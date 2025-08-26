import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../test-utils';
import { storage } from '../storage';
import bcrypt from 'bcrypt';

let app: any;
let server: any;
let agent: request.SuperAgentTest;

beforeAll(async () => {
  const built = await buildApp();
  app = built.app;
  server = built.server;
  agent = request.agent(app);

  // ensure a dev user exists in in-memory storage for tests
  const hashed = await bcrypt.hash('testpass', 10);
  await storage.upsertUser({
    id: 'test-user',
    email: 'testuser@example.com',
    username: 'testuser',
    password: hashed,
    firstName: 'Test',
    lastName: 'User',
    role: 'administrator',
  } as any);
});

afterAll(async () => {
  try { server.close(); } catch (e) {}
});

describe('auth endpoints (dev mode)', () => {
  it('rejects login with missing fields', async () => {
    const res = await agent.post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('accepts valid login and sets session cookie', async () => {
    const res = await agent.post('/api/auth/login').send({ username: 'testuser', password: 'testpass' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username');
    // session cookie should be set
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
  });

  it('returns current user via /api/auth/user', async () => {
    const res = await agent.get('/api/auth/user');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username');
  });

  it('logs out via /api/auth/logout', async () => {
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(200);
    // subsequent user call should be 401
    const res2 = await agent.get('/api/auth/user');
    expect(res2.status).toBe(401);
  });
});
