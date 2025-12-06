## Diagnóstico Inicial
- Verificar logs de build e runtime no Vercel (Aba Deploy e Functions) para identificar a etapa que falhou.
- Checar se o comando de build é `npm run build` e o diretório de saída é `dist` (detectado automaticamente para Vite).
- Confirmar versão Node nas configurações do projeto (>= 18).

## SPA Routing (React Router)
- O app usa `createBrowserRouter` com rotas como `/agendar`, `/confirmacao` (`src/App.tsx:10-43`). Em Vercel, acesso direto a rotas client-side gera 404 sem fallback.
- Adicionar `vercel.json` na raiz com rewrite para SPA, ignorando assets e APIs:
  - Opção A (recomendada): `{ "rewrites": [{ "source": "/((?!api/.*).*)", "destination": "/index.html" }] }`.
  - Opção B (mais explícita): `{ "routes": [{ "handle": "filesystem" }, { "src": "/((?!api/.*).*)", "dest": "/index.html" }] }`.
- Garantir que o `vercel.json` esteja na raiz do repositório (não em `public`), conforme relatos na comunidade.
- Referências: Vercel/React Router SPA reescritas [1][2][3][4].

## Variáveis de Ambiente
- O cliente Supabase falha se faltarem variáveis (`src/lib/supabase.ts:7-9`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- No Vercel, cadastrar todas variáveis do `.env.example` com prefixo `VITE_` em Project Settings → Environment Variables.
- Em Preview/Production, validar que os valores estão presentes; sem isso, o bundle roda mas quebra no runtime.

## Robustez de Inicialização (Opcional)
- Trocar o `throw` de `src/lib/supabase.ts:7-9` por um guard mais amigável (log e tela de erro controlada), evitando crash total em ambientes sem config.
- Exibir mensagem clara ao usuário quando variáveis faltarem.

## Ajustes Menores
- Definir `"engines": { "node": ">=18" }` em `package.json` para consistência com Vercel.
- Confirmar que não há imports SSR ou uso de APIs de Node em código de cliente.

## Validação
- Fazer novo deploy em Vercel.
- Testar navegação direta para `/agendar` e `/confirmacao` sem 404.
- Validar chamadas ao Supabase e envio de e-mail (se `VITE_RESEND_API_KEY` estiver configurada).

## Se persistir erro
- Coletar o log exato do Vercel (mensagem e stack) e o ID do deployment para triagem direcionada.

[1] https://github.com/vercel/vercel/issues/7475
[2] https://stackoverflow.com/questions/64815012/react-router-app-works-in-dev-but-not-after-vercel-deployment
[3] https://github.com/vercel/vercel/discussions/5448
[4] https://medium.com/today-i-solved/deploy-spa-with-react-router-to-vercel-d10a6b2bfde8