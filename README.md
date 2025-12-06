# Sistema de Agendamento de Salão de Beleza

Um sistema completo e moderno para gerenciamento de agendamentos de salão de beleza, desenvolvido com React, TypeScript, Supabase e Tailwind CSS.

## 🌟 Funcionalidades Principais

### Para Clientes
- ✅ **Agendamento Online 24/7**: Interface intuitiva para agendar serviços
- ✅ **Seleção de Serviços**: Escolha múltiplos serviços com visualização de preço e duração
- ✅ **Calendário Interativo**: Visualize disponibilidade em tempo real
- ✅ **Confirmação por Email**: Receba confirmações e lembretes automáticos
- ✅ **Painel do Cliente**: Visualize histórico de agendamentos
- ✅ **Cancelamento/Reagendamento**: Gerencie seus compromissos facilmente

### Para Administradores
- ✅ **Dashboard com Calendário**: Visualização completa de agendamentos
- ✅ **Gestão de Clientes**: CRUD completo com histórico de atendimentos
- ✅ **Gestão de Serviços**: Adicione, edite e gerencie serviços oferecidos
- ✅ **Relatórios Financeiros**: Análise de faturamento e estatísticas
- ✅ **Controle de Disponibilidade**: Configure horários de funcionamento
- ✅ **Sistema de Logs**: Auditoria completa de todas as operações

### Segurança & Compliance
- ✅ **Autenticação com Google**: Login social integrado
- ✅ **Controle de Acesso**: Papéis diferenciados (Cliente, Admin, Proprietário)
- ✅ **LGPD Compliance**: Conformidade com leis de proteção de dados
- ✅ **Criptografia**: Dados sensíveis protegidos
- ✅ **Logs de Auditoria**: Registro de todas as ações no sistema

### Tecnologia & Performance
- ✅ **Design Responsivo**: Mobile-first, otimizado para todos dispositivos
- ✅ **Multi-idioma**: Integração com Google Translate
- ✅ **Carregamento Rápido**: Otimizado para performance
- ✅ **SEO Otimizado**: Estrutura amigável para mecanismos de busca
- ✅ **Notificações em Tempo Real**: Sistema de alertas integrado

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Zustand** para gerenciamento de estado
- **React Router** para navegação
- **Lucide React** para ícones
- **Sonner** para notificações

### Backend & Banco de Dados
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Row Level Security (RLS)** para proteção de dados
- **Triggers e Functions** PostgreSQL para automação
- **Resend API** para emails transacionais

### Bibliotecas Adicionais
- **React Hook Form** + **Zod** para formulários e validação
- **React Big Calendar** para calendário administrativo
- **Date-fns** para manipulação de datas
- **React DatePicker** para seleção de datas

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no Supabase (gratuito)
- Conta no Resend para emails (opcional)
- Conta no Google Cloud para OAuth (opcional)

## 🚀 Instalação e Configuração

### 1. Clone o repositório
```bash
git clone [url-do-repositorio]
cd sistema-agendamento-salao-beleza
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure:

```env
# Supabase (obrigatório)
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase

# Email (opcional)
VITE_RESEND_API_KEY=sua_chave_resend
VITE_SALON_EMAIL=contato@seusalao.com
VITE_SALON_OWNER_EMAIL=proprietario@seusalao.com

# Google Translate (opcional)
VITE_GOOGLE_TRANSLATE_API_KEY=sua_chave_google_translate

# Google OAuth (opcional)
VITE_GOOGLE_CLIENT_ID=seu_client_id_google
```

### 4. Configure o Supabase
1. Crie um projeto no [Supabase](https://supabase.com)
2. Aplique as migrações do diretório `/supabase/migrations`
3. Configure as políticas RLS conforme necessário
4. Ative a autenticação com email e Google OAuth

### 5. Execute o projeto
```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
├── pages/              # Páginas principais da aplicação
├── stores/             # Gerenciamento de estado com Zustand
├── lib/                # Utilitários e configurações
├── hooks/              # Custom hooks
├── utils/              # Funções utilitárias
└── types/              # Definições TypeScript

supabase/
├── migrations/         # Migrações do banco de dados
└── functions/         # Funções PostgreSQL
```

## 🎯 Fluxo de Uso

### Cliente
1. Acessa a página inicial e visualiza serviços
2. Clica em "Agendar Horário"
3. Seleciona serviços desejados
4. Escolhe data e horário disponível
5. Preenche dados pessoais
6. Aceita termos e condições
7. Recebe confirmação por email

### Administrador
1. Faz login no painel administrativo
2. Visualiza calendário com todos agendamentos
3. Gerencia clientes e serviços
4. Aprova/cancela agendamentos
5. Visualiza relatórios financeiros
6. Configura horários de funcionamento

## 📊 Performance

- **LCP (Largest Contentful Paint)**: < 2.5 segundos
- **FID (First Input Delay)**: < 100 milissegundos  
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8 segundos

## 🔒 Segurança

- **Autenticação JWT** com tokens de curta duração
- **Row Level Security** no PostgreSQL
- **Criptografia de dados sensíveis**
- **Proteção XSS** e injeção SQL
- **Rate limiting** para prevenir ataques
- **Logs de auditoria** completos

## 📱 Responsividade

- **Mobile-first** design approach
- **Breakpoints**: 320px, 768px, 1024px, 1440px
- **Touch optimization** para dispositivos móveis
- **Performance otimizada** para 3G

## 🌐 Multi-idioma

- Português (BR) - Idioma padrão
- Inglês (EN) - Tradução automática
- Espanhol (ES) - Tradução automática
- Fallback para português quando necessário

## 📞 Suporte e Contato

Para suporte técnico ou dúvidas:
- Email: suporte@seusalao.com
- Telefone: (11) 99999-9999
- Horário: Segunda a Sexta, 9h às 18h

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Notas de Versão

### v1.0.0 (Lançamento Inicial)
- Sistema completo de agendamento
- Painel administrativo com calendário
- Autenticação com Google
- Notificações por email
- Design responsivo e elegante
- Multi-idioma com Google Translate
- LGPD compliance

---

Desenvolvido com ❤️ para transformar a experiência de agendamento de salões de beleza.
