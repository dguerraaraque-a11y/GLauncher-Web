/*
 * ==================================================================================
 * GLAUNCHER - SCRIPTS ESPECÍFICOS PARA LA PÁGINA DE INICIO (INDEX.HTML)
 * ==================================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA LAS CARACTERÍSTICAS INTERACTIVAS ---
    function initializeFeatureCards() {
        const featureCards = document.querySelectorAll('.feature-card');
        const displayImage = document.getElementById('feature-display-image');
        const displayTitle = document.getElementById('feature-display-title');
        const displayDescription = document.getElementById('feature-display-description');

        if (!featureCards.length || !displayImage) return; // No ejecutar si los elementos no existen

        let isChanging = false;

        featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (isChanging || card.classList.contains('active')) return;

                isChanging = true;
                featureCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                displayImage.classList.add('is-changing');
                displayTitle.classList.add('is-changing');
                displayDescription.classList.add('is-changing');

                setTimeout(() => {
                    displayTitle.textContent = card.dataset.title;
                    displayDescription.textContent = card.dataset.description;
                    displayImage.src = card.dataset.image || 'https://i.imgur.com/BS585N0.png';

                    displayImage.classList.remove('is-changing');
                    displayTitle.classList.remove('is-changing');
                    displayDescription.classList.remove('is-changing');
                    
                    isChanging = false;
                }, 300);
            });
        });
    }

    // --- SCRIPT DEL CONTADOR DE NAVIDAD Y AÑO NUEVO ---
    function initializeHolidayCountdown() {
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        const countdownHeader = document.querySelector('#christmas-countdown h3');
        const countdownTargetDateEl = document.getElementById('countdown-target-date');
        const timerEl = document.getElementById('timer');
        
        if (!timerEl) return; // Salir si no estamos en la página del contador

        const currentYear = new Date().getFullYear();
        const christmasDate = new Date(`December 25, ${currentYear} 00:00:00`);
        const newYearDate = new Date(`January 1, ${currentYear + 1} 00:00:00`);

        let countdownInterval;

        function updateCountdown() {
            const now = new Date();
            let targetDate;

            if (now < christmasDate) {
                targetDate = christmasDate;
                countdownHeader.textContent = '¿Cuánto falta para Navidad?';
                countdownTargetDateEl.textContent = `Para el 25 de Diciembre de ${currentYear}`;
            } else if (now < newYearDate) {
                targetDate = newYearDate;
                countdownHeader.textContent = '¿CUÁNTO FALTA PARA AÑO NUEVO?';
                countdownTargetDateEl.textContent = `Para el 1 de Enero de ${currentYear + 1}`;
            } else {
                clearInterval(countdownInterval);
                celebrateNewYear();
                return;
            }

            const totalSeconds = (targetDate - now) / 1000;

            if (totalSeconds <= 0) {
                // El intervalo se limpiará en la próxima ejecución y pasará al siguiente evento.
                return;
            }

            const days = Math.floor(totalSeconds / 3600 / 24);
            const hours = Math.floor(totalSeconds / 3600) % 24;
            const minutes = Math.floor(totalSeconds / 60) % 60;
            const seconds = Math.floor(totalSeconds) % 60;

            daysEl.textContent = days;
            hoursEl.textContent = formatTime(hours);
            minutesEl.textContent = formatTime(minutes);
            secondsEl.textContent = formatTime(seconds);
        }

        function formatTime(time) {
            return time < 10 ? `0${time}` : time;
        }

        function celebrateNewYear() {
            timerEl.style.display = 'none';
            countdownHeader.textContent = '¡FELIZ AÑO NUEVO A TODOS!';
            countdownTargetDateEl.innerHTML = '<i class="fas fa-tree" style="color: var(--neon-green); margin-right: 10px;"></i><i class="fas fa-star" style="color: yellow;"></i>';
            
            if (typeof snowInterval !== 'undefined') clearInterval(snowInterval);
            const snowCanvas = document.getElementById('snow-canvas');
            if (snowCanvas) {
                const ctx = snowCanvas.getContext('2d');
                ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
            }

            const duration = 15 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();
                if (timeLeft <= 0) return clearInterval(interval);
                
                const particleCount = 50 * (timeLeft / duration);
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    // --- LÓGICA DEL EFECTO DE NIEVE ---
    const canvas = document.getElementById('snow-canvas');
    const toggleSnowBtn = document.getElementById('toggle-snow-btn');
    let snowInterval;
    let isSnowing = false;

    if (canvas && toggleSnowBtn) {
        const ctx = canvas.getContext('2d');
        let snowflakes = [];

        function resizeCanvas() {
            const section = document.getElementById('christmas-countdown-section');
            if (section) {
                canvas.width = section.offsetWidth;
                canvas.height = section.offsetHeight;
            }
        }

        function createSnowflake() {
            return {
                x: Math.random() * canvas.width,
                y: 0,
                radius: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.5
            };
        }

        function drawSnowflakes() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
            ctx.beginPath();
            snowflakes.forEach(flake => {
                ctx.moveTo(flake.x, flake.y);
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            });
            ctx.fill();
        }

        function updateSnowflakes() {
            snowflakes.forEach((flake, index) => {
                flake.y += flake.speed;
                if (flake.y > canvas.height) {
                    snowflakes[index] = createSnowflake();
                }
            });
        }

        function animateSnow() {
            if (snowflakes.length < 100) snowflakes.push(createSnowflake());
            updateSnowflakes();
            drawSnowflakes();
        }

        toggleSnowBtn.addEventListener('click', () => {
            isSnowing = !isSnowing;
            toggleSnowBtn.classList.toggle('active', isSnowing);
            if (isSnowing) {
                resizeCanvas();
                snowInterval = setInterval(animateSnow, 50);
            } else {
                clearInterval(snowInterval);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                snowflakes = [];
            }
        });

        // Iniciar nieve por defecto
        toggleSnowBtn.click();
        window.addEventListener('resize', resizeCanvas);
    }

    // --- INICIALIZACIÓN DE FUNCIONES ---
    initializeFeatureCards();
    initializeHolidayCountdown();
    
    if (typeof initializeLaunchMessages === 'function') {
        initializeLaunchMessages();
    }
});