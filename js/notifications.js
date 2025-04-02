class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.initialize();
    }

    initialize() {
        // Criar o dropdown de notificações
        const notificationDropdown = `
            <div id="notificationDropdown" class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg py-1 hidden">
                <div class="px-4 py-2 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-sm font-semibold text-gray-800">Notificações</h3>
                        <button id="markAllRead" class="text-xs text-blue-600 hover:text-blue-800">
                            Marcar todas como lidas
                        </button>
                    </div>
                </div>
                <div id="notificationList" class="max-h-96 overflow-y-auto">
                    <!-- Notificações serão inseridas aqui -->
                </div>
            </div>
        `;

        // Inserir dropdown após o botão de notificações
        const bellButton = document.querySelector('.fa-bell').parentElement;
        bellButton.parentElement.style.position = 'relative';
        bellButton.parentElement.insertAdjacentHTML('beforeend', notificationDropdown);

        // Configurar eventos
        bellButton.addEventListener('click', () => this.toggleDropdown());
        document.getElementById('markAllRead').addEventListener('click', () => this.markAllAsRead());

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationDropdown');
            const bellIcon = document.querySelector('.fa-bell');
            if (!bellIcon.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        });

        // Adicionar listeners para eventos do sistema
        this.setupEventListeners();

        // Carregar notificações iniciais
        this.loadNotifications();
    }

    setupEventListeners() {
        // Ouvir eventos de atualização de cards
        window.addEventListener('cardUpdated', (event) => {
            const card = event.detail;
            if (card) {
                // Notificar sobre mudança de status
                if (card.status !== card._previousStatus) {
                    this.addNotification({
                        title: 'Atualização de Status',
                        message: `Card "${card.clientName}" movido para ${this.getStatusName(card.status)}`,
                        type: 'status'
                    });
                }

                // Notificar sobre atribuição
                if (card.responsibleId !== card._previousResponsibleId) {
                    this.addNotification({
                        title: 'Nova Atribuição',
                        message: `Você foi atribuído ao card "${card.clientName}"`,
                        type: 'assignment'
                    });
                }
            }
        });

        // Ouvir eventos de novas oportunidades
        window.addEventListener('newOpportunity', (event) => {
            const opportunity = event.detail;
            this.addNotification({
                title: 'Nova Oportunidade',
                message: `Nova oportunidade disponível: ${opportunity.clientName}`,
                type: 'opportunity',
                data: opportunity
            });
        });
    }

    getStatusName(status) {
        const statusNames = {
            prospeccao: 'Prospecção',
            negociacao: 'Negociação',
            fechamento: 'Fechamento'
        };
        return statusNames[status] || status;
    }

    toggleDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        dropdown.classList.toggle('hidden');
    }

    async loadNotifications() {
        try {
            // Em produção, isso seria uma chamada à API
            const mockNotifications = [
                {
                    id: 1,
                    title: 'Nova oportunidade',
                    message: 'Cliente interessado em Seguro Auto',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    read: false,
                    type: 'opportunity'
                },
                {
                    id: 2,
                    title: 'Atualização de status',
                    message: 'Card movido para Negociação',
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    read: false,
                    type: 'status'
                }
            ];

            this.notifications = mockNotifications;
            this.updateNotificationCount();
            this.renderNotifications();
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    }

    renderNotifications() {
        const notificationList = document.getElementById('notificationList');
        notificationList.innerHTML = '';

        if (this.notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="px-4 py-3 text-sm text-gray-500 text-center">
                    Nenhuma notificação
                </div>
            `;
            return;
        }

        this.notifications.forEach(notification => {
            const notificationElement = document.createElement('div');
            notificationElement.className = `px-4 py-3 hover:bg-gray-50 cursor-pointer ${notification.read ? 'bg-white' : 'bg-blue-50'}`;
            notificationElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="text-sm font-medium text-gray-900">${notification.title}</h4>
                        <p class="text-sm text-gray-600">${notification.message}</p>
                        <p class="text-xs text-gray-500 mt-1">${this.formatTimestamp(notification.timestamp)}</p>
                    </div>
                    ${!notification.read ? `
                        <button class="text-xs text-blue-600 hover:text-blue-800"
                                onclick="notificationSystem.markAsRead(${notification.id}, event)">
                            Marcar como lida
                        </button>
                    ` : ''}
                </div>
            `;

            notificationElement.addEventListener('click', () => this.handleNotificationClick(notification));
            notificationList.appendChild(notificationElement);
        });
    }

    updateNotificationCount() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        this.unreadCount = unreadCount;

        const badge = document.querySelector('.fa-bell').nextElementSibling;
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    markAsRead(notificationId, event) {
        if (event) {
            event.stopPropagation();
        }

        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.updateNotificationCount();
            this.renderNotifications();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.updateNotificationCount();
        this.renderNotifications();
    }

    handleNotificationClick(notification) {
        // Marcar como lida
        this.markAsRead(notification.id);

        // Ação específica baseada no tipo de notificação
        switch (notification.type) {
            case 'opportunity':
                if (notification.data) {
                    cardModal.open(notification.data);
                }
                break;
            case 'status':
            case 'assignment':
                // Rolar até o card relevante (TODO)
                break;
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            return 'Agora há pouco';
        } else if (diffInHours < 24) {
            return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    addNotification(notification) {
        const newNotification = {
            id: this.notifications.length + 1,
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        this.updateNotificationCount();
        this.renderNotifications();

        // Mostrar feedback visual
        const badge = document.querySelector('.fa-bell').nextElementSibling;
        badge.classList.add('notification-badge');
        setTimeout(() => {
            badge.classList.remove('notification-badge');
        }, 2000);
    }
}

// Criar instância global do sistema de notificações
window.notificationSystem = new NotificationSystem();