document.addEventListener('DOMContentLoaded', () => {
    // URL del backend. Para desarrollo local, apunta a tu propia PC.
    const BACKEND_URL = "http://127.0.0.1:5000";

    // 1. Referencias de los Elementos
    // Se buscan todos los botones de logout (escritorio y móvil)
    const logoutButtons = document.querySelectorAll('#logout-btn');
    const launchButton = document.getElementById('launch-game-btn');
    const launchStatus = document.getElementById('launch-status');
    const progressBar = document.getElementById('progress-bar');
    const dashboardUsernameSpan = document.getElementById('dashboard-username');

    // ========================================================
    // A) LÓGICA DEL DASHBOARD
    // ========================================================

    // Función para verificar la sesión y obtener el nombre de usuario
    async function checkSessionAndLoadUser() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/user_info`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Importante para enviar cookies de sesión
            });

            if (response.ok) {
                const data = await response.json();
                if (data.username) {
                    const username = data.username.toUpperCase();
                    // Actualizar todos los lugares donde aparece el nombre de usuario
                    if (dashboardUsernameSpan) dashboardUsernameSpan.textContent = username;
                    
                    const userInfoH2 = document.querySelector('.user-info-card h2.neon-text');
                    if (userInfoH2) userInfoH2.textContent = data.username;
                    
                    const userAvatar = document.querySelector('.user-info-card .user-avatar');
                    if (userAvatar) userAvatar.src = data.avatar_url || '../images/avatars/default-avatar.png';
                }
            } else {
                // Si no está autenticado, redirigir al login
                window.location.href = "login.html"; // Redirige a la página de login
            }
        } catch (error) {
            console.error("Error al verificar la sesión:", error);
            // En caso de error de red o servidor, también redirigir al login
            window.location.href = "login.html";
        }
    }

    checkSessionAndLoadUser(); // Ejecutar al cargar la página

    // ========================================================
    // B) CIERRE DE SESIÓN FUNCIONAL
    // ========================================================

    if (logoutButtons.length > 0) {
        logoutButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (launchStatus) launchStatus.textContent = "Cerrando sesión...";
                if (launchStatus) launchStatus.style.color = 'var(--neon-pink)';
                
                // Realizar una solicitud al backend para cerrar la sesión
                fetch(`${BACKEND_URL}/logout`, {
                    method: 'GET', // O POST, dependiendo de cómo lo configures en Flask
                    credentials: 'include' // Importante para enviar cookies de sesión
                })
                .then(response => {
                    if (response.ok) {
                        // Si el logout fue exitoso en el backend, redirigir al frontend
                        setTimeout(() => {
                            window.location.href = 'login.html'; // Redirige a la página de login
                        }, 1000);
                    } else {
                        console.error("Error al cerrar sesión en el backend.");
                        alert("Error al cerrar sesión. Inténtalo de nuevo.");
                        window.location.href = 'login.html'; // Forzar redirección incluso con error
                    }
                }).catch(error => {
                    console.error("Error de red al intentar cerrar sesión:", error);
                    alert("Error de conexión al intentar cerrar sesión.");
                    window.location.href = 'login.html'; // Forzar redirección en caso de error de red
                });
            });
        });
    }

    // ========================================================
    // C) LANZAMIENTO DEL JUEGO SIMULADO (CON BARRA DE PROGRESO)
    // ========================================================
    if (launchButton) {
        launchButton.addEventListener('click', () => {
            launchButton.disabled = true;
            launchButton.innerHTML = '<i class="fas fa-cog fa-spin"></i> Lanzando...';
            launchStatus.textContent = 'Iniciando Minecraft...';
            launchStatus.style.color = 'var(--neon-blue)';

            // Simulación de lanzamiento
            setTimeout(() => {
                launchStatus.textContent = '¡Juego lanzado con éxito! Disfruta.';
                launchStatus.style.color = 'var(--neon-green)';
                launchButton.disabled = false;
                launchButton.innerHTML = '<i class="fas fa-play-circle"></i> Iniciar Juego';
                alert("Simulación: Minecraft se ha iniciado.");
            }, 2000);
        });
    }

    // ========================================================
    // D) LÓGICA DE NAVEGACIÓN POR PESTAÑAS (SPA-like)
    // ========================================================
    const navItems = document.querySelectorAll('.dashboard-nav .nav-item, .bottom-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        // Ignorar el botón de logout que no tiene data-target
        if (item.dataset.target) {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                const targetId = item.dataset.target;

                // 1. Ocultar todas las secciones de contenido
                contentSections.forEach(section => {
                    section.classList.remove('active');
                });

                // 2. Quitar 'active' de todos los items de navegación (ambas barras)
                navItems.forEach(nav => {
                    if (nav.dataset.target) nav.classList.remove('active');
                });

                // 3. Mostrar la sección correcta y activar los items de nav correspondientes
                document.getElementById(targetId)?.classList.add('active');
                document.querySelectorAll(`.nav-item[data-target="${targetId}"]`).forEach(activeItem => {
                    activeItem.classList.add('active');
                });
            });
        }
    });
});