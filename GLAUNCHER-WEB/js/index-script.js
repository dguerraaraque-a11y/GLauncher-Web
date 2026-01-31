document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DEL TEMPORIZADOR (NAVIDAD Y AÑO NUEVO) ---
    const countdownSection = document.getElementById('christmas-countdown-section');
    const countdownTitle = document.getElementById('countdown-title');
    const countdownTargetDate = document.getElementById('countdown-target-date');
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = Enero, 11 = Diciembre
    const currentDay = now.getDate();
    
    let targetDate;
    let isCountdownActive = true;

    // --- LÓGICA DE VISIBILIDAD POR FECHAS (2 Nov - 2 Ene) ---
    // Visible si: (Noviembre y día >= 2) O (Diciembre) O (Enero y día < 2)
    const isHolidaySeason = (currentMonth === 10 && currentDay >= 2) || 
                            (currentMonth === 11) || 
                            (currentMonth === 0 && currentDay < 2);

    if (!isHolidaySeason) {
        isCountdownActive = false;
        if (countdownSection) {
            countdownSection.style.display = 'none';
        }
    } else {
        // Si estamos en temporada, decidimos qué mostrar
        if (countdownSection) countdownSection.style.display = 'block';

        const christmasDate = new Date(`December 25, ${currentYear} 00:00:00`);
        const newYearDate = new Date(`January 1, ${currentYear + 1} 00:00:00`);

        if (currentMonth === 0 && currentDay === 1) {
            // Es 1 de Enero: Mostrar mensaje de celebración estático
            countdownTitle.textContent = '¡Feliz Año Nuevo!';
            countdownTargetDate.textContent = `¡Bienvenido al ${currentYear}!`;
            isCountdownActive = false; // Detener contador
            daysEl.innerHTML = "0"; hoursEl.innerHTML = "00"; minutesEl.innerHTML = "00"; secondsEl.innerHTML = "00";
        } else if (now < christmasDate) {
            // Antes de Navidad
            targetDate = christmasDate;
            countdownTitle.textContent = '¿Cuánto falta para Navidad?';
            countdownTargetDate.textContent = `Para el 25 de Diciembre de ${currentYear}`;
        } else {
            // Entre Navidad y Año Nuevo (hasta el 31 de Dic 23:59:59)
            targetDate = newYearDate;
            countdownTitle.textContent = '¿Cuánto falta para Año Nuevo?';
            countdownTargetDate.textContent = `Para el 01 de Enero de ${currentYear + 1}`;
        }
    }

    function updateCountdown() {
        if (!isCountdownActive) return;

        const currentTime = new Date();
        const diff = targetDate - currentTime;

        if (diff <= 0) {
            // Si el tiempo ha terminado, podrías recargar la página para que la lógica decida de nuevo
            // o simplemente detener el contador. (Ahora recargamos para mostrar el mensaje de Año Nuevo si corresponde)
            clearInterval(countdownInterval);
            location.reload(); // Recarga para cambiar a Año Nuevo o desaparecer
            return;
        }

        const d = Math.floor(diff / 1000 / 60 / 60 / 24);
        const h = Math.floor(diff / 1000 / 60 / 60) % 24;
        const m = Math.floor(diff / 1000 / 60) % 60;
        const s = Math.floor(diff / 1000) % 60;

        daysEl.innerHTML = d;
        hoursEl.innerHTML = h < 10 ? '0' + h : h;
        minutesEl.innerHTML = m < 10 ? '0' + m : m;
        secondsEl.innerHTML = s < 10 ? '0' + s : s;
    }

    let countdownInterval;
    if (isCountdownActive) {
        countdownInterval = setInterval(updateCountdown, 1000);
        updateCountdown(); // Llamada inicial
    }

    // --- LÓGICA DE LA NIEVE ---
    const snowCanvas = document.getElementById('snow-canvas');
    const toggleSnowBtn = document.getElementById('toggle-snow-btn');
    let snowEnabled = localStorage.getItem('snowEnabled') !== 'false'; // Activado por defecto

    if (snowCanvas && toggleSnowBtn) {
        const ctx = snowCanvas.getContext('2d');
        let flakes = [];

        function resizeCanvas() {
            snowCanvas.width = countdownSection.offsetWidth;
            snowCanvas.height = countdownSection.offsetHeight;
        }

        function createFlakes() {
            const flakeCount = snowCanvas.width / 10;
            flakes = [];
            for (let i = 0; i < flakeCount; i++) {
                flakes.push({
                    x: Math.random() * snowCanvas.width,
                    y: Math.random() * snowCanvas.height,
                    r: Math.random() * 3 + 1,
                    d: Math.random() + 0.5
                });
            }
        }

        function drawFlakes() {
            ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            for (let i = 0; i < flakes.length; i++) {
                const f = flakes[i];
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            }
            ctx.fill();
            moveFlakes();
        }

        function moveFlakes() {
            for (let i = 0; i < flakes.length; i++) {
                const f = flakes[i];
                f.y += Math.pow(f.d, 2) + 1;
                if (f.y > snowCanvas.height) {
                    flakes[i] = { x: Math.random() * snowCanvas.width, y: 0, r: f.r, d: f.d };
                }
            }
        }

        let animationFrameId;
        function animateSnow() {
            if (snowEnabled) {
                drawFlakes();
                animationFrameId = requestAnimationFrame(animateSnow);
            }
        }

        function setupSnow() {
            resizeCanvas();
            createFlakes();
            if (snowEnabled) {
                animateSnow();
                toggleSnowBtn.classList.add('active');
            }
        }

        toggleSnowBtn.addEventListener('click', () => {
            snowEnabled = !snowEnabled;
            localStorage.setItem('snowEnabled', snowEnabled);
            toggleSnowBtn.classList.toggle('active', snowEnabled);
            if (snowEnabled) {
                animateSnow();
            } else {
                cancelAnimationFrame(animationFrameId);
                ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
            }
        });

        window.addEventListener('resize', setupSnow);
        setupSnow();
    }
});