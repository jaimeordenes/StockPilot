# StockPilot — Desarrollo local

Este repositorio contiene una aplicación Node + React para gestión de inventarios.
Este README explica los pasos mínimos para dejarlo funcional en local, ejecutar los scripts de inicialización y ejecutar la suite de tests.

Requisitos
- Node 18+ (recomendado)
- npm
- Postgres (local) — o usar un contenedor/servicio remoto

1) Crear la base de datos y usuario (psql)
Abre una terminal PowerShell y, si tienes `psql` como superusuario (`postgres`), ejecuta:

```powershell
# Ejecutar en psql o desde PowerShell si psql está en PATH
psql -U postgres -c "CREATE ROLE jordenes WITH LOGIN PASSWORD '9999Jaop*85';"
psql -U postgres -c "CREATE DATABASE bodega OWNER jordenes;"
```

2) Variables de entorno (sesión PowerShell)
```powershell
$env:DATABASE_URL = 'postgres://jordenes:9999Jaop*85@127.0.0.1:5432/bodega'
$env:SESSION_SECRET = 'cambia-esto-por-una-secreta-larga'
$env:PORT = '5000'
```

3) Inicializar esquema y crear usuario de aplicación
```powershell
npm ci
npm run setup-db
```
El script `setup-db` aplica el esquema y crea/actualiza el usuario de prueba `jordenes` (contraseña de app: `Jaop*1985`).

4) Arrancar en modo desarrollo
```powershell
npm run dev
```
- API y cliente estarán disponibles en http://127.0.0.1:5000

5) Probar login (PowerShell)
```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/auth/login' -Method Post -Body (@{ username='jordenes'; password='Jaop*1985' } | ConvertTo-Json) -ContentType 'application/json' -WebSession $session
Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/auth/user' -Method Get -WebSession $session
```

6) Ejecutar tests (modo in-memory si no hay DB)
```powershell
npx vitest run --root . server/__tests__ --run
```

Notas y recomendaciones
- En desarrollo se usa MemoryStore para sesiones; cuando `DATABASE_URL` esté presente, el servidor usa `connect-pg-simple` con la tabla `sessions`.
- Cambia `SESSION_SECRET` antes de exponer la app.
- Si quieres ejecutar los tests DB-backed en CI, el repo incluye un workflow de GitHub Actions que arranca Postgres y ejecuta `npm run setup-db` antes de ejecutar los tests.

Si quieres, puedo añadir un script para arrancar Postgres localmente con Docker y una tarea `npm run test:db` para facilitar pruebas locales con BD.
