import passport from "passport";
import session from "express-session";
import bcrypt from 'bcrypt';
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Force local-only auth: disable Replit OIDC to avoid any external redirects.
const isProdAuth = false;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  // Development-friendly MemoryStore session by default. When DATABASE_URL
  // is present we will configure a PG-backed store inside setupAuth so we
  // can use createTableIfMissing there.
  return session({
    secret: process.env.SESSION_SECRET ?? 'dev-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, secure: false },
  });
}
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  // Do not install session/passport globally here; install per-branch below
  // If DATABASE_URL is present, enable DB-backed auth (email+password)
  if (process.env.DATABASE_URL) {
    // Use PG-backed session store and allow table creation for convenience
    const pgStore = connectPg(session);
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    // ensure SESSION_SECRET is set
    const secret = process.env.SESSION_SECRET ?? 'dev-secret';
    app.use(session({ secret, store: sessionStore, resave: false, saveUninitialized: false, cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' } }));
    app.use(passport.initialize());
    app.use(passport.session());

    // Use storage (Drizzle-backed) to find user by email or username.
  // Ensure passport can serialize/deserialize sessions when using DB-backed auth
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
    app.post('/api/auth/login', async (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ message: 'username and password required' });

      try {
        const email = username.includes('@') ? username : `${username}@example.com`;
        let user = await storage.getUserByEmail(email);
        if (!user) user = await storage.getUserByUsername(username as string);
        if (!user) return res.status(401).json({ message: 'invalid credentials' });

        const hash = (user as any).password;
        if (!hash) return res.status(401).json({ message: 'invalid credentials' });

        const ok = await bcrypt.compare(password, hash as string);
        if (!ok) return res.status(401).json({ message: 'invalid credentials' });

        const sessionUser = { id: user.id, username: (user as any).username, email: user.email, firstName: (user as any).firstName, lastName: (user as any).lastName, role: (user as any).role };
        // Attempt passport login; if it errors, fall back to manual session storage
        try {
          req.login(sessionUser, (err) => {
            if (err) {
              console.error('req.login error:', err);
              // fallback: store user directly on session so client can proceed
              try {
                (req as any).session.user = sessionUser;
                (req as any).user = sessionUser;
              } catch (e) {
                console.error('fallback session write failed', e);
              }
              return res.json(sessionUser);
            }
            return res.json(sessionUser);
          });
        } catch (e) {
          console.error('req.login threw', e);
          try {
            (req as any).session.user = sessionUser;
            (req as any).user = sessionUser;
          } catch (ee) {
            console.error('fallback session write failed', ee);
          }
          return res.json(sessionUser);
        }
      } catch (err) {
        console.error('login error', err);
        return res.status(500).json({ message: 'internal error' });
      }
    });
    
    app.post('/api/auth/logout', (req, res) => {
      req.logout(() => res.json({ ok: true }));
    });
    
    app.get('/api/auth/user', (req, res) => {
      const user = (req as any).user || (req as any).session?.user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      res.json(user);
    });
    
    return;
  }
  
  // Development mock auth: simple login endpoints that set a fake user
  // For dev fallback, use in-memory sessions
  app.use(getSession());
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.post('/api/auth/login', async (req, res) => {
    const { username, password, email, firstName, lastName } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password required' });

    let user = await storage.getUserByUsername(username);
    if (!user) {
      // create user in dev with provided password
      const hashed = await bcrypt.hash(password, 10);
      user = await storage.upsertUser({
        id: undefined as any,
        email: email ?? `${username}@example.com`,
        username,
        password: hashed,
        firstName: firstName || username,
        lastName: lastName || '',
      } as any);
    }

    // verify password
    if (!user.password) return res.status(401).json({ message: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password as string);
    if (!ok) return res.status(401).json({ message: 'invalid credentials' });

    req.login(user, (err) => {
      if (err) {
        console.error('dev req.login error', err);
        try { (req as any).session.user = user; (req as any).user = user; } catch(e){}
        return res.json(user);
      }
      return res.json(user);
    });
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => res.json({ ok: true }));
  });
  
  app.get('/api/auth/user', (req, res) => {
    const user = (req as any).user || (req as any).session?.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json(user);
  });
}
export const isAuthenticated: RequestHandler = (req, res, next) => {
  // Accept either passport's isAuthenticated OR a manual session user
  if (req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated()) return next();
  if ((req as any).session?.user) return next();
  return res.status(401).json({ message: "Unauthorized" });
};
