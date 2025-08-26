$env:DATABASE_URL = 'postgres://jordenes:9999Jaop*85@localhost:5432/bodega'
$env:NODE_ENV = 'development'
Set-Location 'C:\StockPilot'
# start server (will run in this process)
npx tsx server/index.ts
