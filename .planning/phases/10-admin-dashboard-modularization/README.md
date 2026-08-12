# Fase 10: Admin Dashboard Modularization

**Status**: Em Progresso

**Objetivo**: Refatorar AdminDashboard.tsx para utilizar componentes modulares das abas, visando melhor manutenibilidade e escalabilidade do código.

## Contexto

O AdminDashboard.tsx atualmente é um arquivo monolítico (~3000 linhas) que contém toda a lógica e renderização de todas as abas inline. O projeto já possui componentes de abas separados em `src/pages/admin/tabs/` que podem ser aproveitados.

## Tarefas

### 10.1 - Análise e Preparação
- [ ] Analisar dependências de estados (useState) utilizados em cada aba
- [ ] Mapear funções existentes que precisam ser migradas
- [ ] Identificar tipos TypeScript necessários

### 10.2 - Migração de Marketing Tab
- [ ] Criar interface de props para MarketingTab
- [ ] Migrar estados: promoStorePct, promoPerService, birthdayVoucherEnabled, etc.
- [ ] Migrar funções: savePromotions, saveSettings, saveRouletteSettings, etc.
- [ ] Testar funcionalidade após migração

### 10.3 - Migração de Settings Tab
- [ ] Migrar estados: businessHours, blockedDates, blockedSlots
- [ ] Migrar funções: saveBusinessHours, addBlockedDate, addBlockedSlot, etc.
- [ ] Testar funcionalidade após migração

### 10.4 - Migração de System Tab
- [ ] Migrar estados: whatsappStatus, whatsappNumber, users, bookingPaused
- [ ] Migrar funções: saveWhatsappNumber, generateWhatsappQRCode, fetchUsers
- [ ] Migrar modal de criação de usuários
- [ ] Testar funcionalidade após migração

### 10.5 - Migração de Services Tab
- [ ] Migrar estados: services, serviceForm, isNewMenuOpen
- [ ] Migrar funções: openCreateService, openEditService, deleteService
- [ ] Testar funcionalidade após migração

### 10.6 - Limpeza e Verificação
- [ ] Remover código inline migrado
- [ ] Limpar imports não utilizados
- [ ] Verificar build passa sem erros
- [ ] Testar todas as funcionalidades manualmente

## Critérios de Sucesso

- [ ] Build passa sem erros TypeScript
- [ ] Todas as abas funcionam corretamente após refatoração
- [ ] Código mais limpo e modular
- [ ] Manutenção facilitada

## Problemas Identificados (Tentativa Anterior)

A tentativa anterior de migração falhou porque:
1. Muitos estados (useState) estavam no componente pai e precisavam ser passados como props
2. Funções como fetchUsers, revokeAdmin, makeAdmin não existiam ou não estavam expostas
3. O modal de profissionais tinha estados próprios não migraodos

## Dependências

- Componentes existentes em `src/pages/admin/tabs/`
- Tipos em `src/types/admin.ts`
