document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'https://glauncher-api.onrender.com';
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const securityCode = document.getElementById('security-code').value;

        if (password !== confirmPassword) {
            window.showNotification('Las contraseñas no coinciden.', 'error');
            return;
        }
        if (!/^\d{6}$/.test(securityCode)) {
            window.showNotification('El código de seguridad debe tener exactamente 6 dígitos.', 'error');
            return;
        }

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());
        delete data.confirm_password; // No necesitamos enviar esto al backend

        try {
            const response = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include' // Importante para manejar sesiones/cookies
            });

            const result = await response.json();

            if (response.ok) {
                window.showNotification(result.message, 'success');
                setTimeout(() => {
                    window.location.href = "login.html?status=registered"; // Redirigir al login con un mensaje de éxito
                }, 2000);
            } else {
                window.showNotification(result.message || 'Error desconocido.', 'error');
            }
        } catch (error) {
            window.showNotification('Error de conexión con el servidor.', 'error');
        }
    });
});