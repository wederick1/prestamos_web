document.addEventListener('DOMContentLoaded', function () {
  fetch('/api/solicitudes')
    .then(response => response.json())
    .then(data => {
      const tbody = document.querySelector('#clientes tbody');

      // Si no hay datos, muestra mensaje
      if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td colspan="6" style="text-align: center; padding: 20px; font-weight: bold; color: #666;">
            No hay solicitudes disponibles.
          </td>
        `;
        tbody.appendChild(row);
        return; // Detiene el resto
      }

      // Si hay solicitudes, las inserta
      data.forEach(cliente => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="hidden">${cliente.id}</td>
          <td>${cliente.nombre}</td>
          <td>${cliente.email}</td>
          <td>${cliente.telefono}</td>
          <td>${cliente.monto}</td>
          <td>
            <a href="http://gmail.com" target="_blank" rel="noopener noreferrer" class="ver-btn">Ver</a>
            <button class="aprobar-btn" data-id="${cliente.id}">Aprobar</button>
            <button class="eliminar-btn" data-id="${cliente.id}">Eliminar</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      // Evento click aprobar
      document.querySelectorAll('.aprobar-btn').forEach(button => {
        button.addEventListener('click', function () {
          const clienteId = this.getAttribute('data-id');
          aprobarSolicitud(clienteId);
        });
      });

      // Evento click eliminar
      document.querySelectorAll('.eliminar-btn').forEach(button => {
        button.addEventListener('click', function () {
          const clienteId = this.getAttribute('data-id');
          eliminarSolicitud(clienteId, this);
        });
      });
    });
});

function aprobarSolicitud(id) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción aprobará la solicitud y moverá los datos a clientes",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, aprobar!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/aprobar_solicitud/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            Swal.fire('Aprobado!', data.message, 'success');
            document.querySelector(`button[data-id="${id}"]`).closest('tr').remove();
          } else {
            Swal.fire('Error!', data.message, 'error');
          }
        });
    }
  });
}

function eliminarSolicitud(id, btn) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción eliminará la solicitud permanentemente.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar!'
  }).then((result) => {
    if (result.isConfirmed) {
      fetch(`/eliminar_solicitud/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            Swal.fire('Eliminado!', data.message, 'success');
            btn.closest('tr').remove();
          } else {
            Swal.fire('Error!', data.message, 'error');
          }
        });
    }
  });
}
