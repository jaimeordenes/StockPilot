import express from 'express';
import { registerRoutes } from './routes';
import { createServer } from 'http';

export async function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const server = await registerRoutes(app);
  return { app, server };
}
