import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import api from './api/index';

const __filename=fileURLToPath(import.meta.url); const __dirname=path.dirname(__filename);
const app=express(); const isProd=process.env.NODE_ENV==='production';
if(!isProd){ app.use(api); const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'}); app.use(vite.middlewares); }
else { app.use(api); app.use(express.static(path.join(__dirname,'dist'))); app.get('*',(_req,res)=>res.sendFile(path.join(__dirname,'dist','index.html'))); }
const port=Number(process.env.PORT||3000); app.listen(port,'0.0.0.0',()=>console.log(`QUESTORA running on http://localhost:${port}`));
