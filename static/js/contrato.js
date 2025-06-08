document.addEventListener('DOMContentLoaded', function () {
    // Obtener ID de cliente de la URL
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('id');

    if (!clientId) {
        alert('No se proporcionó un ID de cliente.');
        return;
    }

    // Cargar datos del cliente
    fetch(`/api/clientes/${clientId}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(cliente => {
            if (cliente.error) {
                alert(cliente.error);
                return;
            }
            document.getElementById('nombre-cliente').textContent = cliente.nombre || 'No proporcionado';
            document.getElementById('cedula-cliente').textContent = cliente.cedula || 'No proporcionado';
            document.getElementById('monto').textContent = formatCurrency(cliente.monto_solicitado);
            document.getElementById('monto-letras').textContent = `RD$ ${formatCurrency(cliente.monto_solicitado)}`;
            document.getElementById('monto-total').textContent = formatCurrency(cliente.monto_total || cliente.monto_solicitado);
            document.getElementById('fecha-solicitud').textContent = `Fecha: ${formatDate(cliente.fecha_solicitud)}`;
            const garantiaEl = document.getElementById('garantia');
            if (['INPUT','SELECT','TEXTAREA'].includes(garantiaEl.tagName)) {
                garantiaEl.value = cliente.garantia || '';
            } else {
                garantiaEl.textContent = cliente.garantia || 'No proporcionado';
            }
            document.getElementById('frecuencia').textContent = cliente.frecuencia || 'No proporcionado';
        })
        .catch(error => {
            console.error('Error al cargar los datos del cliente:', error);
            alert('Error al cargar los datos del cliente');
        });

    // Variables del modal y canvas
    const modal = document.getElementById('modal-firma');
    const abrirModal = document.getElementById('abrir-modal');
    const borrarFirma = document.getElementById('borrar-firma');
    const finalizarFirma = document.getElementById('finalizar-firma');
    const signaturePadCanvas = document.getElementById('signature-pad');
    const ctx = signaturePadCanvas.getContext('2d');
    let isDrawing = false;

    // Redimensionar y escalar canvas
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = signaturePadCanvas.getBoundingClientRect();
        signaturePadCanvas.width = rect.width * ratio;
        signaturePadCanvas.height = rect.height * ratio;
        signaturePadCanvas.style.width = rect.width + 'px';
        signaturePadCanvas.style.height = rect.height + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
        ctx.lineCap = 'round';
        ctx.lineWidth = 2;
    }

    function getPosition(e) {
        const rect = signaturePadCanvas.getBoundingClientRect();
        const isTouch = e.touches && e.touches.length > 0;
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getPosition(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        e.preventDefault();
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getPosition(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        e.preventDefault();
    }

    function stopDrawing() {
        isDrawing = false;
        ctx.closePath();
    }

    // Inicializar canvas y eventos
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    signaturePadCanvas.addEventListener('mousedown', startDrawing);
    signaturePadCanvas.addEventListener('mousemove', draw);
    signaturePadCanvas.addEventListener('mouseup', stopDrawing);
    signaturePadCanvas.addEventListener('mouseout', stopDrawing);
    signaturePadCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    signaturePadCanvas.addEventListener('touchmove', draw, { passive: false });
    signaturePadCanvas.addEventListener('touchend', stopDrawing);
    signaturePadCanvas.addEventListener('touchcancel', stopDrawing);

    // Abrir y cerrar modal
    abrirModal.addEventListener('click', () => {
        modal.style.display = 'block';
        resizeCanvas();
    });
    modal.querySelector('.close-btn').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    // Borrar firma
    borrarFirma.addEventListener('click', () => ctx.clearRect(0, 0, signaturePadCanvas.width, signaturePadCanvas.height));

    // Finalizar firma y enviar al backend
    finalizarFirma.addEventListener('click', function () {
        const firmaData = signaturePadCanvas.toDataURL('image/png');
        // Obtener valores de todos los checkboxes seleccionados
        const medioEntrega = Array.from(
            document.querySelectorAll('input[name="grupo-checkbox"]:checked')
        ).map(cb => cb.value);
        const garantiaEl = document.getElementById('garantia');
        const garantia = garantiaEl.value || garantiaEl.textContent;

        if (!firmaData || medioEntrega.length === 0 || !garantia) {
            alert('Por favor, completa todos los campos antes de continuar.');
            return;
        }

        // Construir payload
        const payload = {
            cliente_id: clientId,
            firma: firmaData,
            medio_entrega: medioEntrega,
            garantia: garantia,
            estado: 'aprobado',
        };

        fetch('/api/firmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.error) {
                    alert(data.error);
                }
            })
            .catch(error => {
                console.error('Error al enviar los datos:', error);
                alert('Error al enviar los datos');
            });
    });

    // Checkbox único
    document.querySelectorAll('input[name="grupo-checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                document.querySelectorAll('input[name="grupo-checkbox"]').forEach(other => {
                    if (other !== this) other.checked = false;
                });
            }
        });
    });
});

// Formato moneda
function formatCurrency(amount) {
    return parseFloat(amount || 0).toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Formato fecha
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}
