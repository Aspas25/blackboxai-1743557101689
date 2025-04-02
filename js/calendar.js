class CalendarView {
    constructor() {
        this.months = [];
        this.cards = {};
        this.initialize();
    }

    async initialize() {
        // Generate months array (current month + 11 future months)
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            this.months.push(date.toISOString().substring(0, 7));
        }

        // Add calendar view button to header
        const header = document.querySelector('header .flex.items-center.space-x-4');
        const calendarButton = document.createElement('button');
        calendarButton.className = 'text-gray-600 hover:text-gray-800';
        calendarButton.innerHTML = '<i class="fas fa-calendar-alt text-xl"></i>';
        calendarButton.onclick = () => this.showCalendarModal();
        header.appendChild(calendarButton);

        // Listen for card updates
        window.addEventListener('cardUpdated', (event) => {
            if (event.detail) {
                const month = event.detail[0]?.expectedDate?.substring(0, 7);
                if (month) {
                    this.cards[month] = event.detail;
                }
            }
        });
    }

    async showCalendarModal() {
        // Load all cards for the next 12 months
        await this.loadAllMonthsData();

        const modalHTML = `
            <div id="calendarModal" class="modal-backdrop show">
                <div class="modal-content max-w-7xl">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Visão Geral do Pipeline</h3>
                        <button class="text-gray-400 hover:text-gray-500" onclick="calendarView.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="grid grid-cols-3 gap-6">
                        ${this.months.map(month => this.renderMonthCard(month)).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async loadAllMonthsData() {
        try {
            await Promise.all(this.months.map(async (month) => {
                if (!this.cards[month]) {
                    const response = await fetch(`/api/cards/month/${month}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    if (response.ok) {
                        this.cards[month] = await response.json();
                    }
                }
            }));
        } catch (error) {
            console.error('Error loading calendar data:', error);
            utils.showFeedback('Erro ao carregar dados do calendário', 'error');
        }
    }

    renderMonthCard(month) {
        const monthCards = this.cards[month] || [];
        const metrics = this.calculateMetrics(monthCards);
        const date = new Date(month + '-01');
        const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        return `
            <div class="bg-white rounded-lg shadow p-4">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="font-semibold text-gray-900">${monthName}</h4>
                    <button onclick="kanbanBoard.currentMonth = '${month}'; kanbanBoard.loadMonthCards('${month}'); calendarView.closeModal()"
                            class="text-sm text-blue-600 hover:text-blue-800">
                        Ver detalhes
                    </button>
                </div>

                <div class="space-y-3">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-blue-600">Prospecção</span>
                        <span class="font-medium">${utils.formatCurrency(metrics.prospeccao.value)}</span>
                        <span class="text-gray-500">${metrics.prospeccao.count} cards</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-yellow-600">Negociação</span>
                        <span class="font-medium">${utils.formatCurrency(metrics.negociacao.value)}</span>
                        <span class="text-gray-500">${metrics.negociacao.count} cards</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-green-600">Fechamento</span>
                        <span class="font-medium">${utils.formatCurrency(metrics.fechamento.value)}</span>
                        <span class="text-gray-500">${metrics.fechamento.count} cards</span>
                    </div>
                    <div class="pt-2 border-t">
                        <div class="flex justify-between items-center font-semibold">
                            <span>Total</span>
                            <span>${utils.formatCurrency(metrics.total.value)}</span>
                        </div>
                        <div class="text-sm text-gray-500 text-right">
                            ${metrics.total.count} cards
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    calculateMetrics(cards) {
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

        return metrics;
    }

    closeModal() {
        const modal = document.getElementById('calendarModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }
}

// Create global calendar view instance
window.calendarView = new CalendarView();