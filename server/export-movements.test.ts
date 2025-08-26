import request from 'supertest';
import { app, startServer } from './index';
import { beforeAll, afterAll, test, expect, describe } from 'vitest';

async function login(agent: request.SuperTest<request.Test>) {
  const res = await agent.post('/api/auth/login').send({ username: 'exportuser', password: 'secret' });
  expect(res.status).toBe(200);
}

function iso(daysAgo = 0){ const d = new Date(); d.setDate(d.getDate()-daysAgo); return d.toISOString().slice(0,10); }

describe('Export Movements CSV', () => {
  let server: any;
  const originalDb = process.env.DATABASE_URL;
  beforeAll(async () => { delete process.env.DATABASE_URL; server = await startServer({ port: 0, host: '127.0.0.1' }); });
  afterAll(async () => { if (server) server.close(); if (originalDb) process.env.DATABASE_URL = originalDb; });
  test('should export movements with date filter', async () => {
    const agent = request.agent(app);
    await login(agent);
    const from = iso(7);
    const to = iso(0);
    const res = await agent.get(`/api/export/movements?from=${from}&to=${to}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    const firstLine = res.text.split('\n')[0];
    expect(firstLine).toContain('productCode');
    expect(firstLine).toContain('createdAt');
  });

  test('should export filtered by productId and type', async () => {
    const agent = request.agent(app);
    await login(agent);
    // intentar obtener algún movimiento existente primero (no falla si vacío)
    const list = await agent.get('/api/movements?limit=1');
    let productId: string | undefined;
    if (list.status === 200) {
      try { productId = list.body?.movements?.[0]?.movement?.productId; } catch(e) {}
    }
    const qs = new URLSearchParams();
    if (productId) qs.set('productId', productId);
    qs.set('type', 'entry');
    const res = await agent.get('/api/export/movements?' + qs.toString());
    expect(res.status).toBe(200);
    expect(res.text.split('\n')[0]).toContain('productCode');
  });
});
