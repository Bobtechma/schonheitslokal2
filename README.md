# ⚡ Antigravity Master Guide: schoenheitslokal.ch

Este documento é a "Fonte de Verdade" e o manual de execução rigoroso para manter a consistência, estética e performance do site **Schönheits Lokal**. Utilize estas diretrizes como restrições (constraints) inegociáveis para todas as atualizações via Antigravity.

---

## 💎 1. Identidade & Core Branding

* **Nome:** Schönheits Lokal
* **Slogan:** "Verwandeln Sie Ihre Schönheit mit unseren Exklusiven Dienstleistungen"
* **Tom de Voz:** Moderno, vibrante, acolhedor e focado na transformação pessoal.
* **Idioma Oficial:** Alemão (Suíça).
* **Contacto:** 077 816 29 33 | Kalkbreitstrasse 129, 8003 Zurich

---

## 🎨 2. Design System & Design Tokens

**[SKILL: DESIGN INTEGRITY]**

O Antigravity deve usar estritamente a paleta de cores e tipografia abaixo para qualquer novo elemento:

### Variáveis CSS (Paleta Oficial)

```css
:root {
  /* Cores da Marca */
  --sl-pink-primary: #F04E85;     /* Rosa vibrante (Botões primários, cards e destaques) */
  --sl-purple-gradient: #9B51E0;  /* Roxo (Usado em gradientes de texto) */
  
  /* Cores de Fundo (Backgrounds) */
  --sl-bg-main: #FAFAFA;          /* Fundo principal quase branco */
  --sl-bg-white: #FFFFFF;         /* Fundo de seções específicas e botões outline */
  --sl-bg-soft-pink: #FDF2F8;     /* Fundo suave (ex: atrás do grid de serviços) */
  
  /* Cores de Texto (Typography) */
  --sl-text-dark: #1E293B;        /* Grafite escuro para títulos principais */
  --sl-text-muted: #64748B;       /* Cinza médio para parágrafos e subtítulos */
  --sl-text-light: #FFFFFF;       /* Branco para texto dentro de botões e cards coloridos */
}
```

### Tipografia e Efeitos Visuais

* **Títulos (Headings):** Fonte Sans-Serif moderna, limpa e com peso (Bold/Black).

---

## 🧩 3. Estrutura de Componentes

### Botões (CTAs)

Todos os botões de ação devem ter o estilo **"Pill"** (totalmente arredondados, `border-radius: 9999px`).

* **Primário (Termin Buchen):** Fundo Rosa Sólido (`--sl-pink-primary`), texto branco, com ícone alinhado à esquerda.
* **Secundário (Dienstleistungen Ansehen):** Fundo transparente/branco, borda fina Rosa (`--sl-pink-primary`), texto Rosa.

---

## 🚀 4. Superpoderes do Antigravity (Regras de Execução)

### 🛡️ Skill 1: Zero Regression Policy (Safe Edit) - *DIRETRIZ PRINCIPAL*

* **Regra:** Nenhuma nova atualização deve quebrar, sobrescrever ou comprometer funcionalidades, layouts ou estilos previamente implementados.
* **Ação Restrita:** Adicionar código de forma modular e incremental. É expressamente proibido remover classes CSS, IDs ou scripts existentes sem autorização explícita do usuário.

### 📐 Skill 2: Component Symmetry (Regra dos Cards)

* **Regra:** Qualquer novo card de serviço adicionado deve seguir estritamente este layout simétrico: Fundo rosa (sólido ou gradiente suave), bordas arredondadas (16px), texto branco, com Ícone de estrela no topo esquerdo, Título em negrito e Duração (ex: `50 min`) logo abaixo.

### ✨ Skill 3: Text Highlight Sync (Efeito Gradiente)

* **Regra:** O Antigravity deve usar a técnica de `background-clip: text` ou a cor primária (`--sl-pink-primary`) para destacar as palavras-chave nos títulos principais (`<h1>`, `<h2>`), mantendo o padrão visual do site original.

### 📱 Skill 4: Mobile-First & Stacking

* **Regra:** O grid de "Cards de Serviço" DEVE empilhar perfeitamente em uma única coluna vertical em dispositivos móveis (`max-width: 768px`). Textos muito grandes devem usar `clamp()` ou media queries para não quebrar a tela.

### 🔍 Skill 5: SEO Local & Performance

* **Regra:** Inserir palavras-chave como `Schönheitssalon Zürich` e o nome da especialidade ao criar novas seções ou landing pages. Imagens novas e SVGs devem ser minificados e usar `loading="lazy"`.

### 🔗 Skill 6: Routing & Conversion Lock

* **Regra:** Todo novo botão de CTA criado deve apontar para o fluxo de conversão principal (Sistema de agendamento "Visuel IA" ou âncora de contato). Nunca crie botões "órfãos" sem link funcional.

### 🌍 Skill 7: Language & Content Sync

* **Regra:** Proibido gerar textos de placeholder (Lorem Ipsum) ou traduções para inglês/português. Novas seções devem ser redigidas em Alemão (Suíça). Morada e telefone são globais e devem refletir em todas as seções.

---

## 🚨 5. Checklist de Validação (Pre-Commit)

O Antigravity deve processar este checklist silenciosamente antes de aplicar qualquer alteração de código:

* [ ] **Zero Regressão?** A nova alteração preserva 100% o funcionamento das seções vizinhas e componentes anteriores?
* [ ] **Paleta Respeitada?** Nenhuma cor fora do esquema Rosa/Roxo/Grafite/Branco foi injetada?
* [ ] **Geometria Correta?** Botões novos estão com estilo "Pill" (arredondados) e não quadrados?
* [ ] **Simetria de Cards?** Novos serviços possuem Ícone, Título e Duração (`XX min`) no padrão branco sobre fundo rosa?
* [ ] **Efeito de Texto?** As palavras-chave dos novos títulos ganharam o destaque rosa/roxo?
* [ ] **Responsividade?** Elementos não causam rolagem horizontal no mobile?
* [ ] **Semântica SEO?** Tags `<h1>` e `<h2>` mantidas e estruturadas corretamente?

---

*Ficheiro de configuração otimizado para IA (Antigravity). Atualizado com 7 Skills essenciais, Design Tokens exatos e política de Zero Regressão.*