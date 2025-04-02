// Admin System Module
const AdminSystem = (() => {
    let instance;
    let agencies = [];
    let products = [];

    function initialize() {
        const user = auth.getCurrentUser();
        if (user?.role === 'admin') {
            loadData();
            addAdminControls();
        }
    }

    async function loadData() {
        try {
            // Load agencies
            const agenciesResponse = await fetch('/api/agencies', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            agencies = await agenciesResponse.json();

            // Load products
            const productsResponse = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            products = await productsResponse.json();
        } catch (error) {
            console.error('Error loading admin data:', error);
            utils.showFeedback('Erro ao carregar dados administrativos', 'error');
        }
    }

    function addAdminControls() {
        const header = document.querySelector('header .flex.justify-between.items-center');
        const adminControls = document.createElement('div');
        adminControls.className = 'flex items-center space-x-4';
        adminControls.innerHTML = `
            <button class="text-gray-600 hover:text-gray-800" onclick="adminSystem.showAgenciesModal()">
                <i class="fas fa-building text-xl"></i>
            </button>
            <button class="text-gray-600 hover:text-gray-800" onclick="adminSystem.showProductsModal()">
                <i class="fas fa-box text-xl"></i>
            </button>
            <button class="text-gray-600 hover:text-gray-800" onclick="adminSystem.showAdminModal()">
                <i class="fas fa-cog text-xl"></i>
            </button>
        `;
        header.querySelector('.flex.items-center').appendChild(adminControls);
    }

    function showAgenciesModal() {
        const modalHTML = `
            <div id="agenciesModal" class="modal-backdrop show">
                <div class="modal-content max-w-4xl">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Gerenciar Agências</h3>
                        <button class="text-gray-400 hover:text-gray-500" onclick="adminSystem.closeModal('agenciesModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <button onclick="adminSystem.showAddAgencyForm()"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Nova Agência
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuários Atribuídos</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200" id="agenciesTableBody">
                                ${renderAgenciesTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function renderAgenciesTable() {
        return agencies.map(agency => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${agency.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">
                        ${agency.assignments.length} usuários
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="adminSystem.editAgency(${agency.id})" 
                            class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminSystem.assignUsers(${agency.id}, 'agency')" 
                            class="text-green-600 hover:text-green-900 mr-3">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button onclick="adminSystem.deleteAgency(${agency.id})" 
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function showAddAgencyForm() {
        const formHTML = `
            <div id="agencyForm" class="mt-4 p-4 bg-gray-50 rounded-lg">
                <form onsubmit="return adminSystem.handleAgencySubmit(event)">
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nome da Agência</label>
                            <input type="text" name="agencyName" required
                                   class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" onclick="adminSystem.cancelAgencyForm()"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                                Salvar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;

        const container = document.querySelector('#agenciesModal .modal-content');
        container.insertAdjacentHTML('beforeend', formHTML);
    }

    async function handleAgencySubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const agencyName = formData.get('agencyName');

        try {
            const response = await fetch('/api/agencies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: agencyName })
            });

            if (!response.ok) {
                throw new Error('Erro ao criar agência');
            }

            const newAgency = await response.json();
            agencies.push(newAgency);
            
            // Update table
            document.getElementById('agenciesTableBody').innerHTML = renderAgenciesTable();
            
            // Remove form
            document.getElementById('agencyForm').remove();
            
            utils.showFeedback('Agência criada com sucesso!', 'success');
        } catch (error) {
            console.error('Error creating agency:', error);
            utils.showFeedback('Erro ao criar agência', 'error');
        }
    }

    async function editAgency(agencyId) {
        const agency = agencies.find(a => a.id === agencyId);
        if (!agency) return;

        const formHTML = `
            <div id="agencyForm" class="mt-4 p-4 bg-gray-50 rounded-lg">
                <form onsubmit="return adminSystem.handleAgencyEdit(event, ${agencyId})">
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nome da Agência</label>
                            <input type="text" name="agencyName" required value="${agency.name}"
                                   class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" onclick="adminSystem.cancelAgencyForm()"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                                Atualizar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;

        const container = document.querySelector('#agenciesModal .modal-content');
        container.insertAdjacentHTML('beforeend', formHTML);
    }

    async function handleAgencyEdit(event, agencyId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const agencyName = formData.get('agencyName');

        try {
            const response = await fetch(`/api/agencies/${agencyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: agencyName })
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar agência');
            }

            const updatedAgency = await response.json();
            const index = agencies.findIndex(a => a.id === agencyId);
            agencies[index] = updatedAgency;
            
            // Update table
            document.getElementById('agenciesTableBody').innerHTML = renderAgenciesTable();
            
            // Remove form
            document.getElementById('agencyForm').remove();
            
            utils.showFeedback('Agência atualizada com sucesso!', 'success');
        } catch (error) {
            console.error('Error updating agency:', error);
            utils.showFeedback('Erro ao atualizar agência', 'error');
        }
    }

    async function deleteAgency(agencyId) {
        if (!confirm('Tem certeza que deseja excluir esta agência?')) return;

        try {
            const response = await fetch(`/api/agencies/${agencyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir agência');
            }

            agencies = agencies.filter(a => a.id !== agencyId);
            document.getElementById('agenciesTableBody').innerHTML = renderAgenciesTable();
            
            utils.showFeedback('Agência excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Error deleting agency:', error);
            utils.showFeedback('Erro ao excluir agência', 'error');
        }
    }

    function cancelAgencyForm() {
        const form = document.getElementById('agencyForm');
        if (form) form.remove();
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    async function assignUsers(entityId, type) {
        try {
            const usersResponse = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const users = await usersResponse.json();

            const entity = type === 'agency' 
                ? agencies.find(a => a.id === entityId)
                : products.find(p => p.id === entityId);

            const modalHTML = `
                <div id="assignUsersModal" class="modal-backdrop show">
                    <div class="modal-content max-w-lg">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">
                                Atribuir Usuários - ${entity.name}
                            </h3>
                            <button class="text-gray-400 hover:text-gray-500" 
                                    onclick="adminSystem.closeModal('assignUsersModal')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <div class="space-y-4">
                            ${users.map(user => `
                                <label class="flex items-center space-x-3">
                                    <input type="checkbox" 
                                           value="${user.id}"
                                           ${entity.assignments.includes(user.id) ? 'checked' : ''}
                                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <span class="text-sm font-medium text-gray-700">
                                        ${user.name} (${user.role})
                                    </span>
                                </label>
                            `).join('')}
                        </div>

                        <div class="mt-6 flex justify-end space-x-3">
                            <button onclick="adminSystem.closeModal('assignUsersModal')"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onclick="adminSystem.saveAssignments(${entityId}, '${type}')"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
        } catch (error) {
            console.error('Error loading users:', error);
            utils.showFeedback('Erro ao carregar usuários', 'error');
        }
    }

    async function saveAssignments(entityId, type) {
        const selectedUsers = Array.from(document.querySelectorAll('#assignUsersModal input[type="checkbox"]:checked'))
            .map(cb => parseInt(cb.value));

        try {
            const response = await fetch(`/api/${type}s/${entityId}/assign`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userIds: selectedUsers })
            });

            if (!response.ok) {
                throw new Error(`Erro ao atribuir usuários à ${type}`);
            }

            const updatedEntity = await response.json();
            
            // Update local data
            if (type === 'agency') {
                const index = agencies.findIndex(a => a.id === entityId);
                agencies[index] = updatedEntity;
                document.getElementById('agenciesTableBody').innerHTML = renderAgenciesTable();
            } else {
                const index = products.findIndex(p => p.id === entityId);
                products[index] = updatedEntity;
                document.getElementById('productsTableBody').innerHTML = renderProductsTable();
            }

            closeModal('assignUsersModal');
            utils.showFeedback('Atribuições atualizadas com sucesso!', 'success');
        } catch (error) {
            console.error('Error saving assignments:', error);
            utils.showFeedback('Erro ao salvar atribuições', 'error');
        }
    }

    function showProductsModal() {
        const modalHTML = `
            <div id="productsModal" class="modal-backdrop show">
                <div class="modal-content max-w-4xl">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Gerenciar Produtos</h3>
                        <button class="text-gray-400 hover:text-gray-500" onclick="adminSystem.closeModal('productsModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <button onclick="adminSystem.showAddProductForm()"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Novo Produto
                        </button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuários Atribuídos</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200" id="productsTableBody">
                                ${renderProductsTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function renderProductsTable() {
        return products.map(product => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${product.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">
                        ${product.assignments.length} usuários
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="adminSystem.editProduct(${product.id})" 
                            class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminSystem.assignUsers(${product.id}, 'product')" 
                            class="text-green-600 hover:text-green-900 mr-3">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button onclick="adminSystem.deleteProduct(${product.id})" 
                            class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function showAddProductForm() {
        const formHTML = `
            <div id="productForm" class="mt-4 p-4 bg-gray-50 rounded-lg">
                <form onsubmit="return adminSystem.handleProductSubmit(event)">
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nome do Produto</label>
                            <input type="text" name="productName" required
                                   class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" onclick="adminSystem.cancelProductForm()"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                                Salvar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;

        const container = document.querySelector('#productsModal .modal-content');
        container.insertAdjacentHTML('beforeend', formHTML);
    }

    async function handleProductSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const productName = formData.get('productName');

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: productName })
            });

            if (!response.ok) {
                throw new Error('Erro ao criar produto');
            }

            const newProduct = await response.json();
            products.push(newProduct);
            
            // Update table
            document.getElementById('productsTableBody').innerHTML = renderProductsTable();
            
            // Remove form
            document.getElementById('productForm').remove();
            
            utils.showFeedback('Produto criado com sucesso!', 'success');
        } catch (error) {
            console.error('Error creating product:', error);
            utils.showFeedback('Erro ao criar produto', 'error');
        }
    }

    async function editProduct(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const formHTML = `
            <div id="productForm" class="mt-4 p-4 bg-gray-50 rounded-lg">
                <form onsubmit="return adminSystem.handleProductEdit(event, ${productId})">
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Nome do Produto</label>
                            <input type="text" name="productName" required value="${product.name}"
                                   class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" onclick="adminSystem.cancelProductForm()"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                                Atualizar
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        `;

        const container = document.querySelector('#productsModal .modal-content');
        container.insertAdjacentHTML('beforeend', formHTML);
    }

    async function handleProductEdit(event, productId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const productName = formData.get('productName');

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: productName })
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar produto');
            }

            const updatedProduct = await response.json();
            const index = products.findIndex(p => p.id === productId);
            products[index] = updatedProduct;
            
            // Update table
            document.getElementById('productsTableBody').innerHTML = renderProductsTable();
            
            // Remove form
            document.getElementById('productForm').remove();
            
            utils.showFeedback('Produto atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Error updating product:', error);
            utils.showFeedback('Erro ao atualizar produto', 'error');
        }
    }

    async function deleteProduct(productId) {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir produto');
            }

            products = products.filter(p => p.id !== productId);
            document.getElementById('productsTableBody').innerHTML = renderProductsTable();
            
            utils.showFeedback('Produto excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            utils.showFeedback('Erro ao excluir produto', 'error');
        }
    }

    function cancelProductForm() {
        const form = document.getElementById('productForm');
        if (form) form.remove();
    }

    function showAdminModal() {
        const modalHTML = `
            <div id="adminModal" class="modal-backdrop show">
                <div class="min-h-screen px-4 text-center">
                    <div class="fixed inset-0 transition-opacity" aria-hidden="true">
                        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>
                    <span class="inline-block h-screen align-middle">&#8203;</span>
                    <div class="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-900">Configurações do Sistema</h3>
                            <button class="text-gray-400 hover:text-gray-500" onclick="adminSystem.closeModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <!-- Logo Upload -->
                        <div class="mb-6">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">Logo da Empresa</h4>
                            <div class="flex items-center space-x-4">
                                <img id="currentLogo" src="${localStorage.getItem('companyLogo') || '/default-logo.png'}" 
                                     class="h-12 object-contain" alt="Logo">
                                <label class="cursor-pointer px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                                    <span>Alterar Logo</span>
                                    <input type="file" id="logoUpload" accept="image/*" class="hidden" 
                                           onchange="adminSystem.handleLogoUpload(event)">
                                </label>
                            </div>
                        </div>

                        <!-- Custom Fields -->
                        <div class="mb-6">
                            <h4 class="text-sm font-medium text-gray-700 mb-2">Campos Personalizados</h4>
                            <div id="customFields" class="space-y-2">
                                <!-- Custom fields will be inserted here -->
                            </div>
                            <button onclick="adminSystem.addCustomField()"
                                    class="mt-2 text-sm text-blue-600 hover:text-blue-800">
                                <i class="fas fa-plus mr-1"></i> Adicionar Campo
                            </button>
                        </div>

                        <div class="mt-6 flex justify-end space-x-3">
                            <button onclick="adminSystem.closeModal()"
                                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onclick="adminSystem.saveSettings()"
                                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700">
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        loadCustomFields();
    }

    function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('currentLogo').src = e.target.result;
                localStorage.setItem('companyLogo', e.target.result);
                // Update logo in header
                const headerLogo = document.querySelector('header h
