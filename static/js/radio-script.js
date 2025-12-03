document.addEventListener('DOMContentLoaded', () => {
    // ========================================================
    // A. ELEMENTOS DEL DOM
    // ========================================================
    const audio = document.getElementById('radio-stream');
    const playButton = document.getElementById('play-button');
    const volumeIconButton = document.getElementById('volume-icon-button');
    const volumeIcon = document.getElementById('volume-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeControlContainer = document.querySelector('.volume-control');
    const statusMessage = document.getElementById('status-message');
    // Bandera para manejar el desbloqueo del Autoplay por el navegador
    let isAudioUnlocked = false; 
    
    // --- Configuración Inicial ---
    
    // 1. Establecer volumen inicial
    audio.volume = parseFloat(volumeSlider.value);
    // --- Lógica de Reproducción y Pausa (La Solución al Autoplay) ---
    // 2. Función para actualizar la UI (ícono y texto del botón)
    function updatePlayButton() {
        if (audio.paused || audio.ended) {
            playButton.setAttribute('aria-label', 'Reproducir');
            playButton.innerHTML = '<i class="fas fa-play"></i>';
            playButton.classList.remove('playing');
        } else {
            playButton.innerHTML = '<i class="fas fa-pause"></i>';
            playButton.classList.add('playing');
        }
    }
    // --- Solución de Errores y Reconexión ---

    function attemptReconnect() {
        // --- Control de Volumen ---
        if (audio.paused) return; // No intentar reconectar si el usuario pausó

        statusMessage.textContent = 'ERROR DE CONEXIÓN. Reconectando...';
        statusMessage.style.color = 'var(--neon-pink)';
        
        // Cargar el stream y forzar la reproducción
        audio.load(); 
        
        audio.play().then(() => {
            statusMessage.textContent = '¡En el aire!';
            statusMessage.style.color = 'var(--button-green)';
            updatePlayButton();
        }).catch(error => {
            console.error("Fallo al reconectar:", error);
            // Si falla la reconexión, avisa al usuario
            statusMessage.textContent = 'Fallo al reconectar. Intenta Pausar y Reproducir manualmente.';
            statusMessage.style.color = 'var(--neon-pink)';
            audio.pause();
            updatePlayButton();
        });
    }
    
    playButton.addEventListener('click', () => {
        if (audio.paused) {
            
            // 1. Intentar reproducir. Maneja la restricción de autoplay.
            audio.play().then(() => {
                // Éxito: Reproduciendo
                isAudioUnlocked = true;
                statusMessage.textContent = '¡En el aire!';
                statusMessage.style.color = 'var(--button-green)';
                updatePlayButton();
            }).catch(error => {
                // 2. Fallo: Autoplay bloqueado.
                
                if (!isAudioUnlocked) {
                    // Primer clic fallido: Informar al usuario
                    isAudioUnlocked = true; 
                    statusMessage.textContent = 'Presiona Reproducir de nuevo para iniciar.';
                    statusMessage.style.color = 'var(--accent-color)';
                    console.warn("Autoplay bloqueado. Requiere segundo clic.");
                } else {
                    // Fallo después del desbloqueo: Error de conexión
                    statusMessage.textContent = 'Error: No se pudo iniciar el stream. Intenta más tarde.';
                    statusMessage.style.color = 'var(--neon-pink)';
                    console.error("Fallo de reproducción después del desbloqueo:", error);
                }
                
                // Aseguramos el estado visual correcto
                audio.pause(); 
                updatePlayButton();
            });
            
        } else {
            // Pausar
            audio.pause();
            statusMessage.textContent = 'En pausa. Presiona Reproducir.';
            statusMessage.style.color = 'var(--accent-color)';
            updatePlayButton();
        }
    });

    /**
     * Cambia el volumen del audio cuando el slider se mueve.
     */
    function handleVolumeChange() {
        audio.volume = parseFloat(volumeSlider.value);
        audio.muted = false; // Desilenciar si se mueve el slider
        updateVolumeIcon();
    }

    /**
     * Silencia o desilencia el audio.
     */
    function toggleMute() {
        audio.muted = !audio.muted;
        updateVolumeIcon();
    }
    function updateVolumeIcon() {
        // --- Lógica para Resaltar Programa Actual ---
        if (audio.muted || audio.volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (audio.volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }

    /**
     * 4. Control de visibilidad del slider de volumen en móvil.
     *    Añade o quita una clase para mostrar/ocultar el slider.
     */
    function toggleVolumeSlider(event) {
        // Solo activar en pantallas de menos de 768px
        if (window.innerWidth <= 768) {
            // Evita que el click en el slider (si ya está visible) lo cierre
            if (event.target.id !== 'volume-slider') {
                volumeControlContainer.classList.toggle('show-slider');
            }
        }
    }


    // ========================================================
    // C. ASIGNACIÓN DE EVENTOS
    // ========================================================

    if (volumeSlider) {
        volumeSlider.addEventListener('input', handleVolumeChange);
    }

    function highlightCurrentProgram() {
        const now = new Date();
        const currentDay = now.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        const programCards = document.querySelectorAll('.program-card');
        let liveProgramFound = false;

        programCards.forEach(card => {
            const days = card.dataset.days;
            const start = card.dataset.start;
            const end = card.dataset.end;

            if (!days || !start || !end) return;

            // Comprobar si el día actual está en el rango
            const dayMatch = days.split(',').some(dayRange => {
                if (dayRange.includes('-')) {
                    const [startDay, endDay] = dayRange.split('-').map(Number);
                    return currentDay >= startDay && currentDay <= endDay;
                }
                return parseInt(dayRange) === currentDay;
            });

            // Lógica para manejar horarios normales y nocturnos (que cruzan la medianoche)
            let timeMatch = false;
            if (start > end) { // Horario nocturno (ej: 22:00 - 02:00)
                if (currentTime >= start || currentTime < end) {
                    timeMatch = true;
                }
            } else { // Horario diurno normal
                if (currentTime >= start && currentTime < end) {
                    timeMatch = true;
                }
            }

            // Comprobar si la hora actual está en el rango
            if (dayMatch && timeMatch) {
                card.classList.add('is-live');
                liveProgramFound = true;
            } else {
                card.classList.remove('is-live');
            }
        });
    }
    if (volumeIconButton) {
        volumeIconButton.addEventListener('click', toggleMute);
    }

    // Evento para mostrar/ocultar el slider de volumen en móvil
    if (volumeControlContainer) {
        volumeControlContainer.addEventListener('click', toggleVolumeSlider);
        // Cierra el slider si se hace clic fuera de él
        document.addEventListener('click', (e) => {
            if (!volumeControlContainer.contains(e.target) && window.innerWidth <= 768) {
                volumeControlContainer.classList.remove('show-slider');
            }
        });
    }

    // ========================================================
    // D. INICIALIZACIÓN
    // ========================================================

    // 1. Detección de error de red o stream (el más común en radios)
    audio.addEventListener('error', (e) => {
        console.error("Error de audio detectado:", e.target.error.code);
        if (e.target.error.code === 4) { // Error de red/stream
             if (!audio.paused) {
                setTimeout(attemptReconnect, 5000); // Intenta reconectar después de 5 segundos
             }
        }
    });

    // 2. Detección de interrupción de datos (stream stalled)
    audio.addEventListener('stalled', () => {
        console.warn("Audio en estado 'stalled'. Posible caída de stream.");
        if (!audio.paused) {
            setTimeout(attemptReconnect, 3000); // Intenta reconectar después de 3 segundos
        }
    });
    
    // 3. Detección de finalización del stream (o cierre de conexión)
    audio.addEventListener('ended', () => {
        console.warn("Stream terminó. Intentando reiniciar.");
        setTimeout(attemptReconnect, 2000);
    });

    // 4. Actualización de estado en eventos nativos
    audio.addEventListener('playing', () => {
        statusMessage.textContent = '¡En el aire!';
        statusMessage.style.color = 'var(--button-green)';
        updatePlayButton();
    });

    audio.addEventListener('pause', () => {
        statusMessage.textContent = 'En pausa. Presiona Reproducir.';
        statusMessage.style.color = 'var(--accent-color)';
        updatePlayButton();
    });
    
    updatePlayButton(); 
    updateVolumeIcon();
    highlightCurrentProgram(); // Ejecutar al cargar la página
    
    setInterval(highlightCurrentProgram, 60000); // Actualizar cada minuto

    // ========================================================
    // E. LÓGICA DEL CHAT EN VIVO (GUARDADO LOCAL EN EL NAVEGADOR)
    // ========================================================
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const sendButton = document.getElementById('chat-send-btn');

    // No ejecutar si los elementos del chat no existen en la página
    if (chatForm && chatInput && chatMessages && sendButton) {

        const STORAGE_KEY = 'glauncher_radio_chat_messages';

        // Función para renderizar un mensaje en el DOM
        function renderMessage(message) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message user'; // Todos los mensajes son de usuario
            msgDiv.innerHTML = `<p>${message.text}</p>`;
            chatMessages.appendChild(msgDiv);
            // Auto-scroll al último mensaje
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Función para cargar mensajes desde localStorage
        function loadMessages() {
            const messages = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            messages.forEach(renderMessage);
        }

        // Función para guardar un nuevo mensaje en localStorage
        function saveMessage(text) {
            const messages = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            const newMessage = { text: text, timestamp: new Date().toISOString() };
            
            // Limitar el historial a los últimos 50 mensajes para no sobrecargar localStorage
            if (messages.length >= 50) {
                messages.shift(); // Elimina el mensaje más antiguo
            }

            messages.push(newMessage);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            return newMessage;
        }

        // Evento de envío del formulario
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const messageText = chatInput.value.trim();

            if (messageText) {
                // Escapar HTML para seguridad básica
                const escapedText = messageText.replace(/[&<>"']/g, function(match) {
                    return {
                        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
                    }[match];
                });

                const newMessage = saveMessage(escapedText);
                renderMessage(newMessage);
                chatInput.value = ''; // Limpiar el input
                toggleSendButton(); // Deshabilitar el botón de nuevo
            }
        });

        // Habilitar/deshabilitar el botón de envío si hay texto
        function toggleSendButton() {
            const isDisabled = chatInput.value.trim() === '';
            if (sendButton) {
                sendButton.disabled = isDisabled;
            }
        }

        chatInput.addEventListener('input', toggleSendButton);

        // --- Inicialización del Chat ---
        loadMessages();
        toggleSendButton();
    }
});