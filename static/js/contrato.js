document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('id');

    if (clientId) {
        fetch(`/api/clientes/${clientId}`)
            .then(response => response.json())
            .then(cliente => {
                if (cliente.error) {
                    alert(cliente.error);
                } else {
                    document.getElementById('nombre-cliente').textContent = cliente.nombre || 'No proporcionado';
                    document.getElementById('cedula-cliente').textContent = cliente.cedula || 'No proporcionado';
                    document.getElementById('monto').textContent = formatCurrency(cliente.monto_solicitado || 0);
                    document.getElementById('monto-letras').textContent = `RD$ ${formatCurrency(cliente.monto_solicitado || 0)}`;
                    document.getElementById('monto-total').textContent = formatCurrency(cliente.monto_total || cliente.monto_solicitado || 0);
                    document.getElementById('fecha-solicitud').textContent = `Fecha: ${formatDate(cliente.fecha_solicitud || new Date())}`;
                }
            })
            .catch(error => {
                console.error('Error al cargar los datos del cliente:', error);
                alert('Error al cargar los datos del cliente');
            });
    } else {
        alert('No se proporcionó un ID de cliente.');
    }

    const modal = document.getElementById('modal-firma');
    const abrirModal = document.getElementById('abrir-modal');
    const borrarFirma = document.getElementById('borrar-firma');
    const finalizarFirma = document.getElementById('finalizar-firma');
    const signaturePadCanvas = document.getElementById('signature-pad');
    const ctx = signaturePadCanvas.getContext('2d');
    let isDrawing = false;
    const closeModal = document.querySelector('.close-btn');

    // Redimensionar y escalar canvas correctamente
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const rect = signaturePadCanvas.getBoundingClientRect();
        signaturePadCanvas.width = rect.width * ratio;
        signaturePadCanvas.height = rect.height * ratio;
        signaturePadCanvas.style.width = rect.width + 'px';
        signaturePadCanvas.style.height = rect.height + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
        ctx.scale(ratio, ratio);
    }

    function getPosition(e) {
        const rect = signaturePadCanvas.getBoundingClientRect();
        const isTouch = e.touches && e.touches.length > 0;
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const clientY = isTouch ? e.touches[0].clientY : e.clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
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

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Eventos para mouse
    signaturePadCanvas.addEventListener('mousedown', startDrawing);
    signaturePadCanvas.addEventListener('mousemove', draw);
    signaturePadCanvas.addEventListener('mouseup', stopDrawing);
    signaturePadCanvas.addEventListener('mouseout', stopDrawing);

    // Eventos para touch
    signaturePadCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    signaturePadCanvas.addEventListener('touchmove', draw, { passive: false });
    signaturePadCanvas.addEventListener('touchend', stopDrawing);
    signaturePadCanvas.addEventListener('touchcancel', stopDrawing);

    // Abrir modal
    abrirModal.addEventListener('click', () => {
        modal.style.display = 'block';
        resizeCanvas(); // asegurar que se escale al mostrarse
    });

    // Cerrar modal
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', e => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Borrar firma
    borrarFirma.addEventListener('click', () => ctx.clearRect(0, 0, signaturePadCanvas.width, signaturePadCanvas.height));

    // Finalizar firma
    finalizarFirma.addEventListener('click', function () {
        const firmaData = signaturePadCanvas.toDataURL('image/png');
        const medioEntrega = document.querySelector('input[name="grupo-checkbox"]:checked')?.id || 'No especificado';
        const garantia = document.getElementById('garantia').value;

        if (!firmaData || !medioEntrega || !garantia || !clientId) {
            alert('Por favor, completa todos los campos antes de continuar.');
            return;
        }

        fetch('/api/firmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente_id: clientId,
                firma: firmaData,
                medio_entrega: medioEntrega,
                garantia: garantia,
                estado: 'aprobado',
            }),
        })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    return response.json();
                }
            })
            .then(data => {
                if (data && !data.success) {
                    alert(data.error || 'Error al guardar la firma');
                }
            })
            .catch(error => {
                console.error('Error al enviar los datos:', error);
                alert('Error al enviar los datos');
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
