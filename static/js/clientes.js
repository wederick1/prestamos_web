document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#clientes tbody');
  const editarModal = document.getElementById('editarModal');
  const cerrarBtn = document.getElementById('cerrarEditarModal');
  const cancelarBtn = document.getElementById('cancelarEditar');
  const editarForm = document.getElementById('editarForm');

  const inputId = document.getElementById('editarClienteId');
  const inputMonto = document.getElementById('editarMonto');
  const selectFreq = document.getElementById('editarFrecuencia');
  const inputTiempo = document.getElementById('editarTiempo');
  const inputMontoPagar = document.getElementById('montopagar');
  const apodo = document.getElementById('apodo');
  const Garantia = document.getElementById('garantia');

  const formatter = new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2
  });

  inputMonto.addEventListener('focus', e => {
    const val = e.target.value;
    const numeric = val.replace(/[^0-9.]/g, '');
    e.target.value = numeric;
  });

  inputMonto.addEventListener('blur', e => {
    const num = parseFloat(e.target.value);
    if (!isNaN(num)) {
      e.target.value = formatter.format(num);
    } else {
      e.target.value = '';
    }
  });

  function formatInitialMonto() {
    const val = inputMonto.value;
    if (val && !val.includes('RD$') && !val.includes('DOP')) {
      const num = parseFloat(val);
      if (!isNaN(num)) inputMonto.value = formatter.format(num);
    }
  }

  fetch('/api/clientes')
    .then(res => res.json())
    .then(data => {
      data.forEach(cliente => {
        const row = document.createElement('tr');
        row.dataset.id = cliente.id;
        row.innerHTML = `
          <td class="hidden">${cliente.id}</td>
          <td>${cliente.nombre}</td>
          <td>${cliente.email}</td>
          <td>${cliente.telefono}</td>
          <td>${cliente.cedula}</td>
          <td>
            <button class="info-btn view-client-btn" data-id="${cliente.id}">Info</button>
            <button class="contrato-btn" data-id="${cliente.id}">Contrato</button>
            <button class="editar-btn" data-id="${cliente.id}">Editar</button>
            <button class="btn-compartir" data-id="${cliente.id}">Compartir Link</button>
            <button class="borrar-btn" data-id="${cliente.id}">Borrar</button> 
          </td>
        `;
        tbody.appendChild(row);
      });
      attachButtonHandlers();
    });

  function attachButtonHandlers() {
    document.querySelectorAll('.view-client-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        fetch(`/api/clientes/${id}`)
          .then(r => r.json())
          .then(c => {
            if (c.error) return alert(c.error);
            const modal = document.getElementById('modal');
            document.getElementById('modal-title').textContent = `Cliente - ${c.nombre}`;
            document.querySelector('#modal-body').innerHTML = `
              <p><strong>Nombre:</strong> ${c.nombre}</p>
              <p><strong>Cédula:</strong> ${c.cedula}</p>
              <p><strong>Teléfono:</strong> ${c.telefono}</p>
              <p><strong>Dirección:</strong> ${c.direccion}</p>
              <p><strong>Lugar de Trabajo:</strong> ${c.lugar_trabajo}</p>
              <p><strong>Ingresos Mensuales:</strong> RD$ ${c.ingresos_mensuales}</p>
            `;
            modal.classList.add('show');
          });
      });
    });

    document.querySelectorAll('.contrato-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `/contrato?id=${btn.dataset.id}`;
      });
    });

    document.querySelectorAll('.editar-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const resp = await fetch(`/api/clientes/${id}`);
        if (!resp.ok) return alert('Error al cargar datos');
        const c = await resp.json();

        inputId.value = c.id;
        inputMonto.value = c.monto_solicitado || '';
        selectFreq.value = c.frecuencia || '';
        apodo.value = c.apodo || '';
        Garantia.value = c.garantia || '';
        inputTiempo.value = c.tiempo || '';
        inputMontoPagar.value = c.monto_pagar || '';
        formatInitialMonto();
        editarModal.style.display = 'flex';
      });
    });

    document.querySelectorAll('.btn-compartir').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const link = `${window.location.origin}/contrato?id=${id}`;
          await navigator.clipboard.writeText(link);
          new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } }).success(`Link copiado: ${link}`);
        } catch (err) {
          new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } }).error('Error al copiar el link');
        }
      });
    });

    // Aquí el botón BORRAR con confirmación y llamada a backend
    document.querySelectorAll('.borrar-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;

        const { isConfirmed } = await Swal.fire({
          title: '¿Está seguro?',
          text: "Esta acción es permanente y no podrá deshacerse.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Sí, borrar',
          cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed) return;

        try {
          const res = await fetch(`/clientes/${id}`, {
            method: 'DELETE'
          });

          const result = await res.json();
          if (!res.ok) throw new Error(result.message || 'Error al borrar');

          // Quitar fila del DOM
          btn.closest('tr').remove();

          Swal.fire({
            icon: 'success',
            title: 'Cliente borrado exitosamente',
            timer: 2000,
            showConfirmButton: false
          });

        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'No se puede borrar este cliente',
            text: err.message
          });
        }
      });
});

  }


  function cerrar() {
    editarModal.style.display = 'none';
    editarForm.reset();
  }

  cerrarBtn.addEventListener('click', cerrar);
  cancelarBtn.addEventListener('click', cerrar);
  editarModal.addEventListener('click', e => {
    if (e.target === editarModal) cerrar();
  });

  editarForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id = inputId.value;
    const monto = parseFloat(inputMonto.value.replace(/[^0-9.]/g, ''));
    const frecuencia = selectFreq.value;
    const tiempo = inputTiempo.value.trim();
    const monto_pagar = inputMontoPagar.value.trim();
    const apodoValue = apodo.value.trim();
    const GarantiaValue = Garantia.value;

    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });

    try {
      const res = await fetch(`/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto_solicitado: monto,
          frecuencia,
          apodo: apodoValue,
          garantia: GarantiaValue,
          tiempo,
          monto_pagar
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Error al actualizar');

      cerrar();
      notyf.success('Cliente actualizado exitosamente');
    } catch (err) {
      notyf.error(err.message);
    }
  });

  const infoModal = document.getElementById('modal');
  document.querySelector('.close-btn')?.addEventListener('click', () => {
    infoModal.classList.remove('show');
  });
  window.addEventListener('click', e => {
    if (e.target === infoModal) infoModal.classList.remove('show');
  });
});

