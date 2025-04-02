const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Mock data for cards
const cards = [
    {
        id: 1,
        clientName: 'João Silva',
        cpfCnpj: '123.456.789-00',
        agency: 'Agência Central',
        product: 'Seguro Auto',
        value: 1500.00,
        expectedDate: '2024-01',
        status: 'prospeccao',
        responsibleId: 1,
        responsible: 'Admin',
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 2,
        clientName: 'Maria Oliveira',
        cpfCnpj: '987.654.321-00',
        agency: 'Agência Norte',
        product: 'Seguro Residencial',
        value: 2500.00,
        expectedDate: '2024-02',
        status: 'negociacao',
        responsibleId: 2,
        responsible: 'Corretor',
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 3,
        clientName: 'Carlos Pereira',
        cpfCnpj: '456.789.123-00',
        agency: 'Agência Sul',
        product: 'Seguro Vida',
        value: 3500.00,
        expectedDate: '2024-03',
        status: 'fechamento',
        responsibleId: 3,
        responsible: 'Angariador',
        customFields: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Card routes without authentication
app.get('/api/cards', (req, res) => {
    console.log('Returning all cards:', cards);
    res.json(cards);
});

app.get('/api/cards/month/:month', (req, res) => {
    const { month } = req.params;
    console.log('Fetching cards for month:', month);
    
    const monthlyCards = cards.filter(card => card.expectedDate.startsWith(month));
    console.log('Filtered cards:', monthlyCards);
    
    res.json(monthlyCards);
});

// Start server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});