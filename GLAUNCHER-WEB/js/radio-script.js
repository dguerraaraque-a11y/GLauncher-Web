document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.prog-tab-button');
    const tabContents = document.querySelectorAll('.prog-tab-content');

    // --- Lógica de Pestañas de Programación ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const tabId = button.dataset.tab;
            const activeTabContent = document.getElementById(tabId);
            activeTabContent.classList.add('active');
        });
    });

    // --- Lógica para resaltar el programa actual ---
    function highlightCurrentProgram() {
        const nowUTC = new Date();
        const venezuelaTime = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'America/Caracas' }));

        const currentDay = venezuelaTime.getDay(); // Domingo: 0, Lunes: 1, ..., Sábado: 6
        const currentTime = venezuelaTime.getHours().toString().padStart(2, '0') + ':' + venezuelaTime.getMinutes().toString().padStart(2, '0');

        const programCards = document.querySelectorAll('.program-card');
        
        programCards.forEach(card => {
            card.classList.remove('is-live'); // Limpiar clase anterior

            const days = card.dataset.days.split(',').flatMap(d => {
                if (d.includes('-')) {
                    const [start, end] = d.split('-').map(Number);
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                }
                return [Number(d)];
            });

            const startTime = card.dataset.start;
            const endTime = card.dataset.end;

            const isToday = days.includes(currentDay);
            let isTime = false;

            // Manejar rangos que cruzan la medianoche (ej. 18:00 - 07:50)
            if (startTime > endTime) { 
                isTime = (currentTime >= startTime && currentTime <= '23:59') || (currentTime >= '00:00' && currentTime < endTime);
            } else {
                isTime = currentTime >= startTime && currentTime < endTime;
            }

            if (isToday && isTime) {
                card.classList.add('is-live');
            }
        });
    }

    highlightCurrentProgram();
    setInterval(highlightCurrentProgram, 60000); // Actualizar cada minuto

    // ========================================================
    // LÓGICA DEL CHAT
    // ========================================================
    const chatMessages = document.getElementById('chat-messages');
    const usernameInput = document.getElementById('chat-username');
    const messageInput = document.getElementById('chat-message-input');
    const sendButton = document.getElementById('send-chat-btn');
    const emojiButton = document.getElementById('emoji-btn');
    const pickerContainer = document.getElementById('picker-container');
    const notificationSound = document.getElementById('chat-notification-sound');
    let lastTimestamp = new Date(0).toISOString();

    // --- CONFIGURACIÓN DE PUSHER ---
    // Estas claves son públicas y seguras de exponer en el frontend.
    const PUSHER_KEY = 'default_key'; // Reemplaza con tu PUSHER_KEY real si no usas variables de entorno aquí
    const PUSHER_CLUSTER = 'us2';     // Reemplaza con tu PUSHER_CLUSTER real

    const pusher = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER
    });

    // Suscribirse al canal del chat
    const channel = pusher.subscribe('chat_radio');

    // --- LÓGICA DEL CHAT ---
    const USERNAME_KEY = 'glauncher_chat_username';

    // Lista de palabras para el filtro de profanidad
    const FORBIDDEN_WORDS = [
        // Palabras base
        "puta", "mierda", "cabron", "joder", "gilipollas", "coño", "polla", "pene", "cojones", "zorra", "maricon", "idiota", "estupido", "tonto", "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "bastard", "motherfucker",
        // Palabras de Venezuela y otros países de LATAM
        "mamahuevo", "guevo", "pajuo", "malparido", "hijueputa", "verga", "concha tu madre", "weon", "huevon", "boludo", "pendejo"
    ];

    // Función para censurar malas palabras
    function filterProfanity(text) {
        let filteredText = text;
        const regex = new RegExp(FORBIDDEN_WORDS.join('|'), 'gi');
        filteredText = filteredText.replace(regex, match => '*'.repeat(match.length));
        return filteredText;
    }

    // Cargar nombre de usuario guardado
    usernameInput.value = localStorage.getItem(USERNAME_KEY) || '';

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function(match) {
            return {
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[match];
        });
    }

    function addMessageToDOM(msg) {
        const { username, content, type, timestamp } = msg;
        const user = username.trim() || 'Anónimo';
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', 'user');
        const formattedTime = new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const timestampHTML = `<span class="chat-timestamp">${formattedTime}</span>`;
        let messageContentHTML;
        if (type === 'gif') {
            messageContentHTML = `<strong>${escapeHTML(user)}:</strong><br><img src="${content}" alt="GIF" class="chat-gif">`;
        } else {
            const processedContent = escapeHTML(content).replace(/@(\w+)/g, '<span class="chat-mention">@$1</span>');
            messageContentHTML = `<strong>${escapeHTML(user)}:</strong> ${processedContent}`;
        }
        messageElement.innerHTML = `<p>${timestampHTML} ${messageContentHTML}</p>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function saveAndSendMessage(content, type = 'text') {
        let username = usernameInput.value.trim();
        if (!username) {
            username = 'Anónimo';
        }
        localStorage.setItem(USERNAME_KEY, username);

        let finalContent = content;
        if (type === 'text') {
            finalContent = filterProfanity(content);
        }

        const newMessage = { username, content: finalContent, type };

        try {
            const response = await fetch('/api/chat_messages/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage),
                credentials: 'include'
            });

            if (!response.ok) {
                console.error('Error al enviar el mensaje');
                // Opcional: mostrar un error al usuario
            } else {
                // El mensaje se envió correctamente. Pusher se encargará de mostrarlo.
                if (type === 'text') messageInput.value = '';
                toggleSendButton();
            }
        } catch (error) {
            console.error('Error de red al enviar el mensaje:', error);
        }
    }

    // Escuchar por el evento 'new_message' desde Pusher
    channel.bind('new_message', function(msg) {
        // Comprobar si el mensaje ya se mostró (evita duplicados si el fetch y pusher llegan casi al mismo tiempo)
        if (new Date(msg.timestamp) > new Date(lastTimestamp)) {
            addMessageToDOM(msg);
            lastTimestamp = msg.timestamp;
        }

        addMessageToDOM(msg);
        // Reproducir sonido solo si el mensaje no es nuestro (opcional)
        if (notificationSound && msg.username !== usernameInput.value.trim()) {
            notificationSound.volume = 0.5;
            notificationSound.currentTime = 0;
            notificationSound.play().catch(e => console.warn("No se pudo reproducir sonido de notificación"));
        }
    });

    // Función para cargar mensajes iniciales
    async function fetchInitialMessages() {
        try {
            const response = await fetch('/api/chat_messages');
            const messages = await response.json();
            chatMessages.innerHTML = ''; // Limpiar mensajes de ejemplo
            messages.forEach(msg => {
                addMessageToDOM(msg);
            });
            if (messages.length > 0) {
                lastTimestamp = messages[messages.length - 1].timestamp;
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error("Error al cargar los mensajes iniciales:", error);
            chatMessages.innerHTML = '<div class="chat-message system"><p>Error al cargar el chat. Inténtalo de nuevo más tarde.</p></div>';
        }
    }

    function toggleSendButton() {
        sendButton.disabled = messageInput.value.trim() === '';
    }

    sendButton.addEventListener('click', () => saveAndSendMessage(messageInput.value, 'text'));
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendButton.disabled) sendButton.click();
        }
    });
    messageInput.addEventListener('input', toggleSendButton);

    // Deshabilitar el botón de enviar si el input está vacío
    messageInput.addEventListener('input', toggleSendButton);
    toggleSendButton(); // Estado inicial

    // --- Lógica del Panel de Emojis ---
    const TENOR_API_KEY = "LIVDSRZULELA"; // Clave de API de Tenor v1
    const emojiPicker = document.querySelector('emoji-picker');
    const pickerTabs = document.querySelectorAll('.picker-tab-btn');
    const pickerContents = document.querySelectorAll('.picker-tab-content');
    const gifSearchInput = document.getElementById('gif-search-input');
    const gifResultsContainer = document.getElementById('gif-results');

    emojiButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que el clic se propague al documento y cierre el panel inmediatamente
        pickerContainer.classList.toggle('show');
    });

    // Cierra el panel si se hace clic fuera de él
    document.addEventListener('click', (event) => {
        const isClickInsidePicker = pickerContainer.contains(event.target);
        const isClickOnEmojiButton = emojiButton.contains(event.target);
        if (!isClickInsidePicker && !isClickOnEmojiButton) {
            pickerContainer.classList.remove('show');
        }
    });

    // Lógica de pestañas del panel
    pickerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            pickerTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.picker-tab-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const activeTabContent = document.getElementById(tab.dataset.tab);
            activeTabContent.classList.add('active');

            // Si se hace clic en la pestaña de GIFs y está vacía, cargar los recomendados
            if (tab.dataset.tab === 'gifs' && gifResultsContainer.childElementCount <= 1) {
                loadTrendingGifs();
            }
        });
    });

    // Añadir emoji al input
    emojiPicker.addEventListener('emoji-click', event => {
        messageInput.value += event.detail.unicode;
        messageInput.focus();
    });

    // Función para cargar GIFs de tendencia
    async function loadTrendingGifs() {
        gifResultsContainer.innerHTML = '<p class="gif-placeholder">Cargando GIFs populares...</p>';
        try {
            const response = await fetch(`https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=21&media_filter=minimal`);
            const data = await response.json();
            renderGifs(data);
        } catch (error) {
            console.error("Error al cargar GIFs de tendencia:", error);
            gifResultsContainer.innerHTML = '<p class="gif-placeholder">No se pudieron cargar los GIFs.</p>';
        }
    }

    // Lógica de búsqueda de GIFs
    let gifSearchTimeout;
    gifSearchInput.addEventListener('keyup', () => {
        clearTimeout(gifSearchTimeout);
        gifSearchTimeout = setTimeout(async () => {
            const query = gifSearchInput.value.trim();
            if (query.length < 2) {
                // Si el campo de búsqueda está vacío, volver a mostrar los de tendencia
                if (query.length === 0) {
                    loadTrendingGifs();
                }
                return;
            }
            gifResultsContainer.innerHTML = '<p class="gif-placeholder">Buscando...</p>';
            
            try {
                const response = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=21&media_filter=minimal`);
                const data = await response.json();
                renderGifs(data);
            } catch (error) {
                console.error("Error al buscar GIFs:", error);
                gifResultsContainer.innerHTML = '<p class="gif-placeholder">Error al conectar con Tenor.</p>';
            }
        }, 500); // Espera 500ms después de que el usuario deja de escribir
    });

    // Función para renderizar los GIFs en el contenedor
    function renderGifs(data) {
        gifResultsContainer.innerHTML = ''; // Limpiar
        if (data.results && data.results.length > 0) {
            data.results.forEach(gif => {
                const img = document.createElement('img');
                img.src = gif.media[0].tinygif.url; // Ajustado para la estructura de la API v1
                img.alt = gif.content_description;
                img.addEventListener('click', () => {
                    saveAndSendMessage(gif.media[0].gif.url, 'gif'); // Usar la nueva función
                    pickerContainer.classList.remove('show');
                });
                gifResultsContainer.appendChild(img);
            });
        } else {
            gifResultsContainer.innerHTML = '<p class="gif-placeholder">No se encontraron GIFs.</p>';
        }
    }

    // Lógica para enviar un meme personalizado
    document.getElementById('meme-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('meme-emoji')) {
            saveAndSendMessage(e.target.src, 'gif');
            pickerContainer.classList.remove('show');
        }
    });

    // Lógica para eliminar mensajes
    chatMessages.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-msg-btn')) {
            // La funcionalidad de eliminar mensajes requiere un backend, por lo que se omite en la versión local.
            // Si se quisiera implementar localmente, sería solo para el usuario actual y no se reflejaría para otros.
        }
    });

    // Cargar mensajes iniciales al entrar a la página
    fetchInitialMessages();
});