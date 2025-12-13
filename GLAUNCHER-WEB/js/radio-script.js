document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'https://glauncher-api.onrender.com';
    // Clave PÚBLICA de Pusher. Es seguro tenerla en el frontend.
    const PUSHER_KEY = 'a2fb8d4323a44da53c63'; 
    const PUSHER_CLUSTER = 'us2';

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
    setInterval(highlightCurrentProgram, 60000);

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

    // --- INICIALIZACIÓN DE PUSHER ---
    try {
        const pusher = new Pusher(PUSHER_KEY, {
            cluster: PUSHER_CLUSTER,
            encrypted: true
        });

        const channel = pusher.subscribe('chat_radio');
        channel.bind('new_message', function(data) {
            // Cuando llega un nuevo mensaje, lo añadimos al chat
            addMessageToDOM(data);
            // Reproducir sonido solo si el mensaje no es nuestro
            if (notificationSound && data.username !== (localStorage.getItem('glauncher_chat_username') || '')) {
                notificationSound.volume = 0.5;
                notificationSound.currentTime = 0;
                notificationSound.play().catch(e => console.warn("No se pudo reproducir sonido de notificación"));
            }
        });
    } catch (error) {
        console.error("Error al inicializar Pusher:", error);
        addMessageToDOM({ username: 'Sistema', content: 'Error de conexión con el chat en tiempo real.', type: 'system', timestamp: new Date().toISOString() }, 'error');
    }

    // Lista de palabras para el filtro de profanidad
    const FORBIDDEN_WORDS = [
        "puta", "mierda", "cabron", "joder", "gilipollas", "coño", "polla", "pene", "cojones", "zorra", "maricon", "idiota", "estupido", "tonto", "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "bastard", "motherfucker",
        "mamahuevo", "guevo", "pajuo", "malparido", "hijueputa", "verga", "concha tu madre", "weon", "huevon", "boludo", "pendejo"
    ];

    function filterProfanity(text) {
        const regex = new RegExp(FORBIDDEN_WORDS.join('|'), 'gi');
        return text.replace(regex, match => '*'.repeat(match.length));
    }

    usernameInput.value = localStorage.getItem('glauncher_chat_username') || '';

    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, match => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[match]));
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
        if (!username) username = 'Anónimo';
        localStorage.setItem('glauncher_chat_username', username);

        const finalContent = type === 'text' ? filterProfanity(content) : content;
        const newMessage = { username, content: finalContent, type };

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat_messages/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMessage),
                credentials: 'include'
            });

            if (response.ok) {
                if (type === 'text') messageInput.value = '';
                toggleSendButton();
            } else {
                console.error('Error al enviar el mensaje');
            }
        } catch (error) {
            console.error('Error de red al enviar el mensaje:', error);
        }
    }

    async function fetchInitialMessages() {
        chatMessages.innerHTML = '<div class="chat-message system"><p>Cargando mensajes...</p></div>';
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat_messages`);
            if (!response.ok) throw new Error('No se pudieron cargar los mensajes.');
            
            const messages = await response.json();
            chatMessages.innerHTML = '';
            messages.forEach(addMessageToDOM);
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
    toggleSendButton();

    // --- Lógica del Panel de Emojis y GIFs ---
    const TENOR_API_KEY = "LIVDSRZULELA";
    const emojiPicker = document.querySelector('emoji-picker');
    const pickerTabs = document.querySelectorAll('.picker-tab-btn');
    const gifSearchInput = document.getElementById('gif-search-input');
    const gifResultsContainer = document.getElementById('gif-results');

    emojiButton.addEventListener('click', (event) => {
        event.stopPropagation();
        pickerContainer.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        if (!pickerContainer.contains(event.target) && !emojiButton.contains(event.target)) {
            pickerContainer.classList.remove('show');
        }
    });

    pickerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            pickerTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.picker-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
            if (tab.dataset.tab === 'gifs' && gifResultsContainer.childElementCount <= 1) {
                loadTrendingGifs();
            }
        });
    });

    emojiPicker.addEventListener('emoji-click', event => {
        messageInput.value += event.detail.unicode;
        messageInput.focus();
    });

    async function loadTrendingGifs() {
        gifResultsContainer.innerHTML = '<p class="gif-placeholder">Cargando GIFs populares...</p>';
        try {
            const response = await fetch(`https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=21&media_filter=minimal`);
            renderGifs(await response.json());
        } catch (error) {
            gifResultsContainer.innerHTML = '<p class="gif-placeholder">No se pudieron cargar los GIFs.</p>';
        }
    }

    let gifSearchTimeout;
    gifSearchInput.addEventListener('keyup', () => {
        clearTimeout(gifSearchTimeout);
        gifSearchTimeout = setTimeout(async () => {
            const query = gifSearchInput.value.trim();
            if (query.length < 2) {
                if (query.length === 0) loadTrendingGifs();
                return;
            }
            gifResultsContainer.innerHTML = '<p class="gif-placeholder">Buscando...</p>';
            try {
                const response = await fetch(`https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=21&media_filter=minimal`);
                renderGifs(await response.json());
            } catch (error) {
                gifResultsContainer.innerHTML = '<p class="gif-placeholder">Error al conectar con Tenor.</p>';
            }
        }, 500);
    });

    function renderGifs(data) {
        gifResultsContainer.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(gif => {
                const img = document.createElement('img');
                img.src = gif.media[0].tinygif.url;
                img.alt = gif.content_description;
                img.addEventListener('click', () => {
                    saveAndSendMessage(gif.media[0].gif.url, 'gif');
                    pickerContainer.classList.remove('show');
                });
                gifResultsContainer.appendChild(img);
            });
        } else {
            gifResultsContainer.innerHTML = '<p class="gif-placeholder">No se encontraron GIFs.</p>';
        }
    }

    document.getElementById('meme-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('meme-emoji')) {
            saveAndSendMessage(e.target.src, 'gif');
            pickerContainer.classList.remove('show');
        }
    });

    fetchInitialMessages();
});