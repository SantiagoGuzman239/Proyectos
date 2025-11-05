// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const si = require('systeminformation');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Servir archivos estáticos
app.use(express.static('public'));

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Enviar métricas cada 2 segundos
setInterval(async () => {
  try {
    const [
      cpu,
      currentLoad,
      mem,
      fsSize,
      networkInterfaces,
      networkStats,
      processes,
      temps
    ] = await Promise.all([
      si.cpu(),
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkInterfaces(),
      si.networkStats(),
      si.processes(),
      si.cpuTemperature()
    ]);

    // Obtener estadísticas de red (usamos solo la primera interfaz activa)
    const netIfaces = Object.entries(networkInterfaces)
      .filter(([_, iface]) => iface.operstate === 'up' && iface.iface !== 'lo')
      .map(([name, iface]) => {
        const stats = networkStats.find(s => s.iface === name);
        return {
          iface: name,
          ip4: iface.ip4 || '–',
          mac: iface.mac || '–',
          rx: stats ? (stats.rx_bytes / (1024 * 1024)).toFixed(2) : '0',
          tx: stats ? (stats.tx_bytes / (1024 * 1024)).toFixed(2) : '0'
        };
      });

    // Particiones (discos)
    const particiones = {};
    fsSize.forEach(disk => {
      particiones[disk.fs] = {
        filesystem: disk.fs,
        tamaño: (disk.size / (1024 ** 3)).toFixed(2) + ' GB',
        usado: (disk.used / (1024 ** 3)).toFixed(2) + ' GB',
        libre: (disk.available / (1024 ** 3)).toFixed(2) + ' GB',
        usoPorcentaje: disk.use + '%'
      };
    });

    // Top 10 procesos por CPU
    const topProcesses = processes.list
      .sort((a, b) => b.cpu || 0 - a.cpu || 0)
      .slice(0, 10)
      .map(p => ({
        pid: p.pid,
        name: p.name,
        cpu: p.cpu ? p.cpu.toFixed(1) : 0,
        mem: p.mem ? p.mem.toFixed(1) : 0,
        user: p.user
      }));

    const datos = {
      cpu: {
        fabricante: cpu.manufacturer || 'Desconocido',
        modelo: cpu.brand,
        nucleos: cpu.cores,
        temperatura: temps.main ? temps.main + '°C' : 'N/D',
        carga: currentLoad.currentLoad.toFixed(1) + '%'
      },
      memoria: {
        total: (mem.total / (1024 ** 3)).toFixed(2) + ' GB',
        libre: (mem.free / (1024 ** 3)).toFixed(2) + ' GB',
        usado: (mem.used / (1024 ** 3)).toFixed(2) + ' GB',
        usoPorcentaje: ((mem.used / mem.total) * 100).toFixed(1) + '%'
      },
      particiones,
      red: netIfaces,
      procesos: topProcesses
    };

    io.emit('datosSistema', datos);
  } catch (err) {
    console.error('❌ Error al obtener métricas:', err.message);
  }
}, 2000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Monitor corriendo en http://localhost:${PORT}`);
});