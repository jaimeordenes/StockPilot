(async () => {
  const BASE = process.env.BASE_URL || 'http://127.0.0.1:5000';
  // login
  const loginRes = await fetch(`${BASE}/api/auth/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:'jordenes', password:'Jaop*1985' }) });
  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) throw new Error('No cookie');
  // list products
  const listRes = await fetch(`${BASE}/api/products?limit=1`, { headers:{ Cookie: cookie } });
  const list = await listRes.json();
  const first = list.products?.[0];
  if (!first) { console.log('No products to update'); return; }
  const updatedName = first.name + ' (upd)';
  const putRes = await fetch(`${BASE}/api/products/${first.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Cookie: cookie }, body: JSON.stringify({ name: updatedName }) });
  const out = await putRes.json();
  console.log('Updated:', out.id, out.name);
})();
