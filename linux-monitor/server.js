// server.js
const express = require('express');
const cors = require('cors');
const si = require('systeminformation');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;
const HOST = '192.168.1.41';   // <-- aquí la IP fija

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

/* ----------  API REST  ---------- */
app.get('/api/sistema', async (_req, res) => {
  try {
    const [cpu, mem, osInfo, currentLoad, temp] = await Promise.all([
      si.cpu(), si.mem(), si.osInfo(), si.currentLoad(), si.cpuTemperature(),
    ]);
    res.json({ cpu, mem, osInfo, currentLoad, temp });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/disco', async (_req, res) => {
  try { res.json(await si.fsSize()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/red', async (_req, res) => {
  try { res.json((await si.networkInterfaces()).filter(i => i.ip4)); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/procesos', async (_req, res) => {
  try {
    const list = (await si.processes()).list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 10)
      .map(p => ({ pid: p.pid, name: p.name, cpu: p.cpu.toFixed(1), mem: p.mem.toFixed(1) }));
    res.json(list);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ----------  Arrancar  ---------- */
app.listen(PORT, HOST, () =>
  console.log(`✅ Servidor escuchando en http://${HOST}:${PORT}`)
);
const https   = require('https');
const pem     = require('pem');
pem.createCertificate({ days: 365, selfSigned: true }, (err, keys) => {
  if (err) throw err;
  const server = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app);
  const io     = require('socket.io')(server, { cors: { origin: '*' } });
  server.listen(PORT, HOST, () =>
    console.log(`🔒  HTTPS+WS  ready at  https://${HOST}:${PORT}`));
});