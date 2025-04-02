class ExportSystem {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Adicionar evento ao botão de exportação
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportModal());
        }
    }

    showExportModal() {
        const modalHTML = `
            <div id="exportModal" class="modal-backdrop">
                <div class="modal-content max-w-lg">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Exportar Dados</h3>
                        <button class="text-gray-400 hover:text-gray-500" onclick="exportSystem.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Formato</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="radio" name="format" value="excel" checked
                                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                                    <span class="ml-2 text-gray-700">Excel (.xlsx)</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="format" value="csv"
                                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                                    <span class="ml-2 text-gray-700">CSV</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="format" value="pdf"
                                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                                    <span class="ml-2 text-gray-700">PDF</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
                            <select id="reportType" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option value="summary">Resumo</option>
                                <option value="detailed">Detalhado</option>
                                <option value="forecast">Previsão</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Período</label>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs text-gray-500">De</label>
                                    <input type="month" id="startDate"
                                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-500">Até</label>
                                    <input type="month" id="endDate"
                                           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center mt-4">
                            <input type="checkbox" id="includeMetrics"
                                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                            <label class="ml-2 block text-sm text-gray-700">
                                Incluir métricas e gráficos
                            </label>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-3">
                        <button onclick="exportSystem.closeModal()"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Cancelar
                        </button>
                        <button onclick="exportSystem.generateExport()"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Exportar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Mostrar modal com animação
        const modal = document.getElementById('exportModal');
        setTimeout(() => modal.classList.add('show'), 10);

        // Configurar datas padrão
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);

        document.getElementById('startDate').value = startDate.toISOString().substring(0, 7);
        document.getElementById('endDate').value = endDate.toISOString().substring(0, 7);
    }

    closeModal() {
        const modal = document.getElementById('exportModal');
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    async generateExport() {
        const format = document.querySelector('input[name="format"]:checked').value;
        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const includeMetrics = document.getElementById('includeMetrics').checked;

        try {
            // Buscar dados filtrados atuais
            const response = await fetch('/api/cards', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const cards = await response.json();

            // Filtrar por período
            const filteredCards = cards.filter(card => {
                const cardDate = card.expectedDate;
                return cardDate >= startDate && cardDate <= endDate;
            });

            // Gerar relatório baseado no tipo selecionado
            const reportData = utils.generateReport(filteredCards, reportType);

            // Adicionar métricas se selecionado
            if (includeMetrics) {
                const metrics = utils.calculateMetrics(filteredCards);
                reportData.metrics = metrics;
            }

            // Exportar no formato selecionado
            switch (format) {
                case 'excel':
                    this.exportToExcel(reportData, reportType);
                    break;
                case 'csv':
                    this.exportToCSV(reportData, reportType);
                    break;
                case 'pdf':
                    this.exportToPDF(reportData, reportType);
                    break;
            }

            this.closeModal();
            showFeedback('Relatório gerado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            showFeedback('Erro ao gerar relatório. Tente novamente.', 'error');
        }
    }

    exportToExcel(data, reportType) {
        // Implementar exportação para Excel
        console.log('Exportando para Excel:', data);
        const filename = `pipeline-report-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Criar cabeçalhos
        const headers = [
            'Cliente',
            'CPF/CNPJ',
            'Agência',
            'Produto',
            'Responsável',
            'Valor',
            'Previsão',
            'Status',
            'Data de Criação',
            'Última Atualização'
        ];

        // Criar linhas de dados
        const rows = data.map(card => [
            card.clientName,
            card.cpfCnpj,
            card.agency,
            card.product,
            card.responsible,
            utils.formatCurrency(card.value),
            utils.formatDate(card.expectedDate),
            this.getStatusName(card.status),
            new Date(card.createdAt).toLocaleDateString('pt-BR'),
            new Date(card.updatedAt).toLocaleDateString('pt-BR')
        ]);

        // Combinar cabeçalhos e dados
        const excelData = [headers, ...rows];
        
        // TODO: Implementar geração real do arquivo Excel
        this.downloadFile(JSON.stringify(excelData), filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    exportToCSV(data, reportType) {
        // Converter dados para formato CSV
        let csv = '';
        
        // Adicionar cabeçalhos
        const headers = [
            'Cliente',
            'CPF/CNPJ',
            'Agência',
            'Produto',
            'Responsável',
            'Valor',
            'Previsão',
            'Status',
            'Data de Criação',
            'Última Atualização'
        ];
        csv += headers.join(',') + '\n';

        // Adicionar dados
        if (Array.isArray(data)) {
            data.forEach(card => {
                const row = [
                    `"${card.clientName}"`,
                    `"${card.cpfCnpj}"`,
                    `"${card.agency}"`,
                    `"${card.product}"`,
                    `"${card.responsible}"`,
                    card.value,
                    `"${card.expectedDate}"`,
                    `"${this.getStatusName(card.status)}"`,
                    `"${new Date(card.createdAt).toLocaleDateString('pt-BR')}"`,
                    `"${new Date(card.updatedAt).toLocaleDateString('pt-BR')}"`
                ];
                csv += row.join(',') + '\n';
            });
        }

        const filename = `pipeline-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
        this.downloadFile(csv, filename, 'text/csv');
    }

    getStatusName(status) {
        const statusNames = {
            prospeccao: 'Prospecção',
            negociacao: 'Negociação',
            fechamento: 'Fechamento'
        };
        return statusNames[status] || status;
    }

    exportToPDF(data, reportType) {
        // Criar conteúdo HTML para o PDF
        const title = `Relatório de Pipeline - ${new Date().toLocaleDateString('pt-BR')}`;
        const metrics = this.calculateMetrics(data);

        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .metrics { 
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        margin-bottom: 30px;
                    }
                    .metric-card {
                        padding: 15px;
                        border-radius: 8px;
                        background: #f8f9fa;
                    }
                    .metric-value { font-size: 1.5em; font-weight: bold; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        padding: 8px;
                        border: 1px solid #ddd;
                        text-align: left;
                    }
                    th { background: #f8f9fa; }
                    .status-prospeccao { color: #2563eb; }
                    .status-negociacao { color: #d97706; }
                    .status-fechamento { color: #059669; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${title}</h1>
                    <p>Tipo: ${reportType === 'summary' ? 'Resumo' : 'Detalhado'}</p>
                </div>

                <div class="metrics">
                    <div class="metric-card">
                        <h3>Prospecção</h3>
                        <div class="metric-value status-prospeccao">
                            ${utils.formatCurrency(metrics.prospeccao.value)}
                        </div>
                        <div>${metrics.prospeccao.count} oportunidades</div>
                    </div>
                    <div class="metric-card">
                        <h3>Negociação</h3>
                        <div class="metric-value status-negociacao">
                            ${utils.formatCurrency(metrics.negociacao.value)}
                        </div>
                        <div>${metrics.negociacao.count} oportunidades</div>
                    </div>
                    <div class="metric-card">
                        <h3>Fechamento</h3>
                        <div class="metric-value status-fechamento">
                            ${utils.formatCurrency(metrics.fechamento.value)}
                        </div>
                        <div>${metrics.fechamento.count} oportunidades</div>
                    </div>
                    <div class="metric-card">
                        <h3>Total</h3>
                        <div class="metric-value">
                            ${utils.formatCurrency(metrics.total.value)}
                        </div>
                        <div>${metrics.total.count} oportunidades</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>CPF/CNPJ</th>
                            <th>Agência</th>
                            <th>Produto</th>
                            <th>Responsável</th>
                            <th>Valor</th>
                            <th>Previsão</th>
                            <th>Status</th>
                            <th>Criado em</th>
                            <th>Atualizado em</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(card => `
                            <tr>
                                <td>${card.clientName}</td>
                                <td>${card.cpfCnpj}</td>
                                <td>${card.agency}</td>
                                <td>${card.product}</td>
                                <td>${card.responsible}</td>
                                <td>${utils.formatCurrency(card.value)}</td>
                                <td>${utils.formatDate(card.expectedDate)}</td>
                                <td class="status-${card.status}">${this.getStatusName(card.status)}</td>
                                <td>${new Date(card.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td>${new Date(card.updatedAt).toLocaleDateString('pt-BR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        // Converter HTML para PDF (usando biblioteca de terceiros ou API do navegador)
        const filename = `pipeline-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        // TODO: Implementar conversão real para PDF
        // Por enquanto, baixar como HTML
        this.downloadFile(html, filename.replace('.pdf', '.html'), 'text/html');
    }

    calculateMetrics(data) {
        const metrics = {
            prospeccao: { count: 0, value: 0 },
            negociacao: { count: 0, value: 0 },
            fechamento: { count: 0, value: 0 },
            total: { count: 0, value: 0 }
        };

        data.forEach(card => {
            metrics[card.status].count++;
            metrics[card.status].value += parseFloat(card.value);
            metrics.total.count++;
            metrics.total.value += parseFloat(card.value);
        });

        return metrics;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

// Criar instância global do sistema de exportação
window.exportSystem = new ExportSystem();