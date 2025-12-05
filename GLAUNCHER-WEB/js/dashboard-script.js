document.addEventListener('DOMContentLoaded', () => {
    // 1. Referencias de los Elementos
    const logoutButton = document.getElementById('logout-btn');
    const launchButton = document.getElementById('launch-game-btn');
    const navUsernameSpan = document.getElementById('nav-username');
    const navAvatarImg = document.getElementById('nav-avatar');
    const adminNavButton = document.getElementById('admin-nav-button');

    // ========================================================
    // A) LÓGICA DEL DASHBOARD
    // ========================================================

    // Función para verificar la sesión y cargar los datos del usuario
    async function checkSessionAndLoadUser() {
        try {
            // La URL es relativa, funcionará tanto en local como en producción (Render)
            const response = await fetch(`https://glauncher-api.onrender.com/api/user_info`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include' // Importante para enviar cookies de sesión
            });

            if (response.ok) {
                const data = await response.json();
                if (data.username) {
                    // Usar el servicio de Crafatar para obtener la cabeza de la skin de Minecraft
                    if (navAvatarImg) navAvatarImg.src = `https://crafatar.com/avatars/${data.username}?size=45&overlay`;
                    if (navUsernameSpan) navUsernameSpan.textContent = data.username;

                    // Mostrar el botón de admin si el usuario tiene los permisos
                    if (data.is_admin && adminNavButton) {
                        adminNavButton.style.display = 'block';
                    }
                }
            } else {
                // Si no está autenticado, redirigir al login
                // window.location.href = "login.html"; // Redirección desactivada temporalmente para diseño de GUI
            }
        } catch (error) {
            console.error("Error al verificar la sesión:", error);
            // En caso de error de red o servidor, también redirigir al login
            // window.location.href = "login.html"; // Redirección desactivada temporalmente para diseño de GUI
        }
    }

    checkSessionAndLoadUser(); // Ejecutar al cargar la página

    // ========================================================
    // B) CIERRE DE SESIÓN FUNCIONAL
    // ========================================================
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.showNotification('Cerrando sesión...', 'info');
            
            fetch(`https://glauncher-api.onrender.com/logout`, {
                method: 'GET',
                credentials: 'include'
            })
            .then(response => {
                // Independientemente de la respuesta, redirigimos al login.
                // El backend se habrá encargado de limpiar la sesión.
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            }).catch(error => {
                console.error("Error de red al cerrar sesión:", error);
                window.location.href = 'login.html'; // Forzar redirección
            });
        });
    }

    // ========================================================
    // C) LANZAMIENTO DEL JUEGO SIMULADO
    // ========================================================
    if (launchButton) {
        launchButton.addEventListener('click', () => {
            launchButton.disabled = true;
            launchButton.innerHTML = '<i class="fas fa-cog fa-spin"></i> Lanzando...';
            window.showNotification('Iniciando GLauncher...', 'info');

            // Simulación de lanzamiento
            setTimeout(() => {
                window.showNotification('¡Juego lanzado con éxito!', 'success');
                launchButton.disabled = false;
                launchButton.innerHTML = '<i class="fas fa-play"></i> Iniciar Juego';
                alert("Simulación: Minecraft se ha iniciado.");
            }, 2000);
        });
    }

    // ========================================================
    // D) LÓGICA DE NAVEGACIÓN POR PESTAÑAS (SPA-like)
    // ========================================================
    const navItems = document.querySelectorAll('.floating-nav-item');
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