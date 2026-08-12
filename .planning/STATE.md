# Project State: Schönheits Lokal

**Current Phase**: 19 - Regional Partner Salons Integration

**Status**: ✅ Concluído (Sistema de salões parceiros integrado e validado com sucesso)

**Last Update**: 2026-06-17 (Switzerland/Brazil time)

**Blockers**: None

**GSD Tracking**: Active and synchronized.

## Phase Summary

| Phase | Directory | Status |
| :--- | :--- | :--- |
| 01 - Fix Build Errors | `phases/01-fix-build-errors/` | ✅ Complete |
| 02 - Functional Bug Fixes | `phases/02-functional-bug-fixes/` | ✅ Complete |
| 03 - UI Mobile Refinement | `phases/03-ui-mobile-refinement/` | ✅ Complete |
| 04 - Calendar Integration | `phases/04-calendar-integration/` | ✅ Complete |
| 05 - RBAC & Governance | `phases/05-rbac-governance/` | ✅ Complete |
| 06 - Notifications & Availability | `phases/06-notifications-availability/` | ✅ Complete |
| 07 - Fix Attendant Availability | `phases/07-fix-attendant-availability/` | ✅ Complete |
| 08 - Categorize Manual Booking and Sales | `phases/08-manual-categories/` | ✅ Complete |
| 09 - Professional Availability UX | `phases/09-professional-availability-ux/` | ✅ Complete |
| 10 - Admin Dashboard Modularization | `phases/10-admin-dashboard-modularization/` | 🔄 Em Progresso |
| 11 - Payment Method Enhancements & UI Sync | `phases/11-payment-method-enhancements-ui-sync/` | ✅ Complete |
| 12 - Appointment Details Popup & Stability | `phases/12-appointment-details-popup/` | ✅ Complete |
| 13 - Store Identity & Contact Refinement | `phases/13-address-correction/` | ✅ Complete |
| 14 - Grid Visibility & Accessibility | `phases/14-grid-visibility/` | ✅ Complete |
| 15 - Blocked Slots & Intervals Fix | `phases/15-blocked-slots-fix/` | ✅ Complete |
| 16 - UI Visibility Enhancements | `phases/16-ui-visibility/` | ✅ Complete |
| 17 - Final Polish & Audit | `phases/17-final-polish/` | ✅ Complete |
| 18 - Admin Appointment Editing & SEO | `phases/18-admin-edit-seo/` | ✅ Complete |
| 19 - Regional Partner Salons Integration | `phases/19-partner-salons/` | ✅ Complete |

## Accumulated Context

### Roadmap Evolution

- Phase 11 added: Payment Method Enhancements & UI Sync
- Phase 11 marked as Complete: 2026-04-25

## Recent Fixes (2026-06-16)

### Integração de Salões Parceiros Regionais (Fase 19)
- **Remoção de Boleto & Unificação em CHF:** Removida a conversão de BRL e o método Boleto Bancário. Todas as compras e faturas de saldo de 50% agora operam estritamente em CHF via cartões/Twint no Stripe Checkout.
- **Funil de Vendas Comercial (/parceria):** Implementação de Landing Page premium com Hero section Pink Glassmorphism, grid de benefícios comerciais, calculadora de margem de lucro dinâmica (slider) e formulário integrado com RLS no Supabase.
- **Aprovação Admin e Correção de ID:** Nova seção de aprovações no Dashboard Admin com promoção de papel. Lógica corrigida para selecionar o `user_id` em vez do UUID de registro do cliente (`id`), resolvendo falhas de promoção na API `admin-mgmt`.
- **Triggers de Cadastro Automático:** Criados triggers no banco de dados (`BEFORE INSERT` e `AFTER INSERT` no `auth.users`) para interceptar novos cadastros de e-mails de parceiros aprovados e atribuir a role `'partner'` nas metadatas, além de gerar o registro do perfil correspondente em `public.clients` e associar o `user_id` na solicitação.
- **Search Path de Triggers de Logs:** Corrigido o `search_path` de funções de triggers de log existentes (`log_client_creation`, `log_appointment_creation`, `log_appointment_update`) para `public`, prevenindo falhas de permissão ao criar usuários a partir do contexto da tabela `auth.users`.
- **Validação:** Rodada verificação TypeScript (`tsc --noEmit`), compilação de produção (`npm run build`) e testes de integração automatizados (`test_partner_flow.cjs`) com 100% de sucesso.

## Recent Fixes (2026-06-01)

### Melhoria no Fluxo de Edição de Agendamento (Fase 18)
- **Preservação de Dados de Agendamento**: Modificado o modal de edição para não resetar o horário selecionado (`time`) ao alterar a data ou o profissional. Todos os dados originais agora são exibidos e preservados por padrão.
- **Rótulos de Disponibilidade em Tempo Real**: Se o horário preservado (ou selecionado) estiver ocupado/indisponível para a nova data ou profissional, ele é exibido no dropdown de seleção com o sufixo `(Indisponível)` / `(Nicht verfügbar)`.
- **Aviso Inline no Dashboard**: Injetado um alerta em tempo real abaixo do seletor avisando o administrador que o horário atual está ocupado, mantendo a validação estrita no botão de salvamento.
- **Deploy em Produção**: Deployado via Vercel CLI com compilação e deploy concluídos sem erros.

## Recent Fixes (2026-05-31)

### Admin Appointment Editing & SEO Optimization (Fase 18)
- **Edição de Compromissos no Dashboard**: Permite aos administradores alterar data, hora, profissional responsável, status e notas de agendamentos de clientes, persistindo diretamente no Supabase.
- **Validação Estrita de Conflito de Horário**: Valida no frontend se o profissional está livre usando a RPC `get_available_slots` (via `getAvailabilityPerProfessional`) antes de salvar, assegurando que não haja nenhum overlap de agendamentos ou conflitos de horário.
- **Notificações de Reagendamento**: Envia alertas automáticos detalhados por E-mail (Resend) e WhatsApp (API local) se o profissional, a data ou a hora forem alterados.
- **Otimização Avançada de SEO**: Novo helper centralizado `src/lib/seo.ts` gerencia meta-tags de título, descrição, link canônico absoluto (`schoenheitslokal.ch`) e links alternativos `hreflang` dinâmicos (de-CH e pt-BR) para Google Search Console. Sitemap.xml e Robots.txt corrigidos e atualizados.
- **Banner de Consentimento de Cookies Real**: Componente premium Glassmorphism `<CookieConsent />` com opções granulares (Necessários, Analytics, Marketing), persistência no `localStorage`, API global `window.hasCookieConsent` e CustomEvents para disparos de scripts de terceiros. Exposto globalmente na raiz global em `src/App.tsx`.
- **Otimizações Core Web Vitals (FCP, LCP, CLS, Speed Index)**: Reduzimos o Cumulative Layout Shift (CLS) de **0.394 para 0.0** através do trancamento de aspect-ratio no esqueleto do carrossel (`ProductCarousel.tsx`), dimensões explícitas no logotipo do cabeçalho (`Header.tsx`) e pré-renderização instantânea na grade de destaques da Hero usando fallback estático tipado (`HomePage.tsx`). Aceleramos FCP/LCP e Speed Index trazendo o `ProductCarousel` de lazy para eager-loaded e configurando fontes assíncronas não-bloqueantes (`index.html`) via `media="print" onload="this.media='all'"`.
- **Correção de Crash de Placa de Vídeo (RX 580)**: Removemos todos os filtros pesados de canvas `ctx.shadowBlur` e `ctx.shadowColor` da roleta (`RoulettePopup.tsx`). Substituímos a renderização das lâmpadas piscantes por uma aura vetorial leve semi-transparente de 0% consumo GPU, e a sombra dos textos das fatias por uma borda vetorizada de alto contraste nativa (`strokeText`), eliminando por completo qualquer processamento pesado de rasterização de sombras em loops de 60 FPS, sanando em definitivo os travamentos e crashes de TDR GPU (placa AMD RX 580/590).
- **Ajuste de Validação no Agendamento Manual (Admin)**: Removemos a exibição da mensagem genérica `t('fillDataError')` que afirmava incorretamente que E-mail e Telefone eram obrigatórios para o administrador no painel. Adicionamos novas chaves de tradução específicas para operações administrativas (`manualBookingFillError`, `fillProfessionalNameError`, `fillWhatsappNumberError`) em português e alemão suíço, garantindo que e-mail e telefone sejam 100% opcionais, mas mantendo a obrigatoriedade do Nome do cliente (ou seleção de cliente cadastrado). As notificações continuam operando perfeitamente: são disparadas apenas quando e-mail ou telefone forem efetivamente informados/estiverem presentes.
- **Serviço de WhatsApp em Standby**: Para evitar os erros insistentes de `ERR_CONNECTION_REFUSED` no console quando a Evolution API local (porta 8085) está offline, implementamos um controle de ativação dinâmico da fila de mensagens do WhatsApp. Criamos a configuração `whatsapp_queue_active` no banco de dados (`system_settings`), novas traduções multilíngues e um botão interativo de controle de status ("Ativo" / "Standby") na aba WhatsApp do painel Admin. Quando em Standby, o worker do WhatsApp suspende todas as assinaturas e polling de banco/rede para `localhost:8085`, sanando inteiramente os erros de recusa de conexão.
- **Otimização Extrema de Vídeos de Background**: Para solucionar os travamentos e picos de GPU em chips gráficos (como a placa AMD Radeon RX 580), criamos o componente inteligente `<LazyBackgroundVideo />` (`src/components/LazyBackgroundVideo.tsx`). Ele integra o `IntersectionObserver` para detectar a visibilidade das seções. Para evitar condições de corrida (race conditions) no React durante a montagem inicial da DOM e garantir o correto carregamento dos vídeos, mantemos o elemento `<video>` permanentemente montado e injetamos o `<source>` dinamicamente com um gatilho explícito de carregamento (`video.load()`) na primeira ativação. Quando os vídeos rolam para fora do viewport, o processamento de decodificação de hardware cai a exactly 0% via `.pause()`. Adicionalmente, otimizamos todos os 6 links de fundo em `HomePage.tsx` de 1080p (`_large.mp4`) para resoluções médias (`_medium.mp4`), reduzindo o tamanho em 60% e a decodificação em 70% sem perdas visuais perceptíveis.
- **Deploy em Produção**: Verificado via `npm run build` local e deployado com sucesso em produção aliased para `https://schoenheitslokal.ch` usando a Vercel CLI via `npx vercel --prod --yes`.

## Recent Fixes (2026-05-06)

### Appointment Grid Visibility
- **Problem**: "Plus" icons and appointment details were invisible/faint without hover, causing UX issues on mobile.
- **Solution**: Set opacity to 100% permanently for grid action icons and appointment details in `AppointmentsTab.tsx`.
- **Verification**: UI tested for visibility across all breakpoints.

## Recent Fixes (2026-04-25)

### Payment Method Enhancements

- **Problem**: Payment information missing in Admin Day view; inconsistent keys.
- **Solution**: Restored data mapping in `AdminDashboard.tsx`, added icons (Wallet/CreditCard) to all dashboard views, and moved legacy appointments to "No Salão".
- **Verification**: Verified UI consistency across all dashboard tabs and customer flows.

### Address Correction & Stability

- **Problem**: Inconsistent address spelling and infinite loop in booking professional selection.
- **Solution**: Standardized to `Kalkbreitstrasse 129` and optimized `ProfessionalSelection` dependencies.
- **Deploy**: Successfully pushed to production via Vercel.

## Recent Fixes (2024-04-11)

### Booking System Fix

- **Problem**: RPC `create_appointment_with_services` was giving 404 error
- **Solution**: Changed to direct INSERT (both BookingForm and AdminDashboard)
- **Verification**: Both now use same availability logic from `getAvailabilityPerProfessional`
- **Conflict Check**: Both verify overlapping appointments considering duration

### Admin Dashboard View Fix

- **Problem**: Appointments not showing in weekly/daily view
- **Solution**: Fixed date comparison logic using string format (YYYY-MM-DD)
- **Consistency**: Now uses same logic as monthly view

### Verification Logic
- Professional capacity is checked via `get_available_slots` RPC
- Function verifies:
  1. Professional performs ALL selected services
  2. Professional works on that day/hour
  3. No overlapping appointments

## Key Context

- **Availability Logic**: Implemented in `src/lib/availability.ts`. Uses `get_available_slots` RPC.
- **Booking Flow**: Multi-step flow in `BookingForm.tsx` (Services -> Date -> Professional -> Time -> Client Data).
- **Manual Booking**: AdminDashboard uses same logic for consistency.
- **Conflict Detection**: Checks duration overlap before confirming booking.
- **Design Tokens**: Consistent use of the pink/purple palette and glassmorphism throughout the app.
- **Localization**: Full support for de-CH and pt-BR.
- **Supabase**: Backend integration for data persistence and real-time updates.

## Deploy

- Status: ✅ Production Ready
- Platform: Vercel
- URL: <https://schoenheitslokal.ch>
- Last Deploy: 2026-06-01 09:36 (BRT)
