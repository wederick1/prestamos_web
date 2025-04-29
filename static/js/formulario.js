

window.addEventListener('DOMContentLoaded', function () {
    // Fecha solicitud
    const today = new Date();
    const dia = String(today.getDate()).padStart(2, '0');
    const mes = String(today.getMonth() + 1).padStart(2, '0');
    const anio = today.getFullYear();
    const formattedDate = `${dia}/${mes}/${anio}`;

    const fechaSpan = document.getElementById('fecha-solicitud');
    const fechaInputHidden = document.getElementById('fecha-solicitud-input');
    fechaSpan && (fechaSpan.textContent = `Fecha: ${formattedDate}`);
    fechaInputHidden && (fechaInputHidden.value = formattedDate);

    // Elementos del formulario
    const form = document.getElementById('prestamoForm');
    const firmaModal = document.getElementById('firmaModal');
    const abrirModalBtn = document.getElementById('abrirFirmaModal');
    const firmaInput = document.getElementById('firmaInput');
    const generarFirmaBtn = document.getElementById('generarFirma');
    const firmaSolicitante = document.querySelector('.handwritten-signature');
    const firmaDigitalInput = document.getElementById('firmaDigital');
    const canvas = document.getElementById('signaturePad');
    const clearButton = document.getElementById('clearSignature');
    const tipoVivienda = document.getElementById('tipo-vivienda');
    const campoRenta = document.querySelector('.campo .renta')?.parentElement;
    const estadoCivil = document.getElementById('estado-civil');
    const camposPareja = document.querySelectorAll('.pareja');
    const notyf = new Notyf({
        duration: 3000,
        position: { x: 'right', y: 'top' }
    });
    

    // Modal de firma
    if (abrirModalBtn && firmaModal) {
        abrirModalBtn.addEventListener('click', (e) => {
            e.preventDefault();
            firmaModal.classList.add('active');
        });
    }

    // Generar firma manual
    if (generarFirmaBtn && firmaInput && firmaSolicitante && firmaDigitalInput) {
        generarFirmaBtn.addEventListener('click', () => {
            const firmaTexto = firmaInput.value.trim();
            if (firmaTexto) {
                firmaSolicitante.textContent = firmaTexto;
                firmaDigitalInput.value = firmaTexto;
                firmaModal.classList.remove('active');
                firmaInput.value = '';
            } else {
                notyf.error('Por favor, ingrese su firma.');
            }
        });
    }

    // Calcular ingresos
    const calcularIngresos = () => {
        const ingresos = parseFloat(document.getElementById('ingresos-mensuales')?.value) || 0;
        const otros = parseFloat(document.getElementById('otros-ingresos')?.value) || 0;
        const totalIngresos = document.getElementById('total-ingresos');
        if (totalIngresos) {
            totalIngresos.value = `RD$ ${(ingresos + otros).toFixed(2)}`;
        }
    };
    document.getElementById('ingresos-mensuales')?.addEventListener('input', calcularIngresos);
    document.getElementById('otros-ingresos')?.addEventListener('input', calcularIngresos);

    // Signature Pad
    if (canvas && clearButton && firmaDigitalInput) {
        const resizeCanvas = () => {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext('2d').scale(ratio, ratio);
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgba(255, 255, 255, 1)',
            penColor: 'rgb(0, 0, 0)',
        });

        clearButton.addEventListener('click', () => {
            signaturePad.clear();
            firmaDigitalInput.value = '';
        });

        form?.addEventListener('submit', (e) => {
            if (!signaturePad.isEmpty()) {
                firmaDigitalInput.value = signaturePad.toDataURL();
            } else if (!firmaDigitalInput.value) {
                notyf.error('Por favor, firme antes de enviar el formulario.');
                e.preventDefault();
                return;
            }
        });
    }

    // Mostrar u ocultar campos pareja
    const toggleCamposPareja = () => {
        const estado = estadoCivil?.value;
        camposPareja.forEach((campo) => {
            if (estado === 'soltero') {
                campo.classList.add('hidden');
            } else {
                campo.classList.remove('hidden');
            }
        });
    };
    estadoCivil?.addEventListener('change', toggleCamposPareja);
    toggleCamposPareja(); // Inicial

    // Mostrar u ocultar campo renta
    const toggleCampoRenta = () => {
        if (tipoVivienda?.value === 'propia') {
            campoRenta.style.display = 'none';
        } else {
            campoRenta.style.display = 'block';
        }
    };
    tipoVivienda?.addEventListener('change', toggleCampoRenta);
    toggleCampoRenta(); // Inicial

    // Manejo del envío del formulario
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validar campos requeridos
            const camposRequeridos = Array.from(form.querySelectorAll('[required]'));
            let valido = true;
            camposRequeridos.forEach((campo) => {
                if (!campo.value.trim()) {
                    valido = false;
                    campo.classList.add('campo-invalido');
                    setTimeout(() => campo.classList.remove('campo-invalido'), 2000);
                }
            });

            if (!valido) return notyf.error('Complete todos los campos requeridos');

            // Recolectar datos
            const formData = new FormData(form);
            const datos = {};
            for (const [key, value] of formData.entries()) {
                const claveNormalizada = key.replace(/-/g, '_');
                if (datos[claveNormalizada]) {
                    datos[claveNormalizada] = Array.isArray(datos[claveNormalizada])
                        ? [...datos[claveNormalizada], value]
                        : [datos[claveNormalizada], value];
                } else {
                    datos[claveNormalizada] = value;
                }
            }

            datos['fecha_solicitud'] = fechaInputHidden?.value || '';

            // Convertir campos numéricos
            const camposNumericos = [
                'monto_solicitado',
                'otros_ingresos',
                'ingresos_mensuales',
                'gastos_mensuales',
                'prestamos_activos'
            ];
            camposNumericos.forEach((campo) => {
                datos[campo] = parseFloat(datos[campo] || 0);
            });

            try {
                const respuesta = await fetch('/formulario', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos),
                });

                const resultado = await respuesta.json();
                if (!respuesta.ok) throw new Error(resultado.error || 'Error en el servidor');

                if (resultado.redirect) {
                    window.location.href = resultado.redirect;
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }
});
