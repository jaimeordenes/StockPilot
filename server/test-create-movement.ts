import { randomUUID } from 'crypto';

(async () => {
  const BASE = process.env.BASE_URL || 'http://127.0.0.1:5000';
  // login
  const loginRes = await fetch(`${BASE}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:'jordenes', password:'Jaop*1985' }) });
  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) throw new Error('No cookie');
  // ensure at least one product exists
  const listRes = await fetch(`${BASE}/api/products?limit=1`, { headers:{ Cookie: cookie } });
  const list = await listRes.json();
  let productId = list.products?.[0]?.id;
  if (!productId) {
    const code = 'MV-' + Date.now();
    const createRes = await fetch(`${BASE}/api/products`, { method:'POST', headers:{ 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ code, name:'Prod Movement', unit:'unit' }) });
    const created = await createRes.json();
    productId = created.id;
  }
  // movement requires userId internally; just simulate an entry
  const mvRes = await fetch(`${BASE}/api/movements`, { method:'POST', headers:{ 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ productId, type:'entry', quantity:5, unitPrice: 10 }) });
  const mvJson = await mvRes.json();
  console.log('Movement result status', mvRes.status, mvJson.id || mvJson.message);
})();
