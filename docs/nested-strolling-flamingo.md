# FaithSync — Planejamento Arquitetural Definitivo

**Data:** 2026-04-29 | **Status:** Planejamento — não implementar ainda

---

## 1. Resumo Executivo

O FaithSync é um app familiar de leitura bíblica em Vanilla JS ES6 + Supabase + GitHub Pages. Está funcional, com arquitetura modular correta, mas acumulou débito técnico visível e possui regressões visuais recentes que precisam ser corrigidas antes da expansão massiva de conteúdo.

**Decisão central:** Manter e evoluir incrementalmente o Vanilla JS ES6. Nenhuma migração de stack é justificável agora. O projeto precisa de estabilização arquitetural e correção de regressões — não de reescrita.

**A estrutura de conteúdo deve ser reestruturada agora** (antes da geração massiva). A decisão é: conteúdo textual em `data/weeks/week-N.json` (JSON puro, gerado por agentes de conteúdo), renderizadores visuais em `js/content/[livro].js` (JS controlado), carregamento via `fetch()` + `import()` dinâmico. Esta é a mudança mais crítica para viabilizar a expansão futura com segurança e sem risco de código executável em dados.

---

## 2. Diagnóstico Arquitetural Real

### Stack atual (confirmado por análise de código)

| Camada       | Tecnologia                         | Status                        |
| ------------ | ---------------------------------- | ----------------------------- |
| Frontend     | HTML5 + CSS3 + JS ES6 Modules      | Funcional                     |
| Persistência | Supabase (Auth + PostgreSQL + RLS) | Correto e seguro              |
| Hospedagem   | GitHub Pages (estático, sem build) | Funcional                     |
| Build        | Nenhum (deploy direto do `main`)   | Adequado para o tamanho atual |
| PWA          | manifest.json parcial              | Incompleto                    |

### Arquitetura de módulos JS (estado real)

```
js/const.js       → Configuração Supabase + BOOKS + WEEKS_INDEX (87 semanas)
js/state.js       → Estado global em memória (planState, weekNotes, userId)
js/domain.js      → Lógica pura (calculateWeekDates, checkWeekCompletion)
js/db.js          → CRUD Supabase (load/save progresso, notas, auth)
js/utils.js       → Utilitários (fmtD, esc, toast, getBook)
js/ui.js          → Shell e componentes compartilhados (renderPH, injectAppShell)
js/semanas.js     → WEEKS_DATA[32] apenas (Daniel 7-12, protótipo único)
js/pages/*.js     → Entrypoints de página (index, semanas, anotacoes)
js/content/       → VAZIO (apenas .gitkeep)
```

### Débito técnico real (verificado em código)

- **Arquivos legados versionados:** `js/index.js`, `js/shared.js`, `js/semanas-logic.js`, `js/anotacoes.js` (duplicados, não utilizados pelas páginas)
- **WEEKS_DATA em arquivo monolítico:** `js/semanas.js` tem apenas a semana 32 mas a estratégia atual colocaria todas as 87 semanas no mesmo arquivo → inaceitável para expansão
- **Login com múltiplos listeners:** `click` + `keydown` + `submit` + `onsubmit` inline = múltiplas chamadas por tentativa
- **visual em WEEKS_DATA:** SVG/HTML bruto injetado via innerHTML sem sanitização formal
- **Validação de backup parcial:** `completedDays`, `completedComplements` e histórico entram sem validar formato, faixa ou tipo
- **Datas duplicadas:** WEEKS_INDEX tem datas fixas; `calculateWeekDates()` recalcula — telas diferentes podem mostrar datas diferentes
- **Inline styles residuais:** regra proíbe, mas existem no HTML/JS

---

## 3. Diagnóstico Funcional dos Problemas Encontrados (navegação real)

### Login / Index

- **Lentidão inicial:** causada pela sequência bloqueante: verificação de sessão Supabase → `dbLoad()` → renderização de 87 cards. Sem feedback visual intermediário adequado.
- **Cards sem datas e sem referências:** regressão visual recente. O campo `range` de WEEKS_INDEX existe mas provavelmente foi removido do template de renderização do card durante refatoração recente.
- **Grid desktop com 1 coluna:** regressão de CSS — media query `768px` deveria ativar 3 colunas mas algo no layout quebrou.
- **Botões "Iniciar Plano Hoje" e "Apagar Plano Atual":** sem as classes de estilo corretas, renderizando com estilo padrão do browser.

### Semana 32

- **Não carrega na primeira vez:** race condition — `renderWk()` é chamado antes de `initApp()` completar (especialmente `dbLoad()`). Possível que `planState` ainda não esteja populado quando a semana tenta renderizar.
- **Carrega na segunda vez (após navegar):** confirma race condition, não ausência de conteúdo.

### Header

- **Falta separação visual usuário / Sair:** `.uinf` e `.lout` estão juntos sem separador ou espaço visual adequado.

### Modal de Materiais de Estudo

- **Largura excessiva em desktop:** `max-width` do modal não está configurado para desktop; quebra linha desnecessariamente.
- **Referências:** precisam seguir ABNT (Associação Brasileira de Normas Técnicas) para obras nacionais e formato Chicago/SBL para obras teológicas internacionais.

### Anotações

- Adequada. Botão com design consistente confirmado.

---

## 4. Problemas Classificados por Prioridade

### CRÍTICO — Bloqueiam expansão ou causam perda de dados

| #   | Problema                                                               | Impacto                                                             |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| C1  | js/content/ vazia sem estratégia de carregamento modular               | Toda expansão de conteúdo vai para semanas.js monolítico — inviável |
| C2  | Race condition em semanas.html (semana não carrega na primeira visita) | UX quebrada para funcionalidade principal                           |
| C3  | Login com múltiplos listeners (duplicação de chamadas)                 | Pode criar sessões duplicadas ou erros de auth silenciosos          |

### ALTO — Impactam funcionalidade ou segurança

| #   | Problema                                                   | Impacto                                                |
| --- | ---------------------------------------------------------- | ------------------------------------------------------ |
| A1  | Regressão: cards sem datas e sem referências no Index      | UX principal degradada                                 |
| A2  | Regressão: grid desktop com 1 coluna (deveria ser 3-4)     | Layout quebrado em desktop                             |
| A3  | Botões "Iniciar Plano" e "Apagar Plano" sem estilo correto | Inconsistência visual grave                            |
| A4  | Arquivos legados versionados (4 arquivos não usados)       | Confusão de manutenção, risco de editar arquivo errado |
| A5  | Validação de backup incompleta                             | Estado corrompível via importação mal-formada          |
| A6  | HTML/SVG bruto em wk.visual injetado sem controle          | Risco XSS quando conteúdo vier de agentes externos     |

### MÉDIO — Impactam qualidade e manutenibilidade

| #   | Problema                                                      | Impacto                                        |
| --- | ------------------------------------------------------------- | ---------------------------------------------- |
| M1  | FAITHSYNC_PLAN.md desatualizado vs implementação real         | Agentes futuros podem seguir regras erradas    |
| M2  | Separação visual usuário/sair no header ausente               | UX menor mas visível                           |
| M3  | Modal materiais: largura desktop e formatação de referências  | UX em desktop degradada                        |
| M4  | Datas conflitantes entre WEEKS_INDEX e calculateWeekDates()   | Inconsistência entre telas                     |
| M5  | Acessibilidade: checkboxes div.dchk, modais sem foco/Escape   | Usuários com necessidades especiais bloqueados |
| M6  | Performance: logo JPG 494KB não otimizada                     | Carregamento lento em mobile                   |
| M7  | Progresso conta dias como capítulos (sem correspondência 1:1) | Métrica imprecisa                              |
| M8  | semanas.html não fecha #page-content explicitamente           | HTML não-conforme                              |

### BAIXO — Dívida técnica menor

| #   | Problema                                                   | Impacto                            |
| --- | ---------------------------------------------------------- | ---------------------------------- |
| B1  | Nomes de variáveis abreviados (CW, wk, wn, renderPH, fmtD) | Leitura e manutenção mais difíceis |
| B2  | Comentários mistos inglês/português                        | Inconsistência                     |
| B3  | Funções não usadas: atPct(), ntPct()                       | Dead code                          |
| B4  | manifest.json incompleto (faltam PNG 192/512)              | PWA não instalável corretamente    |
| B5  | :focus-visible ausente em controles                        | Acessibilidade de teclado          |

---

## 5. Decisão Arquitetural Principal

**DECISÃO: Refatorar Incrementalmente — com uma mudança estrutural obrigatória agora**

Não manter sem mudança. Não reestruturar totalmente. Não migrar de stack.

A arquitetura Vanilla JS ES6 é correta e deve ser mantida. Porém, a **estratégia de conteúdo (como WEEKS_DATA é armazenado e carregado)** precisa de reestruturação antes da geração massiva — esta é a única mudança estrutural que não pode ser adiada.

---

## 6. Justificativa Técnica Profunda

### Por que manter Vanilla JS ES6?

1. **Compatibilidade GitHub Pages:** deploy sem build step, sem configuração de Actions para transpilação. Simplifica manutenção.
2. **Tamanho do projeto:** 3 páginas HTML, ~10 módulos JS, 1 CSS. Não há componentes suficientes para justificar overhead de framework.
3. **Contexto familiar:** usuários são pai, mãe e filha de 9 anos. Não há requisitos de interatividade complexa que justifiquem SPA.
4. **Facilidade para agentes IA:** Codex, Claude e Gemini geram Vanilla JS diretamente, sem configuração de build intermediária. Conteúdo bíblico em JS ES6 é trivialmente gerável.
5. **ES6 modules nativos:** já implementados corretamente. Separação de responsabilidades existe.

### Por que a estratégia de conteúdo precisa mudar agora?

Atualmente: `js/semanas.js` contém `WEEKS_DATA[32]` apenas.

Estratégia implícita atual: adicionar todas as 87 semanas no mesmo arquivo.

**Problema:** Com 87 semanas, cada semana tem ~8KB de conteúdo. Um arquivo único teria ~696KB de JS carregado sempre, mesmo que o usuário esteja na semana 1. Isso é inaceitável para mobile e GitHub Pages.

**Solução correta:** Import dinâmico por livro bíblico. Cada `js/content/[livro].js` contém apenas as semanas daquele livro. O app importa apenas quando o usuário navega para aquela semana.

### Por que por livro bíblico e não por semana?

- 87 arquivos separados (um por semana) cria complexidade desnecessária de gestão
- Livros bíblicos são a unidade natural de organização do conteúdo
- Um livro raramente tem mais de 4 semanas → tamanho controlado
- Agentes de IA geram conteúdo por livro naturalmente
- `js/content/daniel.js` como protótipo já está alinhado com o que o plano previa

---

## 7. Decisão sobre Cada Tecnologia Avaliada

| Tecnologia             | Decisão                            | Justificativa                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vanilla JS ES6**     | ✅ Manter e evoluir                | Correto para o projeto. Sem overhead. Compatível com GitHub Pages.                                                                                                                                                                                                                                                                                               |
| **JSON para conteúdo** | ✅ Adotar agora (conteúdo textual) | Com 87 semanas previstas, adotar JSON antes de gerar todo o conteúdo é a decisão correta. Conteúdo textual (dias, complemento, reflexão) vai para `data/weeks/week-N.json`; renderizadores visuais ficam em JS. Evita que agentes injetem código executável em dados. Schema definido agora garante consistência de todas as 87 semanas.                         |
| **Vite**               | ❌ Não adotar                      | Mesmo com 87 semanas de conteúdo previstas, `import()` dinâmico nativo + `fetch()` para JSON já resolvem lazy loading e separação de módulos. Vite adicionaria: build step, GitHub Actions, `node_modules`, mudança de estrutura de deploy. O único ganho real seria cache busting com hashes — problema resolvível com versão em query string. Não justificado. |
| **Tailwind CSS**       | ❌ Não adotar                      | Exige build obrigatório. Projeto tem identidade visual estabelecida e CSS de ~19KB gerenciável. Não resolve nenhum problema real do projeto.                                                                                                                                                                                                                     |
| **React**              | ❌ Não adotar                      | Overengineering. Reescrita completa das 3 páginas. Muda deployment. Não há componentização suficiente para justificar.                                                                                                                                                                                                                                           |
| **Vue**                | ❌ Não adotar                      | Mesmo que React — custo de migração sem benefício proporcional para o tamanho do projeto.                                                                                                                                                                                                                                                                        |
| **Svelte**             | ❌ Não adotar                      | Interessante por tamanho de bundle, mas exige build. Reescrita das páginas. Não resolve problemas reais.                                                                                                                                                                                                                                                         |
| **Astro**              | ❌ Não adotar                      | Otimizado para sites com conteúdo estático intenso e SSG. FaithSync tem auth dinâmica, estado de progresso, Supabase — não é site de conteúdo puro.                                                                                                                                                                                                              |

**Conclusão sobre frameworks e tooling:**

- Nenhum framework resolve os problemas reais identificados — são de implementação, não de stack.
- **JSON é a decisão certa agora** para o conteúdo textual: valida por schema, gerado por agentes sem risco de código executável, facilmente revisável como dado puro.
- **Vite não é justificado** mesmo com volume completo previsto: lazy import + fetch() já resolvem o problema sem build overhead.

---

## 8. Melhor Arquitetura Final Recomendada

```
Vanilla JS ES6 Modules (nativos, sem transpilação)
  ↓
Import estático: estado, domínio, db, utils, ui, constantes
  ↓
Import dinâmico (lazy): js/content/[livro].js via content-loader.js
  ↓
Supabase CDN (SRI fixado) → Auth + PostgreSQL + RLS
  ↓
GitHub Pages (static, main branch, sem Actions)
```

### Princípios arquiteturais mantidos

1. **Single source of truth:** estado em `state.js`, acesso via getters
2. **Supabase isolado:** apenas `db.js` faz chamadas ao Supabase
3. **UI desacoplada de domínio:** `ui.js` recebe dados prontos para renderizar
4. **Conteúdo isolado de lógica:** `js/content/*.js` contém apenas dados, não lógica
5. **Páginas como orquestradores:** `js/pages/*.js` conecta tudo, não tem lógica própria
6. **Sem inline styles, sem inline events:** regra mantida e reforçada

---

## 9. Melhor Estrutura de Pastas Final Recomendada

```
FaithSync/
├── assets/
│   ├── faithsync-logo.webp          ← otimizada (< 50KB)
│   └── faithsync-logo.jpg           ← mantida (compatibilidade)
├── css/
│   └── style.css                    ← único arquivo CSS (mantido)
├── data/
│   └── weeks/                       ← NOVO: conteúdo textual em JSON
│       ├── week-32.json             ← semana 32 (Daniel, migrado do JS)
│       ├── week-01.json             ← futuro (Gênesis semana 1)
│       └── ...                      ← um JSON por semana (87 total)
├── docs/
│   └── FAITHSYNC_PLAN.md            ← fonte de verdade atualizada
├── js/
│   ├── content/                     ← renderizadores visuais por livro
│   │   ├── daniel.js                ← export function renderDanielTimeline(data)
│   │   ├── genesis.js               ← futuro: export function renderGenesisTimeline(data)
│   │   └── ...                      ← um arquivo por livro QUE TIVER VISUAL PRÓPRIO
│   ├── pages/                       ← entrypoints de página
│   │   ├── index.js
│   │   ├── semanas.js
│   │   └── anotacoes.js
│   ├── const.js                     ← Supabase keys + BOOKS + WEEKS_INDEX
│   ├── content-loader.js            ← NOVO: fetch JSON + import visual dinâmico
│   ├── db.js                        ← Supabase CRUD
│   ├── domain.js                    ← lógica de negócio pura
│   ├── state.js                     ← estado global
│   ├── ui.js                        ← shell e componentes compartilhados (sem visuais de livro)
│   ├── utils.js                     ← utilitários puros
│   └── validators.js                ← NOVO: validação de backup e conteúdo JSON
├── schemas/
│   └── week.schema.json             ← NOVO: JSON Schema formal para data/weeks/*.json
├── index.html
├── semanas.html
├── anotacoes.html
├── favicon.ico
├── favicon.svg
├── manifest.json
└── .gitignore

REMOVER (arquivos legados):
├── js/index.js          ← duplicado de pages/index.js
├── js/shared.js         ← duplicado de const.js + utils + state + domain
├── js/semanas-logic.js  ← não usado
└── js/anotacoes.js      ← não importado por pages/
```

### Separação clara de responsabilidades após reestruturação

| Pasta/Arquivo              | Conteúdo                                                    | Editado por                  |
| -------------------------- | ----------------------------------------------------------- | ---------------------------- |
| `data/weeks/week-N.json`   | Dados textuais: dias, complemento, reflexão, visualData     | Gemini (geração de conteúdo) |
| `js/content/[livro].js`    | Renderizadores visuais por livro: `render(data) → SVG/HTML` | Codex (implementação visual) |
| `js/content-loader.js`     | Orquestra: fetch JSON + import visual dinâmico              | Codex (infraestrutura)       |
| `schemas/week.schema.json` | Contrato formal de WeekData                                 | Claude (arquitetura)         |
| `js/const.js`              | WEEKS_INDEX com metadata + contentFile + visualType         | Claude/Codex                 |

**Nota sobre `js/semanas.js`:** após migração, este arquivo é **removido**. WEEKS_DATA passa a viver em `data/weeks/week-32.json` + `js/content/daniel.js` (apenas o renderizador visual).

---

## 10. Estratégia para Expansão Futura dos Livros Bíblicos

### Arquitetura de dois componentes por livro/semana

Cada semana gera **dois artefatos independentes com responsabilidades separadas**:

**1. Conteúdo textual:** `data/weeks/week-N.json` (um arquivo por semana, gerado por Gemini)

```json
{
  "number": 32,
  "title": "As Visões Proféticas de Daniel",
  "book": "daniel",
  "visualType": "danielTimeline",
  "visualData": { "empires": [...], "events": [...] },
  "days": [
    { "dayOfWeek": "Domingo", "reading": "Daniel 7", "context": "..." },
    { "dayOfWeek": "Segunda", "reading": "Daniel 8", "context": "..." },
    { "dayOfWeek": "Terça", "reading": "Daniel 9:1-19", "context": "..." },
    { "dayOfWeek": "Quarta", "reading": "Daniel 9:20-27", "context": "..." },
    { "dayOfWeek": "Quinta", "reading": "Daniel 10-11", "context": "..." },
    { "dayOfWeek": "Sexta", "reading": "Daniel 12", "context": "..." }
  ],
  "complement": {
    "intro": "...",
    "resources": [{ "type": "thompson", "title": "...", "items": [...] }]
  },
  "reflection": { "verse": "...", "reference": "Daniel 12:3", "question": "..." }
}
```

**2. Renderizador visual:** `js/content/[livro].js` (um por livro — somente se tiver visual próprio, implementado por Codex)

```javascript
// js/content/daniel.js — recebe visualData do JSON, retorna SVG/HTML controlado
export function render(visualData) {
  const { empires, events } = visualData;
  return `<svg viewBox="0 0 800 200">...</svg>`;
}
```

**Separação garantida:**

- `data/weeks/*.json` nunca contém código executável
- `js/content/*.js` nunca contém conteúdo textual (apenas lógica de renderização)
- Agentes de conteúdo (Gemini) nunca tocam em JS
- Agentes de código (Codex) nunca tocam em JSON de conteúdo

### Mapeamento semanas → arquivos

```
WEEKS_INDEX[1]  → data/weeks/week-01.json  → js/content/genesis.js (se tiver visual)
WEEKS_INDEX[2]  → data/weeks/week-02.json  → js/content/genesis.js (mesmo renderizador)
WEEKS_INDEX[32] → data/weeks/week-32.json  → js/content/daniel.js  ← PROTÓTIPO
WEEKS_INDEX[87] → data/weeks/week-87.json  → js/content/apocalipse.js
```

**Critério para `js/content/[livro].js`:** somente livros com visual SVG/interativo próprio geram esse arquivo. Semanas sem visual apenas omitem `visualType` no JSON.

### Esqueleto de arquivo (Fase 4a — navegação garantida ANTES do conteúdo real)

Fase 4a gera todos os 87 arquivos JSON com estrutura mínima funcional:

```json
{
  "number": 1,
  "title": "Gênesis: Criação e Queda",
  "book": "genesis",
  "skeleton": true,
  "days": [],
  "complement": {},
  "reflection": {}
}
```

Quando `skeleton: true` → semana renderiza "Conteúdo em breve" mas navegação funciona.
Fase 4b (sob demanda): `skeleton` é removido e conteúdo completo é inserido.

### Fluxo do content-loader.js

```javascript
export async function loadWeek(weekNumber) {
  // 1. Fetch JSON (dados textuais — sempre presente)
  const resp = await fetch(
    `/FaithSync/data/weeks/week-${String(weekNumber).padStart(2, "0")}.json`,
  );
  if (!resp.ok) return null;
  const weekData = await resp.json();

  // 2. Validar contra schema
  if (!validateWeekContent(weekData)) return null;

  // 3. Import dinâmico do renderizador visual (apenas se necessário)
  if (weekData.visualType && weekData.book) {
    try {
      const { render } = await import(`./content/${weekData.book}.js`);
      weekData._renderVisual = render;
    } catch {
      weekData._renderVisual = null; // visual indisponível não quebra a semana
    }
  }

  return weekData;
}
```

### Processo de geração por livro (para agentes)

1. **Fase 4a (automático, Codex):** criar todos os 87 JSON esqueleto + atualizar WEEKS_INDEX (contentFile, hasContent)
2. **Fase 4b (sob demanda, Gemini):** gerar conteúdo completo para `data/weeks/week-N.json` de um livro por vez quando solicitado
3. **Validação (Codex):** validar JSON gerado contra `schemas/week.schema.json` antes do commit
4. **Visual (Codex):** implementar `js/content/[livro].js` com `render(visualData)` baseado nos dados do JSON

---

## 11. Estratégia para Index + Cards + Carregamento Modular

### Problema atual

- Index renderiza 87 cards com dados de WEEKS_INDEX (leve — apenas metadados)
- Cards clicados abrem semanas.html, que carrega WEEKS_DATA completo
- Regressão: cards perderam datas e referências (provavelmente `w.ds`, `w.de`, `w.range` removidos do template)

### Solução: carregamento em dois níveis

**Nível 1 — Cards do Index (dados leves, já em const.js):**

```javascript
// WEEKS_INDEX já tem tudo que card precisa:
{
  (num, ds, de, block, hasContent, range);
}
// Cards devem exibir: número, range, bloco, datas, status
// Não precisam de WEEKS_DATA — nunca devem carregar conteúdo completo
```

**Nível 2 — Semana completa (dados pesados, carregados sob demanda):**

```javascript
// js/content-loader.js
const cache = {};

export async function loadWeek(weekNumber) {
  if (cache[weekNumber]) return cache[weekNumber];

  const bookFile = getBookFile(weekNumber); // ex: "daniel" para semana 32
  const { WEEKS_DATA } = await import(`./content/${bookFile}.js`);
  Object.assign(cache, WEEKS_DATA);
  return cache[weekNumber] ?? null;
}
```

**Nível 3 — Lazy rendering dos cards (performance em desktop):**

```javascript
// IntersectionObserver para renderizar cards apenas quando visíveis
// Evita calcular calculateWeekDates() para 87 semanas de uma vez
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      renderCard(e.target);
      observer.unobserve(e.target);
    }
  });
});
```

### Campos adicionais no WEEKS_INDEX

Adicionar dois campos a cada entrada:

```javascript
{ num: 32, ds: ..., de: ..., block: "Proféticos AT", hasContent: true, range: "Daniel 7-12", contentFile: "daniel", weekFile: "week-32" }
// contentFile: nome do livro (para import do renderizador visual)
// weekFile:    nome do arquivo JSON (para fetch do conteúdo)
```

---

## 12. Estratégia de Performance

### Problemas de performance identificados

1. **Logo JPG 494KB** → converter para WebP com fallback JPG (meta: < 50KB)
2. **calculateWeekDates() em loop** → memoizar resultado por semana em sessão
3. **87 cards renderizados sequencialmente** → IntersectionObserver + virtual rendering
4. **Supabase CDN latência** → toast "Carregando..." imediato ao detectar sessão, antes de dbLoad()
5. **Race condition semanas.html** → garantir await em cadeia: `getSession()` → `dbLoad()` → `renderWk()`

### Otimizações prioritárias

```
1. Corrigir race condition (Crítico)
2. Memoizar calculateWeekDates() (Alto)
3. IntersectionObserver para cards (Alto)
4. Otimizar logo WebP (Médio)
5. Preload de conteúdo da semana atual em background (Baixo/futuro)
```

### O que NÃO fazer por performance

- Não usar Service Worker/offline cache agora (complexidade alta para benefício pequeno)
- Não mover conteúdo para Supabase DB (latência maior que import estático)
- Não usar CDN para conteúdo (GitHub Pages já é CDN)

---

## 13. Estratégia GitHub Pages + Supabase

### GitHub Pages — manter sem mudanças

- Deploy direto da branch `main` (sem Actions, sem build step)
- Funciona perfeitamente com ES6 modules nativos
- Módulos dinâmicos (`import()`) funcionam no browser moderno sem transpilação
- Apenas mudança: garantir que `js/content/` tenha arquivos reais (não .gitkeep)

### Se Vite for adotado no futuro

- Exigiria GitHub Actions para build antes do deploy
- `.github/workflows/deploy.yml` com `npm run build` e deploy de `dist/`
- Mudança no `base` do Vite para `/FaithSync/`
- **Não fazer antes de ter conteúdo completo gerado**

### Supabase — sem mudanças necessárias

- RLS correto e validado
- Chave anon pública é padrão de Supabase frontend
- `db.js` como camada única de acesso: manter
- Futuro (Fase 3H): migração para `family_id` já planejada no FAITHSYNC_PLAN.md

### Regras de segurança a reforçar

- `visualType` + `visualData` em vez de HTML livre em `visual` (antes de conteúdo externo)
- Validação completa de backup antes de `Object.assign()` em `doImport()`
- `esc()` obrigatório em todo texto dinâmico no DOM

---

## 14. Estratégia de Manutenção Futura

### Para Claude/Codex/Gemini que trabalharão no projeto

1. **Leia sempre** `docs/FAITHSYNC_PLAN.md` + `schemas/week.schema.json` antes de qualquer mudança de conteúdo
2. **Conteúdo textual** vai para `data/weeks/week-NN.json` — nunca para arquivos JS
3. **Renderizadores visuais** vão para `js/content/[livro].js` — apenas lógica de renderização, sem dados textuais
4. **Estado** não é modificado em navegação visual (apenas via `checkWeekCompletion()`)
5. **Supabase** é acessado apenas via `db.js`
6. **CSS** vai para `style.css` — nunca inline
7. **Events** via `addEventListener` — nunca `onclick` em HTML
8. **XSS:** `esc()` obrigatório antes de qualquer `.innerHTML` com dados dinâmicos
9. **JSON de conteúdo:** nunca conter HTML, SVG ou código executável — apenas dados estruturados

### Checklist antes de gerar conteúdo de cada livro (Fase 4b)

- [ ] Fase 4a concluída (esqueleto de todas as 87 semanas existe)
- [ ] JSON gerado pelo agente validado contra `schemas/week.schema.json`
- [ ] `skeleton: true` removido do JSON gerado (conteúdo real presente)
- [ ] `js/content/[livro].js` criado se livro tem visual SVG (apenas função render)
- [ ] WEEKS_INDEX tem `contentFile` e `weekFile` corretos para as semanas do livro
- [ ] Semana 32 ainda renderiza corretamente após qualquer mudança em const.js
- [ ] Nenhum arquivo legado foi editado por engano
- [ ] Nenhuma ocorrência de "Velho Testamento" no JSON gerado

---

## 15. Plano de Implementação em Fases

### FASE 0 — Hotfixes Críticos e Estabilização Visual

**Objetivo:** corrigir regressões antes de qualquer nova expansão
**Estimativa:** 1 sessão de trabalho

1. Corrigir race condition em semanas.html (aguardar initApp antes de renderWk)
2. Restaurar datas e referências nos cards do Index (reintroduzir `w.range`, `w.ds`, `w.de`)
3. Corrigir grid desktop para multi-coluna (verificar CSS media queries)
4. Corrigir estilo dos botões "Iniciar Plano Hoje" e "Apagar Plano Atual"
5. Consolidar login em único listener de `submit` no formulário
6. Adicionar separação visual entre usuário e "Sair" no header

### FASE 1 — Reestruturação de Conteúdo + JSON (mudança estrutural principal)

**Objetivo:** criar base arquitetural definitiva para expansão segura
**Estimativa:** 1-2 sessões de trabalho

1. Criar `data/weeks/week-32.json` com conteúdo textual da semana 32 (migrado de `js/semanas.js`)
2. Criar `js/content/daniel.js` com apenas `export function render(visualData)` (SVG do timeline)
3. Criar `js/content-loader.js` (fetch JSON + import visual dinâmico conforme seção 10)
4. Atualizar `js/pages/semanas.js` para usar `content-loader.js` em vez de import estático
5. Adicionar campos `contentFile` e `weekFile` ao WEEKS_INDEX[32] em const.js
6. Criar `schemas/week.schema.json` com JSON Schema formal
7. Remover `js/semanas.js` (conteúdo migrado para JSON)
8. Remover arquivos legados: `js/index.js`, `js/shared.js`, `js/semanas-logic.js`, `js/anotacoes.js`

### FASE 2 — Validação e Segurança

**Objetivo:** fortalecer defesas antes de conteúdo externo
**Estimativa:** 1 sessão de trabalho

1. Criar `js/validators.js` com validação completa de backup (chaves, faixa, tipos)
2. Integrar `validateWeekContent()` em `content-loader.js` (valida JSON antes de usar)
3. Corrigir tag não fechada em semanas.html
4. Remover `onsubmit` inline de index.html
5. Adicionar `type="button"` em todos botões que não são submit
6. Alinhar `currentWeek` default: verificar se deve iniciar em 1 (não 32)

### FASE 3 — UX e Acessibilidade

**Objetivo:** qualidade de uso antes de gerar conteúdo em volume
**Estimativa:** 1-2 sessões de trabalho

1. Otimizar logo WebP (< 50KB)
2. IntersectionObserver para lazy rendering de cards no Index
3. Memoizar calculateWeekDates() (cache em memória por sessão)
4. Corrigir modal de materiais: `max-width` em desktop
5. Formatação de referências ABNT/Chicago/SBL nos materiais de estudo
6. `:focus-visible` em controles principais
7. Modais com `role="dialog"`, `aria-modal`, foco inicial, Escape

### FASE 4a — Esqueleto de Todas as 87 Semanas

**Objetivo:** garantir navegação funcional para toda a Bíblia antes do conteúdo real
**Estimativa:** 1 sessão de trabalho (geração automatizada)

1. Gerar todos os 87 arquivos `data/weeks/week-NN.json` com estrutura esqueleto (`skeleton: true`)
2. Atualizar todos os 87 registros do WEEKS_INDEX em `js/const.js` com `contentFile`, `weekFile`, `hasContent: true`
3. Testar navegação: qualquer semana deve abrir com "Conteúdo em breve" sem erros de console
4. Semana 32 deve continuar renderizando o conteúdo completo (não esqueleto)

### FASE 4b — Geração de Conteúdo por Livro (sob demanda, explicitamente solicitada)

**Objetivo:** preencher conteúdo real semana a semana, quando solicitado
**Estimativa:** iterativa, um livro por sessão, somente quando explicitamente solicitado

1. Para cada livro solicitado: Gemini gera conteúdo completo → `data/weeks/week-N.json`
2. Codex implementa `js/content/[livro].js` com renderizador visual (se o livro tiver visual)
3. Validar JSON contra schema antes do commit
4. Remover campo `skeleton: true` do JSON gerado
5. Testar semana correspondente sem regressão na semana 32

### FASE 5 — Tooling

**Objetivo:** automatizar validação com o volume de conteúdo crescendo
**Estimativa:** 1 sessão de trabalho

1. `package.json` com scripts: `validate-content` (valida todos JSONs contra schema), `check-weeks` (verifica integridade do WEEKS_INDEX)
2. Script Node.js de validação de schema (sem dependência de build, apenas `node validate.js`)
3. ESLint + Prettier para consistência de código JS
4. **Vite: NÃO adotar** — `import()` dinâmico nativo + `fetch()` para JSON já resolvem o problema sem overhead de build. Cache busting resolvido com query string de versão em WEEKS_INDEX.
5. Vitest para funções puras de domínio (opcional, quando houver estabilidade)

---

## 16. Ordem Correta de Execução

```
FASE 0 → FASE 1 → FASE 2 → FASE 3 → FASE 4a → FASE 5 → FASE 4b (por livro, sob demanda)
  ↑           ↑          ↑           ↑            ↑
CRÍTICO    BLOQUEANTE  SEGURANÇA    UX        ESQUELETO
(regres-   (JSON+arq.  (validação   (aces-    (todas 87
sões)      estrutural) de conteúdo) sibili-   semanas
                                   dade)     navegáveis)
```

**Regra:** FASE 1 deve ser concluída ANTES de qualquer nova geração de conteúdo. Gerar conteúdo com a arquitetura atual (semanas.js JS monolítico) cria débito irrecuperável.

**Regra:** FASE 4a (esqueleto) deve preceder FASE 4b (conteúdo real). Isso garante que toda a navegação funciona antes de qualquer geração de conteúdo.

**Regra:** FASE 4b só inicia quando explicitamente solicitada. Não gerar conteúdo automaticamente.

---

## 17. Riscos de Cada Abordagem

### Manter sem mudança estrutural (NÃO recomendado)

| Risco                              | Probabilidade | Impacto                   |
| ---------------------------------- | ------------- | ------------------------- |
| semanas.js com 87 semanas = ~700KB | Alta          | Alto (performance mobile) |
| Race condition persiste            | Alta          | Alto (UX quebrada)        |
| Regressões visuais não corrigidas  | Certa         | Alto                      |

### Refatorar incrementalmente com JSON (RECOMENDADO)

| Risco                                        | Probabilidade | Impacto | Mitigação                                             |
| -------------------------------------------- | ------------- | ------- | ----------------------------------------------------- |
| Semana 32 quebrar durante migração para JSON | Baixa         | Médio   | Testar localmente antes do commit; reversível via git |
| `fetch()` JSON com CORS no GitHub Pages      | Baixíssima    | Médio   | GitHub Pages serve arquivos do mesmo origin; sem CORS |
| `import()` dinâmico falhar em Safari antigo  | Baixa         | Baixo   | ES6 dynamic import suportado desde Safari 11 (2017)   |
| Legados referenciados após remoção           | Baixa         | Alto    | `grep` em HTMLs antes de remover                      |
| JSON inválido gerado por agente              | Média         | Médio   | Schema validation obrigatória antes do commit         |

### Migrar para framework (NÃO recomendado)

| Risco                                               | Probabilidade | Impacto |
| --------------------------------------------------- | ------------- | ------- |
| Reescrita de 3+ meses sem feature nova              | Certa         | Alto    |
| Deploy GitHub Pages quebrado durante transição      | Alta          | Alto    |
| Supabase Auth com framework SPA precisa router      | Alta          | Médio   |
| Conteúdo gerado por agentes precisa de novo formato | Alta          | Alto    |

---

## 18. O Que NÃO Vale Fazer Agora

1. **Não gerar conteúdo de novas semanas** antes de concluir Fase 1 (JSON + content-loader)
2. **Não adotar Tailwind, React, Vue, Svelte ou Astro** — nenhum resolve os problemas reais
3. **Não adotar Vite** — mesmo com 87 semanas previstas, `import()` + `fetch()` já resolvem o problema sem build overhead
4. **Não mover conteúdo para Supabase DB** — JSON estático é mais rápido (sem roundtrip de auth), mais barato e mais simples
5. **Não gerar conteúdo real (Fase 4b)** sem que o esqueleto de todas as semanas (Fase 4a) esteja pronto
6. **Não adicionar Service Worker/PWA completo** antes da estabilização (Fase 3+)
7. **Não criar backend próprio** — RLS do Supabase é suficiente para o contexto
8. **Não usar SSR** — app é dinâmico por design (auth, progresso pessoal)
9. **Não criar testes** antes de corrigir as regressões e estabilizar a arquitetura
10. **Não refatorar nomes de variáveis abreviados** durante Fase 0-2 (distração sem benefício imediato)
11. **Não gerar HTML/SVG bruto em JSON** — `visualData` são dados; o renderizador JS constrói o HTML

---

## 19. Prompts para Execução Futura por Agente

### CODEX — Prompts recomendados (execução e implementação de código)

**Codex Prompt 1 — Fase 0: Hotfixes**

```
Projeto: FaithSync (Vanilla JS ES6, GitHub Pages, Supabase)
Arquivos críticos: js/pages/index.js, js/pages/semanas.js, js/ui.js, css/style.css, index.html

Tarefas (não alterar outros arquivos):
1. Corrigir race condition em js/pages/semanas.js: garantir que renderWk() só seja chamado após await completo de initApp() (getSession + dbLoad)
2. Restaurar campos de datas e range nos cards do Index em js/pages/index.js: incluir w.range, w.ds, w.de no template HTML do card
3. Corrigir grid desktop em css/style.css: media queries devem exibir 3 colunas em 768px e 4 em 1024px (verificar .wgrd ou equivalente)
4. Corrigir estilo dos botões "Iniciar Plano Hoje" e "Apagar Plano Atual" em js/pages/index.js: aplicar classes CSS corretas do design do projeto
5. Consolidar login em js/pages/index.js: manter apenas listener de submit no formulário, remover listeners duplicados de click e keydown
6. Adicionar separação visual entre usuário e botão Sair em js/ui.js: espaçamento ou separador visual entre .uinf e .lout

Restrições:
- Não alterar WEEKS_DATA ou semanas.js
- Não criar novos arquivos
- Não adotar frameworks
- Semana 32 deve continuar renderizando corretamente
- CSS apenas em style.css (nunca inline)
- Events apenas via addEventListener (nunca onclick/onsubmit inline)
```

**Codex Prompt 2 — Fase 1: Reestruturação de Conteúdo (JS→JSON + content-loader)**

```
Projeto: FaithSync (Vanilla JS ES6, GitHub Pages)
Arquivos críticos: js/semanas.js, js/pages/semanas.js, js/const.js

Arquitetura destino (já decidida):
- Conteúdo textual: data/weeks/week-NN.json (um por semana)
- Renderizadores visuais: js/content/[livro].js (export function render(visualData))
- Orquestrador: js/content-loader.js (fetch JSON + import() visual dinâmico)

Tarefas:
1. Criar data/weeks/week-32.json com todo o conteúdo textual da semana 32 extraído de js/semanas.js
   - Campos: number, title, book, visualType, visualData, days (array 6), complement, reflection
   - days: cada item tem dayOfWeek, reading, context (sem date — calculada pelo app)
   - visualData: dados estruturados que a função render() do daniel.js vai consumir (não HTML/SVG)
2. Criar js/content/daniel.js com: export function render(visualData) { return '<svg>...</svg>'; }
   - Extrair a lógica de geração do SVG que estava em js/semanas.js (generateDanielTimeline)
   - Função recebe visualData do JSON, retorna SVG/HTML controlado
3. Criar schemas/week.schema.json com JSON Schema para data/weeks/*.json
   - Campos obrigatórios: number, title, book, days, complement, reflection
   - Campos opcionais: visualType, visualData, skeleton
4. Criar js/content-loader.js (ver fluxo na seção 10 do plano arquitetural):
   - fetch de /FaithSync/data/weeks/week-{NN}.json
   - validateWeekContent() antes de usar
   - import() dinâmico de js/content/{book}.js se visualType presente
5. Atualizar js/const.js: adicionar contentFile: "daniel" e weekFile: "week-32" no WEEKS_INDEX[32]
6. Atualizar js/pages/semanas.js: usar loadWeek(wn) de content-loader em vez de WEEKS_DATA direto
7. Remover js/semanas.js (conteúdo migrado)
8. Remover js/index.js, js/shared.js, js/semanas-logic.js, js/anotacoes.js APÓS confirmar grep limpo

Restrições:
- Semana 32 deve renderizar identicamente ao estado atual após migração completa
- Não alterar db.js, state.js, domain.js
- Não adicionar frameworks ou build tools
- JSON em data/weeks/ nunca deve conter código executável
- js/content/daniel.js nunca deve conter conteúdo textual (apenas lógica de renderização)
```

**Codex Prompt 3 — Fase 2: Validação**

```
Projeto: FaithSync
Arquivo a criar: js/validators.js

Criar módulo de validação com duas funções exportadas:

1. validateImportState(data): valida objeto de backup de progresso antes de doImport()
   - currentWeek: número inteiro 1-87
   - planStartDate: ISO date string válida
   - completedDays: objeto, chaves "N-D" (N=1-87, D=0-5), valores boolean
   - completedComplements: objeto, chaves "N" (N=1-87), valores boolean
   - weekCompletionHistory: objeto, chaves "N" (N=1-87), valores ISO string
   Retornar: { valid: boolean, errors: string[] }

2. validateWeekContent(week): valida JSON de semana carregado via fetch
   - number: inteiro
   - title: string não vazia
   - book: string não vazia
   - days: array (pode ser vazio se skeleton: true)
   - complement: objeto
   - reflection: objeto
   - Se visualType presente: visualData deve ser objeto
   - Se skeleton: true: campos de conteúdo podem estar vazios
   Retornar: boolean

Integrar:
- validateImportState em js/pages/index.js na função doImport (antes do Object.assign)
- validateWeekContent em js/content-loader.js (antes de retornar o dado)

Restrições:
- Funções puras (sem efeitos colaterais, sem acesso a DOM ou estado global)
- Não modificar lógica de renderização existente
```

**Codex Prompt 4 — Fase 4a: Esqueleto de Todas as 87 Semanas**

```
Projeto: FaithSync
Objetivo: criar esqueleto navegável de todas as 87 semanas antes de gerar conteúdo real

Tarefas:
1. Gerar 87 arquivos data/weeks/week-01.json até data/weeks/week-87.json
   - week-32.json já existe (não sobrescrever)
   - Cada arquivo esqueleto deve ter:
     { "number": N, "title": "[Título do bloco conforme WEEKS_INDEX]", "book": "[livro principal]",
       "skeleton": true, "days": [], "complement": {}, "reflection": {} }
   - Usar os dados de WEEKS_INDEX em js/const.js como fonte dos títulos e blocos

2. Atualizar TODOS os 87 registros em WEEKS_INDEX em js/const.js:
   - Adicionar contentFile: "[livro]" (nome do livro principal da semana)
   - Adicionar weekFile: "week-NN" (número com zero à esquerda)
   - Manter hasContent: true (JSON existe, mesmo que skeleton)

3. Testar: navegar para qualquer semana via semanas.html?week=N deve mostrar "Conteúdo em breve"
   e semana 32 deve continuar com conteúdo completo (não skeleton)

Restrições:
- NÃO gerar conteúdo real (dias, complemento, reflexão) — apenas esqueleto
- NÃO sobrescrever week-32.json
- Nomes de livros em snake_case minúsculo sem acentos (genesis, exodo, levítico → levitico)
```

---

### GEMINI — Prompts recomendados (geração de conteúdo bíblico)

**Gemini Prompt 1 — Geração de Conteúdo de Livro Bíblico (JSON)**

```
Contexto: FaithSync é um app de leitura bíblica familiar com plano de 87 semanas cobrindo toda a Bíblia.
A família: pai (dev sênior), mãe e filha de 9 anos. Conteúdo acessível para a criança, com profundidade para adultos.

Protótipo de referência: data/weeks/week-32.json (semana 32, Daniel 7-12). Siga a estrutura EXATA deste JSON.

Tarefa: Gerar os arquivos JSON para o livro de Gênesis (semanas 1-4):
- data/weeks/week-01.json → Gênesis 1-12 (Criação, Queda, Noé, Torre de Babel)
- data/weeks/week-02.json → Gênesis 13-25 (Abraão: chamado, promessa, sacrifício)
- data/weeks/week-03.json → Gênesis 26-36 (Isaque e Jacó: promessa e luta)
- data/weeks/week-04.json → Gênesis 37-50 (José: traição, redenção, providência)

Estrutura de cada JSON:
{
  "number": N,
  "title": "...",
  "book": "genesis",
  "visualType": "genesisPatriarchs",
  "visualData": { "patriarchs": [...], "locations": [...], "events": [...] },
  "days": [
    { "dayOfWeek": "Domingo", "reading": "Gênesis 1-2", "context": "..." },
    { "dayOfWeek": "Segunda", "reading": "Gênesis 3-5", "context": "..." },
    { "dayOfWeek": "Terça", "reading": "Gênesis 6-8", "context": "..." },
    { "dayOfWeek": "Quarta", "reading": "Gênesis 9-10", "context": "..." },
    { "dayOfWeek": "Quinta", "reading": "Gênesis 11", "context": "..." },
    { "dayOfWeek": "Sexta", "reading": "Gênesis 12", "context": "..." }
  ],
  "complement": {
    "intro": "...",
    "resources": [
      { "type": "thompson", "title": "Bíblia Thompson", "items": [...] },
      { "type": "scofield", "title": "Bíblia Scofield", "items": [...] },
      { "type": "atlas", "title": "Atlas Bíblico", "items": [...] },
      { "type": "personagem", "title": "Personagem: [Nome]", "items": [...] },
      { "type": "dicionario", "title": "Dicionário Bíblico", "items": [...] }
    ]
  },
  "reflection": {
    "verse": "...",
    "reference": "Gênesis X:Y",
    "question": "..."
  }
}

Restrições obrigatórias:
- NUNCA usar "Velho Testamento" — sempre "Antigo Testamento"
- NÃO incluir campo "date" nos dias (datas são calculadas pelo app em runtime)
- context de cada dia: máximo 200 palavras, linguagem clara para criança de 9 anos, profundidade para adultos
- Referências: ABNT para obras nacionais, Chicago/SBL para internacionais
- NÃO gerar HTML ou SVG — visualData deve ser objeto com dados estruturados puros (strings, arrays, números)
- Fidelidade bíblica obrigatória: nomes, locais, datas e eventos precisos
- JSON válido (sem comentários, sem trailing commas)
- Retornar um arquivo JSON por semana (4 arquivos separados)
```

**Gemini Prompt 2 — Validação de Conteúdo Gerado**

```
Contexto: FaithSync app de leitura bíblica. Arquivo(s) gerado(s): data/weeks/week-NN.json

Revisar cada arquivo JSON gerado e validar:
1. JSON válido e bem-formado
2. Campos obrigatórios presentes: number, title, book, days, complement, reflection
3. days é array de 6 objetos com dayOfWeek, reading, context (sem campo date)
4. complement tem intro (string) e resources (array com pelo menos 3 itens)
5. reflection tem verse, reference, question
6. visualType é string e visualData é objeto (nunca HTML/SVG)
7. Linguagem do context: acessível para criança de 9 anos (verificar vocabulário e complexidade)
8. Fidelidade bíblica: nomes, locais e eventos são precisos
9. Referências de recursos seguem ABNT/Chicago/SBL conforme origem
10. Nenhuma ocorrência de "Velho Testamento"
11. Não há código JavaScript, HTML ou SVG no JSON

Retornar: lista detalhada de problemas por arquivo (se houver) ou "Aprovado: [semana N]" para cada arquivo sem problemas.
```

---

## 20. Documento de Planejamento Final

**Criar:** `docs/FAITHSYNC_ARCH_2026.md` com o conteúdo completo deste plano (sem a seção de prompts internos)

**Atualizar:** `docs/FAITHSYNC_PLAN.md` com:

- Seção de Stack: corrigir contradição ("sem ES6" → "ES6 Modules nativos")
- Seção de Estrutura: adicionar `js/content/[livro].js`, `js/content-loader.js`, `js/validators.js`, `schemas/week.schema.json`
- Seção de Nomes: alinhar `ST` → nomes reais usados no código (`planState`, `weekNotes`, `currentUserId`)
- Seção de Regras: adicionar regra de `visualType`/`visualData` (não HTML/SVG bruto)
- Backlog: marcar Fase 3E como concluída tecnicamente (modal existe), manter no plano como "refinamento"
- Remover da lista de "concluídos": inline styles (ainda existem residuais)
- Adicionar: estratégia de conteúdo por livro e content-loader

---

## 21. Arquivos Críticos por Fase

### Fase 0

- `js/pages/semanas.js` — race condition
- `js/pages/index.js` — cards sem datas, botões, login duplicado
- `css/style.css` — grid desktop
- `js/ui.js` — separação header usuário/sair
- `index.html` — remover onsubmit inline

### Fase 1

- `js/semanas.js` → REMOVER (conteúdo migra para JSON + js/content/daniel.js)
- `data/weeks/week-32.json` → CRIAR (conteúdo textual da semana 32)
- `js/content/daniel.js` → CRIAR (apenas `export function render(visualData)`)
- `schemas/week.schema.json` → CRIAR (JSON Schema formal)
- `js/content-loader.js` → CRIAR (fetch JSON + import visual dinâmico)
- `js/pages/semanas.js` → usar content-loader em vez de import estático
- `js/const.js` → adicionar contentFile e weekFile no WEEKS_INDEX[32]
- REMOVER: `js/index.js`, `js/shared.js`, `js/semanas-logic.js`, `js/anotacoes.js`

### Fase 2

- `js/validators.js` → CRIAR
- `js/pages/index.js` → integrar validateImportState em doImport
- `js/content-loader.js` → integrar validateWeekContent
- `semanas.html` → fechar #page-content
- `index.html` → remover onsubmit, adicionar type nos botões

### Fase 3

- `css/style.css` → :focus-visible, modal desktop max-width
- `js/pages/index.js` → IntersectionObserver, memoize calculateWeekDates
- `assets/faithsync-logo.webp` → CRIAR (otimizada < 50KB)
- `js/ui.js` → modais com ARIA completo (role, aria-modal, foco, Escape)

### Fase 4a

- `data/weeks/week-01.json` até `data/weeks/week-87.json` → CRIAR (esqueleto, exceto week-32)
- `js/const.js` → atualizar todos os 87 registros WEEKS_INDEX com contentFile + weekFile

### Fase 5

- `package.json` → CRIAR (scripts de validação)
- Script de validação de schema (Node.js puro)

---

_Planejamento concluído. Nenhuma implementação realizada. Aguardando aprovação._
