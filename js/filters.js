class FilterSystem {
    constructor() {
        this.currentFilters = {
            agency: 'all',
            product: 'all',
            status: 'all',
            dateRange: null,
            search: ''
        };
        this.initialize();
    }

    initialize() {
        // Adicionar campo de busca
        const searchContainer = document.createElement('div');
        searchContainer.className = 'col-span-full mb-4';
        searchContainer.innerHTML = `
            <div class="relative">
                <input type="text" id="searchInput" 
                       placeholder="Buscar por nome, CPF/CNPJ, agência ou produto..." 
                       class="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <span class="absolute left-3 top-2.5 text-gray-400">
                    <i class="fas fa-search"></i>
                </span>
            </div>
        `;

        const filtersContainer = document.querySelector('.bg-white.rounded-lg.shadow.p-6.mb-6 .grid');
        filtersContainer.insertBefore(searchContainer, filtersContainer.firstChild);

        // Configurar eventos
        this.setupEventListeners();
        this.loadFilterOptions();
    }

    setupEventListeners() {
        // Evento de busca com debounce
        const searchInput = document.getElementById('searchInput');
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.currentFilters.search = searchInput.value;
                this.applyFilters();
            }, 300);
        });

        // Eventos para selects
        ['agency', 'product', 'status'].forEach(filterType => {
            const select = document.getElementById(filterType);
            if (select) {
                select.addEventListener('change', () => {
                    this.currentFilters[filterType] = select.value;
                    this.applyFilters();
                });
            }
        });
    }

    async loadFilterOptions() {
        try {
            // Carregar agências
            const agenciesResponse = await fetch('/api/agencies', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const agencies = await agenciesResponse.json();
            this.populateSelect('agency', agencies, 'name');

            // Carregar produtos
            const productsResponse = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const products = await productsResponse.json();
            this.populateSelect('product', products, 'name');

        } catch (error) {
            console.error('Erro ao carregar opções de filtro:', error);
        }
    }

    populateSelect(selectId, items, labelProperty) {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Manter a opção "Todos"
        select.innerHTML = `<option value="all">Todos os ${selectId === 'agency' ? 'Agências' : 'Produtos'}</option>`;

        // Adicionar opções
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item[labelProperty];
            select.appendChild(option);
        });
    }

    async applyFilters() {
        try {
            // Get current month from KanbanBoard
            const month = kanbanBoard.currentMonth;
            
            // Fetch cards for current month
            const response = await fetch(`/api/cards/month/${month}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao carregar cards');
            }

            let cards = await response.json();

            // Apply text search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                cards = cards.filter(card => 
                    card.clientName.toLowerCase().includes(searchTerm) ||
                    card.cpfCnpj.toLowerCase().includes(searchTerm) ||
                    card.agency.toLowerCase().includes(searchTerm) ||
                    card.product.toLowerCase().includes(searchTerm) ||
                    card.responsible.toLowerCase().includes(searchTerm)
                );
            }

            // Apply agency filter
            if (this.currentFilters.agency !== 'all') {
                cards = cards.filter(card => card.agency === this.currentFilters.agency);
            }

            // Apply product filter
            if (this.currentFilters.product !== 'all') {
                cards = cards.filter(card => card.product === this.currentFilters.product);
            }

            // Apply status filter
            if (this.currentFilters.status !== 'all') {
                cards = cards.filter(card => card.status === this.currentFilters.status);
            }

            // Update metrics with filtered cards
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
                    container.innerHTML = `
                        <p class="text-3xl font-bold ${this.getMetricColor(status)}">${utils.formatCurrency(metrics[status].value)}</p>
                        <p class="text-sm text-gray-600">${metrics[status].count} oportunidade${metrics[status].count !== 1 ? 's' : ''}</p>
                    `;
                }
            });

            // Update card display
            kanbanBoard.updateCards(cards);

            // Dispatch update event
            window.dispatchEvent(new CustomEvent('filtersUpdated', { detail: { cards, metrics } }));

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            utils.showFeedback('Erro ao aplicar filtros', 'error');
        }
    }

    getMetricColor(status) {
        switch (status) {
            case 'prospeccao':
                return 'text-blue-600';
            case 'negociacao':
                return 'text-yellow-600';
            case 'fechamento':
                return 'text-green-600';
            default:
                return 'text-gray-900';
        }
    }

    clearFilters() {
        // Resetar todos os filtros para o estado inicial
        this.currentFilters = {
            agency: 'all',
            product: 'all',
            status: 'all',
            dateRange: null,
            search: ''
        };

        // Resetar campos do formulário
        document.getElementById('searchInput').value = '';
        document.getElementById('agency').value = 'all';
        document.getElementById('product').value = 'all';

        // Reaplicar filtros
        this.applyFilters();
    }
}

// Criar instância global do sistema de filtros
window.filterSystem = new FilterSystem();