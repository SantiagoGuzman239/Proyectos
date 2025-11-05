// Ajusta esta IP si el servidor está en otra máquina
const socket = io('http://192.168.1.41:3000');

const statusEl = document.getElementById('connection');

socket.on('connect', () => {
  statusEl.textContent = 'Conectado';
  statusEl.className = 'online';
});

socket.on('disconnect', () => {
  statusEl.textContent = 'Desconectado';
  statusEl.className = 'offline';
});

socket.on('datosSistema', (datos) => {
  // CPU
  document.getElementById('cpu').innerHTML = `
    <h2>CPU</h2>
    <p>
      <span class="label">Modelo:</span> ${datos.cpu.modelo}<br>
      <span class="label">Núcleos:</span> ${datos.cpu.nucleos}<br>
      <span class="label">Carga:</span> ${datos.cpu.carga}<br>
      <span class="label">Temperatura:</span> ${datos.cpu.temperatura}
    </p>
  `;

  // Memoria
  document.getElementById('memoria').innerHTML = `
    <h2>Memoria</h2>
    <p>
      <span class="label">Total:</span> ${datos.memoria.total}<br>
      <span class="label">Usada:</span> ${datos.memoria.usado} (${datos.memoria.usoPorcentaje})<br>
      <span class="label">Libre:</span> ${datos.memoria.libre}
    </p>
  `;

  // Discos
  let discosHTML = '<h2>Discos</h2>';
  for (const [fs, d] of Object.entries(datos.particiones)) {
    discosHTML += `
      <div style="margin-bottom:12px;">
        <strong>${fs}</strong><br>
        <span class="label">Tamaño:</span> ${d.tamaño}<br>
        <span class="label">Usado:</span> ${d.usado} (${d.usoPorcentaje})<br>
        <span class="label">Libre:</span> ${d.libre}
      </div>
    `;
  }
  document.getElementById('discos').innerHTML = discosHTML;

  // Red
  let redHTML = '<h2>Red</h2>';
  if (datos.red.length === 0) {
    redHTML += '<p>Sin interfaces activas</p>';
  } else {
    datos.red.forEach(iface => {
      redHTML += `
        <div style="margin-bottom:10px;">
          <span class="label">Interfaz:</span> ${iface.iface}<br>
          <span class="label">IP:</span> ${iface.ip4}<br>
          <span class="label">MAC:</span> ${iface.mac}<br>
          <span class="label">Recibido:</span> ${iface.rx} MB<br>
          <span class="label">Enviado:</span> ${iface.tx} MB
        </div>
      `;
    });
  }
  document.getElementById('red').innerHTML = redHTML;

  // Procesos
  let procesosHTML = `
    <h2>Top Procesos</h2>
    <div class="process-row process-header">
      <div>PID</div>
      <div>Nombre</div>
      <div>Usuario</div>
      <div>CPU %</div>
      <div>Mem %</div>
    </div>
  `;
  datos.procesos.forEach(p => {
    procesosHTML += `
      <div class="process-row">
        <div>${p.pid}</div>
        <div>${p.name}</div>
        <div>${p.user}</div>
        <div>${p.cpu}</div>
        <div>${p.mem}</div>
      </div>
    `;
  });
  document.getElementById('procesos').innerHTML = procesosHTML;
});