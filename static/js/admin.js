document.addEventListener('DOMContentLoaded', function () {
    // Elementos DOM
    const userIcon = document.querySelector('.user-icon');
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('header');
    const mainContent = document.querySelector('.main-content');
    
    // Crear overlay para el sidebar en móvil
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Función para cerrar el sidebar
    function closeSidebar() {
        sidebar.classList.remove('active');
        hamburger.classList.remove('active');
        header.classList.remove('active');
        mainContent.classList.remove('active');
        overlay.classList.remove('active');
    }

    // Toggle del User Dropdown
    if (userIcon) {
        userIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            const dropdown = document.querySelector('.user-dropdown');
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Toggle del Sidebar
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            sidebar.classList.toggle('active');
            header.classList.toggle('active');
            mainContent.classList.toggle('active');
            overlay.classList.toggle('active');
        });
    }

    // Cerrar al hacer click en el overlay
    overlay.addEventListener('click', closeSidebar);

    // Manejo de Dropdowns del Sidebar
    const dropdownBtns = document.querySelectorAll('.dropbtn');
    dropdownBtns.forEach(function(dropdownBtn) {
        dropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Cerrar otros dropdowns
            dropdownBtns.forEach(function(otherBtn) {
                if (otherBtn !== dropdownBtn) {
                    otherBtn.nextElementSibling.style.display = 'none';
                }
            });

            // Toggle del dropdown actual
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Cerrar dropdowns al hacer click fuera
    window.addEventListener('click', function(event) {
        if (!event.target.matches('.dropbtn')) {
            const dropdowns = document.querySelectorAll('.dropdown-content');
            dropdowns.forEach(function(dropdown) {
                dropdown.style.display = 'none';
            });
        }
        
        // Cerrar user dropdown
        if (!event.target.matches('.user-icon')) {
            const userDropdown = document.querySelector('.user-dropdown');
            if (userDropdown) {
                userDropdown.style.display = 'none';
            }
        }
    });

    // Cerrar sidebar en enlaces en móvil
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Manejar cambio de tamaño de ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });

    // Configuración del Gráfico
    const ctx = document.getElementById('monthlyEarningsChart');
    let monthlyEarningsChart;
    if (ctx) {
        monthlyEarningsChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
                datasets: [{
                    label: 'Ganancias Mensuales',
                    data: [1000, 1500, 2000, 2500],
                    backgroundColor: 'rgba(0, 120, 215, 0.2)', // Color ajustado al tema
                    borderColor: 'rgba(0, 120, 215, 1)',      // Color ajustado al tema
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: "'Segoe UI', sans-serif"
                            }
                        }
                    }
                }
            }
        });
    }

    // Selector de Mes para el Gráfico
    const monthSelector = document.getElementById('month');
    if (monthSelector) {
        monthSelector.addEventListener('change', function() {
            const selectedMonth = this.value;
            fetch(`/api/ganancias/${selectedMonth}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    monthlyEarningsChart.data.datasets[0].data = data;
                    monthlyEarningsChart.update();
                })
                .catch(error => {
                    console.error('Error al obtener datos:', error);
                    // Aquí podrías agregar una notificación visual del error
                });
        });
    }
});
    
