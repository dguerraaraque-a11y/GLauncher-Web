document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'http://127.0.0.1:5000';

    // --- Elementos del DOM ---
    const newsList = document.getElementById('news-list');
    const newsForm = document.getElementById('news-form');
    const formTitle = document.getElementById('form-title');
    const newsIdInput = document.getElementById('news-id');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const addNewBtn = document.getElementById('add-new-btn');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const logoutButton = document.getElementById('logout-btn');

    // --- Elementos del Chat Manager ---
    const systemMessageForm = document.getElementById('system-message-form');
    const systemMessageContent = document.getElementById('system-message-content');
    const adminChatView = document.getElementById('admin-chat-view');
    const deleteAllChatBtn = document.getElementById('delete-all-chat-btn');

    // --- Elementos del Download Manager ---
    const downloadForm = document.getElementById('download-form');
    const downloadsList = document.getElementById('downloads-list');

    // --- Elementos del Asistente Gemini ---
    const geminiModalOverlay = document.getElementById('gemini-modal-overlay');
    const geminiModalClose = document.getElementById('gemini-modal-close');
    const geminiChatLog = document.getElementById('gemini-chat-log');
    const geminiChatForm = document.getElementById('gemini-chat-form');
    const geminiChatInput = document.getElementById('gemini-chat-input');
    const helpButtons = document.querySelectorAll('.gemini-help-btn');
    const geminiEmojiBtn = document.getElementById('gemini-emoji-btn');
    const geminiPickerContainer = document.getElementById('gemini-picker-container');
    const notificationSound = document.getElementById('chat-notification-sound');
    const geminiResetBtn = document.getElementById('gemini-reset-btn');
    let geminiChatHistory = []; // Array para almacenar el historial de la conversación


    let currentNews = [];
    let chatPollInterval = null; // Variable para controlar la actualización del chat

    async function checkAdminSession() {
        // ADVERTENCIA: Autenticación desactivada para desarrollo.
        // Esto permite el acceso al panel de admin sin iniciar sesión.
        // No olvides volver a activar la verificación antes de ir a producción.
        // ==================================================================
        loadNews();
        loadUsers(); // Cargar usuarios también para las estadísticas
    }

    async function loadNews() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/news`);
            currentNews = await response.json();
            renderNewsList();
        } catch (error) {
            newsList.innerHTML = '<p class="error-msg">Error al cargar noticias.</p>';
            console.error(error);
        }
    }

    function renderNewsList() {
        newsList.innerHTML = '';
        if (currentNews.length === 0) {
            newsList.innerHTML = '<p>No hay noticias para mostrar.</p>';
            return;
        }
        currentNews.forEach(item => {
            const newsItemDiv = document.createElement('div');
            newsItemDiv.className = 'news-list-item';
            newsItemDiv.innerHTML = `
                <div class="item-info" data-id="${item.id}">
                    <span class="item-date">${item.date}</span>
                    <span class="item-title">${item.title}</span>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            newsList.appendChild(newsItemDiv);
        });
    }

    async function loadUsers() {
        const userListBody = document.getElementById('user-list-body');
        if (!userListBody) return;
        userListBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando usuarios...</td></tr>';
        try {
            const response = await fetch(`${BACKEND_URL}/api/users`, { credentials: 'include' });
            if (!response.ok) throw new Error('No se pudo obtener la lista de usuarios.');
    
            const users = await response.json();
            renderUsersTable(users);
        } catch (error) {
            userListBody.innerHTML = `<tr><td colspan="4" class="error-text" style="text-align:center;">${error.message}</td></tr>`;
        }
    }

    function renderUsersTable(users) {
        const userListBody = document.getElementById('user-list-body');
        userListBody.innerHTML = '';
        users.forEach(user => {
            const isAdminBadge = user.is_admin ? '<span class="badge admin">Admin</span>' : '<span class="badge user">Usuario</span>';
            const row = `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${isAdminBadge}</td>
                    <td><button class="action-btn promote-btn" data-id="${user.id}" ${user.is_admin ? 'disabled' : ''}>Promover a Admin</button></td>
                </tr>`;
            userListBody.innerHTML += row;
        });
    }
    document.getElementById('user-list-body').addEventListener('click', async (e) => {
        if (e.target.classList.contains('promote-btn')) {
            const userId = e.target.dataset.id;
            if (confirm(`¿Estás seguro de que quieres promover al usuario con ID ${userId} a administrador?`)) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/users/promote/${userId}`, {
                        method: 'PUT',
                        credentials: 'include'
                    });
                    if (!response.ok) throw new Error('La promoción falló.');
                    alert('¡Usuario promovido con éxito!');
                    loadUsers(); // Recargar la lista de usuarios para ver el cambio
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
        }
    });

    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${BACKEND_URL}/logout`, { credentials: 'include' });
            if (response.ok) {
                // Para desarrollo sin login, simplemente avisamos.
                // En producción, esto redirigiría a login.html
                alert("Sesión cerrada (simulado). En producción, serías redirigido.");
                // window.location.href = 'login.html';
            } else {
                throw new Error('Fallo al cerrar sesión.');
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    function resetForm() {
        newsForm.reset();
        newsIdInput.value = '';
        formTitle.textContent = 'Crear Nueva Noticia';
        saveBtn.innerHTML = '<i class="fas fa-plus"></i> Crear Noticia';
        cancelBtn.style.display = 'none';
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
        document.getElementById('date').valueAsDate = new Date();
    }

    function populateForm(newsId) {
        const item = currentNews.find(n => n.id === newsId);
        if (!item) return;

        formTitle.textContent = `Editando: ${item.title}`;
        newsIdInput.value = item.id;
        document.getElementById('title').value = item.title;
        document.getElementById('date').value = item.date.split(' ')[0]; // Tomar solo la parte YYYY-MM-DD
        document.getElementById('category').value = item.category;
        document.getElementById('icon').value = item.icon;
        document.getElementById('summary').value = item.summary;
        // Mostrar la imagen actual
        imagePreview.src = `${BACKEND_URL}${item.image}`;
        imagePreviewContainer.style.display = 'block';
        document.getElementById('link').value = item.link;
        document.getElementById('buttonText').value = item.buttonText;

        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        cancelBtn.style.display = 'inline-block';
    }

    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = newsIdInput.value;
        const formData = new FormData(newsForm); // Usamos FormData para enviar archivos

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${BACKEND_URL}/api/news/update/${id}` : `${BACKEND_URL}/api/news/create`;

        // Si estamos editando y no se sube una nueva imagen, enviamos la ruta de la imagen actual
        if (id && !imageInput.files[0]) {
            const item = currentNews.find(n => n.id == id);
            formData.append('current_image_path', item.image);
        }

        try {
            const response = await fetch(url, {
                method: method,
                credentials: 'include', // Usar sesión para autenticación
                body: formData // Enviamos el objeto FormData directamente
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            alert(result.message);
            resetForm();
            loadNews();

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error(error);
        }
    });

    newsList.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-btn');
        const deleteButton = e.target.closest('.delete-btn');
        const itemInfo = e.target.closest('.item-info');

        if (editButton || itemInfo) {
            const id = parseInt((editButton || itemInfo).dataset.id);
            populateForm(id);
        }

        if (deleteButton) {
            const id = parseInt(deleteButton.dataset.id);
            if (confirm('¿Estás seguro de que quieres eliminar esta noticia? Esta acción no se puede deshacer.')) {
                deleteNews(id);
            }
        }
    });

    async function deleteNews(id) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/news/delete/${id}`, {
                method: 'DELETE',
                credentials: 'include' // Usar sesión para autenticación
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            alert(result.message);
            loadNews();

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error(error);
        }
    }

    addNewBtn.addEventListener('click', () => {
        resetForm();
    });

    cancelBtn.addEventListener('click', () => {
        resetForm();
    });

    const navItems = document.querySelectorAll('.admin-nav-item');
    const adminSections = document.querySelectorAll('.admin-section');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.dataset.target;

            // Detener la actualización del chat si cambiamos de pestaña
            if (chatPollInterval) {
                clearInterval(chatPollInterval);
                chatPollInterval = null;
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Si se hace clic en "Gestionar Chat", cargamos los mensajes
            if (targetId === 'chat-manager') {
                loadChatMessages();
                chatPollInterval = setInterval(loadChatMessages, 2000); // Actualiza cada 2 segundos
            } else if (targetId === 'downloads-manager') {
                loadDownloads();
            }

            adminSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    });

    // --- LÓGICA DEL GESTOR DE CHAT ---

    async function loadChatMessages() {
        if (!adminChatView) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/messages`);
            if (!response.ok) throw new Error('No se pudieron cargar los mensajes.');
            const messages = await response.json();
            renderChatMessages(messages);
        } catch (error) {
            adminChatView.innerHTML = `<p style="color: var(--neon-pink);">${error.message}</p>`;
        }
    }

    function renderChatMessages(messages) {
        adminChatView.innerHTML = '';
        messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${msg.username === 'Sistema' ? 'system' : 'user'}`;
            
            let contentHTML;
            if (msg.type === 'gif') {
                contentHTML = `<strong>${msg.username}:</strong><br><img src="${msg.content}" alt="GIF" class="chat-gif">`;
            } else {
                contentHTML = `<strong>${msg.username}:</strong> ${msg.content}`;
            }

            msgDiv.innerHTML = `
                <p>${contentHTML}</p>
                <button class="delete-chat-btn" data-id="${msg.id}" title="Eliminar mensaje">&times;</button>
            `;
            adminChatView.appendChild(msgDiv);
        });
        // Auto-scroll al final
        adminChatView.scrollTop = adminChatView.scrollHeight;
    }

    // Enviar mensaje del sistema
    systemMessageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = systemMessageContent.value.trim();
        if (!content) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: 'Sistema', content: content, type: 'text' })
            });
            if (!response.ok) throw new Error('No se pudo enviar el mensaje.');
            
            alert('Mensaje del sistema enviado con éxito.');
            systemMessageContent.value = '';
            loadChatMessages(); // Recargar el chat para ver el nuevo mensaje
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // Eliminar un mensaje del chat desde el panel de admin
    adminChatView.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-chat-btn')) {
            const messageId = e.target.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este mensaje del chat?')) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/chat/messages/${messageId}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    if (!response.ok) throw new Error('No se pudo eliminar el mensaje.');
                    
                    loadChatMessages(); // Recargar el chat silenciosamente
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
        }
    });

    // Eliminar TODOS los mensajes del chat
    deleteAllChatBtn.addEventListener('click', async () => {
        if (confirm('¿ESTÁS COMPLETAMENTE SEGURO?\nEsta acción borrará permanentemente TODOS los mensajes del chat y no se puede deshacer.')) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/chat/messages/all`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (!response.ok) {
                    const result = await response.json();
                    throw new Error(result.message || 'No se pudo limpiar el chat.');
                }
                
                loadChatMessages(); // Recargar la vista del chat, que ahora estará vacía.
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    });

    // --- LÓGICA DEL GESTOR DE DESCARGAS ---

    async function loadDownloads() {
        if (!downloadsList) return;
        try {
            const response = await fetch(`${BACKEND_URL}/api/downloads`);
            if (!response.ok) throw new Error('No se pudieron cargar las descargas.');
            const downloads = await response.json();
            renderDownloadsList(downloads);
        } catch (error) {
            downloadsList.innerHTML = `<p style="color: var(--neon-pink);">${error.message}</p>`;
        }
    }

    function renderDownloadsList(downloads) {
        downloadsList.innerHTML = '';
        if (downloads.length === 0) {
            downloadsList.innerHTML = '<p>No hay archivos de descarga configurados.</p>';
            return;
        }
        downloads.forEach(item => {
            const downloadItemDiv = document.createElement('div');
            downloadItemDiv.className = 'news-list-item';
            downloadItemDiv.innerHTML = `
                <div class="item-info">
                    <span class="item-date"><i class="${item.icon_class}"></i> ${item.platform}</span>
                    <span class="item-title">${item.version}</span>
                </div>
                <div class="item-actions">
                    <button class="delete-download-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            downloadsList.appendChild(downloadItemDiv);
        });
    }

    downloadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(downloadForm);
        try {
            const response = await fetch(`${BACKEND_URL}/api/downloads/create`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            downloadForm.reset();
            loadDownloads();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    downloadsList.addEventListener('click', async (e) => {
        if (e.target.closest('.delete-download-btn')) {
            const btn = e.target.closest('.delete-download-btn');
            const downloadId = btn.dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este archivo de descarga?')) {
                // Lógica para llamar a la API de borrado
            }
        }
    });

    // --- LÓGICA DEL ASISTENTE GEMINI ---

    function addMessageToGeminiChat(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('gemini-chat-message', sender);

        // Si es el asistente, añadimos el botón de copiar
        if (sender === 'assistant') {
            messageElement.innerHTML = `
                <p>${text}</p>
                <button class="copy-assistant-response-btn" title="Copiar respuesta"><i class="far fa-copy"></i></button>
            `;
        } else {
            messageElement.innerHTML = `<p>${text}</p>`; // Los mensajes de usuario no necesitan botón
        }

        geminiChatLog.appendChild(messageElement);
        geminiChatLog.scrollTop = geminiChatLog.scrollHeight;

        // Reproducir sonido de notificación
        if (notificationSound) {
            notificationSound.currentTime = 0;
            notificationSound.play().catch(e => console.warn("No se pudo reproducir el sonido:", e));
        }
    }

    async function sendPromptToGemini(prompt, sectionContext = null) {
        addMessageToGeminiChat(prompt, 'user'); // Muestra el mensaje del usuario en el DOM
        geminiChatInput.value = '';
        toggleGeminiSendButton(); // Deshabilita el botón de enviar

        // Añade el mensaje del usuario al historial que enviaremos al backend
        geminiChatHistory.push({ role: 'user', parts: [{ text: prompt }] });

        addMessageToGeminiChat("Pensando...", 'assistant'); // Mensaje de carga

        try {
            const response = await fetch(`${BACKEND_URL}/api/gemini-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                // Enviamos el historial completo y el contexto de la sección
                body: JSON.stringify({ history: geminiChatHistory, section: sectionContext })
            });
            const data = await response.json();
            
            // Reemplazar el mensaje de "Pensando..." con la respuesta real
            const loadingMessage = geminiChatLog.querySelector('.assistant:last-child');
            if (loadingMessage) loadingMessage.querySelector('p').textContent = data.answer;
            // Añade la respuesta del asistente al historial para la siguiente pregunta
            geminiChatHistory.push({ role: 'model', parts: [{ text: data.answer }] });

        } catch (error) {
            const loadingMessage = geminiChatLog.querySelector('.assistant:last-child');
            if (loadingMessage) loadingMessage.querySelector('p').textContent = "Error de conexión con el asistente. Inténtalo de nuevo.";
            console.error("Error en el chat de Gemini:", error);
        }
    }

    helpButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.dataset.section;
            
            geminiChatLog.innerHTML = ''; // Limpiar chat anterior
            geminiChatHistory = []; // Limpiar el historial de la conversación
            geminiModalOverlay.style.display = 'flex';
            
            // Display initial welcome message from assistant (frontend-side)
            // The actual username will be fetched by the backend for the AI's response
            addMessageToGeminiChat(`Hola, soy tu asistente de GLauncher. ¿En qué puedo ayudarte con la sección de ${section.replace('-', ' ').toUpperCase()}?`, 'assistant');

            // Store the current section context for subsequent user prompts
            geminiChatLog.dataset.currentSection = section;
        });
    });

    // --- Lógica para reiniciar la conversación con Gemini ---
    geminiResetBtn.addEventListener('click', () => {
        // Limpiar el historial y el DOM
        geminiChatLog.innerHTML = '';
        geminiChatHistory = [];

        // Obtener la sección actual que está almacenada en el dataset del log
        const currentSection = geminiChatLog.dataset.currentSection || 'general';

        // Mostrar de nuevo el mensaje de bienvenida
        addMessageToGeminiChat(`Hola, soy tu asistente de GLauncher. ¿En qué puedo ayudarte con la sección de ${currentSection.replace('-', ' ').toUpperCase()}?`, 'assistant');
        geminiChatInput.focus();
    });

    // --- Lógica para cerrar el modal ---
    geminiModalClose.addEventListener('click', () => {
        geminiModalOverlay.style.display = 'none';
    });

    geminiModalOverlay.addEventListener('click', (e) => {
        // Cierra el modal si se hace clic en el fondo oscuro
        if (e.target === geminiModalOverlay) {
            geminiModalOverlay.style.display = 'none';
        }
    });


    // --- Lógica para enviar el formulario del chat de Gemini ---
    geminiChatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userPrompt = geminiChatInput.value.trim();
        const currentSection = geminiChatLog.dataset.currentSection; // Get section context
        if (userPrompt) {
            sendPromptToGemini(userPrompt, currentSection);
        }
    });

    // Deshabilitar el botón de enviar de Gemini si el input está vacío
    const geminiSendBtn = geminiChatForm.querySelector('.gemini-chat-send-btn');
    function toggleGeminiSendButton() {
        geminiSendBtn.disabled = geminiChatInput.value.trim() === '';
    }
    geminiChatInput.addEventListener('input', toggleGeminiSendButton);
    toggleGeminiSendButton(); // Estado inicial

    // --- Lógica para copiar la respuesta del asistente ---
    geminiChatLog.addEventListener('click', (e) => {
        const copyBtn = e.target.closest('.copy-assistant-response-btn');
        if (copyBtn) {
            const messageText = copyBtn.previousElementSibling.textContent;
            navigator.clipboard.writeText(messageText).then(() => {
                const icon = copyBtn.querySelector('i');
                icon.classList.remove('fa-copy');
                icon.classList.add('fa-check');
                copyBtn.title = "¡Copiado!";
                setTimeout(() => {
                    icon.classList.remove('fa-check');
                    icon.classList.add('fa-copy');
                    copyBtn.title = "Copiar respuesta";
                }, 2000); // Vuelve al icono original después de 2 segundos
            }).catch(err => console.error('Error al copiar:', err));
        }
    });

    // --- Lógica del panel de emojis para Gemini ---
    geminiEmojiBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        geminiPickerContainer.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        const isClickInsidePicker = geminiPickerContainer.contains(event.target);
        const isClickOnEmojiButton = geminiEmojiBtn.contains(event.target);
        if (!isClickInsidePicker && !isClickOnEmojiButton) {
            geminiPickerContainer.classList.remove('show');
        }
    });

    const emojiPicker = document.querySelector('#gemini-picker-container emoji-picker');
    if (emojiPicker) {
        emojiPicker.addEventListener('emoji-click', event => {
            geminiChatInput.value += event.detail.unicode;
            geminiChatInput.focus();
        });
    }

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) {
            imagePreview.src = URL.createObjectURL(file);
            imagePreviewContainer.style.display = 'block';
        }
    });

    checkAdminSession();
});