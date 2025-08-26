import { Pool } from 'pg';

(async function(){
  try{
    const DATABASE_URL = process.env.DATABASE_URL || 'postgres://jordenes:9999Jaop*85@127.0.0.1:5432/bodega';
    const pool = new Pool({ connectionString: DATABASE_URL });
    const res = await pool.query("SELECT id,nombre,correo,contrasena_hash,\"contraseña_hash\",rol,estado FROM usuarios WHERE correo LIKE 'jordenes%'");
    console.log('rows:', JSON.stringify(res.rows, null, 2));
    await pool.end();
  }catch(e){
    console.error('error', e);
    process.exitCode = 1;
  }
})();
