// download.js
document.addEventListener('DOMContentLoaded', () => {
    const downloadButtons = document.querySelectorAll('.download-link');

    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Previene la navegación inmediata del enlace
            e.preventDefault();

            // 1. Bloqueo para botones 'Próximamente'
            if (this.style.opacity === '0.6') {
                alert("¡Lo sentimos! Esta versión de GLauncher estará disponible muy pronto.");
                return;
            }

            // Captura la información de la versión
            let version = this.textContent.trim();
            if (version.toLowerCase().includes('descargar')) {
                version = this.closest('.download-group').querySelector('h3').textContent.trim();
            }

            // Guarda el estado original del botón
            const originalText = this.innerHTML;
            const originalBg = this.style.backgroundColor;
            
            // 2. Muestra un mensaje de 'Iniciando...'
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
            this.style.backgroundColor = '#ff9900'; // Color temporal
            this.style.pointerEvents = 'none'; // Deshabilita el botón

            // 3. Muestra la notificación Neón
            showNotification(`Iniciando descarga de GLauncher ${version}. Revisa tu carpeta de descargas.`, 'success');

            // 4. Simula un retraso antes de "completar" la acción (2.5 segundos)
            setTimeout(() => {
                // Restaura el botón a su estado original
                this.innerHTML = originalText;
                this.style.backgroundColor = originalBg;
                this.style.pointerEvents = 'auto';

                // *** ACCIÓN REAL DE DESCARGA ***
                // En una aplicación real, la línea de abajo iniciaría la descarga:
                // window.location.href = this.href; 
                
            }, 2500); // 2.5 segundos de simulación
        });
    });

    // Función para mostrar notificaciones estilo Neón
    function showNotification(message, type) {
        let notification = document.getElementById('app-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'app-notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.className = type; 
        
        // Estilos Neón en el cuadro de notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 30px;
            background-color: #0b0f1a; /* main-bg-color */
            color: #f0f8ff; /* text-color-light */
            border: 2px solid #00ffff; /* neon-blue */
            border-radius: 8px;
            box-shadow: 0 0 15px #00ffff;
            z-index: 10000;
            transition: opacity 0.5s ease-in-out, transform 0.5s ease;
            opacity: 0;
            transform: translateY(-50px);
            font-weight: bold;
        `;
        
        // Mostrar notificación
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        // Ocultar notificación
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-50px)';
        }, 4000);
    }
});