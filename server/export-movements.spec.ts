import request from 'supertest';
import { describe, beforeAll, afterAll, test, expect } from 'vitest';
import { app, startServer } from './index';

async function login(agent: any) {
  const res = await agent.post('/api/auth/login').send({ username: 'exportuser', password: 'secret' });
  expect(res.status).toBe(200);
}

describe('Export Movements CSV', () => {
  let server: any;
  const originalDb = process.env.DATABASE_URL;
  beforeAll(async () => {
    delete process.env.DATABASE_URL; // forzar modo dev auth
    server = await startServer({ port: 0, host: '127.0.0.1' });
  });
  afterAll(async () => {
    if (server) server.close();
    if (originalDb) process.env.DATABASE_URL = originalDb;
  });
  test('should return CSV with correct headers', async () => {
    const agent = request.agent(app);
    await login(agent);
    const res = await agent.get('/api/export/movements').set('Accept', 'text/csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['content-disposition']).toContain('movimientos.csv');
    expect(res.text.split('\n')[0].toLowerCase()).toContain('type');
  });
});
