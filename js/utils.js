const utils = {
    // Format currency values
    formatCurrency: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    },

    // Format CPF/CNPJ
    formatDocument: (doc) => {
        // Remove non-numeric characters
        doc = doc.replace(/\D/g, '');
        
        // Format as CPF if length <= 11
        if (doc.length <= 11) {
            return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g, '$1.$2.$3-$4');
        }
        
        // Format as CNPJ if length > 11
        return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g, '$1.$2.$3/$4-$5');
    },

    // Format date (YYYY-MM to Month/Year)
    formatDate: (dateString) => {
        const [year, month] = dateString.split('-');
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${monthNames[parseInt(month) - 1]}/${year}`;
    },

    // Calculate metrics for cards
    calculateMetrics: (cards) => {
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
    },

    // Show feedback message
    showFeedback: (message, type = 'success') => {
        const feedbackDiv = document.createElement('div');
        feedbackDiv.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } transition-opacity duration-300`;
        feedbackDiv.textContent = message;

        document.body.appendChild(feedbackDiv);

        // Fade in
        setTimeout(() => {
            feedbackDiv.style.opacity = '1';
        }, 10);

        // Fade out and remove
        setTimeout(() => {
            feedbackDiv.style.opacity = '0';
            setTimeout(() => feedbackDiv.remove(), 300);
        }, 3000);
    },

    // Generate report from cards data
    generateReport: (cards, type = 'summary') => {
        const metrics = utils.calculateMetrics(cards);
        
        let report = {
            date: new Date().toLocaleDateString('pt-BR'),
            metrics: metrics,
            cards: type === 'detailed' ? cards : undefined
        };

        return report;
    }
};

// Export utils for use in other files
window.utils = utils;