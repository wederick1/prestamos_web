const btnAgregar = document.querySelector('.btn-agregar');
const modal = document.getElementById('modal-agregar');
const closeModal = document.getElementById('close-modal');
const form = document.getElementById('form-agregar');

const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });

btnAgregar?.addEventListener('click', () => {
  modal.classList.add('show');
});

closeModal?.addEventListener('click', () => {
  modal.classList.remove('show');
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.classList.remove('show');
  }
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const rol = document.getElementById('rol').value;

  if (!username || !password || !rol) {
    notyf.error('Todos los campos son obligatorios');
    return;
  }

  try {
    const res = await fetch(`/usuarios/verificar?username=${encodeURIComponent(username)}`);
    const data = await res.json();

    if (data.existe) {
      notyf.error('El nombre de usuario ya está en uso');
      return;
    }

    form.submit(); // Enviar si no existe
  } catch (err) {
    notyf.error('Error al verificar el usuario');
  }
});
