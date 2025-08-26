import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export async function startServer(opts?: { port?: number; host?: string }) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    // Log detallado del error del middleware
    console.error('[error-middleware]', status, message, err?.stack);
    if (!res.headersSent) {
      try { res.status(status).json({ message }); } catch (_) {}
    }
    // No relanzar para evitar caída completa del proceso en dev.
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const skipVite = process.env.SKIP_VITE === '1';
  if (app.get("env") === "development" && !skipVite) {
    console.log('[startup] environment=development (SKIP_VITE=0) -> inicializando Vite middleware');
    try {
      await setupVite(app, server);
      console.log('[startup] Vite middleware listo');
    } catch (e) {
      console.error('[startup] fallo al inicializar Vite, continuando sin frontend integrado:', (e as Error).message);
    }
  } else {
    console.log(`[startup] modo estático (env=${app.get('env')} skipVite=${skipVite}) -> sirviendo build si existe`);
    try { serveStatic(app); } catch (e) { console.warn('[startup] no se pudieron servir estáticos:', (e as Error).message); }
  }

  const port = opts?.port ?? parseInt(process.env.PORT || '5000', 10);
  const host = opts?.host ?? (process.env.HOST || "127.0.0.1");
  server.listen(port, host, () => {
    log(`serving on ${host}:${port} (env=${app.get('env')})`);
  });

  return server;
}

// ESM equivalent to Python's `if __name__ == "__main__":`
const thisFilePath = fileURLToPath(import.meta.url);
if (process.argv && process.argv[1] && thisFilePath === process.argv[1]) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app };
