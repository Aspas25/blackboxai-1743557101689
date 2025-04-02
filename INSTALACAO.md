# Instalação do App no Wix

## Pré-requisitos
- Conta Wix com permissões de desenvolvedor
- Acesso ao Wix Developer Center
- Node.js (versão 14 ou superior) instalado localmente

## Passos para Instalação

### 1. Preparação do Ambiente Wix

1. Acesse o [Wix Developer Center](https://dev.wix.com/)
2. Clique em "Create New Application"
3. Preencha as informações básicas do app:
   - Nome do App
   - Descrição
   - Categoria
   - URL do site de suporte

### 2. Configuração do App

1. Na seção "App Settings":
   - Configure as permissões necessárias:
     - Analytics.Read
     - Analytics.Write
     - Dashboard.Access
   - Defina as URLs de redirecionamento OAuth
   - Configure os webhooks necessários

2. Obtenha as credenciais do app:
   - App ID
   - App Secret Key
   - Guarde estas informações em local seguro

### 3. Integração com o Pipeline Analytics

1. Configure as variáveis de ambiente no painel do Wix:
```env
PORT=8000
NODE_ENV=production
JWT_SECRET=seu_jwt_secret
WIX_APP_ID=seu_app_id
WIX_APP_SECRET=seu_app_secret
```

2. Configure os endpoints da API:
```javascript
/api/cards/month/:month  // Dados mensais
/api/cards               // Todos os cards
```

### 4. Instalação no Site Wix

1. No Wix App Market:
   - Publique seu app (para desenvolvimento)
   - Obtenha o link de instalação

2. No site Wix de destino:
   - Acesse o Editor Wix
   - Vá para "Add Apps"
   - Localize seu app
   - Clique em "Add to Site"

### 5. Verificação da Instalação

1. Verifique a integração:
   - Acesse o dashboard em seu site Wix
   - Confirme se os dados estão sendo exibidos corretamente
   - Teste as funcionalidades de analytics

2. Teste as principais funcionalidades:
   - Visualização de dados
   - Geração de relatórios
   - Filtros dinâmicos
   - Gráficos interativos

### 6. Solução de Problemas

#### Problemas Comuns:

1. **Erro de Conexão:**
   - Verifique as credenciais do app
   - Confirme as permissões OAuth
   - Verifique os logs do servidor

2. **Dados não Aparecem:**
   - Limpe o cache do navegador
   - Verifique a conexão com a API
   - Consulte os logs do console

3. **Problemas de Autorização:**
   - Revise as configurações OAuth
   - Verifique os tokens de acesso
   - Confirme as permissões do app

### 7. Suporte

Para suporte na instalação ou problemas técnicos:
- Email: suporte@sistema.com
- Documentação: [Link para documentação]
- Portal do desenvolvedor: [Link para portal]

### 8. Manutenção

1. **Atualizações Regulares:**
   - Mantenha o app atualizado
   - Acompanhe as mudanças na API do Wix
   - Faça backup regular dos dados

2. **Monitoramento:**
   - Configure alertas de erro
   - Monitore o desempenho
   - Acompanhe métricas de uso

### 9. Segurança

1. **Boas Práticas:**
   - Use HTTPS para todas as conexões
   - Implemente rate limiting
   - Mantenha as dependências atualizadas
   - Faça validação de entrada de dados

2. **Proteção de Dados:**
   - Implemente criptografia
   - Siga as diretrizes GDPR/LGPD
   - Faça backup regular

### 10. Customização

1. **Personalização da Interface:**
   - Ajuste o tema conforme a marca
   - Configure layouts responsivos
   - Adapte elementos visuais

2. **Configurações Avançadas:**
   - Defina permissões por usuário
   - Configure integrações adicionais
   - Personalize relatórios