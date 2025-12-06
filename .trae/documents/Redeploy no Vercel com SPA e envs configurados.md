## Pré-checagens
- Verificar `vercel.json` na raiz com fallback de SPA para React Router: rewrites para `index.html` preservando assets e `api/*`.
- Confirmar `package.json` com `"engines": { "node": ">=18" }` e scripts padrão (`build` → `vite build`, output `dist`).
- Conferir variáveis de ambiente no Vercel (Production e Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, opcional `VITE_RESEND_API_KEY`, `VITE_SALON_OWNER_EMAIL`.

## Enviar mudanças ao repositório
- `git add -A && git commit -m "vercel.json + engines Node >=18 + SPA rewrites" && git push` para a branch de produção (geralmente `main`).

## Acionar o redeploy (escolha uma)
- UI: Vercel → Project → Deployments → Redeploy último deployment.
- Push: o `git push` dispara auto-deploy para a Production Branch configurada.
- CLI (se configurado): `vercel --prod` no projeto autenticado.

## Validação pós-deploy
- Abrir diretamente `https://<seu-domínio>/agendar` e `https://<seu-domínio>/confirmacao` sem 404.
- Testar chamadas Supabase (listar serviços em `/agendar`); sem envs corretos, o app quebra em `src/lib/supabase.ts:7-9`.
- Se `VITE_RESEND_API_KEY` está setada, confirmar envio de emails de confirmação.

## Se ocorrer erro
- Coletar o log do Vercel (Deployment → Logs) e o ID do deployment.
- Conferir: envs faltando, rota sem fallback, pasta de build incorreta, versão de Node.

Referências
- SPA rewrites (React Router em Vercel): [2] https://stackoverflow.com/questions/64815012/react-router-app-works-in-dev-but-not-after-vercel-deployment, [3] https://github.com/vercel/vercel/discussions/5448, [4] https://medium.com/today-i-solved/deploy-spa-with-react-router-to-vercel-d10a6b2bfde8