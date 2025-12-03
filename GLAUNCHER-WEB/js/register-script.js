document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const messageBox = document.getElementById('form-message-box');

    function showMessage(message, isError = true) {
        messageBox.textContent = message;
        messageBox.className = 'form-message'; // Reset
        messageBox.classList.add(isError ? 'error' : 'success');
        messageBox.style.display = 'block';
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageBox.style.display = 'none';

        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const securityCode = document.getElementById('security-code').value;

        if (password !== confirmPassword) {
            showMessage('Las contraseñas no coinciden.');
            return;
        }
        if (!/^\d{6}$/.test(securityCode)) {
            showMessage('El código de seguridad debe tener exactamente 6 dígitos numéricos.');
            return;
        }

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());
        delete data.confirm_password; // No necesitamos enviar esto al backend

        try {
            const response = await fetch(`/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include' // Importante para manejar sesiones/cookies
            });

            const result = await response.json();

            if (response.ok) {
                showMessage(result.message, false); // Mensaje de éxito
                setTimeout(() => {
                    window.location.href = "login.html"; // Redirigir al login
                }, 2000);
            } else {
                showMessage(result.message || 'Error desconocido durante el registro.');
            }
        } catch (error) {
            showMessage('Error de conexión con el servidor.');
        }
    });
});