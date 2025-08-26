import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function main() {
  console.log('== Product creation E2E ==');
  // login
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'jordenes', password: 'Jaop*1985' })
  });
  const loginJson = await loginRes.json();
  if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginJson));
  console.log('Login OK as', loginJson.username || loginJson.email);

  // cookies
  const cookie = loginRes.headers.get('set-cookie');
  if (!cookie) throw new Error('No session cookie received');

  // ensure test file
  const testFilePath = path.resolve('test-upload.txt');
  if (!fs.existsSync(testFilePath)) fs.writeFileSync(testFilePath, 'TEST FILE');

  // upload
  const fd = new FormData();
  const fileBytes = fs.readFileSync(testFilePath);
  fd.append('file', new Blob([new Uint8Array(fileBytes)]), 'test-upload.txt');
  const uploadRes = await fetch(`${BASE}/api/uploads`, { method: 'POST', body: fd, headers: { Cookie: cookie } });
  const uploadJson = await uploadRes.json();
  if (!uploadRes.ok) throw new Error('Upload failed: ' + JSON.stringify(uploadJson));
  console.log('Upload OK url=', uploadJson.url);

  // create product
  const code = 'AUT-' + Date.now();
  const productBody = {
    code,
    name: 'Producto Automated',
    unit: 'unit',
    attachmentUrl: uploadJson.url,
    family: 'Fam',
    subfamily: 'Sub',
    group: 'Grp',
    batch: 'L001'
  };
  const prodRes = await fetch(`${BASE}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(productBody) });
  const prodJson = await prodRes.json();
  if (!prodRes.ok) throw new Error('Create product failed: ' + JSON.stringify(prodJson));
  console.log('Product created id=', prodJson.id, 'code=', prodJson.code);

  // list products (first 5)
  const listRes = await fetch(`${BASE}/api/products?limit=5`, { headers: { Cookie: cookie } });
  const listJson = await listRes.json();
  if (!listRes.ok) throw new Error('List products failed: ' + JSON.stringify(listJson));
  console.log('Products total (sample length)=', listJson.products?.length ?? listJson.length);

  console.log('E2E SUCCESS');
}

main().catch(err => { console.error('E2E FAILURE', err); process.exit(1); });
