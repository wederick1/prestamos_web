document.addEventListener('DOMContentLoaded', function () {
    // Obtener todos los clientes desde la API
    fetch('/api/clientes')
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#clientes tbody');
            data.forEach(cliente => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cliente.id}</td>
                    <td>${cliente.nombre}</td>
                    <td>${cliente.email}</td>
                    <td>${cliente.telefono}</td>
                    <td>${cliente.cedula}</td>
                    <td>
                        <button class="info-btn view-client-btn" data-id="${cliente.id}">Info</button>
                        <button class="contrato-btn" data-id="${cliente.id}">Contrato</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Evento para el botón "Info" (abrir modal)
            const infoButtons = document.querySelectorAll('.view-client-btn');
            infoButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const clientId = button.getAttribute('data-id');
                    fetch(`/api/clientes/${clientId}`)
                        .then(response => response.json())
                        .then(cliente => {
                            if (cliente.error) {
                                alert(cliente.error);
                            } else {
                                // Mostrar modal con los datos del cliente
                                const modalContent = `
                                    <p><strong>Nombre:</strong> ${cliente.nombre}</p>
                                    <p><strong>Cédula:</strong> ${cliente.cedula}</p>
                                    <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                                    <p><strong>Dirección:</strong> ${cliente.direccion}</p>
                                    <p><strong>Lugar de Trabajo:</strong> ${cliente.lugar_trabajo}</p>
                                    <p><strong>Ingresos Mensuales:</strong> RD$ ${cliente.ingresos_mensuales}</p>
                                `;
                                document.querySelector('#modal-body').innerHTML = modalContent;
                                document.querySelector('#modal').classList.add('show');
                            }
                        });
                });
            });

            // Evento para el botón "Contrato" (redirigir a contrato.html)
            const contratoButtons = document.querySelectorAll('.contrato-btn');
            contratoButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const clientId = button.getAttribute('data-id');
                    window.location.href = `/contrato?id=${clientId}`;
                });
            });
        });
});

document.addEventListener('DOMContentLoaded', function () {
    const modal = document.querySelector('#modal');
    const closeModal = document.querySelector('.close-btn');

    closeModal.addEventListener('click', function () {
        modal.classList.remove('show');
    });

    window.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
});