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

// Card routes
app.get('/api/cards', (req, res) => {
    console.log('Returning cards:', cards); // Add logging
    res.json(cards);
});

// Start server
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});