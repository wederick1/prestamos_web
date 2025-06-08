/* --- Principal --- */
window.addEventListener('DOMContentLoaded', () => {
    console.log('Script cargado y DOM listo');
  
    // ——— Fecha automática ———
    const today = new Date();
    const dia = String(today.getDate()).padStart(2, '0');
    const mes = String(today.getMonth() + 1).padStart(2, '0');
    const anio = today.getFullYear();
    const formattedDate = `${dia}/${mes}/${anio}`; // Formato DD/MM/YYYY
  
    const fechaSpan = document.getElementById('fecha-solicitud');
    const fechaInputHidden = document.getElementById('fecha-solicitud-input');
    if (fechaSpan) fechaSpan.textContent = `Fecha: ${formattedDate}`;
    if (fechaInputHidden) fechaInputHidden.value = formattedDate;
  
    // ——— Notyf ———
    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
  
    // ——— Elementos firma ———
    const firmaModal       = document.getElementById('firmaModal');
    const abrirFirmaBtn    = document.getElementById('abrirFirmaModal');
    const firmaInput       = document.getElementById('firmaInput');
    const generarFirmaBtn  = document.getElementById('generarFirma');
    const firmaSolicitante = document.querySelector('.handwritten-signature');
    const firmaDigitalIn   = document.getElementById('firmaDigital');
    const canvas           = document.getElementById('signaturePad');
    const clearBtn         = document.getElementById('clearSignature');
    let signaturePad;
  
    // Abrir modal de firma
    abrirFirmaBtn?.addEventListener('click', e => {
      e.preventDefault();
      firmaModal.classList.add('active');
    });
  
    // Generar firma de texto
    generarFirmaBtn?.addEventListener('click', () => {
      const txt = firmaInput.value.trim();
      if (!txt) return notyf.error('Por favor, ingrese su firma.');
      firmaSolicitante.textContent = txt;
      firmaDigitalIn.value = txt;
      firmaInput.value = '';
      firmaModal.classList.remove('active');
    });
  
    // Canvas signature
    if (canvas && clearBtn) {
      const resizeCanvas = () => {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width  = canvas.offsetWidth  * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
      };
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgba(255,255,255,1)', penColor: 'rgb(0,0,0)' });
  
      clearBtn.addEventListener('click', () => {
        signaturePad.clear();
        firmaDigitalIn.value = '';
      });
  
      // Validar firma en submit
      document.getElementById('prestamoForm')?.addEventListener('submit', e => {
        if (!signaturePad.isEmpty()) {
          firmaDigitalIn.value = signaturePad.toDataURL();
        } else if (!firmaDigitalIn.value) {
          notyf.error('Por favor, firme antes de enviar el formulario.');
          e.preventDefault();
        }
      });
    }
  
    // ——— Cálculo ingresos ———
    const calcIngresos = () => {
      const ing   = parseFloat(document.getElementById('ingresos-mensuales')?.value) || 0;
      const otros = parseFloat(document.getElementById('otros-ingresos')?.value) || 0;
      const total = document.getElementById('total-ingresos');
      if (total) total.value = `RD$ ${(ing + otros).toFixed(2)}`;
    };
    ['ingresos-mensuales','otros-ingresos'].forEach(id =>
      document.getElementById(id)?.addEventListener('input', calcIngresos)
    );
  
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
    const campoRenta   = document.querySelector('.campo .renta')?.parentElement;
    const toggleRenta  = () => {
      campoRenta.style.display = (tipoVivienda.value === 'propia' ? 'none' : 'block');
    };
    tipoVivienda?.addEventListener('change', toggleRenta);
    toggleRenta();
  
    // ——— Formulario principal ———
    const form = document.getElementById('prestamoForm');
    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = document.getElementById('btnSiguiente');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  
      try {
        // Validar cédulas
        const frente = document.getElementById('frenteBase64').value;
        const reverso = document.getElementById('reversoBase64').value;
        if (!frente || !reverso) throw new Error('Debes subir ambas imágenes de la cédula');
  
        // Validar campos required
        const invalid = Array.from(form.querySelectorAll('[required]')).filter(f => !f.value.trim());
        if (invalid.length) {
          invalid.forEach(f => {
            f.classList.add('campo-invalido');
            setTimeout(() => f.classList.remove('campo-invalido'), 2000);
          });
          throw new Error('Complete todos los campos requeridos');
        }
  
        // Construir datos
        const data = {
          fecha_solicitud: fechaInputHidden.value,
          frenteBase64: frente.split(',')[1],
          reversoBase64: reverso.split(',')[1]
        };
        new FormData(form).forEach((v,k) => data[k.replace(/-/g,'_')] = v);
  
        // Convertir numéricos
        [ 'monto_solicitado','otros_ingresos','ingresos_mensuales','gastos_mensuales','prestamos_activos','pago_renta' ]
          .forEach(key => data[key] = parseFloat(data[key]) || 0);
  
        // Firma digital canvas
        if (signaturePad && !signaturePad.isEmpty()) {
          data.firma_digital = signaturePad.toDataURL().split(',')[1];
        }
  
        // Fecha validación
        if (!fechaInputHidden.value) throw new Error('La fecha de solicitud no está configurada correctamente.');
  
        // Enviar al servidor
        const res = await fetch('/formulario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error en el servidor');
        }
  
        const result = await res.json();
        notyf.success(result.mensaje || 'Formulario enviado exitosamente');
  
        if (result.redirect) {
          window.location.href = result.redirect;
        } else {
          form.reset();
          document.querySelectorAll('.thumbnail').forEach(img => img.src = '#');
          signaturePad?.clear();
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
      document.getElementById('campo-banco').style.display = (e.target.value === '0' ? 'none':'block');
    });
  
    // ——— Modal Cédula ———
    const modalBackdrop = document.getElementById('modalBackdrop');
    const abrirCedula   = document.getElementById('btnCedula');
    abrirCedula?.addEventListener('click', e => {
      e.preventDefault();
      modalBackdrop.style.display = 'block';
    });
    modalBackdrop?.addEventListener('click', e => {
      if (e.target === modalBackdrop) modalBackdrop.style.display = 'none';
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') modalBackdrop.style.display = 'none';
    });
  
    // ——— Preview y validación de cédula ———
    window.previewImage = (event, previewId, base64InputId) => {
      const input = event.target;
      const file = input.files?.[0];
      const preview = document.getElementById(previewId);
      const base64Input = document.getElementById(base64InputId);
      const container = input.closest('.upload-area');
      const plus = container.querySelector('.plus-icon');
      const text = container.querySelector('p');
  
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
        text.style.display = 'none';
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
      modalBackdrop.style.display = 'none';
    };
  
    // ——— Garantía → límite monto ———
    const garantiaSelect = document.getElementById('garantia');
    const montoInput     = document.getElementById('monto-solicitado');
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
  
    // ——— Validación extra al cerrar formulario ———
    window.validarYCerrarFormulario = () => {
      const sel = document.getElementById('garantia');
      const monto = document.getElementById('monto_solicitado');
      const formElm = document.querySelector('form');
      if (sel.value === 'ninguna' && parseFloat(monto.value) > 15000) {
        alert('El monto máximo sin garantía es de RD$ 15,000');
        formElm.style.display = 'none';
        return false;
      }
      modalBackdrop.style.display = 'none';
    };
  
  });

  function obtenerUbicacion(checkbox) {

    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });

    if (checkbox.checked) {
        // Obtener la ubicación actual
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lon = position.coords.longitude;
                
                // Guardar las coordenadas en los campos ocultos
                if (checkbox.id === "ubicacion_casa") {
                    document.getElementById('casaCoordenadas').value = lat + "," + lon;
                    document.getElementById('casaStatus').innerText = "Ubicación guardada";
                } else if (checkbox.id === "ubicacion_trabajo") {
                    document.getElementById('trabajoCoordenadas').value = lat + "," + lon;
                    document.getElementById('trabajoStatus').innerText = "Ubicación guardada";
                }
            }, function() {
                notyf.error("No se pudo obtener la ubicación.");
            });
        } else {
            notyf.error("La geolocalización no es compatible con este navegador.");
        }
    } else {
        // Limpiar las coordenadas cuando el checkbox no está marcado
        if (checkbox.id === "ubicacion_casa") {
            document.getElementById('casaCoordenadas').value = "";
            document.getElementById('casaStatus').innerText = "";
        } else if (checkbox.id === "ubicacion_trabajo") {
            document.getElementById('trabajoCoordenadas').value = "";
            document.getElementById('trabajoStatus').innerText = "";
        }
    }
}