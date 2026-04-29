# FaithSync — Documento de Projeto

## 1. Visão Geral
Objetivo: Plano de leitura bíblica cobrindo toda a Bíblia (Gênesis ao Apocalipse) em 87 semanas, totalizando 1.189 capítulos.
Família alvo: pai (dev sênior), mãe, filha de 9 anos.
Contexto de uso: Leitura diária e estudo semanal. O conteúdo bíblico e as reflexões são rigorosamente calibrados para serem acessíveis a uma criança de 9 anos, mantendo a profundidade para os pais.

## 2. Stack e Infraestrutura
- **Front-end:** HTML + CSS + JS vanilla. Sem uso de framework, sem módulos ES6 e sem build step/npm em runtime.
- **Back-end/Database:** Supabase (Auth + PostgreSQL + RLS).
  - ID do Projeto: `shhtdamjxoxxxsyeqhhi`
  - URL: `https://shhtdamjxoxxxsyeqhhi.supabase.co`
  - Região: sa-east-1
- **Hospedagem:** GitHub Pages (estático). URL: `https://filipetbh7.github.io/FaithSync/`
- **Deploy:** Automático via GitHub Pages. Todo push para a branch `main` reflete em produção.

## 3. Estrutura de Arquivos
```text
FaithSync/
├── .claude/              # Regras e logs do Claude (não versionar)
├── .env                  # Variáveis locais (não versionar)
├── .git/                 # Git
├── .gitignore            # Ignora secrets e pastas locais
├── README.md             # Informações básicas
├── index.html            # Página inicial (progresso global, login, histórico)
├── semanas.html          # Interface de leitura e anotações semanais
├── anotacoes.html        # Central de anotações global
├── manifest.json         # PWA Manifest
├── favicon.ico           # Fallback para browsers antigos
├── favicon.svg           # Ícone vetorial do projeto
├── assets/               # Imagens (ex: faithsync-logo.jpg)
├── css/                  
│   └── style.css         # Estilos globais (único CSS do projeto)
├── docs/                 
│   └── FAITHSYNC_PLAN.md # Fonte de verdade (ESTE ARQUIVO)
└── js/                   
    ├── shared.js         # Constantes, utils e state global (ST)
    ├── db.js             # Única camada de acesso ao banco e Auth
    ├── index.js          # Lógica da index.html
    ├── semanas-logic.js  # Lógica da semanas.html
    ├── semanas.js        # Conteúdo estruturado (WEEKS_DATA e index)
    ├── anotacoes.js      # Lógica da anotacoes.html
    └── content/          # Conteúdo dividido por livro (ex: genesis.js)
```
**Regras de estrutura:** HTMLs obrigatoriamente na raiz, JS em `js/`, CSS em `css/`, assets em `assets/`, documentação em `docs/` e o conteúdo gerado em `js/content/[livro].js`.

## 4. Arquitetura e Fluxo de Dados
**Estado Global (em memória):**
- `ST`: Objeto que armazena todo o progresso (ex: `completedDays`, `completedComplements`, `weekCompletionHistory`, `currentWeek`, `planStartDate`).
- `NT_NOTES`: Objeto contendo as anotações do usuário (chave = número da semana).
- `UID`: UUID do usuário logado (armazenado globalmente no `db.js`).
*(Nota: Nomes destas variáveis estão sujeitos a refatoração, conforme Prompt E do backlog).*

**Acesso a Dados:**
`js/db.js` atua como a única camada que se comunica com o Supabase. Nenhuma query deve vazar para os arquivos de UI. O fluxo obedece: login → `dbLoad` (popula variáveis globais) → renderização na tela → ações do usuário → `dbSave` / `dbSaveNote`.

**REGRA CRÍTICA DE ESTADO (ST.currentWeek):**
O atributo `ST.currentWeek` define até onde o progresso contínuo do usuário chegou.
- **NUNCA** mude ou atribua `ST.currentWeek = n` em rotinas de navegação visual como `navWk()` ou ao ler a URL.
- O `ST.currentWeek` SÓ AVANÇA através de `checkWeekCompletion()`, ou seja, apenas quando o usuário marcar os 6 dias e a complementação de uma semana.
- A navegação visual de semanas ocorre usando apenas uma variável local `CW` (declarada em `semanas-logic.js`), que **não é persistida**.

## 5. Banco de Dados Supabase
**Schema de Tabelas:**
- `progress`: Armazena o estado do plano.
  - Colunas: `user_id` (uuid, PK, ref auth.users), `data` (jsonb contendo o objeto `ST`), `updated_at` (timestamptz).
- `notes`: Armazena anotações.
  - Colunas: `user_id` (uuid, ref auth.users), `week_number` (int), `content` (text), `updated_at` (timestamptz).
  - PK: `(user_id, week_number)`.

**Políticas de RLS (Row Level Security):**
- Acesso total para a role `authenticated` onde `auth.uid() = user_id`.
- Role `anon` **sem acesso** algum às tabelas (leitura ou escrita).

**Segurança resolvida/analisada no Supabase (R11):**
- `rls_auto_enable` EXECUTE do PUBLIC: **Revogado** (alerta de segurança real eliminado).
- Proteção "Leaked Password": Indisponível no free tier. Trata-se de uma limitação da plataforma, não de um erro de configuração. Como o app é familiar e para um público controlado, o RLS como defesa principal é suficiente; contramedidas extras no código não são necessárias (overengineering).

**Plano de Migração (Fase 3H):**
Futuramente, a coluna `user_id` será substituída por `family_id` para suportar grupos familiares (tabelas `families` e `family_members` já projetadas).

## 6. Regras e Convenções — Obrigatórias para Agentes
Qualquer contribuição ou refatoração DEVE respeitar estas regras inegociáveis:
- **Estado de Semana:** NUNCA atribuir `ST.currentWeek = n` em rotinas de navegação (como `navWk()` ou equivalentes).
- **CSS Inline:** NUNCA adicionar `<style>` inline nos HTMLs. Classes devem ser usadas no `style.css`.
- **Eventos DOM:** NUNCA usar `onclick` (ou similares) em atributos HTML (ex: `<button onclick="...">`). Use sempre `data-nav="..."` ou `addEventListener` via JS.
- **Nomenclatura Bíblica:** SEMPRE usar "Antigo Testamento" ou sua sigla "AT". NUNCA use "Velho Testamento" ou a sigla "VT".
- **XSS / Escapamento:** SEMPRE usar a função global `esc()` antes de injetar texto dinâmico (inclusive de WEEKS_DATA) no HTML usando `.innerHTML`.
- **Validação:** SEMPRE validar o schema em `doImport()` com as funções de validação locais antes de aplicar qualquer dado modificado no objeto global `ST`.
- **Encapsulamento de ID:** SEMPRE usar `getUID()` do `db.js` para acessar o UUID do usuário atual logado, não o objeto de sessão bruto no meio das funções de UI.
- **Nomenclatura de Código:** Uso de camelCase para variáveis/funções em JS. Comentários explicando REGRAS DE NEGÓCIO devem ser escritos em **Português (BR)**.
- **Arquitetura Pura:** Sem módulos ES6 (`type="module"` ou exports/imports) para evitar CORS em ambiente local de duplo-clique. Sem uso de npm, build step (webpack/vite) ou frameworks (React/Vue).

## 7. Estado Atual do Projeto (2026-04-29)
**Fases e Requisitos Concluídos:**
- Fase 1 (correções imediatas): Concluída.
- Fase 2 (separação de arquivos): Concluída.
- Fases 0–4 do plano de melhoria original: Concluídas em 2026-04-29.
- Funcionalidades R1 a R11: Concluídas/Analisadas em 2026-04-29.

**Pendências Atuais:**
- *Nenhuma funcionalidade bloqueante no momento.*

**Backlog de Qualidade (Agendado — Não Iniciado):**
- **E:** Renomear variáveis globais para legibilidade (`ST` → `planState`, `NT_NOTES` → `weekNotes`, `UID` → `currentUserId`).
- **F:** Remover `<style>` inline (como `display:none`) que representam estado inicial do DOM, substituindo-os por uso de classes CSS puras.
- **G:** Componentizar header, nav e progress indicators extraindo renderização do HTML e colocando em um script JS compartilhado (eliminar duplicação entre `index.html`, `semanas.html` e `anotacoes.html`).
- **H:** Clean Architecture — separar `js/state/app-state.js` e `js/domain/plan-domain.js` (depende das refatorações E e G acima).

## 8. Backlog de Funcionalidades
Status das fases da trilha 3A–3I:
- **3A manifest.json:** CONCLUÍDO
- **3B Iniciar/Apagar Plano:** CONCLUÍDO
- **3C Datas dinâmicas + atraso:** CONCLUÍDO (calculateWeekDates e nextSunday já implementadas)
- **3D Bug AT/NT global:** CONCLUÍDO (renderPH usa getBook() para iterar sobre concluídos)
- **3E Modal materiais:** PENDENTE
- **3F Apagar anotações:** CONCLUÍDO (dbDeleteAllNotes implementado em db.js)
- **3G Histórico de conclusões:** PENDENTE
- **3H Grupos familiares:** PENDENTE (depende de migração do db.js — infra inicial já mapeada)
- **3I Notificações push:** PENDENTE (depende da conclusão de 3H)

## 9. Geração de Conteúdo Bíblico
A Bíblia (1.189 capítulos) é dividida em blocos de densidade controlada: narrativo fluido (1.5 caps/dia), narrativo com lei (1.0 caps/dia) e denso/profético (0.5 caps/dia).
O arquivo de referência completa e funcional é `semanas.js` na Semana 32 (Daniel 7-12).

**Estrutura do Objeto (Baseado na Semana 32):**
```javascript
WEEKS_DATA[32] = {
  number: 32,
  title: "As Visões Proféticas de Daniel",
  dateStart: new Date(2026, 9, 25), 
  dateEnd: new Date(2026, 9, 31),
  range: "Daniel 7 – Daniel 12",
  complementDay: new Date(2026, 9, 31),
  chaptersStart: 857,
  chaptersEnd: 862,
  days: [
    {
      dayOfWeek: "Domingo",
      date: new Date(2026, 9, 25),
      reading: "Daniel 7",
      verses: null,
      context: "A visão das quatro bestas...",
      isToday: false
    }
    //... (até Sexta-feira)
  ],
  complement: {
    date: new Date(2026, 9, 31),
    intro: "Introdução à complementação no sábado...",
    resources: [
      {
        type: "thompson",
        title: "Bíblia Thompson",
        items: [ "Cadeia temática nº 3562...", "Nota de estudo..." ]
      }
    ]
  },
  reflection: {
    verse: "\"Os entendidos resplandecerão...\"",
    reference: "Daniel 12:3",
    question: "Pergunta adequada para criança de 9 anos para discussão."
  },
  visual: generateDanielTimeline() // Injeção de string HTML/SVG gerada por função
};
```
O conteúdo será gerado sob demanda, livro-a-livro. Cada sessão gera semanas para um livro em `js/content/[livro].js`. As datas são dinâmicas; use placeholder (como em Daniel).

**Comando modelo (Prompt) para geração:**
```text
Gere as semanas do plano FaithSync para o livro de Gênesis (50 capítulos).
Semanas a gerar: 1 a 5.
Última semana existente no arquivo: semana 32 (Daniel 7-12).
Densidade: narrativo fluido (1.5 capítulos/dia).
Família: pai (dev sênior), mãe, filha de 9 anos.
Materiais disponíveis: Thompson, Scofield, Atlas Reinke, Atlas Zondervan, 
Bíblia Judaica Completa, Dicionário Crescer, Enciclopédia Personagens Matheus Soares,
LaHaye (escatologia apenas em proféticos).
Use datas placeholder (new Date(2026,0,1)) — serão recalculadas dinamicamente.
Siga exatamente a estrutura de WEEKS_DATA definida em semanas.js.
Gere o JS puro, sem explicações, pronto para append ao arquivo.
```

## 10. Segurança e Configurações
- **Autenticação e Permissões:** O sistema baseia-se intencionalmente em publicar a Chave Pública Anon (`SUPABASE_ANON`) via JS, com defesa real inteiramente baseada em políticas RLS no banco de dados.
- **Validação de RLS:** Realizada e validada em 2026-04-28 via agent MCP. As `policies` estão fechadas, e a role `anon` não possui acesso direto de leitura/escrita nas tabelas `progress` e `notes`.
- **Criptografia e Integridade (CDN):** Supabase injetado via CDN possui SRI sha384 fixado no arquivo HTML (`@2.105.1/dist/umd/supabase.min.js`), fixado e concluído na Fase R2.
- **Versionamento de Secrets:** Absolutamente nada sob as máscaras `.env`, `.claude/` ou `service_role key` deve subir para controle de versão.
- **Supabase Alerts (R11):** O `rls_auto_enable` foi revogado. O alerta de "Leaked password protection" é ignorado intencionalmente, pois a funcionalidade não está disponível no plano gratuito do Supabase e o RLS já provê a defesa principal para este contexto de app familiar.

## 11. Checklist Pré-Push
Antes de fazer qualquer commit em `main` (produção via GitHub Pages), execute estas verificações rigorosamente:
1. **Secrets:** Nenhum arquivo sensível foi stageado. Execute `git ls-files | grep -E "\.env|\.claude"` e confira o output limpo.
2. **Nomenclatura (Velho Testamento):** Garantir que "Velho Testamento" (ou VT) nunca vaze. Execute `grep -rni "velho testamento"` e confira o output limpo.
3. **CSS Inline:** Não deve haver tags `<style>` inline perdidas em arquivos HTML. Execute `grep -n "<style>" *.html`.
4. **Eventos Inline:** Não deve haver mapeamento de eventos inline perdidos. Execute `grep -n "onclick" *.html`.
5. **Teste de Renderização:** Abra `semanas.html?week=32` e valide visualmente se a semana 32 (Daniel) carrega normalmente sem erros no Console.
6. **Fluxos Básicos:** O Login loga corretamente. O Logout limpa a sessão local.
7. **Persistência de Progresso:** Marcar uma checkbox na página salva no Supabase (verifique aba Network ou faça recarregamento para confirmar que a check não sumiu).
8. **Persistência de Anotações:** Digite e observe o timeout salvar ou use o botão Salvar, verifique a página `anotacoes.html` se persistiu.

