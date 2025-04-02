class KanbanBoard {
    constructor() {
        this.currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        this.months = [];
        this.initialize();
    }

    async initialize() {
        // Verificar autenticação
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/index.html';
            return;
        }

        // Setup user information
        const user = auth.getCurrentUser();
        if (user) {
            document.getElementById('userName').textContent = user.name;
            document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`;
        }

        // Initialize card modal
        if (!window.cardModal) {
            window.cardModal = new CardModal();
        }

        // Setup logo if exists
        const storedLogo = localStorage.getItem('companyLogo');
        if (storedLogo) {
            const logoContainer = document.getElementById('logoContainer');
            logoContainer.innerHTML = `<img src="${storedLogo}" alt="Company Logo" class="h-10 object-contain">`;
        }

        // Gerar array de meses (6 meses antes e depois do mês atual)
        const today = new Date();
        for (let i = -6; i <= 6; i++) {
            const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
            this.months.push(month.toISOString().substring(0, 7));
        }

        // Criar estrutura do Kanban
        await this.createKanbanStructure();
        
        // Configurar botão de adicionar
        const addButton = document.querySelector('.fixed.bottom-4.right-4');
        if (addButton) {
            addButton.addEventListener('click', () => {
                if (window.cardModal) {
                    window.cardModal.open();
                } else {
                    console.error('Card modal not initialized');
                    utils.showFeedback('Erro ao abrir modal', 'error');
                }
            });
        }

        // Carregar cards do mês atual
        await this.loadMonthCards(this.currentMonth);

        // Configurar navegação entre meses
        this.setupMonthNavigation();

        // Setup event listeners for updates
        window.addEventListener('logoUpdated', (event) => {
            const logoContainer = document.getElementById('logoContainer');
            if (event.detail.logo) {
                logoContainer.innerHTML = `<img src="${event.detail.logo}" alt="Company Logo" class="h-10 object-contain">`;
            }
        });

        // Initialize admin features if admin user
        if (user?.role === 'admin') {
            const adminScript = document.createElement('script');
            adminScript.src = '/js/admin.js';
            document.body.appendChild(adminScript);
        }
    }

    async createKanbanStructure() {
        const container = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-6');
        if (!container) return;

        // Adicionar seletor de mês
        const monthSelector = document.createElement('div');
        monthSelector.className = 'flex justify-between items-center mb-6';
        monthSelector.innerHTML = `
            <button id="prevMonth" class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-chevron-left"></i>
            </button>
            <h2 id="currentMonthDisplay" class="text-xl font-semibold"></h2>
            <button id="nextMonth" class="text-gray-600 hover:text-gray-800">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        container.parentElement.insertBefore(monthSelector, container);

        // Configurar colunas do Kanban
        const columns = ['prospeccao', 'negociacao', 'fechamento'];
        const columnTitles = ['Prospecção', 'Negociação', 'Fechamento'];

        container.innerHTML = columns.map((status, index) => `
            <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-4">${columnTitles[index]}</h3>
                <div id="${status}" class="kanban-column bg-gray-100 p-4 rounded-lg min-h-[200px]" 
                     data-status="${status}">
                </div>
            </div>
        `).join('');

        // Configurar drag and drop
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const columns = document.querySelectorAll('.kanban-column');
        columns.forEach(column => {
            new Sortable(column, {
                group: 'cards',
                animation: 150,
                ghostClass: 'card-ghost',
                dragClass: 'card-drag',
                onStart: (evt) => {
                    evt.item.classList.add('dragging');
                    document.body.style.cursor = 'grabbing';
                },
                onEnd: async (evt) => {
                    evt.item.classList.remove('dragging');
                    document.body.style.cursor = '';
                    const cardId = evt.item.getAttribute('data-id');
                    const newStatus = evt.to.getAttribute('data-status');
                    const oldStatus = evt.from.getAttribute('data-status');
                    
                    if (newStatus !== oldStatus) {
                        await this.updateCardStatus(cardId, newStatus);
                        
                        // Create status change notification
                        const card = this.getCardById(cardId);
                        if (card) {
                            const statusNames = {
                                prospeccao: 'Prospecção',
                                negociacao: 'Negociação',
                                fechamento: 'Fechamento'
                            };
                            
                            window.dispatchEvent(new CustomEvent('cardStatusChanged', {
                                detail: {
                                    cardId,
                                    oldStatus: statusNames[oldStatus] || oldStatus,
                                    newStatus: statusNames[newStatus] || newStatus,
                                    cardName: card.clientName
                                }
                            }));
                        }
                    }
                },
                onMove: (evt) => {
                    const user = auth.getCurrentUser();
                    const card = this.getCardById(evt.dragged.getAttribute('data-id'));
                    
                    // Check permissions
                    if (!user) return false;
                    
                    // Admin can move any card
                    if (user.role === 'admin') return true;
                    
                    // Users can only move their own cards
                    const cardData = this.getCardData(evt.dragged.getAttribute('data-id'));
                    return cardData && cardData.responsibleId === user.id;
                }
            });
        });
    }

    getCardById(cardId) {
        const card = document.querySelector(`.kanban-card[data-id="${cardId}"]`);
        if (!card) return null;

        return {
            clientName: card.querySelector('.font-semibold').textContent,
            value: card.getAttribute('data-value'),
            agency: card.getAttribute('data-agency'),
            product: card.getAttribute('data-product'),
            responsibleId: parseInt(card.getAttribute('data-responsible-id'))
        };
    }

    getCardData(cardId) {
        return this.cards.find(card => card.id === parseInt(cardId));
    }

    setupMonthNavigation() {
        const prevButton = document.getElementById('prevMonth');
        const nextButton = document.getElementById('nextMonth');
        const monthDisplay = document.getElementById('currentMonthDisplay');

        // Add month selector dropdown
        const monthSelector = document.createElement('select');
        monthSelector.className = 'ml-4 px-3 py-1 border border-gray-300 rounded-md text-sm';
        
        // Generate month options for the next 12 months
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const option = document.createElement('option');
            option.value = date.toISOString().substring(0, 7);
            option.textContent = date.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric'
            });
            monthSelector.appendChild(option);
        }

        monthSelector.value = this.currentMonth;
        monthDisplay.parentNode.insertBefore(monthSelector, monthDisplay.nextSibling);

        // Update navigation handlers
        monthSelector.addEventListener('change', async () => {
            this.currentMonth = monthSelector.value;
            await this.loadMonthCards(this.currentMonth);
            this.updateMonthDisplay();
        });

        prevButton.addEventListener('click', async () => {
            const currentIndex = this.months.indexOf(this.currentMonth);
            if (currentIndex > 0) {
                this.currentMonth = this.months[currentIndex - 1];
                monthSelector.value = this.currentMonth;
                this.updateMonthDisplay();
                await this.loadMonthCards(this.currentMonth);
            }
        });

        nextButton.addEventListener('click', async () => {
            const currentIndex = this.months.indexOf(this.currentMonth);
            if (currentIndex < this.months.length - 1) {
                this.currentMonth = this.months[currentIndex + 1];
                monthSelector.value = this.currentMonth;
                this.updateMonthDisplay();
                await this.loadMonthCards(this.currentMonth);
            }
        });

        this.updateMonthDisplay();
    }

    updateMonthDisplay() {
        const monthDisplay = document.getElementById('currentMonthDisplay');
        const [year, month] = this.currentMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        monthDisplay.textContent = date.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });
    }

    async moveToMonth(cardId) {
        const monthSelector = document.createElement('select');
        monthSelector.className = 'w-full px-3 py-2 border border-gray-300 rounded-md';

        // Generate month options
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const option = document.createElement('option');
            option.value = date.toISOString().substring(0, 7);
            option.textContent = date.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric'
            });
            monthSelector.appendChild(option);
        }

        // Create modal for month selection
        const modalHTML = `
            <div id="moveToMonthModal" class="fixed inset-0 bg-black bg-opacity-50 z-50">
                <div class="min-h-screen px-4 text-center">
                    <div class="fixed inset-0 transition-opacity"></div>
                    <span class="inline-block h-screen align-middle">&#8203;</span>
                    <div class="inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">
                            Mover para outro mês
                        </h3>
                        <div id="monthSelectorContainer" class="mb-6"></div>
                        <div class="mt-6 flex justify-end space-x-3">
                            <button onclick="document.getElementById('moveToMonthModal').remove()"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button id="confirmMoveMonth"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                                Mover
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('monthSelectorContainer').appendChild(monthSelector);

        // Handle month change confirmation
        document.getElementById('confirmMoveMonth').addEventListener('click', async () => {
            const newMonth = monthSelector.value;
            try {
                const response = await fetch(`/api/cards/${cardId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ expectedDate: newMonth })
                });

                if (!response.ok) {
                    throw new Error('Erro ao mover card');
                }

                // Reload cards for current month
                await this.loadMonthCards(this.currentMonth);
                utils.showFeedback('Card movido com sucesso!', 'success');
            } catch (error) {
                console.error('Error moving card:', error);
                utils.showFeedback('Erro ao mover card', 'error');
            }

            document.getElementById('moveToMonthModal').remove();
        });
    }

    async loadMonthCards(month) {
        try {
            const response = await fetch(`/api/cards/month/${month}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar cards');
            }

            const cards = await response.json();
            this.updateCards(cards);
            
            // Atualizar métricas
            window.dispatchEvent(new CustomEvent('cardUpdated', { detail: cards }));

        } catch (error) {
            console.error('Erro ao carregar cards:', error);
            utils.showFeedback('Erro ao carregar cards', 'error');
        }
    }

    async updateCardStatus(cardId, newStatus) {
        try {
            const response = await fetch(`/api/cards/${cardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar status');
            }

            // Atualizar métricas
            await this.loadMonthCards(this.currentMonth);

        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            utils.showFeedback('Erro ao atualizar status', 'error');
            // Recarregar cards para reverter mudanças
            await this.loadMonthCards(this.currentMonth);
        }
    }

    updateCards(cards) {
        const columns = {
            prospeccao: document.getElementById('prospeccao'),
            negociacao: document.getElementById('negociacao'),
            fechamento: document.getElementById('fechamento')
        };

        const counts = {
            prospeccao: 0,
            negociacao: 0,
            fechamento: 0
        };

        // Limpar colunas
        Object.values(columns).forEach(column => {
            column.innerHTML = '';
        });

        // Distribuir cards e contar
        cards.forEach(card => {
            const column = columns[card.status];
            if (column) {
                column.insertAdjacentHTML('beforeend', this.renderCard(card));
                counts[card.status]++;
            }
        });

        // Atualizar contadores
        Object.keys(counts).forEach(status => {
            const countElement = document.getElementById(`${status}-count`);
            if (countElement) {
                countElement.textContent = `${counts[status]} card${counts[status] !== 1 ? 's' : ''}`;
            }
        });

        // Atualizar métricas
        this.updateMetrics(cards);
    }

    updateMetrics(cards) {
        const metrics = {
            prospeccao: { count: 0, value: 0 },
            negociacao: { count: 0, value: 0 },
            fechamento: { count: 0, value: 0 },
            total: { count: 0, value: 0 }
        };

        cards.forEach(card => {
            metrics[card.status].count++;
            metrics[card.status].value += parseFloat(card.value);
            metrics.total.count++;
            metrics.total.value += parseFloat(card.value);
        });

        // Update metrics display
        Object.keys(metrics).forEach(status => {
            const container = document.getElementById(`${status}-metrics`);
            if (container) {
                const valueClass = status === 'total' ? 'text-gray-900' :
                                 status === 'prospeccao' ? 'text-blue-600' :
                                 status === 'negociacao' ? 'text-yellow-600' : 'text-green-600';
                
                container.innerHTML = `
                    <p class="text-3xl font-bold ${valueClass}">${utils.formatCurrency(metrics[status].value)}</p>
                    <p class="text-sm text-gray-600">${metrics[status].count} oportunidade${metrics[status].count !== 1 ? 's' : ''}</p>
                `;
            }
        });

        // Dispatch metrics update event
        window.dispatchEvent(new CustomEvent('metricsUpdated', { detail: metrics }));
    }

    renderCard(card) {
        const user = auth.getCurrentUser();
        const isAdmin = user?.role === 'admin';
        const isResponsible = user?.id === card.responsibleId;

        // Get custom fields from system config
        const customFields = JSON.parse(localStorage.getItem('customFields') || '[]');

        return `
            <div class="bg-white rounded-lg shadow p-4 cursor-move mb-4" data-id="${card.id}">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-800">${card.clientName}</h4>
                    <span class="text-sm text-gray-600">${utils.formatDocument(card.cpfCnpj)}</span>
                </div>
                <div class="space-y-2">
                    <p class="text-sm text-gray-600">Agência: ${card.agency}</p>
                    <p class="text-sm text-gray-600">Produto: ${card.product}</p>
                    <p class="text-sm text-gray-600">Responsável: ${card.responsible}</p>
                    <p class="text-sm font-semibold text-gray-800">${utils.formatCurrency(card.value)}</p>
                    <p class="text-sm text-gray-600">Previsão: ${utils.formatDate(card.expectedDate)}</p>
                    
                    <!-- Custom Fields -->
                    ${customFields.map(field => `
                        <p class="text-sm text-gray-600">
                            ${field.name}: ${card.customFields?.[field.name] || '-'}
                        </p>
                    `).join('')}
                </div>
                ${(isAdmin || isResponsible) ? `
                    <div class="mt-2 flex justify-end space-x-2">
                        <button onclick="cardModal.open(${JSON.stringify(card)})" 
                                class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${isAdmin ? `
                            <button onclick="kanbanBoard.moveToMonth(${card.id})" 
                                    class="text-gray-600 hover:text-gray-800">
                                <i class="fas fa-calendar-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }
}

// Criar instância do Kanban
window.kanbanBoard = new KanbanBoard();
