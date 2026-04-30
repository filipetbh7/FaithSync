# Code Review FaithSync - 2026-04-29

## 1. Resumo executivo

O FaithSync está em uma boa fase para um projeto estático familiar publicado no GitHub Pages: a base é pequena, compreensível, usa HTML/CSS/JavaScript Vanilla com ES6 Modules, separa parte relevante da lógica em `state.js`, `domain.js`, `db.js`, `ui.js` e `js/pages/*.js`, e mantém o Supabase concentrado em uma camada própria. A semana 32 cumpre bem o papel de protótipo funcional principal.

A arquitetura atual é adequada para o tamanho do projeto, mas há débitos que já começaram a pesar: arquivos legados duplicados continuam versionados, regras documentadas como concluídas ainda não batem totalmente com a implementação, HTML gerado por string aparece em muitos pontos, estilos inline ainda existem, a validação de importação de backup é parcial, e a modelagem de conteúdo mistura dados, datas, HTML/SVG e funções JavaScript no mesmo arquivo.

Minha recomendação principal é incremental: manter Vanilla JS agora, limpar sobras da migração, endurecer validação/semântica/acessibilidade, consolidar padrões de renderização e só depois considerar Vite. Não recomendo React/Vue/Svelte/Tailwind agora. JSON pode melhorar a separação de conteúdo no futuro, mas uma migração total imediata não paga o custo neste momento; o melhor caminho é preparar um schema e migrar primeiro apenas conteúdo realmente estático.

Validações feitas nesta revisão:

- `node --check` passou para `js/pages/index.js`, `js/pages/semanas.js`, `js/pages/anotacoes.js`, `js/semanas.js`, `js/const.js`, `js/db.js`, `js/domain.js`, `js/ui.js`, `js/utils.js` e arquivos legados.
- `git ls-files` não lista `.env` nem `.claude/`, apesar de existirem localmente.
- Busca textual confirmou scripts ativos apenas em `js/pages/*.js` nos HTMLs.
- Busca textual confirmou ocorrência de `onsubmit`, `style=`, `onclick`, `innerHTML`, configs Supabase públicas e arquivos JS legados versionados.

## 2. Pontos positivos encontrados

- Stack simples e coerente com GitHub Pages: HTML raiz, CSS único e módulos ES6 sem build obrigatório.
- Supabase isolado em `js/db.js`, com `progress` e `notes` acessados por uma camada única (`js/db.js:30`, `js/db.js:47`, `js/db.js:79`, `js/db.js:104`, `js/db.js:131`).
- Uso de SRI no CDN do Supabase nos HTMLs (`index.html:12`, `semanas.html:12`, `anotacoes.html:12`).
- Estado global nomeado de forma melhor que o plano antigo (`planState`, `weekNotes`, `currentUserId` em `js/state.js:1`).
- Regra crítica de semana preservada na navegação: `navWk()` altera `CW`, não `planState.currentWeek` (`js/pages/semanas.js:16`).
- `checkWeekCompletion()` concentra o avanço de `currentWeek` (`js/domain.js:50`, `js/domain.js:73`).
- Semana 32 tem estrutura rica e serve bem como contrato visual/conteudístico (`js/semanas.js:4`, `js/semanas.js:148`, `js/semanas.js:153`).
- CSS usa variáveis globais e media queries simples (`css/style.css:2`, `css/style.css:220`, `css/style.css:225`, `css/style.css:234`).
- `.gitignore` cobre `.env`, `.claude/`, IDEs, Node, build e logs.
- Não há conteúdo bíblico completo gerado, coerente com a restrição atual.

## 3. Problemas por prioridade

### Crítico

Nenhum problema crítico confirmado apenas por leitura estática. Não encontrei service role key versionada, `.env` versionado, query Supabase fora de `db.js` ou quebra sintática nos módulos principais.

### Alto

1. Possível login duplicado por combinação de `click`, `keydown`, `submit`, botão sem `type` e `onsubmit` inline.
   - Evidência: `index.html:20`, `index.html:22`, `js/pages/index.js:241`, `js/pages/index.js:242`, `js/pages/index.js:243`.
   - Impacto: pressionar Enter ou clicar em "Entrar" pode disparar `doLogin()` mais de uma vez, gerando chamadas duplicadas ao Supabase e estados de botão inconsistentes.
   - Recomendação: remover `onsubmit` inline, definir `type="submit"` no botão, tratar apenas o evento `submit` do formulário e remover o `keydown` manual.

2. Arquivos legados duplicados continuam versionados e podem confundir manutenção.
   - Evidência: `git ls-files` inclui `js/index.js`, `js/anotacoes.js`, `js/semanas-logic.js`, `js/shared.js`; os HTMLs apontam apenas para `js/pages/index.js`, `js/pages/semanas.js`, `js/pages/anotacoes.js`.
   - Impacto: agentes ou humanos podem editar o arquivo errado; `shared.js` duplica constantes e chave anon; `semanas-logic.js` tem uma versão antiga de `doImport()` que tentava reatribuir `planState`.
   - Recomendação: em uma fase dedicada, confirmar que não há uso externo e remover ou arquivar esses arquivos fora do deploy.

3. Validação de backup/importação ainda é parcial.
   - Evidência: `validateImportState()` só valida forma geral de objetos e `currentWeek` (`js/pages/semanas.js:277`); `completedDays` e `completedComplements` entram sem validar chaves/valores (`js/pages/semanas.js:279`, `js/pages/semanas.js:282`).
   - Impacto: dados inválidos podem poluir o estado persistido no Supabase, quebrar progresso, datas e histórico.
   - Recomendação: validar chave `semana-dia`, faixa 1-87, dia 0-5, boolean estrito, complements 1-87, histórico e `planStartDate`.

4. `wk.visual` injeta HTML/SVG bruto.
   - Evidência: `renderVisual()` concatena `wk.visual` diretamente (`js/pages/semanas.js:104`, `js/pages/semanas.js:107`); `visual` vem de função no conteúdo (`js/semanas.js:153`, `js/semanas.js:156`).
   - Impacto: hoje é conteúdo local confiável, então o risco é controlado. Mas se conteúdo passar a ser gerado por agente ou carregado de JSON, vira superfície de XSS/manutenção.
   - Recomendação: tratar visual como exceção explícita: permitir apenas componentes/IDs conhecidos, ou separar `visualType` + dados e renderizar SVG por função de UI.

5. `semanas.html` abre `#page-content` e não fecha antes de `</body>`.
   - Evidência: abertura em `semanas.html:16`, conteúdo até `semanas.html:29`, sem `</div>` antes de `semanas.html:30`.
   - Impacto: navegador corrige automaticamente, mas o DOM fica menos previsível e dificulta validação/acessibilidade.
   - Recomendação: fechar explicitamente o container antes do script ou mover script para fora do container.

### Médio

1. O plano tem inconsistências com a implementação real.
   - Evidência: o plano diz "sem módulos ES6" (`docs/FAITHSYNC_PLAN.md:9`), mas também exige ES6 Modules (`docs/FAITHSYNC_PLAN.md:97`) e os HTMLs usam `type="module"`.
   - Evidência: plano diz que remoção de inline style foi concluída (`docs/FAITHSYNC_PLAN.md:111`), mas há estilos inline em HTML e JS (`index.html:31`, `index.html:39`, `index.html:46`, `semanas.html:21`, `semanas.html:25`, `js/ui.js:127`, `js/pages/semanas.js:95`, `js/pages/semanas.js:123`).
   - Evidência: plano ainda fala em `ST`, `NT_NOTES`, `UID` (`docs/FAITHSYNC_PLAN.md:54`), mas o código já usa `planState`, `weekNotes`, `currentUserId`.

2. Muitas renderizações usam `innerHTML` com concatenação de strings.
   - Evidência: `js/pages/semanas.js:33`, `js/pages/semanas.js:37`, `js/pages/index.js:94`, `js/pages/index.js:192`, `js/pages/anotacoes.js:49`, `js/ui.js:168`.
   - Impacto: aumenta risco de XSS e regressões em markup. O uso de `esc()` reduz muito o risco para texto, mas não cobre atributos, classes dinâmicas e HTML proposital.
   - Recomendação: manter `innerHTML` apenas em blocos controlados e criar helpers para texto/atributos/classes.

3. Dados de progresso por capítulo são aproximados.
   - Evidência: `renderPH()` conta dias concluídos como capítulos e tenta inferir capítulo pela leitura textual (`js/ui.js:7`, `js/ui.js:24`, `js/ui.js:34`).
   - Impacto: leituras como "Daniel 9:1-19" e "Daniel 10-11" não correspondem exatamente a um capítulo por dia; progresso global pode ficar semanticamente impreciso.
   - Recomendação: modelar `chapterRefs` ou `chapterCount` por dia antes de gerar mais conteúdo.

4. Datas estáticas e datas dinâmicas coexistem sem contrato claro.
   - Evidência: `WEEKS_INDEX` contém datas fixas (`js/const.js:75` em diante), `WEEKS_DATA` também (`js/semanas.js:8`), mas `calculateWeekDates()` recalcula datas por `planStartDate` (`js/domain.js:14`).
   - Impacto: páginas podem exibir datas dinâmicas em uma tela e datas fixas em outra se um fluxo usar `wi.ds`/`wi.de`.
   - Recomendação: documentar que datas em conteúdo são placeholder e centralizar a data exibida em `calculateWeekDates()`.

5. Acessibilidade dos controles customizados precisa melhorar.
   - Evidência: checkboxes são `div.dchk` clicáveis (`js/pages/semanas.js:92`, `js/pages/semanas.js:121`, `css/style.css:143`).
   - Impacto: teclado, leitores de tela e estados `checked` não são naturais.
   - Recomendação: usar `<button>` com `aria-pressed` ou `<input type="checkbox">` estilizado.

6. Modais não implementam foco, Escape e atributos de diálogo.
   - Evidência: modal em HTML (`index.html:42`, `index.html:50`) e abertura/fechamento em `js/pages/index.js:164`, `js/pages/index.js:209`.
   - Impacto: navegação por teclado e leitor de tela ficam frágeis.
   - Recomendação: `role="dialog"`, `aria-modal="true"`, foco inicial, retorno de foco e Escape.

7. CSS único está aceitável, mas já começa a acumular responsabilidades.
   - Evidência: `style.css` tem 19 KB e cobre shell, login, index, semanas, anotações, modais e responsividade.
   - Impacto: ainda não é grande demais, mas fica mais difícil localizar estilos conforme novas páginas entram.
   - Recomendação: sem build, manter arquivo único por enquanto; se Vite entrar, dividir em módulos CSS por página.

### Baixo

1. Nomes de classes são muito abreviados (`wc`, `dc`, `rb`, `cttl`, `npg`).
   - Impacto: economiza bytes, mas reduz legibilidade.
   - Recomendação: migrar aos poucos para nomes mais semânticos quando tocar nos blocos.

2. Comentários estão mistos em inglês/português.
   - Evidência: `js/db.js` usa comentários em inglês ("Load Progress", "Save progress").
   - Recomendação: regras de negócio em PT-BR; comentários técnicos curtos onde agregam.

3. `atPct()` e `ntPct()` parecem não ser usados.
   - Evidência: exportados em `js/utils.js:9`, `js/utils.js:13`, sem uso encontrado.
   - Recomendação: remover quando fizer limpeza de código morto.

4. Imagem principal tem quase 500 KB.
   - Evidência: `assets/faithsync-logo.jpg` tem 494222 bytes.
   - Impacto: aceitável, mas pesa no login mobile.
   - Recomendação: gerar versão WebP/JPEG otimizada e usar dimensões explícitas.

5. `manifest.json` só tem ícone SVG.
   - Impacto: PWA installability pode variar entre navegadores.
   - Recomendação: adicionar PNGs 192/512 futuramente.

## 4. Recomendações de Clean Code

- Priorizar remoção de arquivos mortos: `js/index.js`, `js/anotacoes.js`, `js/semanas-logic.js`, `js/shared.js`.
- Padronizar eventos com `addEventListener`; evitar `element.onclick = ...` em código novo.
- Consolidar fluxo de login em um único evento `submit`.
- Trocar strings longas de HTML por helpers pequenos quando houver dados dinâmicos.
- Criar constantes para chaves de estado (`completedDays`, `completedComplements`) e para limites (`0..5`, `1..87`) onde há validação.
- Separar cálculo de progresso de renderização. `renderPH()` hoje faz UI e regra de progresso no mesmo lugar.
- Remover funções não usadas após confirmação: `atPct()`, `ntPct()` e arquivos legados.
- Usar nomes descritivos em novos códigos: `currentWeekView` em vez de `CW`, `renderProgressHeader` em vez de `renderPH`, `formatShortDate` em vez de `fmtD`.
- Manter comentários em PT-BR quando explicarem regra de negócio, não mecânica do código.

## 5. Recomendações de Clean Architecture

Arquitetura atual sugerida, sem framework:

- `js/state.js`: estado em memória e mutações explícitas.
- `js/domain.js`: regras puras de plano, datas, conclusão, progresso e validação.
- `js/db.js`: Supabase Auth, `progress`, `notes`.
- `js/content/` ou `js/semanas.js`: conteúdo bíblico prototipado.
- `js/ui.js`: shell compartilhado e componentes comuns.
- `js/pages/*.js`: orquestração de página.
- `css/style.css`: estilos globais enquanto não houver build.

Mudanças incrementais recomendadas:

- Mover validação de backup para `js/domain.js` ou `js/validators.js`.
- Extrair cálculo de progresso AT/NT/livro de `ui.js` para domínio.
- Criar contrato explícito para `WeekData`, mesmo que seja apenas JSDoc no início.
- Separar `visual` de `WEEKS_DATA` como `visualId`/`visualData` em fase futura.
- Evitar introduzir camadas genéricas como "repositories/usecases/controllers" agora; isso seria overengineering para o porte atual.

## 6. Responsividade desktop, tablet e mobile

Pontos bons:

- Grid mobile-first em index, dias e recursos (`css/style.css:220`, `css/style.css:225`, `css/style.css:234`).
- Botões têm mínimo de 44px (`css/style.css:13`), bom para toque.
- Layout usa `max-width:900px`, adequado para leitura.

Recomendações:

- Testar visualmente `index.html`, `semanas.html?week=32` e `anotacoes.html` em larguras 360, 390, 768 e 1366.
- Garantir que `.wnav` não fique comprimido em telas muito estreitas (`css/style.css:117`).
- Revisar textos com `letter-spacing` alto em botões pequenos (`css/style.css:14`, `css/style.css:118`, `css/style.css:188`).
- Dar estado visível de foco (`:focus-visible`) para botões, cards clicáveis, modais e links.
- Em `.dgrd`, confirmar que três cards por linha no desktop não reduz demais a leitura de contexto (`css/style.css:236`).
- Para modais em mobile, garantir altura e scroll interno sem perder botão fechar (`css/style.css:53`, `css/style.css:54`).

## 7. Recomendações específicas para HTML

- Corrigir `semanas.html` fechando `#page-content`.
- Remover `onsubmit="return false"` de `index.html:20`.
- Definir `type` em todos os botões:
  - `type="submit"` no botão de login.
  - `type="button"` em botões que não submetem formulário.
- Remover estilos inline de `index.html:31`, `index.html:39`, `index.html:46`, `semanas.html:21`, `semanas.html:25`.
- Melhorar hierarquia de headings: páginas injetam `h1` no shell, mas seções internas usam `div` como título. Para leitura assistiva, considerar `h2/h3` em seções principais.
- Modais devem ter `role="dialog"`, `aria-modal="true"` e `aria-labelledby`.
- Toast já tem `aria-live`, ponto positivo (`index.html:70`, `semanas.html:27`, `anotacoes.html:22`).
- Login tem labels corretos para e-mail e senha (`index.html:20`, `index.html:21`).
- `anotacoes.html` coloca `<script>` dentro de `<main>` (`anotacoes.html:24`); funciona, mas é mais limpo mover para antes de `</body>`.

## 8. Recomendações específicas para CSS

- Manter variáveis CSS globais.
- Criar classes para estilos inline atuais:
  - `.btn-history`
  - `.materials-actions`
  - `.history-list`
  - `.week-number-box`
  - `.delay-banner-wrap`
  - `.inline-reading-verses`
  - `.completion-check-wrap`
  - `.progress-book-label`
- Adicionar `:focus-visible` para `.tbtn`, `.wnavb`, `.abtn`, `.lbtn`, `.wc`, `.dc`, `.modal-close`.
- Evitar `!important` exceto em utilitários reais; `.abtn.svok` usa três `!important` (`css/style.css:192`).
- Nomear classes novas de forma mais semântica, mantendo as atuais até uma refatoração segura.
- Evitar aumentar muito o arquivo único; quando passar de cerca de 30-40 KB ou houver mais páginas, dividir CSS pode valer a pena, especialmente se Vite for adotado.

## 9. Recomendações específicas para JavaScript

- Remover import não usado `checkWeekCompletion` de `js/pages/index.js:3`.
- Consolidar login:
  - Remover listener de click do botão.
  - Remover keydown no campo senha.
  - Tratar apenas `submit`.
- Em `renderIndex()` e `renderNotes()`, preferir `button`/`article` e listeners dedicados em vez de cards `div` totalmente clicáveis.
- Em `renderDays()`, usar controle acessível real para marcação, não `div`.
- Em `doImport()`, validar todos os campos antes de `Object.assign(planState, safeState)` (`js/pages/semanas.js:246`).
- Em `importValidNotes()`, considerar limite de tamanho de anotação por semana.
- Em `dbLoad()`, alinhar default de `currentWeek`: o estado inicial é 1 (`js/state.js:5`), mas carregamento sem valor cai para 32 (`js/db.js:41`). Isso pode ser intencional por causa do protótipo, mas precisa estar documentado como comportamento temporário.
- Em `renderPH()`, extrair cálculo de progresso para função pura testável.
- Em `renderVisual()`, não aceitar HTML arbitrário quando o conteúdo vier de JSON ou fonte externa.

## 10. Recomendações sobre nomes e comentários em PT-BR

Nomes atuais bons:

- `planState`
- `weekNotes`
- `currentUserId`
- `calculateWeekDates`
- `checkWeekCompletion`
- `dbSaveNote`
- `dbDeleteAllNotes`

Nomes a melhorar futuramente:

- `renderPH` -> `renderProgressHeader`
- `fmtD` -> `formatShortDate`
- `fmtDFull` -> `formatFullDate`
- `CW` -> `currentViewedWeek`
- `wk`, `wn`, `wi` -> usar apenas em escopos muito pequenos; em funções maiores, preferir `weekData`, `weekNumber`, `weekIndexItem`.
- Classes CSS abreviadas podem ser mantidas por ora, mas novas classes devem ser semânticas.

Comentários:

- Comentários de regra de negócio devem ser em Português PT-BR.
- Comentários técnicos óbvios devem ser removidos.
- Comentários úteis a adicionar:
  - Explicar que `currentWeek` é progresso persistido, não navegação.
  - Explicar que datas em `WEEKS_DATA` são placeholder quando `planStartDate` existe.
  - Explicar por que a anon key do Supabase é pública e depende de RLS.

## 11. Recomendações sobre .gitignore e GitHub Pages

Situação atual:

- `.gitignore` cobre `.env`, `.env.local`, `.env.*.local`, `.claude/`, IDEs, `node_modules/`, `dist/`, `build/`, logs e temporários.
- `git ls-files` não mostrou `.env` nem `.claude/`.
- A chave `SUPABASE_ANON` está versionada em `js/const.js:2`, o que é esperado em apps públicos com Supabase, desde que RLS esteja correto.

Recomendações:

- Manter `.env` fora do Git.
- Adicionar, se fizer sentido localmente:
  - `.antigravity/`
  - `.history/`
  - `*.local`
  - `coverage/`
  - `playwright-report/`
  - `test-results/`
- Documentar no README que `SUPABASE_ANON` é pública por design e que a segurança real está em RLS.
- Não colocar service role key em nenhum arquivo do projeto.
- Não depender de validação frontend para autorização. O plano já acerta ao colocar RLS como defesa real.
- GitHub Pages é compatível com o modelo atual e também com Vite se `base: '/FaithSync/'` for configurado futuramente.

## 12. Segurança no frontend

Riscos reais:

- HTML/SVG dinâmico em `wk.visual` se o conteúdo deixar de ser 100% confiável.
- Importação de backup com validação parcial.
- `innerHTML` amplo, mitigado por `esc()` em textos, mas ainda sensível a exceções.
- CDN do Supabase é dependência externa. SRI reduz risco, mas se a versão precisar atualizar, o hash deve ser atualizado conscientemente.

Riscos aceitáveis:

- `SUPABASE_ANON` público: normal para Supabase no frontend.
- Dados bíblicos públicos no repositório: esperado.
- Auth no frontend: esperado, desde que RLS esteja correto.

Não exagerar:

- Não há necessidade de esconder a anon key via backend próprio neste estágio.
- Não há necessidade de migrar para SSR/serverless apenas por segurança.
- Não há necessidade de criptografar anotações no frontend para o contexto familiar atual, salvo nova exigência de privacidade.

## 13. Performance e carregamento

Situação atual:

- JS total ainda é pequeno/moderado, mas há arquivos legados versionados que não são carregados pelos HTMLs.
- CSS único tem 19 KB, aceitável.
- Imagem de logo tem cerca de 494 KB, ponto mais visível no carregamento inicial.
- Supabase vem de CDN e é carregado em todas as páginas.

Recomendações:

- Otimizar `assets/faithsync-logo.jpg`.
- Adicionar `width` e `height` na imagem do login para reduzir layout shift.
- Quando mais semanas forem geradas, evitar carregar todo o conteúdo bíblico em um único `semanas.js`.
- Usar import dinâmico por semana/livro se continuar com JS, ou `fetch()` por JSON se migrar conteúdo.
- Evitar recalcular `calculateWeekDates()` repetidamente dentro da mesma renderização. Hoje é barato, mas fácil de otimizar passando `weekDates` como parâmetro.
- Evitar anexar muitos handlers individuais se o número de cards crescer muito; delegação por container pode simplificar.

## 14. Testabilidade

Não há estrutura de testes hoje. Para o porte atual, isso não é grave, mas alguns pontos merecem teste antes de crescer:

- `nextSunday()`
- `calculateWeekDates()`
- `checkWeekCompletion()`
- `validateImport()`
- `validateImportState()`
- cálculo de progresso AT/NT/livro
- renderização vazia de semana sem conteúdo
- fluxo de login sem duplicação

Recomendação mínima sem framework:

- Adotar Node test runner ou Vitest apenas para funções puras.
- Para DOM, começar com testes manuais documentados; Playwright só depois que os fluxos estabilizarem.

## 15. Débito técnico

Débitos principais:

- Arquivos legados duplicados.
- Plano desatualizado/inconsistente.
- Estilos inline apesar de regra contrária.
- Eventos por `onclick` em JS.
- Renderização por strings longas.
- Conteúdo acoplado a função geradora de SVG.
- Progresso por capítulo aproximado.
- Backup com validação parcial.
- Acessibilidade incompleta em checkboxes customizados e modais.

O débito é administrável. O importante é quitar antes de gerar dezenas de semanas, porque conteúdo novo multiplicará o custo de correção.

## 16. Inconsistências no FAITHSYNC_PLAN.md

- Stack diz "sem módulos ES6" (`docs/FAITHSYNC_PLAN.md:9`), mas o projeto usa ES6 Modules e o próprio plano depois exige isso (`docs/FAITHSYNC_PLAN.md:97`).
- Estrutura documenta `js/content/[livro].js` (`docs/FAITHSYNC_PLAN.md:48`), mas hoje só existe `.gitkeep`; correto, mas precisa marcar como futuro.
- Estado ainda cita `ST`, `NT_NOTES`, `UID` (`docs/FAITHSYNC_PLAN.md:54`), mas o código usa nomes novos.
- Regras dizem sem inline style (`docs/FAITHSYNC_PLAN.md:90`) e backlog diz concluído (`docs/FAITHSYNC_PLAN.md:111`), mas há inline style em HTML e JS.
- Regra diz usar `getUID()` (`docs/FAITHSYNC_PLAN.md:95`), mas o código expõe `getCurrentUserId()`.
- Backlog diz "Nenhuma funcionalidade bloqueante" (`docs/FAITHSYNC_PLAN.md:106`), mas há pelo menos riscos altos de manutenção/validação.
- Fase 3E "Modal materiais" aparece pendente (`docs/FAITHSYNC_PLAN.md:121`), mas o modal de materiais existe em `index.html:50` e `js/pages/index.js:209`.

## 17. Bloco Extra A - JSON vs JS para conteúdo

### Situação atual

Hoje o conteúdo usa `WEEKS_DATA` em JS (`js/semanas.js:4`) e o plano prevê conteúdo por livro em `js/content/[livro].js`. A semana 32 mistura:

- dados textuais;
- `Date`;
- recursos;
- reflexão;
- HTML/SVG gerado por função (`visual: generateDanielTimeline()`).

### Benefícios potenciais de JSON

- Separação mais clara entre conteúdo e lógica.
- Facilita geração por Claude/Codex com validação de schema.
- Permite revisar conteúdo como dado, sem risco de inserir código executável.
- Permite carregar sob demanda com `fetch('data/weeks/week-32.json')`.
- Facilita ferramentas futuras de validação, diff e revisão editorial.
- Reduz risco de agentes alterarem renderização ao gerar conteúdo.

### Custos e riscos da migração

- JSON não aceita `Date`; datas precisam virar ISO/string ou placeholders textuais.
- JSON não aceita função/SVG gerado; `visual` teria que virar dados estruturados ou arquivo separado.
- O app teria que usar `fetch()`, lidar com erro HTTP, cache e parsing.
- GitHub Pages serve JSON sem problema, mas execução local precisa continuar via Live Server, o que já é o fluxo correto.
- Se migrar tudo de uma vez, risco de regressão na semana 32 é real.
- Sem schema, JSON pode piorar: vira "objeto solto" com menos ajuda do JavaScript.

### Impacto na renderização atual

- Baixo para textos simples se criar um loader.
- Médio para datas, porque hoje há `new Date()` direto no conteúdo.
- Alto para `visual`, porque HTML/SVG bruto em JSON não é uma boa fronteira arquitetural.
- Médio para import dinâmico por livro/semana, se continuar com ES modules.

### Impacto no GitHub Pages

- Positivo/neutro. GitHub Pages serve `.json` estaticamente.
- Atenção ao caminho base `/FaithSync/`.
- `fetch()` deve usar caminhos relativos ou base configurada.

### Impacto no Supabase

- Quase nenhum. Conteúdo bíblico é estático e não precisa ir para Supabase.
- Supabase deve continuar guardando apenas progresso, anotações e futuramente família.

### Validação de schema

Recomendado antes de migrar:

- Definir `week.schema.json` para semana.
- Definir `book.schema.json` se houver arquivos por livro.
- Validar localmente com script opcional.
- Validar também em runtime com mensagens amigáveis para conteúdo inválido.

### Decisão técnica sobre JSON

JSON é melhor para conteúdo textual estático, mas não é automaticamente melhor para tudo que existe hoje. O JS atual é melhor enquanto:

- há apenas uma semana protótipo;
- o visual depende de função;
- não há build/tooling;
- o contrato ainda está mudando.

Melhor caminho:

1. Não migrar agora.
2. Definir schema e contrato primeiro.
3. Migrar futuramente campos textuais e recursos para JSON.
4. Manter visuais como componentes JS controlados por `visualType`/`visualData`, não como HTML livre dentro de JSON.

Estrutura futura recomendada:

```text
data/
  weeks/
    week-32.json
  books/
    daniel.json
js/
  content-loader.js
  visuals/
    danielTimeline.js
schemas/
  week.schema.json
```

## 18. Bloco Extra B - Frameworks e Tooling

### Permanecer com HTML + CSS + JS Vanilla

Recomendado agora. O app é pequeno, estático, familiar e já funciona bem com GitHub Pages e Live Server. Framework resolveria pouco dos problemas mais urgentes, que são limpeza, validação, acessibilidade e contrato de dados.

### Vite

Vite sozinho pode valer em uma fase futura, sem React/Vue/Svelte.

Benefícios:

- servidor local consistente;
- imports mais confortáveis;
- build com cache busting;
- possibilidade de dividir CSS/JS;
- ambiente para testes;
- facilidade para JSON imports se desejado;
- melhor ergonomia para Codex/Claude.

Custos:

- adiciona `package.json`, `node_modules`, build e deploy configurado;
- GitHub Pages precisa `base: '/FaithSync/'`;
- muda fluxo atual de "abrir com Live Server" para `npm run dev`, salvo manutenção de fallback.

Recomendação: não adotar Vite antes de limpar o projeto. Considerar após a fase de estabilização, principalmente se começar a haver muitos arquivos de conteúdo.

### Tailwind CSS

Não recomendo agora.

Motivos:

- o app já tem identidade visual própria em CSS;
- Tailwind exigiria build para uso ideal;
- grande parte do problema atual é semântica/organização, não falta de utilitários;
- pode aumentar ruído em HTML gerado por string.

Tailwind só faria sentido se houvesse redesign grande, equipe acostumada, ou adoção de componentes com build.

### React/Vue/Svelte

Não recomendo agora.

Resolveriam:

- componentização;
- estado/renderização declarativa;
- reuso de UI.

Mas o custo não compensa hoje:

- migração de páginas;
- autenticação e rotas;
- adaptação para GitHub Pages;
- build obrigatório;
- reescrita de CSS/componentes;
- risco de overengineering.

Svelte seria o menor salto se um framework fosse inevitável no futuro. Astro poderia ser interessante para conteúdo estático, mas o app é autenticado/interativo, então não resolve o núcleo.

### Tooling mínimo futuro

Antes de framework, considerar:

- `package.json` com scripts opcionais;
- `vite` puro;
- `eslint`;
- `prettier`;
- teste de funções puras;
- schema validation para conteúdo.

## 19. Riscos técnicos

- Gerar muitas semanas no formato atual pode criar um `semanas.js` grande, difícil de revisar e pesado no carregamento.
- Arquivos legados podem levar a correções no lugar errado.
- Conteúdo com HTML livre pode virar risco de XSS se for tratado como dado externo.
- Progresso por capítulo pode ficar inconsistente com leituras fracionadas ou múltiplos capítulos por dia.
- Backups importados podem corromper estado se não houver validação forte.
- Acessibilidade pode ficar cara de corrigir se controles customizados forem replicados em muitas telas.
- Plano/documentação desatualizado pode induzir agentes a seguir regra errada.

## 20. Plano incremental de melhoria por fases

### Fase 1 - Estabilização sem mudar arquitetura

- Corrigir fluxo de login duplicado.
- Fechar HTML inválido em `semanas.html`.
- Remover inline style mais simples para classes.
- Melhorar foco visível e botões com `type`.
- Atualizar `FAITHSYNC_PLAN.md` para refletir ES modules e nomes atuais.
- Confirmar e remover arquivos legados.

### Fase 2 - Validação e segurança de dados

- Fortalecer `validateImportState()`.
- Validar notes com tamanho máximo.
- Criar helpers de validação em módulo próprio.
- Documentar contrato de `planState`.
- Ajustar default de `currentWeek` entre protótipo 32 e plano real.

### Fase 3 - Acessibilidade e semântica

- Trocar `div.dchk` por checkbox/botão acessível.
- Adicionar `aria-pressed` ou `checked`.
- Melhorar modais com foco, Escape e `role="dialog"`.
- Rever headings internos.
- Testar teclado completo nas três páginas.

### Fase 4 - Conteúdo e schema

- Definir JSDoc/schema de `WeekData`.
- Adicionar `chapterRefs`/`chapterCount`.
- Separar `visualType`/`visualData`.
- Criar script opcional de validação de conteúdo.
- Só então decidir migração parcial para JSON.

### Fase 5 - Tooling opcional

- Adotar Vite puro se o volume de conteúdo crescer.
- Adicionar testes de domínio.
- Adicionar lint/format.
- Configurar deploy GitHub Pages com build se Vite entrar.

## 21. Checklist de aceite para futuras correções

- Nenhum arquivo legado ativo ou duplicado permanece sem justificativa.
- `node --check` passa nos módulos JS.
- Login dispara uma única chamada por tentativa.
- `semanas.html?week=32` renderiza sem erro no console.
- Nenhum `<style>` inline ou `style=` novo fora de exceções justificadas.
- Nenhum `onclick`/`onsubmit` inline em HTML.
- `currentWeek` não muda por navegação visual.
- Backup inválido não altera estado.
- Campos de backup aceitos são validados por faixa e tipo.
- Checkboxes/marcações funcionam por teclado.
- Modais abrem com foco correto, fecham com Escape e retornam foco.
- `.env`, `.claude/` e service role key não aparecem em `git ls-files`.
- Conteúdo novo não adiciona HTML bruto fora de visual controlado.
- Semana 32 continua sendo o protótipo funcional principal.
- Nenhum conteúdo bíblico completo é gerado sem decisão explícita.

## 22. Lista de arquivos que provavelmente devem ser alterados

Alterar em fases próximas:

- `index.html`
- `semanas.html`
- `anotacoes.html`
- `css/style.css`
- `js/pages/index.js`
- `js/pages/semanas.js`
- `js/pages/anotacoes.js`
- `js/ui.js`
- `js/domain.js`
- `js/db.js`
- `js/state.js`
- `docs/FAITHSYNC_PLAN.md`
- `.gitignore`

Provavelmente remover após conferência:

- `js/index.js`
- `js/anotacoes.js`
- `js/semanas-logic.js`
- `js/shared.js`

Criar futuramente, se necessário:

- `js/validators.js`
- `js/content-loader.js`
- `js/visuals/danielTimeline.js`
- `schemas/week.schema.json`
- `data/weeks/week-32.json`
- `package.json` e `vite.config.js` apenas se Vite for adotado.

## 23. Decisão Arquitetural Recomendada

1. Permanecer com Vanilla JS ou adotar framework?
   - Permanecer com Vanilla JS. Não há dor atual que justifique React, Vue, Svelte ou Astro. A arquitetura precisa de limpeza incremental, não de reescrita.

2. Vale adotar Vite agora?
   - Ainda não. Vite é o tooling mais plausível para uma fase futura, mas deve vir depois de limpar arquivos legados, alinhar documentação e estabilizar contrato de conteúdo. Quando entrar, pode entrar sozinho, sem framework.

3. Vale adotar Tailwind agora?
   - Não. O CSS atual é pequeno o bastante, tem identidade própria e não sofre de falta de utilitários. Tailwind adicionaria build e ruído sem resolver os principais problemas.

4. Vale migrar conteúdo para JSON?
   - Não totalmente agora. Vale planejar migração parcial futura para conteúdo textual estático, com schema. O JS atual ainda é aceitável para a semana 32 porque há `Date`, função visual e protótipo em evolução.

5. O que deve entrar agora?
   - Correção do login duplicado.
   - Fechamento/semântica do HTML.
   - Remoção de inline styles simples.
   - Validação forte de backup.
   - Limpeza de arquivos legados.
   - Atualização do plano.
   - Melhorias de acessibilidade em controles e modais.

6. O que deve ficar para fase futura?
   - Vite puro.
   - Schema formal de conteúdo.
   - Migração parcial para JSON.
   - Testes automatizados.
   - Separação de visuais em componentes.
   - PWA mais completo com ícones PNG e talvez service worker.

7. O que NÃO vale fazer neste momento?
   - Não migrar para React/Vue/Svelte.
   - Não adotar Tailwind.
   - Não gerar conteúdo bíblico completo.
   - Não mover conteúdo para Supabase.
   - Não criar backend próprio para esconder anon key.
   - Não fazer reescrita arquitetural grande.
   - Não transformar o projeto em SPA complexa antes de quitar os débitos atuais.
