document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const credentialsSection = document.getElementById('credentials-section');
    const codeEntrySection = document.getElementById('code-entry-section');
    const verifyCodeButton = document.getElementById('verify-code-button');
    const goBackLink = document.getElementById('go-back-login');
    const messageBox = document.getElementById('form-message-box');

    function showMessage(message, isError = true) {
        messageBox.textContent = message;
        messageBox.className = 'form-message'; // Reset classes
        messageBox.classList.add(isError ? 'error' : 'success');
        messageBox.style.display = 'block';
    }
    
    // Mostrar mensaje si se redirige desde el panel de admin
    const urlParams = new URLSearchParams(window.location.search);
    const reason = urlParams.get('reason');
    if (reason === 'login_required') {
        showMessage('Debes iniciar sesión para acceder al panel de administración.', false);
    } else if (reason === 'admin_required') {
        showMessage('Acceso denegado. Necesitas permisos de administrador.', true);
    }

    // Función para verificar si ya hay una sesión activa
    async function checkSession() {
        try {
            const response = await fetch(`/api/user_info`, {
                credentials: 'include'
            });
            if (response.ok) {
                // Si la respuesta es OK, significa que el usuario ya está logueado.
                // Lo redirigimos al dashboard.
                window.location.href = "/dashboard";
            }
            // Si la respuesta no es OK (ej. 401), no hacemos nada y dejamos que el usuario inicie sesión.
        } catch (error) {
            // Error de red, no hacemos nada y permitimos el inicio de sesión manual.
            console.warn("No se pudo verificar la sesión existente, puede que el servidor no esté en línea.", error);
        }
    }

    // 1. Enviar credenciales al backend
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageBox.style.display = 'none';

        const formData = new FormData(loginForm);
        // Creamos el objeto de datos manualmente para enviar solo lo necesario.
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch(`/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include' // Importante para manejar sesiones/cookies
            });

            const result = await response.json();

            if (response.ok) {
                credentialsSection.style.display = 'none';
                codeEntrySection.style.display = 'block';
            } else {
                showMessage(result.message || 'Error desconocido.');
            }
        } catch (error) {
            showMessage('Error de conexión con el servidor.');
        }
    });

    // 2. Enviar código 2FA al backend
    verifyCodeButton.addEventListener('click', async () => {
        const code = document.getElementById('security-code').value;
        messageBox.style.display = 'none';

        try {
            const response = await fetch(`/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code }),
                credentials: 'include' // CRUCIAL para que el servidor sepa qué sesión verificar
            });

            const result = await response.json();

            if (response.ok) {
                // Redirigir a la URL que nos da el backend
                window.location.href = result.redirect_url;
            } else {
                showMessage(result.message || 'Error desconocido.');
            }
        } catch (error) {
            showMessage('Error de conexión con el servidor.');
        }
    });

    // 3. Volver a la pantalla de credenciales
    goBackLink.addEventListener('click', (e) => {
        e.preventDefault();
        codeEntrySection.style.display = 'none';
        credentialsSection.style.display = 'block';
        messageBox.style.display = 'none';
    });

    // Al cargar la página, primero verificamos si ya hay una sesión.
    checkSession();
});