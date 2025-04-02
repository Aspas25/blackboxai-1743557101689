class AnalyticsSystem {
    constructor() {
        this.charts = {};
        this.currentData = null;
        this.initialize();
    }

    async initialize() {
        // Setup event listeners
        document.getElementById('dateRange').addEventListener('change', () => this.loadData());
        document.getElementById('groupBy').addEventListener('change', () => this.updateCharts());
        document.getElementById('refreshData').addEventListener('click', () => this.loadData());

        // Initial data load
        await this.loadData();
    }

    async loadData() {
        try {
            const months = parseInt(document.getElementById('dateRange').value);
            const dates = this.generateDateRange(months);
            
            console.log('Loading data for dates:', dates);
            
            // Load data for each month
            const data = await Promise.all(dates.map(async date => {
                const response = await fetch(`/api/cards/month/${date}`);
                if (!response.ok) throw new Error('Failed to load data');
                const cards = await response.json();
                console.log(`Data for ${date}:`, cards);
                return { date, cards };
            }));

            this.currentData = data;
            this.updateCharts();
            this.updateMetrics();

        } catch (error) {
            console.error('Error loading analytics data:', error);
            document.querySelector('.error-message').textContent = 'Erro ao carregar dados';
        }
    }

    generateDateRange(months) {
        const dates = [];
        const today = new Date(2024, 2, 1); // Fixed date for testing: March 2024
        
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            dates.push(date.toISOString().substring(0, 7));
        }
        
        return dates;
    }

    updateMetrics() {
        if (!this.currentData) return;

        // Calculate total metrics
        const totalMetrics = {
            count: 0,
            value: 0,
            prospeccao: { count: 0, value: 0 },
            negociacao: { count: 0, value: 0 },
            fechamento: { count: 0, value: 0 }
        };

        this.currentData.forEach(({ cards }) => {
            cards.forEach(card => {
                totalMetrics.count++;
                totalMetrics.value += parseFloat(card.value);
                totalMetrics[card.status].count++;
                totalMetrics[card.status].value += parseFloat(card.value);
            });
        });

        // Calculate monthly average
        const monthCount = this.currentData.length;
        const averageValue = totalMetrics.value / monthCount;
        const averageCount = totalMetrics.count / monthCount;

        // Calculate growth
        const halfPoint = Math.floor(monthCount / 2);
        const firstHalf = this.currentData.slice(0, halfPoint);
        const secondHalf = this.currentData.slice(halfPoint);

        const firstHalfValue = firstHalf.reduce((sum, { cards }) => 
            sum + cards.reduce((total, card) => total + parseFloat(card.value), 0), 0);
        const secondHalfValue = secondHalf.reduce((sum, { cards }) => 
            sum + cards.reduce((total, card) => total + parseFloat(card.value), 0), 0);

        const growth = firstHalfValue ? ((secondHalfValue - firstHalfValue) / firstHalfValue) * 100 : 0;

        // Calculate conversion rate
        const conversionRate = totalMetrics.prospeccao.count ? 
            (totalMetrics.fechamento.count / totalMetrics.prospeccao.count) * 100 : 0;

        // Update UI
        document.getElementById('total-metrics').innerHTML = `
            <p class="text-3xl font-bold text-gray-900">R$ ${totalMetrics.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p class="text-sm text-gray-600">${totalMetrics.count} oportunidades</p>
        `;

        document.getElementById('average-metrics').innerHTML = `
            <p class="text-3xl font-bold text-blue-600">R$ ${averageValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p class="text-sm text-gray-600">${Math.round(averageCount)} oportunidades/mês</p>
        `;

        document.getElementById('growth-metrics').innerHTML = `
            <p class="text-3xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%
            </p>
            <p class="text-sm text-gray-600">vs período anterior</p>
        `;

        document.getElementById('conversion-metrics').innerHTML = `
            <p class="text-3xl font-bold text-yellow-600">${conversionRate.toFixed(1)}%</p>
            <p class="text-sm text-gray-600">prospecção → fechamento</p>
        `;
    }

    updateCharts() {
        if (!this.currentData) return;

        const groupBy = document.getElementById('groupBy').value;
        
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => chart.destroy());
        
        // Create new charts
        this.createEvolutionChart(groupBy);
        this.createDistributionChart(groupBy);
        this.updateDetailsTable(groupBy);
    }

    createEvolutionChart(groupBy) {
        const canvas = document.getElementById('evolutionChart');
        const ctx = canvas.getContext('2d');

        // Prepare data based on grouping
        const datasets = this.prepareEvolutionData(groupBy);

        this.charts.evolution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.currentData.map(d => {
                    const [year, month] = d.date.split('-');
                    return `${month}/${year}`;
                }),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }
                    }
                }
            }
        });
    }

    createDistributionChart(groupBy) {
        const canvas = document.getElementById('distributionChart');
        const ctx = canvas.getContext('2d');

        // Prepare data based on grouping
        const { labels, data } = this.prepareDistributionData(groupBy);

        this.charts.distribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#3B82F6', // blue
                        '#F59E0B', // yellow
                        '#10B981', // green
                        '#6B7280', // gray
                        '#EC4899', // pink
                        '#8B5CF6'  // purple
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    prepareEvolutionData(groupBy) {
        const datasets = [];
        const groupedData = new Map();

        // Group data by selected criteria
        this.currentData.forEach(({ date, cards }) => {
            cards.forEach(card => {
                const key = this.getGroupKey(card, groupBy);
                if (!groupedData.has(key)) {
                    groupedData.set(key, new Array(this.currentData.length).fill(0));
                }
                const monthIndex = this.currentData.findIndex(d => d.date === date);
                groupedData.get(key)[monthIndex] += parseFloat(card.value);
            });
        });

        // Convert to Chart.js format
        groupedData.forEach((values, key) => {
            datasets.push({
                label: key,
                data: values,
                borderColor: this.getRandomColor(),
                fill: false
            });
        });

        return datasets;
    }

    prepareDistributionData(groupBy) {
        const distribution = new Map();
        let total = 0;

        // Calculate totals for each group
        this.currentData.forEach(({ cards }) => {
            cards.forEach(card => {
                const key = this.getGroupKey(card, groupBy);
                const value = parseFloat(card.value);
                distribution.set(key, (distribution.get(key) || 0) + value);
                total += value;
            });
        });

        // Convert to arrays for Chart.js
        const labels = Array.from(distribution.keys());
        const data = Array.from(distribution.values());

        return { labels, data };
    }

    getGroupKey(card, groupBy) {
        switch (groupBy) {
            case 'product':
                return card.product;
            case 'agency':
                return card.agency;
            case 'user':
                return card.responsible;
            default:
                return 'Unknown';
        }
    }

    updateDetailsTable(groupBy) {
        const tableBody = document.getElementById('detailsTable');
        const groups = new Map();

        // Aggregate data by group
        this.currentData.forEach(({ cards }) => {
            cards.forEach(card => {
                const key = this.getGroupKey(card, groupBy);
                if (!groups.has(key)) {
                    groups.set(key, {
                        name: key,
                        prospeccao: { count: 0, value: 0 },
                        negociacao: { count: 0, value: 0 },
                        fechamento: { count: 0, value: 0 }
                    });
                }

                const group = groups.get(key);
                group[card.status].count++;
                group[card.status].value += parseFloat(card.value);
            });
        });

        // Generate table rows
        tableBody.innerHTML = Array.from(groups.values()).map(group => {
            const total = group.prospeccao.value + group.negociacao.value + group.fechamento.value;
            const conversionRate = group.prospeccao.count ? 
                (group.fechamento.count / group.prospeccao.count * 100).toFixed(1) : '0.0';

            return `
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${group.name}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ ${group.prospeccao.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <span class="text-xs text-gray-400">(${group.prospeccao.count})</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ ${group.negociacao.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <span class="text-xs text-gray-400">(${group.negociacao.count})</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        R$ ${group.fechamento.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <span class="text-xs text-gray-400">(${group.fechamento.count})</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${conversionRate}%
                    </td>
                </tr>
            `;
        }).join('');
    }

    getRandomColor() {
        const colors = [
            '#3B82F6', // blue
            '#F59E0B', // yellow
            '#10B981', // green
            '#6B7280', // gray
            '#EC4899', // pink
            '#8B5CF6'  // purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Create global analytics instance
window.analyticsSystem = new AnalyticsSystem();