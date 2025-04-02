const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// System configuration
let systemConfig = {
    logo: null,
    customFields: [],
    theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        accentColor: '#60A5FA'
    },
    companyName: 'Pipeline de Vendas'
};

// Notifications store
let notifications = [];

// Function to create a notification
const createNotification = (userId, title, message, type, data = null) => {
    const notification = {
        id: Date.now(),
        userId,
        title,
        message,
        type,
        data,
        read: false,
        createdAt: new Date().toISOString()
    };
    notifications.push(notification);
    return notification;
};

// Mock data stores
const agencies = [
    { 
        id: 1, 
        name: 'Agência Central',
        assignments: [],
        customFields: {}
    },
    { 
        id: 2, 
        name: 'Agência Norte',
        assignments: [],
        customFields: {}
    },
    { 
        id: 3, 
        name: 'Agência Sul',
        assignments: [],
        customFields: {}
    }
];

const products = [
    { 
        id: 1, 
        name: 'Seguro Auto',
        assignments: []
    },
    { 
        id: 2, 
        name: 'Seguro Residencial',
        assignments: []
    },
    { 
        id: 3, 
        name: 'Seguro Vida',
        assignments: []
    },
    { 
        id: 4, 
        name: 'Previdência Privada',
        assignments: []
    }
];

const users = [
    {
        id: 1,
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
    },
    {
        id: 2,
        name: 'Corretor',
        email: 'corretor@example.com',
        password: 'corretor123',
        role: 'corretor'
    },
    {
        id: 3,
        name: 'Angariador',
        email: 'angariador@example.com',
        password: 'angariador123',
        role: 'angariador'
    }
];

const cards = [
    {
        id: 1,
        clientName: 'João Silva',
        cpfCnpj: '123.456.789-00',
        agency: 1,
        product: 1,
        value: 1500.00,
        expectedDate: '2024-01',
        status: 'prospeccao',
        responsibleId: 1,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 2,
        clientName: 'Maria Oliveira',
        cpfCnpj: '987.654.321-00',
        agency: 2,
        product: 2,
        value: 2500.00,
        expectedDate: '2024-02',
        status: 'negociacao',
        responsibleId: 2,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 3,
        clientName: 'Carlos Pereira',
        cpfCnpj: '456.789.123-00',
        agency: 3,
        product: 3,
        value: 3500.00,
        expectedDate: '2024-03',
        status: 'fechamento',
        responsibleId: 3,
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Middleware to check user role
const checkRole = (roles) => {
    return (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1];
        const role = token?.split('-')[2];
        
        if (!token || !roles.includes(role)) {
            return res.status(403).json({ error: 'Acesso não autorizado' });
        }
        next();
    };
};

// Authentication routes
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        res.json({
            token: `mock-jwt-token-${user.id}-${user.role}`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// System configuration routes
app.get('/api/system/config', (req, res) => {
    res.json(systemConfig);
});

app.post('/api/system/config', checkRole(['admin']), (req, res) => {
    const { logo, customFields, theme } = req.body;
    
    if (logo !== undefined) systemConfig.logo = logo;
    if (customFields !== undefined) systemConfig.customFields = customFields;
    if (theme !== undefined) systemConfig.theme = { ...systemConfig.theme, ...theme };
    
    res.json(systemConfig);
});

// Get user's assigned agencies and products
app.get('/api/user/assignments', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('-')[1]);
    const role = token?.split('-')[2];

    if (role === 'admin') {
        res.json({
            agencies: agencies,
            products: products
        });
        return;
    }

    const assignedAgencies = agencies.filter(agency => 
        agency.assignments.includes(userId)
    );

    const assignedProducts = products.filter(product => 
        product.assignments.includes(userId)
    );

    res.json({
        agencies: assignedAgencies,
        products: assignedProducts
    });
});

// Agency routes
app.get('/api/agencies', (req, res) => {
    res.json(agencies);
});

app.post('/api/agencies', checkRole(['admin']), (req, res) => {
    const { name } = req.body;
    const newAgency = {
        id: agencies.length + 1,
        name,
        assignments: [],
        customFields: {}
    };
    agencies.push(newAgency);
    res.status(201).json(newAgency);
});

// Product routes
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Product management routes
app.post('/api/products', checkRole(['admin']), (req, res) => {
    const { name } = req.body;
    const newProduct = {
        id: products.length + 1,
        name,
        assignments: []
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', checkRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    const product = products.find(p => p.id === parseInt(id));
    if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    product.name = name;
    res.json(product);
});

app.delete('/api/products/:id', checkRole(['admin']), (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === parseInt(id));
    
    if (index === -1) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    products.splice(index, 1);
    res.json({ success: true });
});

// Agency management routes
app.put('/api/agencies/:id', checkRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    const agency = agencies.find(a => a.id === parseInt(id));
    if (!agency) {
        return res.status(404).json({ error: 'Agência não encontrada' });
    }
    
    agency.name = name;
    res.json(agency);
});

app.delete('/api/agencies/:id', checkRole(['admin']), (req, res) => {
    const { id } = req.params;
    const index = agencies.findIndex(a => a.id === parseInt(id));
    
    if (index === -1) {
        return res.status(404).json({ error: 'Agência não encontrada' });
    }
    
    agencies.splice(index, 1);
    res.json({ success: true });
});

// User management routes
app.get('/api/users', checkRole(['admin']), (req, res) => {
    // Return users without sensitive information
    const safeUsers = users.map(({ id, name, email, role }) => ({
        id,
        name,
        email,
        role
    }));
    res.json(safeUsers);
});

// Assignment routes
app.post('/api/agencies/:id/assign', checkRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { userIds } = req.body;
    
    const agency = agencies.find(a => a.id === parseInt(id));
    if (!agency) {
        return res.status(404).json({ error: 'Agência não encontrada' });
    }
    
    agency.assignments = [...new Set([...agency.assignments, ...userIds])];
    
    // Notify assigned users
    userIds.forEach(userId => {
        const notification = {
            id: Date.now(),
            userId,
            title: 'Nova Atribuição',
            message: `Você foi atribuído à agência ${agency.name}`,
            type: 'assignment',
            read: false,
            createdAt: new Date().toISOString()
        };
        // In a real application, save notification to database
        console.log('New notification:', notification);
    });
    
    res.json(agency);
});

app.post('/api/products/:id/assign', checkRole(['admin']), (req, res) => {
    const { id } = req.params;
    const { userIds } = req.body;
    
    const product = products.find(p => p.id === parseInt(id));
    if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    product.assignments = [...new Set([...product.assignments, ...userIds])];
    
    // Notify assigned users
    userIds.forEach(userId => {
        const notification = {
            id: Date.now(),
            userId,
            title: 'Nova Atribuição',
            message: `Você foi atribuído ao produto ${product.name}`,
            type: 'assignment',
            read: false,
            createdAt: new Date().toISOString()
        };
        // In a real application, save notification to database
        console.log('New notification:', notification);
    });
    
    res.json(product);
});

// Card routes
app.get('/api/cards', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const role = token?.split('-')[2];
    const userId = parseInt(token?.split('-')[1]);

    let filteredCards = [...cards];

    // Filter by user role and assignments
    if (role !== 'admin') {
        filteredCards = filteredCards.filter(card => {
            const agency = agencies.find(a => a.id === card.agency);
            const product = products.find(p => p.id === card.product);
            return (agency?.assignments?.includes(userId) || product?.assignments?.includes(userId));
        });
    }

    const populatedCards = filteredCards.map(card => ({
        ...card,
        agency: agencies.find(a => a.id === card.agency)?.name || 'Desconhecida',
        product: products.find(p => p.id === card.product)?.name || 'Desconhecido',
        responsible: users.find(u => u.id === card.responsibleId)?.name || 'Não atribuído'
    }));

    res.json(populatedCards);
});

app.get('/api/cards/month/:month', (req, res) => {
    const { month } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const role = token?.split('-')[2];
    const userId = parseInt(token?.split('-')[1]);

    let filteredCards = cards.filter(card => card.expectedDate.startsWith(month));

    if (role !== 'admin') {
        filteredCards = filteredCards.filter(card => {
            const agency = agencies.find(a => a.id === card.agency);
            const product = products.find(p => p.id === card.product);
            return (agency?.assignments?.includes(userId) || product?.assignments?.includes(userId));
        });
    }

    const populatedCards = filteredCards.map(card => ({
        ...card,
        agency: agencies.find(a => a.id === card.agency)?.name || 'Desconhecida',
        product: products.find(p => p.id === card.product)?.name || 'Desconhecido',
        responsible: users.find(u => u.id === card.responsibleId)?.name || 'Não atribuído'
    }));

    res.json(populatedCards);
});

app.post('/api/cards', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('-')[1]);

    const newCard = {
        id: cards.length + 1,
        ...req.body,
        responsibleId: userId,
        customFields: req.body.customFields || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    cards.push(newCard);
    res.status(201).json(newCard);
});

app.put('/api/cards/:id', (req, res) => {
    const { id } = req.params;
    const cardIndex = cards.findIndex(c => c.id === parseInt(id));
    
    if (cardIndex === -1) {
        return res.status(404).json({ error: 'Card não encontrado' });
    }

    cards[cardIndex] = {
        ...cards[cardIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };

    res.json(cards[cardIndex]);
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Notification routes
app.get('/api/notifications', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('-')[1]);
    
    const userNotifications = notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(userNotifications);
});

app.post('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === parseInt(id));
    
    if (notification) {
        notification.read = true;
        res.json(notification);
    } else {
        res.status(404).json({ error: 'Notificação não encontrada' });
    }
});

app.post('/api/notifications/read-all', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = parseInt(token?.split('-')[1]);
    
    notifications
        .filter(n => n.userId === userId)
        .forEach(n => n.read = true);
    
    res.json({ success: true });
});

// Start server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});