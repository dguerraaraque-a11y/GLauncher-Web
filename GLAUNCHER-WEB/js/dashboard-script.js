document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'https://glauncher-api.onrender.com';
    const DEFAULT_AVATAR_URL = 'https://crafatar.com/avatars/606e2ff0-ed77-4842-9d6c-e1d3321c7838?size=100&overlay'; // Steve Avatar
    const PUSHER_KEY = 'a2fb8d4323a44da53c63'; // Tu clave de Pusher
    const token = localStorage.getItem('glauncher_token');

    // --- FLOATING NAV LOGIC ---
    const navItems = document.querySelectorAll('.floating-nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            if (item.id === 'admin-nav-button') {
                window.location.href = '/admin.html';
                return;
            }
            const targetId = item.dataset.target;
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) section.classList.add('active');
            });
        });
    });

    // --- AUTH CHECK ---
    if (!token) {
        // Modo de demostración si no hay token
        loadDemoData();
        return;
    }

    // --- LOAD USER DATA ---
    async function loadUserData() {
        try {
            const [userResponse, usersListResponse, cosmeticsResponse] = await Promise.all([
                fetch(`${BACKEND_URL}/api/user_info`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${BACKEND_URL}/api/users`),
                fetch(`${BACKEND_URL}/api/shop/items`)
            ]);

            if (!userResponse.ok) {
                if (userResponse.status === 401) {
                    localStorage.removeItem('glauncher_token');
                    window.location.href = '/login.html?error=session_expired';
                }
                throw new Error('No se pudo cargar la información del usuario.');
            }

            const userData = await userResponse.json();
            const allUsers = await usersListResponse.json();
            const allCosmetics = await cosmeticsResponse.json();

            initializeRealtimeNotifications(userData);
            populateSidebar(userData);
            populateStats(userData);
            renderFriendsList(allUsers);
            setupFriendSearch(allUsers);
            // Pasamos userData a la inicialización de ajustes
            initializeSettings(userData);
            initializeAchievements(userData);
            renderSkinsInventory(userData.owned_cosmetics, allCosmetics);

        } catch (error) {
            console.error("Error al cargar datos de usuario:", error);
            window.showNotification(error.message, 'error');
            loadDemoData(); // Cargar datos de demo si hay un error
        }
    }

    function populateSidebar(userData) {
        document.getElementById('nav-avatar').src = userData.avatar_url || DEFAULT_AVATAR_URL;
        document.getElementById('nav-username').textContent = userData.username;
        document.getElementById('user-role').textContent = userData.role;
        document.getElementById('user-role-container').style.display = 'block';

        if (userData.is_admin) {
            document.getElementById('admin-nav-button').style.display = 'flex';
        }

        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('glauncher_token');
            window.showNotification('Has cerrado sesión.', 'success');
            setTimeout(() => window.location.href = '/index.html', 1500);
        });

        document.getElementById('launch-game-btn').addEventListener('click', () => {
            window.showNotification('Iniciando GLauncher...', 'info');
            window.location.href = 'glauncher://'; // Protocolo personalizado
        });
    }

    function populateStats(userData) {
        document.getElementById('stat-gcoins').textContent = userData.gcoins.toLocaleString('es-ES');
        document.getElementById('stat-cosmetics').textContent = userData.owned_cosmetics.length;
        document.getElementById('stat-register-date').textContent = new Date(userData.registration_date).toLocaleDateString('es-ES');
        // Placeholder para tiempo de juego
        document.getElementById('stat-playtime').textContent = `${Math.floor(userData.play_time_seconds / 3600)}h`;
    }

    function renderFriendsList(users) {
        const friendsListContainer = document.getElementById('friends-list');
        friendsListContainer.innerHTML = '';

        if (!users || users.length === 0) {
            friendsListContainer.innerHTML = '<p>No se encontraron usuarios.</p>';
            return;
        }

        users.forEach(user => {
            const friendCard = document.createElement('div');
            friendCard.className = 'friend-item';
            friendCard.innerHTML = `
                <img src="${user.avatar_url || DEFAULT_AVATAR_URL}" alt="Avatar de ${user.username}" class="friend-avatar">
                <div class="friend-info">
                    <span class="friend-name">${user.username}</span>
                    <span class="friend-role">${user.role}</span>
                </div>
                <button class="action-btn add-friend-btn" title="Añadir Amigo"><i class="fas fa-user-plus"></i></button>
            `;
            friendsListContainer.appendChild(friendCard);
        });
    }

    function setupFriendSearch(allUsers) {
        const searchInput = document.getElementById('friend-search-input');
        searchInput.addEventListener('keyup', () => {
            const query = searchInput.value.toLowerCase();
            const filteredUsers = allUsers.filter(user => user.username.toLowerCase().includes(query));
            renderFriendsList(filteredUsers);
        });
    }

    function renderSkinsInventory(ownedIds, allCosmetics) {
        const skinsGrid = document.getElementById('skins-inventory-grid');
        skinsGrid.innerHTML = '';
        const ownedCosmetics = allCosmetics.filter(item => ownedIds.includes(item.id));

        if (ownedCosmetics.length === 0) {
            skinsGrid.innerHTML = '<p class="placeholder-content">Aún no tienes cosméticos. ¡Visita la tienda para conseguir algunos!</p>';
            return;
        }

        ownedCosmetics.forEach(item => {
            const skinCard = document.createElement('div');
            skinCard.className = 'skin-card';
            skinCard.innerHTML = `
                <img src="${BACKEND_URL}${item.image_url}" alt="${item.name}" class="skin-image">
                <p class="skin-name">${item.name}</p>
            `;
            skinsGrid.appendChild(skinCard);
        });
    }

    // --- LÓGICA DE LOGROS ---
    function initializeAchievements(userData) {
        const achievements = [
            { id: 'pioneer', title: 'Pionero', description: 'Regístrate durante la fase BETA.', icon: 'images/achievements/pioneer.png', recommended: true, isUnlocked: (data) => new Date(data.registration_date) < new Date('2026-01-01') },
            { id: 'collector', title: 'Primer Comprador', description: 'Adquiere tu primer cosmético en la tienda.', icon: 'images/achievements/collector.png', recommended: true, isUnlocked: (data) => data.owned_cosmetics.length > 0 },
            { id: 'veteran', title: 'Veterano', description: 'Lleva más de 3 meses en la comunidad.', icon: 'images/achievements/explorer.png', recommended: false, isUnlocked: (data) => (new Date() - new Date(data.registration_date)) / (1000 * 60 * 60 * 24 * 30) >= 3 },
            { id: 'fashionista', title: 'Fashionista', description: 'Consigue 5 o más cosméticos.', icon: 'images/achievements/socialite.png', recommended: true, isUnlocked: (data) => data.owned_cosmetics.length >= 5 },
            { id: 'rich', title: 'Adinerado', description: 'Acumula 1,000 GCoins.', icon: 'images/achievements/pioneer.png', recommended: false, isUnlocked: (data) => data.gcoins >= 1000 },
        ];

        const grid = document.getElementById('achievements-grid');
        const filterButtons = document.querySelectorAll('.achievements-filter-controls .filter-btn');

        function renderAchievements(filter = 'all') {
            grid.innerHTML = '';
            const userAchievements = achievements.map(ach => ({
                ...ach,
                unlocked: ach.isUnlocked(userData)
            }));

            let filteredAchievements = userAchievements;

            switch (filter) {
                case 'unlocked':
                    filteredAchievements = userAchievements.filter(a => a.unlocked);
                    break;
                case 'locked':
                    filteredAchievements = userAchievements.filter(a => !a.unlocked);
                    break;
                case 'recommended':
                    filteredAchievements = userAchievements.filter(a => a.recommended && !a.unlocked);
                    break;
            }

            if (filteredAchievements.length === 0) {
                grid.innerHTML = '<p class="placeholder-content">No hay logros en esta categoría.</p>';
                return;
            }

            filteredAchievements.forEach(ach => {
                const card = document.createElement('div');
                card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
                card.innerHTML = `
                    <img src="${ach.icon}" class="achievement-icon" alt="${ach.title}">
                    <div class="achievement-info">
                        <h4>${ach.title}</h4>
                        <p>${ach.description}</p>
                        <div class="achievement-progress">
                            <div class="progress-bar" style="width: ${ach.unlocked ? '100%' : '0%'}"></div>
                        </div>
                    </div>
                    <div class="achievement-actions">
                        <button class="reaction-btn" data-achievement-id="${ach.id}" title="Reaccionar">
                            <i class="fas fa-thumbs-up"></i>
                        </button>
                        <span class="reaction-count">0</span>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderAchievements(button.dataset.filter);
            });
        });

        // Render inicial
        renderAchievements();

        // Lógica de Reacciones (placeholder)
        grid.addEventListener('click', (e) => {
            const reactionBtn = e.target.closest('.reaction-btn');
            if (reactionBtn) {
                const achievementId = reactionBtn.dataset.achievementId;
                // En una implementación completa, necesitarías el ID del usuario cuyo perfil estás viendo.
                // Por ahora, asumimos que reaccionas a tus propios logros como demostración.
                const targetUserId = userData.id; 
                reactToAchievement(achievementId, targetUserId, reactionBtn);
            }
        });
    }

    async function reactToAchievement(achievementId, targetUserId, button) {
        // Simulación visual: incrementa el contador y deshabilita el botón
        const countSpan = button.nextElementSibling;
        const currentCount = parseInt(countSpan.textContent);
        countSpan.textContent = currentCount + 1;
        button.disabled = true;
        button.classList.add('reacted');

        try {
            const response = await fetch(`${BACKEND_URL}/api/achievements/react`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ achievement_id: achievementId, target_user_id: targetUserId })
            });
            const result = await response.json();
            if (!response.ok) {
                // Si falla, revertir el cambio visual
                countSpan.textContent = currentCount;
                button.disabled = false;
                throw new Error(result.message);
            }
        } catch (error) { window.showNotification(`Error al reaccionar: ${error.message}`, 'error'); }
    }

    // --- LÓGICA DE AJUSTES ---
    function initializeSettings(userData) {
        const settingsForm = document.getElementById('account-settings-form');
        const avatarPreview = document.getElementById('settings-avatar-preview');
        const avatarFileInput = document.getElementById('avatar-change-file');

        // Poblar datos iniciales
        document.getElementById('username-change').value = userData.username;
        avatarPreview.src = userData.avatar_url || DEFAULT_AVATAR_URL;

        // Previsualización de avatar
        avatarFileInput.addEventListener('change', () => {
            const file = avatarFileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(settingsForm);
            // Lógica para enviar el formulario al backend
            try {
                const response = await fetch(`${BACKEND_URL}/api/user/update_profile`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                
                window.showNotification(result.message, 'success');
                setTimeout(() => window.location.reload(), 1500); // Recargar para ver cambios
            } catch (error) {
                window.showNotification(error.message, 'error');
            }
        });
    }

    function initializeDemoAchievements() {
        const achievements = [
            { id: 'pioneer', title: 'Pionero', description: 'Regístrate durante la fase BETA.', icon: 'images/achievements/pioneer.png', unlocked: true },
            { id: 'collector', title: 'Primer Comprador', description: 'Adquiere tu primer cosmético en la tienda.', icon: 'images/achievements/collector.png', unlocked: false },
            { id: 'veteran', title: 'Veterano', description: 'Lleva más de 3 meses en la comunidad.', icon: 'images/achievements/explorer.png', unlocked: false },
            { id: 'fashionista', title: 'Fashionista', description: 'Consigue 5 o más cosméticos.', icon: 'images/achievements/socialite.png', unlocked: false },
        ];
        const grid = document.getElementById('achievements-grid');
        const filterButtons = document.querySelectorAll('.achievements-filter-controls .filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                grid.innerHTML = '<p class="placeholder-content">Inicia sesión para ver y filtrar tus logros.</p>';
            });
        });

        grid.innerHTML = '';
        achievements.forEach(ach => {
            const card = document.createElement('div');
            card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <img src="${ach.icon}" class="achievement-icon" alt="${ach.title}">
                <h4>${ach.title}</h4><p>${ach.description}</p><div class="achievement-progress"><div class="progress-bar" style="width: ${ach.unlocked ? '100%' : '0%'}"></div></div>
                <div class="achievement-actions">
                    <button class="reaction-btn" title="Reaccionar"><i class="fas fa-thumbs-up"></i></button>
                    <span class="reaction-count">0</span></div>
            `;
            grid.appendChild(card);
        });
    }

    function loadDemoData() {
        // Ocultar elementos de usuario y mostrar mensaje de invitado
        const profileSection = document.getElementById('nav-profile-section');
        if (profileSection) {
            profileSection.style.display = 'none';
        }
        document.getElementById('nav-guest-section').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
        
        // Actualizar el avatar y nombre en la sección de invitado
        const guestAvatar = document.querySelector('#nav-guest-section .nav-avatar');
        if (guestAvatar) guestAvatar.src = DEFAULT_AVATAR_URL;

        // Poblar estadísticas con datos de ejemplo
        document.getElementById('stat-gcoins').textContent = "0";
        document.getElementById('stat-cosmetics').textContent = "0";
        document.getElementById('stat-register-date').textContent = "--/--/----";
        document.getElementById('stat-playtime').textContent = "0h";

        // Poblar lista de amigos con datos de ejemplo
        const demoUsers = [
            { username: 'DaniCraftYT25', role: 'Pico de Netherite', avatar_url: 'https://crafatar.com/avatars/606e2ff0-ed77-4842-9d6c-e1d3321c7838?size=100&overlay' },
            { username: 'UsuarioAlfa', role: 'Pico de Diamante', avatar_url: null },
            { username: 'JugadorBeta', role: 'Pico de Oro', avatar_url: null }
        ];
        renderFriendsList(demoUsers);
        setupFriendSearch(demoUsers);

        // Mensaje en inventario de skins
        document.getElementById('skins-inventory-grid').innerHTML = '<p class="placeholder-content">Inicia sesión para ver tus cosméticos.</p>';

        // Inicializar logros en modo demo
        initializeDemoAchievements();
    }
    
    // --- LÓGICA DE NOTIFICACIONES EN TIEMPO REAL ---
    function initializeRealtimeNotifications(userData) {
        const pusher = new Pusher(PUSHER_KEY, {
            cluster: 'us2',
            authEndpoint: `${BACKEND_URL}/pusher/auth`,
            auth: { headers: { 'Authorization': `Bearer ${token}` } }
        });

        // Canal privado para notificaciones personales (solicitudes de amistad, etc.)
        const privateChannel = pusher.subscribe(`private-user-${userData.id}`);

        privateChannel.bind('pusher:subscription_error', (status) => {
            console.error(`Error al suscribirse al canal privado: ${status}`);
        });

        privateChannel.bind('new-friend-request', (data) => {
            window.showNotification(`📬 Nueva solicitud de amistad de: ${data.from_username}`, 'info');
            // Aquí podrías añadir una lógica para refrescar la lista de amigos automáticamente
        });

        privateChannel.bind('new-gchat-message', (data) => {
            // Solo mostrar notificación si la ventana de GChat no está activa
            if (!document.getElementById('gchat-section').classList.contains('active')) {
                window.showNotification(`💬 Nuevo mensaje de ${data.from_username}: "${data.content}"`, 'info');
            }
        });
    }

    loadUserData();
});
