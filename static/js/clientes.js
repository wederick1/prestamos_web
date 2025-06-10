document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#clientes tbody');
    const editarModal = document.getElementById('editarModal');
    const cerrarBtn = document.getElementById('cerrarEditarModal');
    const cancelarBtn = document.getElementById('cancelarEditar');
    const editarForm = document.getElementById('editarForm');
    const inputId = document.getElementById('editarClienteId');
    const inputMonto = document.getElementById('editarMonto');
    const selectFreq = document.getElementById('editarFrecuencia');
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
  
    // 1. Cargar todos los clientes y pintar filas
    fetch('/api/clientes')
      .then(res => res.json())
      .then(data => {
        data.forEach(cliente => {
          const row = document.createElement('tr');
          row.dataset.id = cliente.id;
          row.innerHTML = `
            <td>${cliente.id}</td>
            <td>${cliente.nombre}</td>
            <td>${cliente.email}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.cedula}</td>
            <td>
              <button class="info-btn view-client-btn" data-id="${cliente.id}">Info</button>
              <button class="contrato-btn" data-id="${cliente.id}">Contrato</button>
              <button class="editar-btn" data-id="${cliente.id}">Editar</button>
              <button class="btn-compartir" data-id="${cliente.id}">Compartir Link</button>
            </td>
          `;
          tbody.appendChild(row);
        });
        attachButtonHandlers();
      });
  
    // 2. Adjuntar eventos a botones recién creados
    function attachButtonHandlers() {
      // Info
      document.querySelectorAll('.view-client-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          fetch(`/api/clientes/${id}`)
            .then(r => r.json())
            .then(c => {
              if (c.error) return alert(c.error);
              const modal = document.getElementById('modal');
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
  
      // Contrato
      document.querySelectorAll('.contrato-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          window.location.href = `/contrato?id=${btn.dataset.id}`;
        });
      });
  
      // Editar
      document.querySelectorAll('.editar-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          const resp = await fetch(`/api/clientes/${id}`);
          if (!resp.ok) return alert('Error al cargar datos');
          const c = await resp.json();
  
          inputId.value = c.id;
          inputMonto.value = c.monto_solicitado || '';
          formatInitialMonto(); // aplicar formato de moneda
          selectFreq.value = c.frecuencia || '';
          editarModal.style.display = 'flex';
        });
      });

            // Compartir Link
      document.querySelectorAll('.btn-compartir').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;

          try {
            const resp = await fetch(`/api/clientes/${id}`);
            if (!resp.ok) return alert('Error al cargar datos');
            const c = await resp.json();

            const link = `${window.location.origin}/contrato?id=${id}`;

            await navigator.clipboard.writeText(link);

            const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
            notyf.success(`Link copiado al portapapeles: ${link}`);

          } catch (err) {
            const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
            notyf.error('Error al compartir el link');
          }
        });
      });
    }
  
    // 3. Cerrar modal editar
    function cerrar() {
      editarModal.style.display = 'none';
      editarForm.reset();
    }
    cerrarBtn.addEventListener('click', cerrar);
    cancelarBtn.addEventListener('click', cerrar);
    editarModal.addEventListener('click', e => {
      if (e.target === editarModal) cerrar();
    });
  
    // 4. Enviar cambios de edición
    editarForm.addEventListener('submit', async e => {
      e.preventDefault();
      const id = inputId.value;
      const raw = inputMonto.value.replace(/[^0-9.]/g, '');
      const monto = parseFloat(raw);
      const frecuencia = selectFreq.value;
      const apodoValue = apodo.value;
      const GarantiaValue = Garantia.value;
      const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
  
      try {
        const res = await fetch(`/clientes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monto_solicitado: monto,
            frecuencia,
            apodo: apodoValue, // <--- aquí se envía al backend
            garantia: GarantiaValue // <--- aquí se envía al backend
          })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Error al actualizar');
  
        cerrar(); // Cerrar el modal
        notyf.success('Cliente actualizado exitosamente');
      } catch (err) {
        notyf.error(err.message);
      }
    });
  
    // 5. Cerrar modal Info
    const infoModal = document.getElementById('modal');
    document.querySelector('.close-btn')?.addEventListener('click', () => {
      infoModal.classList.remove('show');
    });
    window.addEventListener('click', e => {
      if (e.target === infoModal) infoModal.classList.remove('show');
    });
  });
  


