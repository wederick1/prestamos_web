// Abre el modal de subir cédula
function openModal() {
  const modal = document.getElementById('modalBackdrop');
  if (modal) modal.classList.add('active');
}

// Cierra el modal de subir cédula
function closeModal() {
  const modal = document.getElementById('modalBackdrop');
  if (modal) modal.classList.remove('active');
}

// Formatea teléfono 10 dígitos como 3-3-4
function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 10);
  if (p3) return `${p1}-${p2}-${p3}`;
  if (p2) return `${p1}-${p2}`;
  return p1;
}

// Formatea cédula 11 dígitos como 3-3-4-1
function formatCedula(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 10);
  const p4 = digits.slice(10, 11);
  let out = p1;
  if (p2) out += `-${p2}`;
  if (p3) out += `-${p3}`;
  if (p4) out += `-${p4}`;
  return out;
}

/* --- Principal --- */
window.addEventListener('DOMContentLoaded', () => {
  console.log('Script cargado y DOM listo');

  // ——— Fecha automática ———
  const today = new Date();
  const dia = String(today.getDate()).padStart(2, '0');
  const mes = String(today.getMonth() + 1).padStart(2, '0');
  const anio = today.getFullYear();
  const formattedDate = `${dia}/${mes}/${anio}`; // DD/MM/YYYY

  const fechaSpan = document.getElementById('fecha-solicitud');
  const fechaInputHidden = document.getElementById('fecha-solicitud-input');
  if (fechaSpan) fechaSpan.textContent = `Fecha: ${formattedDate}`;
  if (fechaInputHidden) fechaInputHidden.value = formattedDate;

  // ——— Notyf ———
  const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });

  // ——— Firma ———
  const firmaModal = document.getElementById('firmaModal');
  const abrirFirmaBtn = document.getElementById('abrirFirmaModal');
  const firmaInput = document.getElementById('firmaInput');
  const generarFirmaBtn = document.getElementById('generarFirma');
  const firmaSolicitante = document.querySelector('.handwritten-signature');
  const firmaDigitalIn = document.getElementById('firmaDigital');
  const canvas = document.getElementById('signaturePad');
  const clearBtn = document.getElementById('clearSignature');
  let signaturePad;

  abrirFirmaBtn?.addEventListener('click', e => {
    e.preventDefault();
    firmaModal.classList.add('active');
  });
  generarFirmaBtn?.addEventListener('click', () => {
    const txt = firmaInput.value.trim();
    if (!txt) return notyf.error('Por favor, ingrese su firma.');
    firmaSolicitante.textContent = txt;
    firmaDigitalIn.value = txt;
    firmaInput.value = '';
    firmaModal.classList.remove('active');
  });
if (canvas && clearBtn) {
  // 1) Redimensiona UNA sola vez
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width  = canvas.offsetWidth  * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  canvas.getContext('2d').scale(ratio, ratio);

  // 2) Crea el SignaturePad con ese tamaño definitivo
  signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgba(255,255,255,1)',
    penColor: 'rgb(0,0,0)'
  });

  // 3) Cada vez que termines el trazo, vuelca el Base64 al input
  signaturePad.onEnd = () => {
    firmaDigitalIn.value = signaturePad.toDataURL();
  };

  // 4) Evita que el scroll táctil mueva la página al dibujar
  canvas.style.touchAction = 'none';
  ['touchstart','touchmove','touchend'].forEach(evt => {
    canvas.addEventListener(evt, e => e.preventDefault(), { passive: false });
  });

  // 5) Botón para limpiar
  clearBtn.addEventListener('click', () => {
    signaturePad.clear();
    firmaDigitalIn.value = '';
  });
}


  // ——— Cálculo ingresos ———
  const calcIngresos = () => {
    const ing = parseFloat(document.getElementById('ingresos-mensuales')?.value) || 0;
    const otros = parseFloat(document.getElementById('otros-ingresos')?.value) || 0;
    const total = document.getElementById('total-ingresos');
    if (total) total.value = `RD$ ${(ing + otros).toFixed(2)}`;
  };
  ['ingresos-mensuales','otros-ingresos'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', calcIngresos)
  );

  // ——— Formatea teléfonos y cédula ———
  const phoneFields = [
    'telefono-solicitante',
    'telefono-trabajo',
    'celular-conyuge',
    'telefono-trabajo-conyuge',
    'telefono-referencia-personal-1',
    'telefono-referencia-personal-2',
    'telefono-referencia-familiar-1',
    'telefono-referencia-familiar-2',
    'telefono-referencia-comercial'
  ];
  phoneFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', e => {
      e.target.value = formatPhone(e.target.value);
    });
  });
  const ced = document.getElementById('cedula');
  if (ced) ced.addEventListener('input', e => {
    e.target.value = formatCedula(e.target.value);
  });

  // ——— Estado civil → pareja ———
  const estadoCivil = document.getElementById('estado-civil');
  const camposPareja = document.querySelectorAll('.pareja');
  const togglePareja = () => {
    const soltero = estadoCivil.value === 'soltero';
    camposPareja.forEach(el => el.classList.toggle('hidden', soltero));
  };
  estadoCivil?.addEventListener('change', togglePareja);
  togglePareja();

  // ——— Tipo vivienda → renta ———
  const tipoVivienda = document.getElementById('tipo-vivienda');
  const campoRenta = document.querySelector('.campo .renta')?.parentElement;
  const toggleRenta = () => {
    campoRenta.style.display = (tipoVivienda.value === 'propia' ? 'none' : 'block');
  };
  tipoVivienda?.addEventListener('change', toggleRenta);
  toggleRenta();

  // ——— Envío del formulario ———
  const form = document.getElementById('prestamoForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('btnSiguiente');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    try {
      const url = window.location.pathname; // '/formulario'

      // Validaciones
      const frente = document.getElementById('frenteBase64').value;
      const reverso = document.getElementById('reversoBase64').value;
      if (!frente || !reverso) throw new Error('Debes subir ambas imágenes de la cédula');

      const invalid = Array.from(form.querySelectorAll('[required]'))
        .filter(f => !f.value.trim());
      if (invalid.length) {
        invalid.forEach(f => {
          f.classList.add('campo-invalido');
          setTimeout(() => f.classList.remove('campo-invalido'), 2000);
        });
        throw new Error('Complete todos los campos requeridos');
      }

      // Build data
      const data = {
        fecha_solicitud: fechaInputHidden.value,
        frenteBase64: frente.split(',')[1],
        reversoBase64: reverso.split(',')[1]
      };
      new FormData(form).forEach((v, k) => {
        data[k.replace(/-/g, '_')] = v;
      });
      [
        'monto_solicitado',
        'otros_ingresos',
        'ingresos_mensuales',
        'gastos_mensuales',
        'prestamos_activos',
        'pago_renta'
      ].forEach(key => {
        data[key] = parseFloat(data[key]) || 0;
      });

      if (signaturePad && !signaturePad.isEmpty()) {
        data.firmaDigital = signaturePad.toDataURL();
      } else {
        throw new Error('Por favor, firme antes de enviar el formulario.');
      }
      if (!fechaInputHidden.value) {
        throw new Error('La fecha de solicitud no está configurada correctamente.');
      }

      // envía
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        if (ct.includes('application/json')) {
          const err = await res.json();
          throw new Error(err.error || 'Error en el servidor');
        } else {
          const html = await res.text();
          console.error('HTML inesperado:', html);
          throw new Error('El servidor respondió con HTML inesperado.');
        }
      }
      const result = await res.json();
      notyf.success(result.mensaje || 'Formulario enviado exitosamente');
      if (result.redirect) {
        window.location.href = result.redirect;
      } else {
        form.reset();
        document.querySelectorAll('.thumbnail').forEach(img => img.src = '#');
        signaturePad.clear();
        document.getElementById('frenteBase64').value = '';
        document.getElementById('reversoBase64').value = '';
      }
    } catch (err) {
      notyf.error(err.message);
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Siguiente';
    }
  });

  // ——— Préstamos activos → banco ———
  document.getElementById('prestamos-activos')?.addEventListener('change', e => {
    document.getElementById('campo-banco').style.display = (e.target.value === '0' ? 'none' : 'block');
  });

  // ——— Modal Cédula Click Outside & Escape ———
  const modalBackdrop = document.getElementById('modalBackdrop');
  modalBackdrop?.addEventListener('click', e => {
    if (e.target === modalBackdrop) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // ——— Preview de cédula ———
  window.previewImage = (event, previewId, base64InputId) => {
    const input = event.target;
    const file = input.files?.[0];
    const preview = document.getElementById(previewId);
    const base64Input = document.getElementById(base64InputId);
    const container = input.closest('.upload-area');
    const plus = container.querySelector('.plus-icon');
    const txt = container.querySelector('p');
    if (!file || !file.type.startsWith('image/')) {
      notyf.error('Seleccione una imagen válida');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = 'block';
      plus.style.display = 'none';
      txt.style.display = 'none';
      base64Input.value = reader.result;
    };
    reader.onerror = () => notyf.error('Error al leer la imagen');
    reader.readAsDataURL(file);
  };

  // ——— Validar y cerrar modal ———
  window.validarYcerrar = () => {
    const f = document.getElementById('frenteBase64').value;
    const r = document.getElementById('reversoBase64').value;
    if (!f || !r) return notyf.error('Debes subir ambas imágenes de la cédula');
    closeModal();
  };

  // ——— Lógica de garantía / límite ———
  const garantiaSelect = document.getElementById('garantia');
  const montoInput = document.getElementById('monto-solicitado');
  const actualizarLimite = () => {
    if (garantiaSelect.value === 'ninguna') {
      montoInput.max = 15000;
      montoInput.placeholder = 'Máximo RD$ 15,000';
      if (parseFloat(montoInput.value) > 15000) montoInput.value = 15000;
    } else {
      montoInput.removeAttribute('max');
      montoInput.placeholder = 'Ej. 20000';
    }
  };
  garantiaSelect?.addEventListener('change', actualizarLimite);
  actualizarLimite();

  // ——— Toggle redes sociales ———
  function toggleRedesSociales() {
    const sel = document.getElementById('tiene-redes');
    const campo = document.getElementById('campo-redes');
    if (sel.value === 'si') campo.classList.remove('hidden');
    else {
      campo.classList.add('hidden');
      document.getElementById('redes-sociales').value = '';
    }
  }
  const selRedes = document.getElementById('tiene-redes');
  toggleRedesSociales();
  selRedes?.addEventListener('change', toggleRedesSociales);

});

// Función global de geolocalización
function obtenerUbicacion(checkbox) {
  const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
  if (checkbox.checked && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const latlon = `${pos.coords.latitude},${pos.coords.longitude}`;
      if (checkbox.id === 'ubicacion_casa') {
        document.getElementById('casaCoordenadas').value = latlon;
        document.getElementById('casaStatus').innerText = 'Ubicación guardada';
      } else {
        document.getElementById('trabajoCoordenadas').value = latlon;
        document.getElementById('trabajoStatus').innerText = 'Ubicación guardada';
      }
    }, () => notyf.error('No se pudo obtener la ubicación.'));
  } else if (!checkbox.checked) {
    if (checkbox.id === 'ubicacion_casa') {
      document.getElementById('casaCoordenadas').value = '';
      document.getElementById('casaStatus').innerText = '';
    } else {
      document.getElementById('trabajoCoordenadas').value = '';
      document.getElementById('trabajoStatus').innerText = '';
    }
  } else {
    notyf.error('La geolocalización no es compatible con este navegador.');
  }
}
