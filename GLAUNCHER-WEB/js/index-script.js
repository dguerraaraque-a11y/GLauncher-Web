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

    // --- SCRIPT DEL CONTADOR DE NAVIDAD ---
    function initializeChristmasCountdown() {
        const countdownSection = document.getElementById('christmas-countdown-section');
        if (!countdownSection) return;

        const now = new Date();
        const currentMonth = now.getMonth(); // 0 = Enero, 11 = Diciembre

        // --- LÓGICA DE VISIBILIDAD ---
        // Mostrar el contador solo en Noviembre (10) y Diciembre (11).
        if (currentMonth < 10) {
            countdownSection.style.display = 'none';
            return; // No ejecutar el resto del script si no es Noviembre o Diciembre
        }
        
        const daysEl = document.getElementById("days");
        const hoursEl = document.getElementById("hours");
        const minutesEl = document.getElementById("minutes");
        const secondsEl = document.getElementById("seconds");
        let previousValues = {};

        let year = now.getFullYear();
        let countDownDate = new Date(`Dec 25, ${year} 00:00:00`).getTime();

        if (now.getTime() > countDownDate) {
            year++;
            countDownDate = new Date(`Dec 25, ${year} 00:00:00`).getTime(); // Corregido
            if (document.getElementById("countdown-target-date")) document.getElementById("countdown-target-date").innerText = `Para el 25 de Diciembre de ${year}`;
        }

        function triggerAnimation(element) {
            element.parentElement.classList.add('time-flash');
            setTimeout(() => element.parentElement.classList.remove('time-flash'), 200);
        }

        // Función para la animación de confeti
        function launchConfetti() {
            const duration = 5 * 1000; // Duración de la animación en milisegundos (5 segundos)
            const animationEnd = Date.now() + duration;

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // Lanzar dos ráfagas de confeti desde los lados para un efecto más amplio
                confetti({
                    particleCount,
                    startVelocity: 30,
                    spread: 360,
                    origin: { x: Math.random(), y: Math.random() - 0.2 }
                });
            }, 250);
        }

        const x = setInterval(() => {
            const distance = countDownDate - new Date().getTime();

            if (distance < 0) {
                clearInterval(x);
                document.getElementById("timer").innerHTML = '<h2 class="christmas-greeting">¡FELIZ NAVIDAD A TODOS!</h2>';
                launchConfetti(); // ¡Lanzar confeti!
                return;
            }

            const values = {
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            };

            if (previousValues.days !== values.days && daysEl) { triggerAnimation(daysEl); daysEl.innerText = values.days; }
            if (previousValues.hours !== values.hours && hoursEl) { triggerAnimation(hoursEl); hoursEl.innerText = values.hours; }
            if (previousValues.minutes !== values.minutes && minutesEl) { triggerAnimation(minutesEl); minutesEl.innerText = values.minutes; }
            // Se actualiza siempre para evitar congelamiento
            if (secondsEl) { triggerAnimation(secondsEl); secondsEl.innerText = values.seconds; }
            previousValues = values;
        }, 1000);
    }

    // --- INICIALIZACIÓN DE FUNCIONES ---
    initializeFeatureCards();
    initializeChristmasCountdown();
    
    // La función initializeLaunchMessages() viene de global-script.js y también se ejecuta en el index
    if (typeof initializeLaunchMessages === 'function') {
        initializeLaunchMessages();
    }

    // --- LÓGICA DEL EFECTO DE NIEVE PARA EL CONTADOR DE NAVIDAD ---
    const canvas = document.getElementById('snow-canvas');
    const toggleSnowBtn = document.getElementById('toggle-snow-btn');

    if (canvas && toggleSnowBtn) {
        const ctx = canvas.getContext('2d');
        let snowflakes = [];
        let snowEnabled = true; // La nieve está activada por defecto
        let animationFrameId;

        toggleSnowBtn.classList.add('active');

        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        function createSnowflakes() {
            const count = 200; // Número de copos de nieve
            snowflakes = [];
            for (let i = 0; i < count; i++) {
                snowflakes.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3 + 1, // Radio entre 1 y 4
                    density: Math.random() * count,
                    speed: Math.random() * 1 + 0.5 // Velocidad de caída
                });
            }
        }

        function drawSnowflakes() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();
            for (let i = 0; i < snowflakes.length; i++) {
                const s = snowflakes[i];
                ctx.moveTo(s.x, s.y);
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2, true);
            }
            ctx.fill();
            updateSnowflakes();
        }

        function updateSnowflakes() {
            for (let i = 0; i < snowflakes.length; i++) {
                const s = snowflakes[i];
                s.y += s.speed;
                // Si el copo sale por abajo, lo reinicia arriba
                if (s.y > canvas.height) {
                    snowflakes[i] = { ...s, x: Math.random() * canvas.width, y: -10 };
                }
            }
        }

        function animateSnow() {
            if (snowEnabled) {
                drawSnowflakes();
                animationFrameId = requestAnimationFrame(animateSnow);
            }
        }

        function startSnowing() {
            snowEnabled = true;
            toggleSnowBtn.classList.add('active');
            animateSnow();
        }

        function stopSnowing() {
            snowEnabled = false;
            toggleSnowBtn.classList.remove('active');
            cancelAnimationFrame(animationFrameId);
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas
        }

        toggleSnowBtn.addEventListener('click', () => {
            snowEnabled ? stopSnowing() : startSnowing();
        });

        // Iniciar la nieve por defecto
        window.addEventListener('resize', () => {
            resizeCanvas();
            createSnowflakes();
        });
        resizeCanvas();
        createSnowflakes();
        startSnowing();
    }
});
