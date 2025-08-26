import express from 'express';
import request from 'supertest';
import { registerRoutes } from './routes.js';

(async ()=>{
  try{
    const app = express();
    app.use(express.json());
    const server = await registerRoutes(app);
    const res = await request(server).get('/api/inventory');
    console.log('status', res.status);
    console.log('body sample', Array.isArray(res.body) ? res.body.slice(0,2) : res.body);
    server && server.close && server.close();
  }catch(e){
    console.error('integration test failed', e);
    process.exitCode = 1;
  }
})();
