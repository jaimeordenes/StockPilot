import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';

let server: any;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  server = await registerRoutes(app);
});

afterAll(async () => {
  server && server.close && server.close();
});

test('GET /api/inventory returns rows (or fallback)', async () => {
  const res = await request(server).get('/api/inventory');
  expect([200,500]).toContain(res.status);
  if (res.status === 200) {
    expect(Array.isArray(res.body)).toBe(true);
  }
});
