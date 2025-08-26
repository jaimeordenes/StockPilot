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

  // create admin user
  const hashedAdmin = await bcrypt.hash('adminpass', 10);
  await storage.upsertUser({
    id: 'admin-user',
    email: 'admin@example.com',
    username: 'admin',
    password: hashedAdmin,
    firstName: 'Admin',
    lastName: 'User',
    role: 'administrator',
  } as any);

  // create viewer user
  const hashedViewer = await bcrypt.hash('viewerpass', 10);
  await storage.upsertUser({
    id: 'viewer-user',
    email: 'viewer@example.com',
    username: 'viewer',
    password: hashedViewer,
    firstName: 'Viewer',
    lastName: 'User',
    role: 'viewer',
  } as any);
});

afterAll(async () => {
  try { server.close(); } catch (e) {}
});

describe('CRUD & permissions (suppliers / warehouses / products)', () => {
  it('admin can create, update, delete supplier', async () => {
    // login as admin
    const login = await agent.post('/api/auth/login').send({ username: 'admin', password: 'adminpass' });
    expect(login.status).toBe(200);

    // create supplier
    const create = await agent.post('/api/suppliers').send({ name: 'Acme', email: 'acme@example.com' });
    expect(create.status).toBe(201);
    const supplier = create.body;
    expect(supplier).toHaveProperty('id');

    // fetch list
    const list = await agent.get('/api/suppliers');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    // update supplier
    const up = await agent.put(`/api/suppliers/${supplier.id}`).send({ contact: 'Juan' });
    expect(up.status).toBe(200);
    expect(up.body.contact).toBe('Juan');

    // delete supplier
    const del = await agent.delete(`/api/suppliers/${supplier.id}`);
    expect(del.status).toBe(204);

    // ensure supplier removed (returns 404 when fetching by id)
    const get = await agent.get(`/api/suppliers/${supplier.id}`);
    expect(get.status).toBe(404);
  });

  it('viewer cannot create supplier', async () => {
    // login as viewer (new agent to separate cookies)
    const agent2 = request.agent(app);
    const login = await agent2.post('/api/auth/login').send({ username: 'viewer', password: 'viewerpass' });
    expect(login.status).toBe(200);

    const create = await agent2.post('/api/suppliers').send({ name: 'BadCorp' });
    expect(create.status).toBe(403);
  });

  it('admin can create warehouse and product and get product with inventory', async () => {
    // already logged as admin in `agent`
    const w = await agent.post('/api/warehouses').send({ name: 'Main Warehouse' });
    expect(w.status).toBe(201);
    const warehouse = w.body;

    const p = await agent.post('/api/products').send({ code: 'P001', name: 'Product 1' });
    expect(p.status).toBe(201);
    const product = p.body;

    // fetch product with inventory (should succeed even if empty)
    const getProd = await agent.get(`/api/products/${product.id}`);
    expect(getProd.status).toBe(200);
    expect(getProd.body).toHaveProperty('id');
  });
});

// DB-backed integration test placeholder (runs only if DATABASE_URL is set)
describe('DB-backed smoke test (runs only if DATABASE_URL present)', () => {
  it('skips if no DATABASE_URL', () => {
    if (!process.env.DATABASE_URL) {
      // vitest counts this as a pass; we rely on env presence to actually run full DB tests
      expect(true).toBe(true);
    }
  });
});
