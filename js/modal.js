class CardModal {
    constructor() {
        // Initialize modal when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.customFields = JSON.parse(localStorage.getItem('customFields') || '[]');
        
        // Create modal HTML
        const modalHTML = 
            '<div id="cardModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">' +
                '<div class="min-h-screen px-4 text-center">' +
                    '<div class="fixed inset-0 transition-opacity" aria-hidden="true">' +
                        '<div class="absolute inset-0 bg-gray-500 opacity-75"></div>' +
                    '</div>' +
                    '<span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>' +
                    '<div class="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">' +
                        '<div class="flex justify-between items-center mb-4">' +
                            '<h3 class="text-lg font-semibold text-gray-900" id="modalTitle">Adicionar Card</h3>' +
                            '<button type="button" class="text-gray-400 hover:text-gray-500" onclick="cardModal.close()">' +
                                '<i class="fas fa-times"></i>' +
                            '</button>' +
                        '</div>' +
                        '<form id="cardForm" class="space-y-4">' +
                            '<input type="hidden" id="cardId" name="cardId">' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700">Nome do Cliente</label>' +
                                '<input type="text" id="clientName" name="clientName" required ' +
                                       'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700">CPF/CNPJ</label>' +
                                '<input type="text" id="cpfCnpj" name="cpfCnpj" required ' +
                                       'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" ' +
                                       'onkeyup="this.value = utils.formatDocument(this.value)">' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700">Agência</label>' +
                                '<select id="agency" name="agency" required ' +
                                        'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">' +
                                    '<option value="">Selecione uma agência</option>' +
                                '</select>' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700">Produto</label>' +
                                '<select id="product" name="product" required ' +
                                        'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">' +
                                    '<option value="">Selecione um produto</option>' +
                                '</select>' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700">Valor</label>' +
                                '<div class="relative mt-1 rounded-md shadow-sm">' +
                                    '<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">' +
                                        '<span class="text-gray-500 sm:text-sm">R$</span>' +
                                    '</div>' +
                                    '<input type="number" id="value" name="value" required step="0.01" min="0" ' +
                                           'class="pl-12 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">' +
                                '</div>' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700">Previsão de Débito</label>' +
                                '<input type="month" id="expectedDate" name="expectedDate" required ' +
                                       'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">' +
                            '</div>' +
                            '<div>' +
                                '<label class="block text-sm font-medium text-gray-700">Status</label>' +
                                '<select id="status" name="status" required ' +
                                        'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">' +
                                    '<option value="prospeccao">Prospecção</option>' +
                                    '<option value="negociacao">Negociação</option>' +
                                    '<option value="fechamento">Fechamento</option>' +
                                '</select>' +
                            '</div>' +
                            '<div id="cardCustomFields">' + this.renderCustomFields() + '</div>' +
                            '<div class="mt-6 flex justify-end space-x-3">' +
                                '<button type="button" onclick="cardModal.close()" ' +
                                        'class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">' +
                                    'Cancelar' +
                                '</button>' +
                                '<button type="submit" ' +
                                        'class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">' +
                                    'Salvar' +
                                '</button>' +
                            '</div>' +
                        '</form>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // Add modal to body if it doesn't exist
        if (!document.getElementById('cardModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Setup event listeners
        this.setupEventListeners();
        this.loadFormOptions();
    }

    setupEventListeners() {
        const form = document.getElementById('cardForm');
        const modal = document.getElementById('cardModal');

        // Handle form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(e);
        });

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    async loadFormOptions() {
        try {
            // Load agencies and products in parallel
            const [agenciesResponse, productsResponse] = await Promise.all([
                fetch('/api/agencies', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }),
                fetch('/api/products', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
            ]);

            if (!agenciesResponse.ok || !productsResponse.ok) {
                throw new Error('Failed to load options');
            }

            const agencies = await agenciesResponse.json();
            const products = await productsResponse.json();

            // Update dropdowns
            const agencySelect = document.getElementById('agency');
            const productSelect = document.getElementById('product');

            if (agencySelect && productSelect) {
                this.populateSelect('agency', agencies);
                this.populateSelect('product', products);
            } else {
                console.error('Select elements not found');
            }
        } catch (error) {
            console.error('Error loading form options:', error);
            utils.showFeedback('Erro ao carregar opções do formulário', 'error');
        }
    }

    populateSelect(selectId, items) {
        const select = document.getElementById(selectId);
        const defaultOption = select.querySelector('option');
        select.innerHTML = '';
        select.appendChild(defaultOption);

        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            select.appendChild(option);
        });
    }

    open(card = null) {
        const modal = document.getElementById('cardModal');
        const form = document.getElementById('cardForm');
        const modalTitle = document.getElementById('modalTitle');

        // Reset form
        form.reset();

        if (card) {
            // Editing existing card
            modalTitle.textContent = 'Editar Card';
            document.getElementById('cardId').value = card.id;
            document.getElementById('clientName').value = card.clientName;
            document.getElementById('cpfCnpj').value = card.cpfCnpj;
            document.getElementById('agency').value = card.agency;
            document.getElementById('product').value = card.product;
            document.getElementById('value').value = card.value;
            document.getElementById('expectedDate').value = card.expectedDate;
            document.getElementById('status').value = card.status;
        } else {
            // Creating new card
            modalTitle.textContent = 'Adicionar Card';
            document.getElementById('cardId').value = '';
            document.getElementById('status').value = 'prospeccao';
            document.getElementById('expectedDate').value = new Date().toISOString().substring(0, 7); // YYYY-MM
        }

        // Show modal
        modal.classList.remove('hidden');
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('clientName').focus();
        }, 100);
    }

    close() {
        const modal = document.getElementById('cardModal');
        modal.classList.add('hidden');
    }

    renderCustomFields() {
        return this.customFields.map(field => 
            '<div class="mt-4">' +
                '<label class="block text-sm font-medium text-gray-700">' + field.name + '</label>' +
                this.renderCustomFieldInput(field) +
            '</div>'
        ).join('');
    }

    renderCustomFieldInput(field) {
        switch (field.type) {
            case 'text':
                return '<input type="text" name="custom_' + field.name + '" ' +
                       'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">';
            case 'number':
                return '<input type="number" name="custom_' + field.name + '" ' +
                       'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">';
            case 'date':
                return '<input type="date" name="custom_' + field.name + '" ' +
                       'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">';
            default:
                return '<input type="text" name="custom_' + field.name + '" ' +
                       'class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">';
        }
    }

    updateCustomFields(fields) {
        this.customFields = fields;
        const container = document.getElementById('cardCustomFields');
        if (container) {
            container.innerHTML = this.renderCustomFields();
        }
    }

    async handleSubmit(e) {
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            const isEditing = !!data.cardId;

            // Add custom fields to data
            const customData = {};
            this.customFields.forEach(field => {
                const value = formData.get(`custom_${field.name}`);
                if (value) {
                    customData[field.name] = value;
                }
            });
            data.customFields = customData;

            const endpoint = isEditing ? `/api/cards/${data.cardId}` : '/api/cards';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...data,
                    value: parseFloat(data.value),
                    agency: parseInt(data.agency),
                    product: parseInt(data.product)
                })
            });

            if (!response.ok) {
                throw new Error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} card`);
            }

            const result = await response.json();
            utils.showFeedback(`Card ${isEditing ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            this.close();

            // Dispatch update event
            window.dispatchEvent(new CustomEvent('cardUpdated', { detail: result }));
        } catch (error) {
            console.error('Error saving card:', error);
            utils.showFeedback(`Erro ao ${isEditing ? 'atualizar' : 'criar'} card`, 'error');
        }
    }
}

// Create global modal instance
window.cardModal = new CardModal();