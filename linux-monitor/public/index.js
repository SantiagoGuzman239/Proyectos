// public/index.js  (cliente Socket.IO)
const icon = s => ({
  cpu: '<svg class="icon" stroke="#06b6d4"><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M4 9v6m16-6v6M9 4h6m-6 16h6"/></svg>',
  mem: '<svg class="icon" stroke="#10b981"><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 10v4m4-4v4m4-4v4"/></svg>',
  disk: '<svg class="icon" stroke="#f59e0b"><path d="M4 7v10a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2z"/></svg>',
  net: '<svg class="icon" stroke="#6366f1"><circle cx="12" cy="12" r="2"/><path d="M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10"/></svg>',
  pro: '<svg class="icon" stroke="#ef4444"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
}[s]);

const panel = document.getElementById('panel');

function card(title, svg, body) {
  return `<div class="bg-gray-800 rounded p-4 flex items-start"><span>${svg}</span><div><div class="font-semibold mb-1">${title}</div><div class="text-sm text-gray-300">${body}</div></div></div>`;
}

const socket = io('http://192.168.1.41:3000', { transports: ['websocket'] });

socket.on('connect', () => console.log('✅ Conectado por WebSocket'));
socket.on('disconnect', () => console.warn('❌ Desconectado'));

socket.on('metrics', data => {
  const { cpu, mem, osInfo, fs, net, procs } = data;
  const load = cpu.load?.toFixed(1) || 0;
  const temp = cpu.temp?.toFixed(1) || 'N/D';
  const usedMem = ((mem.used / mem.total) * 100).toFixed(1);
  const diskUse = fs ? fs.use : 0;

  let html = '';
  html += card('CPU & Temp', icon('cpu'), `Load: ${load}%<br>Temp: ${temp} °C<br>${cpu.manufacturer} ${cpu.brand}`);
  html += card('Memoria RAM', icon('mem'), `Usado: ${usedMem}%<br>Total: ${(mem.total / 1e9).toFixed(1)} GB`);
  html += card('Disco /', icon('disk'), `Usado: ${diskUse}%<br>Libre: ${(fs?.available / 1e9).toFixed(1)} GiB`);
  html += card('Red', icon('net'), net.map(i => `${i.iface}: ${i.ip4}`).join('<br>'));
  html += card('Top procesos CPU', icon('pro'), procs.map(p => `${p.name} (${p.cpu.toFixed(1)}%)`).join('<br>'));
  panel.innerHTML = html;
});