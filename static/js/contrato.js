document.addEventListener('DOMContentLoaded', function () {
    // Obtener el ID del cliente desde la URL
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('id');

    if (clientId) {
        // Obtener los datos del cliente desde la API
        fetch(`/api/clientes/${clientId}`)
            .then(response => response.json())
            .then(cliente => {
                if (cliente.error) {
                    alert(cliente.error);
                } else {
                    // Llenar los campos del contrato con los datos del cliente
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

    // Modal de firma digital
    const modal = document.getElementById('modal-firma');
    const abrirModal = document.getElementById('abrir-modal');
    const borrarFirma = document.getElementById('borrar-firma');
    const finalizarFirma = document.getElementById('finalizar-firma');
    const signaturePadCanvas = document.getElementById('signature-pad');
    const ctx = signaturePadCanvas.getContext('2d');
    let isDrawing = false;
    const closeModal = document.querySelector('.close-btn');

    // Abrir el modal
    abrirModal.addEventListener('click', () => modal.style.display = 'block');

    // Dibujar en el canvas
    signaturePadCanvas.addEventListener('mousedown', e => {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });

    signaturePadCanvas.addEventListener('mousemove', e => {
        if (isDrawing) {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        }
    });

    signaturePadCanvas.addEventListener('mouseup', () => isDrawing = false);
    signaturePadCanvas.addEventListener('mouseleave', () => isDrawing = false);

    // Borrar la firma
    borrarFirma.addEventListener('click', () => ctx.clearRect(0, 0, signaturePadCanvas.width, signaturePadCanvas.height));

    // Finalizar la firma
    finalizarFirma.addEventListener('click', function () {
        const firmaData = signaturePadCanvas.toDataURL('image/png');
        const medioEntrega = document.querySelector('input[name="grupo-checkbox"]:checked')?.id || 'No especificado';
        const garantia = document.getElementById('garantia').value; // Capturar el valor de la garantía
    
        console.log('Garantía seleccionada:', garantia); // Depuración
    
        // Validar que los campos requeridos estén completos
        if (!firmaData || !medioEntrega || !garantia || !clientId) {
            alert('Por favor, completa todos los campos antes de continuar.');
            return;
        }
    
        // Enviar los datos al servidor
        fetch('/api/firmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente_id: clientId,
                firma: firmaData,
                medio_entrega: medioEntrega,
                garantia: garantia, // Enviar la garantía
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

    // Evento para cerrar el modal al hacer clic en la "X"
    closeModal.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    // Cerrar el modal al hacer clic fuera de él
    window.addEventListener('click', e => {
        if (e.target === modal) modal.style.display = 'none';
    });
});

// Función para formatear moneda
function formatCurrency(amount) {
    return parseFloat(amount || 0).toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Función para formatear fecha
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Asegurar que solo un checkbox esté seleccionado
document.querySelectorAll('input[name="grupo-checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
        if (this.checked) {
            document.querySelectorAll('input[name="grupo-checkbox"]').forEach(otherCheckbox => {
                if (otherCheckbox !== this) {
                    otherCheckbox.checked = false;
                }
            });
        }
    });
});