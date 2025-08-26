const { Pool } = require('pg');
(async ()=>{
  const DATABASE_URL = process.env.DATABASE_URL || 'postgres://jordenes:9999Jaop*85@127.0.0.1:5432/bodega';
  const p = new Pool({ connectionString: DATABASE_URL });
  const c = await p.connect();
  try{
    const r = await c.query("SELECT id,nombre,correo FROM usuarios ORDER BY id");
    console.log(JSON.stringify(r.rows, null, 2));
  }catch(e){ console.error(e); }
  finally{ await c.release(); await p.end(); }
})();
