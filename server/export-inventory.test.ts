import request from 'supertest';
import { app, startServer } from './index';
import { beforeAll, afterAll, test, expect, describe } from 'vitest';

async function login(agent: request.SuperTest<request.Test>) {
  const res = await agent.post('/api/auth/login').send({ username: 'exportuser', password: 'secret' });
  expect(res.status).toBe(200);
}

describe('Export Inventory CSV', () => {
  let server: any;
  const originalDb = process.env.DATABASE_URL;
  beforeAll(async () => { delete process.env.DATABASE_URL; server = await startServer({ port: 0, host: '127.0.0.1' }); });
  afterAll(async () => { if (server) server.close(); if (originalDb) process.env.DATABASE_URL = originalDb; });
  test('should download CSV low stock', async () => {
    const agent = request.agent(app);
    await login(agent);
    const res = await agent.get('/api/export/inventory');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text.split('\n')[0]).toContain('productCode');
  });
});
