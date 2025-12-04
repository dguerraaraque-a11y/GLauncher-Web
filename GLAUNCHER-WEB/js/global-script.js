/**
 * GLAUNCHER - Global UI Sound Script
 * Este script añade efectos de sonido de clic a varios elementos interactivos del sitio.
 */
document.addEventListener('DOMContentLoaded', () => {

    // ========================================================
    // 1. SISTEMA DE CARGA, NOTIFICACIONES Y OFFLINE
    // ========================================================

    // --- Lógica del Spinner de Carga ---
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        window.addEventListener('load', () => {
            loader.classList.add('hidden');
            // Eliminar el loader del DOM después de la transición para mejorar el rendimiento
            setTimeout(() => {
                loader.remove();
            }, 500);
        });
    }

    // --- Lógica de la Pantalla de Desconexión ---
    const offlineOverlay = document.getElementById('offline-overlay');
    
    function updateOnlineStatus() {
        if (navigator.onLine) {
            offlineOverlay?.classList.remove('visible');
        } else {
            offlineOverlay?.classList.add('visible');
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Comprobar estado al cargar la página

    // --- Sistema Global de Notificaciones Flotantes ---
    window.showNotification = (message, type = 'info') => {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        if (type === 'error') iconClass = 'fa-times-circle';

        notification.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
        
        container.appendChild(notification);

        // Eliminar la notificación del DOM después de que termine la animación
        setTimeout(() => {
            notification.remove();
        }, 5000); // 5 segundos (4.5s de animación + 0.5s de margen)
    };


    // ========================================================
    // 2. EFECTOS DE SONIDO GLOBALES
    // ========================================================

    // Quitar la clase de carga para activar la animación de entrada
    document.body.classList.remove('is-loading');

    // 1. Crear el elemento de audio para el sonido de clic
    const clickSound = new Audio('/static/sounds/click_sound.mp3');
    clickSound.preload = 'auto';
    clickSound.volume = 0.4; // Ajusta el volumen para que no sea muy invasivo

    // Función para reproducir el sonido
    const playClickSound = () => {
        clickSound.currentTime = 0; // Reinicia el sonido para poder hacer clics rápidos
        clickSound.play().catch(error => {
            // La reproducción automática puede fallar si el usuario no ha interactuado con la página.
            // No es un error crítico, por lo que solo lo mostramos en la consola.
            console.warn("No se pudo reproducir el sonido de clic:", error);
        });
    };

    // 2. Seleccionar todos los elementos que deben tener sonido de clic
    const clickableElements = document.querySelectorAll(`
        .auth-button,
        .download-button,
        .auth-button-action,
        .filter-button,
        .prog-tab-button,
        .tab-button,
        .social-login-button,
        .control-button
    `);

    // 3. Añadir el evento de clic a cada elemento
    clickableElements.forEach(element => {
        element.addEventListener('click', playClickSound);
    });

    // ========================================================
    // LÓGICA PARA MENSAJES DE LANZAMIENTO (INDEX.HTML)
    // ========================================================

    let currentPage = 1;
    const messagesPerPage = 10;

    // Palabras prohibidas (cliente-side para feedback inmediato)
    const FORBIDDEN_WORDS = [
        "puta", "mierda", "cabron", "joder", "gilipollas", "coño", "polla", "verga", "pene", "cojones", "zorra", "maricon", "idiota", "estupido", "tonto", "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "bastard", "motherfucker"
    ];

    function filterWordsClient(text) {
        let filteredText = text;
        FORBIDDEN_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi'); // 'gi' para global e insensible a mayúsculas/minúsculas
            filteredText = filteredText.replace(regex, '*'.repeat(word.length));
        });
        return filteredText;
    }

    // Función para verificar el estado de inicio de sesión
    async function checkLoginStatus() {
        try {
            const response = await fetch(`/api/user_info`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                return { loggedIn: true, username: data.username };
            } else {
                return { loggedIn: false };
            }
        } catch (error) {
            console.warn("Error al verificar el estado de login:", error);
            return { loggedIn: false };
        }
    }

    // Función para añadir un mensaje al DOM
    function addLaunchMessageToDOM(msg) {
        const launchMessagesList = document.getElementById('launch-messages-list');
        if (!launchMessagesList) return;

        const messageElement = document.createElement('div');
        messageElement.classList.add('launch-message-card');

        const date = new Date(msg.timestamp);
        const formattedDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        messageElement.innerHTML = `
            <div class="message-header"><span class="message-username">${msg.username}</span><span class="message-timestamp">${formattedDate} ${formattedTime}</span></div>
            <p class="message-content">${msg.content}</p>
        `;
        // Si es la primera página, usamos prepend. Si no, append.
        if (currentPage === 1) {
            launchMessagesList.prepend(messageElement);
        } else {
            launchMessagesList.appendChild(messageElement);
        }
    }

    // Función para cargar los mensajes existentes
    async function loadLaunchMessages(page = 1) {
        const launchMessagesList = document.getElementById('launch-messages-list');
        const loadMoreContainer = document.getElementById('load-more-container');
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (!launchMessagesList) return;

        if (page === 1) {
            launchMessagesList.innerHTML = '<div class="launch-message-card system-message"><p>Cargando mensajes...</p></div>';
        } else {
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
        }

        try {
            const response = await fetch(`/api/launch_messages?page=${page}&limit=${messagesPerPage}`);
            if (!response.ok) throw new Error('No se pudieron cargar los mensajes.');
            
            const { messages, has_more } = await response.json();
            if (page === 1) launchMessagesList.innerHTML = ''; // Limpiar el mensaje de carga solo en la primera página

            if (messages.length === 0) {
                launchMessagesList.innerHTML = '<div class="launch-message-card system-message"><p>¡Sé el primero en dejar un mensaje!</p></div>';
            } else {
                messages.forEach(msg => addLaunchMessageToDOM(msg));
            }
        } catch (error) {
            console.error("Error al cargar mensajes de lanzamiento:", error);
            launchMessagesList.innerHTML = '<div class="launch-message-card system-message error-message"><p>Error al cargar los mensajes.</p></div>';
        }
    }

    // Función para enviar un nuevo mensaje
    async function postLaunchMessage() {
        const messageContentInput = document.getElementById('launch-message-content');
        const postButton = document.getElementById('post-launch-message-btn');
        const warningText = document.getElementById('launch-message-warning');

        let content = messageContentInput.value.trim();
        if (!content) {
            warningText.textContent = 'El mensaje no puede estar vacío.';
            return;
        }

        // Filtrar palabras en el cliente para feedback inmediato
        const filteredContentClient = filterWordsClient(content);
        if (filteredContentClient !== content) {
            warningText.textContent = 'Tu mensaje contiene palabras inapropiadas y ha sido censurado.';
            content = filteredContentClient; // Enviar el contenido censurado
        } else {
            warningText.textContent = '';
        }

        postButton.disabled = true;
        postButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        try {
            const response = await fetch(`/api/launch_messages/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content: content })
            });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message);

            // Recargamos la primera página para ver el nuevo mensaje al principio
            loadLaunchMessages(1);
            messageContentInput.value = ''; // Limpiar input
            warningText.textContent = '¡Mensaje enviado con éxito!';
            warningText.style.color = 'var(--neon-green)';
        } catch (error) {
            console.error("Error al enviar mensaje de lanzamiento:", error);
            warningText.textContent = `Error al enviar mensaje: ${error.message}`;
            warningText.style.color = 'var(--neon-pink)';
        } finally {
            postButton.disabled = false;
            postButton.innerHTML = 'Enviar Mensaje';
        }
    }

    // Función de inicialización para index.html
    async function initializeLaunchMessages() {
        const loginStatus = await checkLoginStatus();
        const messageInputArea = document.getElementById('message-input-area');
        const loginToPostMessage = document.getElementById('login-to-post-message');
        const postButton = document.getElementById('post-launch-message-btn');
        const loadMoreBtn = document.getElementById('load-more-btn');
        const messageContentInput = document.getElementById('launch-message-content');
        const charCounter = document.getElementById('char-counter');

        if (loginStatus.loggedIn) {
            if (messageInputArea) messageInputArea.style.display = 'flex';
            if (loginToPostMessage) loginToPostMessage.style.display = 'none';
            if (postButton) postButton.addEventListener('click', postLaunchMessage);

            // Lógica del contador de caracteres
            if (messageContentInput && charCounter) {
                messageContentInput.addEventListener('input', () => {
                    const currentLength = messageContentInput.value.length;
                    const maxLength = messageContentInput.maxLength;
                    charCounter.textContent = `${currentLength}/${maxLength}`;
                    if (currentLength >= maxLength) {
                        charCounter.classList.add('limit-reached');
                    } else {
                        charCounter.classList.remove('limit-reached');
                    }
                });
            }
        } else {
            if (messageInputArea) messageInputArea.style.display = 'none';
            if (loginToPostMessage) loginToPostMessage.style.display = 'block';
        }
        
        if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => loadLaunchMessages(currentPage + 1));
        loadLaunchMessages(1); // Cargar la primera página de mensajes
    }

    // Ejecutar la inicialización solo si estamos en la página de inicio
    if (document.getElementById('launch-messages-section')) {
        initializeLaunchMessages();
    }
});