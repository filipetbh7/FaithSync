# Code Review FaithSync Pos-JSON - 2026-04-30

## Atualizacao de producao GitHub Pages - 2026-05-02

Nova evidencia informada pelo usuario:

- GitHub Pages: `index.js:189 Uncaught SyntaxError: Invalid or unexpected token`.
- Live Server: fluxo de login funcionando com os ultimos ajustes locais.

Causa confirmada:

- A producao em `https://filipetbh7.github.io/FaithSync/js/pages/index.js` ainda servia a versao antiga de `origin/main`.
- Essa versao antiga continha backticks escapados em `setupModalHistory()`, exatamente na linha 189 publicada.
- O branch local `main` esta 5 commits a frente de `origin/main`; portanto, o Live Server usa o codigo corrigido localmente, mas o GitHub Pages ainda usa o codigo antigo publicado.
- Como o erro e de parse do ES Module, o browser interrompe a execucao inteira de `js/pages/index.js`; por isso nenhum bootstrap, fallback de login ou finalizacao de spinner roda em producao.

Correcao aplicada nesta etapa:

- `index.html`: o script do Index passou a usar `js/pages/index.js?v=20260502-prod-sync`, forcando uma URL nova do modulo apos o deploy e reduzindo risco de cache do navegador/CDN reaproveitar o arquivo antigo.

Validacoes feitas nesta etapa:

- Comparado o arquivo publicado no GitHub Pages com `origin/main:js/pages/index.js`; ambos ainda tinham os backticks escapados na area de historico.
- Confirmado que o arquivo local `js/pages/index.js` nao tem mais os escapes invalidos.
- Confirmado por `git status --short --branch` que `main` local esta 5 commits a frente de `origin/main`.

Pendencia operacional:

- Fazer push dos commits locais para `origin/main` e aguardar o GitHub Pages publicar novamente. Sem esse push/deploy, a producao continuara servindo o `index.js` antigo com `SyntaxError`.

## Atualizacao pos-correcao do login

Atualizado em 2026-04-30 apos a correcao do bloqueio da tela inicial. O problema critico do loading infinito no Index foi tratado nos arquivos `index.html`, `js/db.js` e `js/pages/index.js`.

O ajuste aplicado foi:

- `index.html`: o CDN do Supabase passou a usar `defer`, evitando bloquear o parse da pagina inicial.
- `js/db.js`: foi adicionada a funcao `waitForSupabaseRuntime()`, com timeout para detectar quando `window.supabase` nao estiver disponivel.
- `js/db.js`: `sb()` agora falha com erro claro se o runtime do Supabase nao estiver carregado.
- `js/pages/index.js`: o bootstrap agora usa timeout em `getSession()` e no login.
- `js/pages/index.js`: o spinner e finalizado explicitamente via `finishLoading()`.
- `js/pages/index.js`: se Supabase/Auth falhar ou demorar demais, a tela de login aparece com mensagem amigavel em vez de ficar presa no loading.
- `js/pages/index.js`: se o login autenticar mas a reinicializacao do app falhar, o botao volta ao estado "Entrar" em vez de permanecer desabilitado.
- `js/pages/index.js`: foi removido o import nao usado de `checkWeekCompletion`.

Validacoes pos-ajuste:

- `node --check js/pages/index.js` passou.
- `node --check js/db.js` passou.
- Busca textual confirmou, naquela etapa, `defer` no script Supabase da `index.html` e uso de `waitForSupabaseRuntime()`, `finishLoading()` e `showLogin()` no fluxo do Index. Esse ponto foi revisado em 2026-05-01, e o script passou para `async`.

## Atualizacao investigativa - 2026-05-01

A correcao anterior nao resolveu o problema em runtime. A investigacao mais profunda encontrou causas reais adicionais que `node --check` nao apontava:

1. `js/pages/index.js` usava `lscr` e `iscr` dentro de `initApp()` no caminho autenticado, mas essas variaveis nao existiam mais no escopo da funcao. Isso causava `ReferenceError` em runtime no browser quando havia sessao ativa.
2. A tela de login nascia com `class="hidden"` e tambem ficava afetada por `body:not(.ready) .lscr { opacity: 0; }`. Se o modulo, o CDN ou o bootstrap falhassem antes de chamar `showLogin()`, nao havia fallback visual real.
3. O Supabase CDN ainda participava do carregamento inicial. Se ele atrasasse ou falhasse antes do bootstrap concluir, a pagina podia continuar em estado de espera sem login visivel.
4. O caminho autenticado chamava `dbLoad(user.id)` sem timeout. Uma sessao existente com consulta Supabase pendente podia manter o bootstrap aguardando indefinidamente.

Correcao aplicada em 2026-05-01:

- `index.html`: o login deixou de nascer escondido (`#lscr` nao tem mais `hidden` inicial).
- `index.html`: o spinner passou a nascer escondido (`#spinner.hidden`) e e exibido apenas quando o bootstrap JS inicia verificacao.
- `index.html`: o script do Supabase mudou de `defer` para `async`, evitando bloquear o parser/`DOMContentLoaded`; o JS do app ja espera o runtime via `waitForSupabaseRuntime()`.
- `css/style.css`: a regra `body:not(.ready)` nao oculta mais `.lscr`, garantindo fallback visual mesmo com falha de JS/CDN.
- `js/pages/index.js`: `lscr` e `iscr` foram restaurados ao escopo de `initApp()`.
- `js/pages/index.js`: foi adicionado timeout tambem ao `dbLoad(user.id)`.
- `js/pages/index.js`: o bootstrap agora roda mesmo se o modulo executar depois de `DOMContentLoaded`, usando `document.readyState`.
- `js/pages/index.js`: listeners de botoes foram protegidos contra IDs ausentes.

Validacao realizada em 2026-05-01:

- `node --check js/pages/index.js` passou.
- `node --check js/db.js` passou.
- `node --check js/content-loader.js` passou.
- Todos os JSONs em `data/weeks/*.json` foram parseados com `ConvertFrom-Json` sem erro.
- Foi feita leitura estatica dos imports ES Modules e dos seletores DOM relevantes.
- Tentativa de validacao com Chrome headless nao gerou screenshot/DOM neste ambiente; portanto, nao consegui validar em browser real de forma conclusiva aqui. Validar manualmente em Live Server/GitHub Pages continua obrigatorio.

Como validar manualmente agora:

1. Abrir `index.html` via Live Server.
2. Em aba anonima/sem sessao, confirmar que a tela "Acesso Familiar" aparece imediatamente, mesmo antes de qualquer resposta do Supabase.
3. No Console, confirmar ausencia de `ReferenceError: lscr is not defined` ou `iscr is not defined`.
4. Na aba Network, conferir que `js/pages/index.js`, `js/db.js`, `js/const.js`, `css/style.css` e o CDN Supabase carregam; se o CDN falhar, a UI deve continuar mostrando login com erro amigavel apos timeout.
5. Com sessao ativa, confirmar que `progress` e `notes` nao deixam o spinner preso; se a carga falhar, o Index deve renderizar com fallback e toast.

## Atualizacao final do fluxo de Auth - 2026-05-02

A validacao manual do usuario mostrou que a correcao anterior melhorou o carregamento sem sessao no Live Server, mas nao resolveu o fluxo completo. Havia dois bugs distintos:

### Live Server

Sintoma: o login aparecia, mas apos inserir usuario/senha o app voltava para a tela de login.

Causa real:

- `doLogin()` autenticava com `signInWithPassword()`, mas descartava o `data.session`/`data.user` retornado pelo proprio Supabase e chamava `initApp()` em seguida.
- `initApp()` fazia nova chamada para `getSession()` imediatamente apos o login. Em runtime real, esse caminho pode sofrer race com persistencia da sessao no storage ou falhar por outro erro de carregamento.
- Qualquer erro no caminho autenticado era tratado pelo `catch` de `initApp()` como erro de bootstrap/Auth e chamava `showLogin()`. Assim, erro de dados ou renderizacao podia parecer "logout" ou "login nao persistiu".

Correcao aplicada:

- `doLogin()` agora usa diretamente `data.session` e `data.user` retornados por `signInWithPassword()`.
- Foi criada a funcao `renderAuthenticatedIndex(user)`, responsavel apenas por renderizar a tela autenticada.
- `initApp()` ficou responsavel por bootstrap/refresh: chama `getSession()` apenas no carregamento inicial ou refresh, e se houver sessao delega para `renderAuthenticatedIndex(session.user)`.
- Falha em `dbLoad()` nao volta mais para login. O Index autenticado aparece, com toast avisando que os dados nao foram carregados.
- Falha em `renderPH()`/`renderIndex()` nao volta mais para login. A UI mostra erro amigavel no container do indice.
- `dbLoad(user.id)` recebeu timeout defensivo.
- `db.js` agora cria o cliente Supabase com `persistSession: true`, `autoRefreshToken: true` e `detectSessionInUrl: false` explicitamente.

### GitHub Pages

Sintoma: a pagina ainda ficava com spinner infinito e login nao aparecia.

Causa real/provavel:

- O HTML anterior dependia de JavaScript bem-sucedido para revelar o login (`#lscr.hidden`).
- A regra CSS tambem ocultava `.lscr` antes de `body.ready`.
- Em GitHub Pages, qualquer erro de import, CDN, SRI, MIME, cache antigo ou falha antes do bootstrap impedia `showLogin()` de rodar; como o login nascia oculto, o usuario via apenas loading/estado preso.

Correcao aplicada:

- `#lscr` passou a nascer visivel no HTML.
- `#spinner` passou a nascer com `hidden`.
- O CSS nao oculta mais `.lscr` antes de `body.ready`.
- O script do Supabase esta assíncrono (`async`) e o modulo do app aguarda o runtime com `waitForSupabaseRuntime()`.
- O bootstrap tambem funciona se o modulo executar depois de `DOMContentLoaded`, usando `document.readyState`.

Validacoes feitas em 2026-05-02:

- `node --check js/pages/index.js`: passou.
- `node --check js/db.js`: passou.
- `node --check js/pages/semanas.js`: passou.
- `node --check js/pages/anotacoes.js`: passou.
- `node --check js/content-loader.js`: passou.
- Parse de todos os JSONs em `data/weeks/*.json`: passou.
- Verificacao de imports literais em `js/**/*.js`: nenhum arquivo ausente encontrado.
- Verificacao de IDs usados por `js/pages/index.js` em `index.html`: nenhum ID obrigatorio ausente encontrado.

Validacao pendente:

- Ainda e necessario validar visualmente em browser real, especialmente GitHub Pages, porque este ambiente nao permitiu uma validacao headless confiavel com captura/Console.

Roteiro de validacao manual:

1. Live Server sem sessao: abrir `index.html`; login deve aparecer imediatamente, spinner nao deve ficar preso.
2. Live Server com login valido: apos submit, Network deve mostrar chamada `auth/v1/token`; o Index autenticado deve renderizar sem voltar para login.
3. Live Server apos refresh autenticado: `getSession()` deve retornar sessao e renderizar o Index.
4. Console Live Server: nao deve haver `ReferenceError`, `Failed to load module script` ou erro de `renderIndex`.
5. LocalStorage Live Server: procurar chave Supabase com `sb-...-auth-token`; deve existir apos login.
6. GitHub Pages sem sessao: login deve aparecer mesmo que o CDN demore/falhe.
7. GitHub Pages com login valido: apos submit, o Index deve renderizar; se `progress`/`notes` falhar, deve aparecer toast, nao a tela de login.
8. Network GitHub Pages: `index.html`, `css/style.css`, `js/pages/index.js`, `js/db.js`, `js/const.js`, `js/ui.js`, `js/domain.js`, `js/utils.js` devem retornar 200; Supabase CDN deve retornar 200 ou, se falhar, o login deve continuar visivel.

## Atualizacao de sintaxe do modulo - 2026-05-02

A validacao em browser do usuario trouxe a evidencia decisiva:

- Live Server: `index.js:275 Uncaught SyntaxError: Invalid or unexpected token`.
- GitHub Pages: `index.js:189 Uncaught SyntaxError: Invalid or unexpected token`.
- Live Server: `GET /FaithSync/manifest.json 404`.

Causa real:

- `js/pages/index.js` continha backticks escapados (`\``) em template literals dentro de `setupModalHistory()`. Isso e sintaxe invalida em ES Modules no browser e impede o modulo inteiro de executar. Como `index.js` nao executava, nenhum bootstrap, `showLogin()`, `finishLoading()` ou fluxo de Auth podia funcionar corretamente.
- O arquivo tambem continha interpolacoes escapadas (`\${...}`) dentro do mesmo template, o que nao causaria necessariamente o mesmo erro depois da remocao do backtick escapado, mas renderizaria texto literal no historico.
- Os HTMLs apontavam o manifest para `/FaithSync/manifest.json`. No Live Server em `127.0.0.1:5500`, esse caminho retornava 404.

Correcoes aplicadas:

- Removidos os escapes invalidos antes dos backticks em `js/pages/index.js`.
- Removidos os escapes indevidos antes das interpolacoes `${...}` no bloco de historico.
- Corrigido texto do historico afetado pela mesma area.
- `index.html`, `semanas.html` e `anotacoes.html` agora usam `<link rel="manifest" href="manifest.json">`.
- `manifest.json` agora usa `"start_url": "."`, compatível com Live Server e GitHub Pages.

Validacoes feitas apos esta correcao:

- `node --check js/pages/index.js`: passou.
- `node --check js/db.js`: passou.
- `node --check js/pages/semanas.js`: passou.
- `node --check js/pages/anotacoes.js`: passou.
- `node --check js/content-loader.js`: passou.
- Busca por backtick escapado e interpolacao escapada em JS: sem ocorrencias.
- Parse de todos os JSONs em `data/weeks/*.json`: passou.
- Verificacao de imports literais: nenhum arquivo ausente.
- Verificacao de IDs usados pelo Index em `index.html`: nenhum ID ausente.

Checklist especifico para confirmar no browser:

1. Recarregar com cache limpo no Live Server.
2. Confirmar que o Console nao mostra mais `Uncaught SyntaxError` em `js/pages/index.js`.
3. Confirmar que `manifest.json` retorna 200 no Network.
4. Confirmar que a tela de login aparece.
5. Fazer login valido e confirmar que o Index autenticado renderiza.
6. No GitHub Pages, fazer hard refresh ou limpar cache; se o erro apontar linha antiga, o deploy/cache ainda esta servindo arquivo anterior.

## Atualizacao de UI e carregamento - 2026-05-02

Novas evidencias apos validacao no Live Server:

- O login passou a abrir e autenticar.
- O Index renderizava, mas os cards continuavam em uma coluna no desktop.
- O `dbLoad()` podia registrar timeout apos 7 segundos em conexoes frias/lentas.
- Ao voltar de Semanas/Anotacoes para o Index, a tela de login aparecia rapidamente antes do Index autenticado.
- A Semana tentava buscar primeiro `/FaithSync/data/weeks/week-32.json` no Live Server, gerando 404 antes do fallback correto.
- O modal "Materiais de Estudo" ainda precisava de referencias em formato bibliografico e largura melhor no desktop.

Correcoes aplicadas:

- `index.html`: `#igc` recebeu `class="igrd"` para ativar o grid responsivo.
- `js/pages/index.js`: `renderIndex()` tambem garante `classList.add('igrd')`.
- `css/style.css`: modal de materiais ganhou largura desktop maior e lista em duas colunas a partir de tablet.
- `js/pages/index.js`: referencias do modal de materiais agora sao preenchidas com formato bibliografico/ABNT aproximado para obras nacionais e padrao autor-titulo-editora-ano para internacionais.
- `js/pages/index.js`: `DATA_TIMEOUT_MS` subiu de 7s para 20s.
- `js/pages/index.js`: timeout de dados passou de `console.error` para `console.warn`, pois nao invalida a autenticacao.
- `js/pages/index.js`: `showAuthChecking()` esconde login e dashboard durante verificacao de sessao, evitando flash de login quando o usuario ja esta autenticado.
- `js/content-loader.js`: o JSON da semana agora e carregado por URL relativa ao modulo com `new URL('../data/weeks/...', import.meta.url)`, removendo o 404 inicial no Live Server e mantendo compatibilidade com GitHub Pages.

Validacoes feitas:

- `node --check` passou para `js/pages/index.js`, `js/content-loader.js`, `js/db.js`, `js/pages/semanas.js` e `js/pages/anotacoes.js`.
- Parse de todos os JSONs em `data/weeks/*.json`: passou.
- Verificacao de imports literais: nenhum arquivo ausente.
- Verificacao de IDs usados pelo Index em `index.html`: nenhum ID ausente.

## 1. Resumo executivo

O FaithSync avancou bastante apos os ajustes recentes. A migracao estrutural para JSON foi executada: existem `data/weeks/week-01.json` ate `data/weeks/week-87.json`, `js/content-loader.js`, `js/content/daniel.js`, `schemas/week.schema.json` e `js/validators.js`. Os arquivos legados citados no review anterior (`js/index.js`, `js/shared.js`, `js/semanas-logic.js`, `js/anotacoes.js` e `js/semanas.js`) nao estao mais versionados.

O projeto esta mais sustentavel que em 2026-04-29, especialmente por separar conteudo textual de renderizadores visuais. O bug bloqueante da tela inicial foi diagnosticado neste review e corrigido em seguida: o bootstrap do Index agora tem timeout, fallback de Supabase/Auth e encerramento explicito do spinner.

Validacoes executadas neste review:

- `node --check` passou para `js/pages/index.js`, `js/pages/semanas.js`, `js/pages/anotacoes.js`, `js/content-loader.js` e `js/validators.js`.
- Todos os 87 arquivos `data/weeks/*.json` foram lidos com `ConvertFrom-Json` sem erro de parse.
- `git ls-files` nao lista `.env`, `.claude/` ou chave `service_role`.
- `git status --short` mostrou `docs/nested-strolling-flamingo.md` como nao rastreado; isso precisa ser decidido antes de push.
- O arquivo criado por este review foi este documento; apos a solicitacao de correcao, tambem foram alterados `index.html`, `js/db.js` e `js/pages/index.js`.

## 2. Diagnostico do bug bloqueante do loading infinito

### Sintoma

Ao acessar `index.html`, a tela de login nao aparece e o usuario fica preso no spinner/loading.

### Causa provavel

A causa mais provavel esta no fluxo de loading da `index.html`:

- `index.html:15` cria `<div class="spinner" id="spinner"></div>` visivel por padrao.
- `index.html:16` cria a tela de login com `class="lscr hidden"`.
- `js/pages/index.js:134` remove `hidden` do spinner.
- `js/pages/index.js:136-141` remove `hidden` de `#lscr` quando nao ha sessao.
- `js/pages/index.js:140` adiciona `document.body.classList.add('ready')`.
- `js/pages/index.js:162-164` so adiciona `hidden` ao spinner se `body` ainda nao contem `ready`.
- `css/style.css:50` apenas muda `opacity:0` do spinner em `body.ready .spinner`; ele continua montado no DOM e nao recebe `display:none`.

Esse desenho e fragil porque o spinner so some por CSS, nao por estado DOM explicito. Se a classe `ready` nao for aplicada por qualquer erro antes ou durante `initApp()`, o spinner permanece indefinidamente. E mesmo quando `ready` e aplicado, o `finally` nao remove `hidden`, entao a pagina depende 100% da regra `body.ready .spinner`.

### Arquivos provavelmente envolvidos

- `index.html:15-24`: spinner, tela de login e formulario.
- `css/style.css:3`, `css/style.css:48-50`: ocultacao por `body:not(.ready)` e spinner por opacidade.
- `js/pages/index.js:129-164`: bootstrap, `getSession()`, renderizacao do login e `finally`.
- `js/db.js:5-8`: criacao do cliente Supabase via `window.supabase`.
- `index.html:12`: Supabase CDN com SRI.

### Fluxo afetado

1. Browser carrega HTML e mostra spinner.
2. `js/pages/index.js` e carregado como ES6 Module.
3. `DOMContentLoaded` chama `initApp()`.
4. `initApp()` chama `sb().auth.getSession()`.
5. Se nao ha sessao, deveria mostrar `#lscr` e esconder spinner.
6. Hoje o spinner nao e escondido de modo explicito; depende de `body.ready`.
7. Se um erro impede `body.ready`, a tela fica travada.

### Como confirmar no Console/Network

No Console:

- Verificar se ha erro de modulo: `Failed to load module script`, `SyntaxError`, `Cannot find module`, `Cannot read properties of undefined`.
- Verificar se ha erro do Supabase CDN: `Failed to find a valid digest in the integrity attribute` ou `window.supabase is undefined`.
- Rodar manualmente:
  - `document.body.classList.contains('ready')`
  - `document.getElementById('lscr').className`
  - `document.getElementById('spinner').className`
  - `getComputedStyle(document.getElementById('spinner')).opacity`

Na aba Network:

- `index.html` deve retornar 200.
- `css/style.css` deve retornar 200.
- `js/pages/index.js` deve retornar 200 com MIME JavaScript valido.
- `js/const.js`, `js/db.js`, `js/ui.js`, `js/domain.js`, `js/utils.js`, `js/state.js` devem retornar 200.
- CDN `@supabase/supabase-js@2.105.1/dist/umd/supabase.min.js` deve retornar 200 e passar SRI.
- Requisicoes a Supabase Auth devem concluir ou falhar com erro visivel; nao devem ficar pendentes sem timeout perceptivel.

### Correcao aplicada

1. No `finally` de `initApp()` em `js/pages/index.js`, sempre esconder o spinner explicitamente, independente de `body.ready`.
2. Trocar a regra visual para uma classe clara, usando `spinner.classList.add('hidden')`.
3. Criar `finishLoading()` e `showLogin()` no Index para centralizar o estado visual.
4. Adicionar fallback se `window.supabase` nao existir antes de chamar `window.supabase.createClient`.
5. Adicionar timeout defensivo para bootstrap/Auth, exibindo login com mensagem amigavel se a sessao nao puder ser verificada.
6. Adicionar `defer` ao script do Supabase na `index.html`.

### Criterio de aceite

- Acessar `index.html` sem sessao mostra a tela de login em ate 2 segundos em Live Server e GitHub Pages.
- O spinner recebe `display:none` ou `class="hidden"` apos sucesso ou erro.
- Se o CDN do Supabase falhar, a UI mostra mensagem de conexao e nao fica em loading infinito.
- Se `getSession()` falhar, o login aparece com erro amigavel.
- Console nao deve ter erros nao tratados no carregamento inicial.

## 3. Problemas por prioridade

### Critico

1. Loading infinito na inicializacao do Index. **Status: corrigido nesta etapa.**
   - Evidencia: `index.html:15`, `js/pages/index.js:129-164`, `css/style.css:48-50`.
   - Impacto: bloqueia login e todo o uso do app.
   - Recomendacao: finalizar o loading explicitamente no `finally` e adicionar fallback de erro de bootstrap.

2. Ausencia de fallback de modulo/CDN antes do bootstrap. **Status: corrigido no Index nesta etapa.**
   - Evidencia: `js/db.js:5-8` assume `window.supabase` existente; `index.html:12` depende de CDN com SRI.
   - Impacto: se CDN ou SRI falhar, o app pode parar antes de renderizar login.
   - Recomendacao: validar `window.supabase` e renderizar estado de erro recuperavel.

### Alto

1. `schemas/week.schema.json` diverge dos skeletons reais.
   - Evidencia: `data/weeks/week-01.json` usa `complement: {}` e `reflection: {}`, mas `schemas/week.schema.json:47-75` exige `intro`, `resources`, `verse`, `reference`, `question`.
   - Impacto: uma validacao formal por schema reprovaria 86 skeletons que o runtime aceita.
   - Recomendacao: ajustar o schema para permitir objetos vazios quando `skeleton: true`, ou preencher skeletons com strings/arrays vazios coerentes.

2. `validateImportState()` rejeita `planStartDate: null`.
   - Evidencia: `js/state.js:5` define `planStartDate: null`, `js/pages/index.js:43` tambem usa `null`, mas `js/validators.js:70-72` exige ISO date string.
   - Impacto: backups validos de plano ainda nao iniciado podem ser rejeitados.
   - Recomendacao: aceitar `null` ou ausencia controlada para `planStartDate`.

3. `weekCompletionHistory` tem contrato inconsistente.
   - Evidencia: `js/domain.js:63-67` salva objeto `{ completedAt, daysElapsed, wasDelayed }`, mas `js/validators.js:85-91` espera que cada valor seja ISO string.
   - Impacto: backup exportado pelo proprio app pode nao ser importavel quando houver historico.
   - Recomendacao: validar ambos os formatos ou migrar para um unico contrato documentado.

4. `semanas.html` continua com HTML invalido e styles inline.
   - Evidencia: `semanas.html:16` abre `#page-content` e nao ha fechamento antes de `</body>`; `semanas.html:21` e `semanas.html:25` usam `style=`.
   - Impacto: DOM menos previsivel, descumpre regra do plano e dificulta acessibilidade.
   - Recomendacao: fechar o container e mover estilos para classes CSS.

5. Renderizador visual ainda injeta SVG string por `innerHTML`.
   - Evidencia: `js/pages/semanas.js:109-113`, `js/content/daniel.js:30-63`.
   - Impacto: risco controlado porque os dados sao locais e escapados, mas ainda e uma excecao de seguranca a documentar e testar.
   - Recomendacao: manter permitido apenas para renderizadores JS controlados; nunca aceitar HTML/SVG em JSON.

### Medio

1. `content-loader` tenta primeiro `/FaithSync/...` e depois caminho relativo.
   - Evidencia: `js/content-loader.js:14-17`.
   - Impacto: em Live Server fora de `/FaithSync/`, toda semana gera uma primeira requisicao 404 antes de acertar o fallback.
   - Recomendacao: centralizar `BASE_PATH` ou calcular base a partir de `location.pathname`.

2. A pagina Index ainda importa conteudo de dominio nao usado.
   - Evidencia: `js/pages/index.js:3` importa `checkWeekCompletion`, mas nao usa.
   - Impacto: pequeno ruido de manutencao.
   - Recomendacao: remover import nao usado.

3. `anotacoes.js` ainda usa `.onclick`.
   - Evidencia: `js/pages/anotacoes.js:15`, `js/pages/anotacoes.js:29`, `js/pages/anotacoes.js:51`.
   - Impacto: diverge do padrao de eventos por `addEventListener`.
   - Recomendacao: padronizar em fase de limpeza.

4. CSS unico segue aceitavel, mas ja concentra muitas responsabilidades.
   - Evidencia: `css/style.css` tem aproximadamente 20 KB e cobre login, shell, index, semanas, anotacoes, modal e responsividade.
   - Impacto: ainda administravel, mas cresce com risco de efeitos colaterais.
   - Recomendacao: manter por ora; separar apenas se houver tooling ou crescimento relevante.

5. Logo inicial pesa 494 KB.
   - Evidencia: `assets/faithsync-logo.jpg` tem 494222 bytes.
   - Impacto: afeta carregamento mobile e primeira pintura do login.
   - Recomendacao: criar WebP/JPEG otimizado e dimensoes explicitas.

### Baixo

1. Comentarios ainda misturam ingles e portugues.
   - Evidencia: `js/db.js` usa comentarios como "Load Progress", "Save progress".
   - Recomendacao: regras de negocio em PT-BR, comentarios tecnicos so quando agregarem.

2. Funcoes `atPct()` e `ntPct()` parecem nao usadas.
   - Evidencia: `js/utils.js:9-16`.
   - Recomendacao: remover quando fizer limpeza de codigo morto.

3. `README.md` esta minimo demais.
   - Evidencia: `README.md` tem apenas titulo e descricao curta.
   - Recomendacao: documentar Live Server, GitHub Pages, Supabase anon key publica e fluxo de conteudo JSON.

## 4. Pontos positivos encontrados

- A migracao para JSON foi realizada de forma estruturalmente correta.
- Existem 87 arquivos de semana, permitindo navegacao sem precisar gerar conteudo real.
- A semana 32 permanece como prototipo funcional rico em `data/weeks/week-32.json`.
- O visual de Daniel foi movido para `js/content/daniel.js`, mantendo JSON sem codigo executavel.
- `js/content-loader.js` faz carregamento sob demanda por semana.
- `js/validators.js` introduz validacao runtime para conteudo e backup.
- Supabase continua isolado em `js/db.js`.
- Arquivos legados ativos foram removidos do versionamento.
- Nenhuma `service_role key` foi encontrada no frontend.
- `.gitignore` cobre `.env`, `.claude/`, IDEs, Node, build e logs.
- Grid responsivo do Index esta melhor: 2 colunas em 480px, 3 em 768px e 4 em 1024px.

## 5. Validacao da arquitetura pos-JSON

### Correto

- Conteudo textual vive em `data/weeks/*.json`.
- Renderizador visual vive em `js/content/daniel.js`.
- `js/content-loader.js` faz `fetch()` do JSON e `import()` dinamico do renderer.
- Pagina Semana carrega conteudo sob demanda via `loadWeek(wn)`.
- Index nao carrega JSON das semanas, apenas `WEEKS_INDEX`.
- Semana 32 segue como prototipo funcional.
- Skeletons permitem navegacao futura sem conteudo biblico adicional.

### Parcial

- Ha schema JSON, mas ele ainda nao representa corretamente os skeletons.
- Validacao runtime existe, mas nao retorna erros detalhados para conteudo de semana.
- `contentFile` em `WEEKS_INDEX` esta preenchido, mas `content-loader.js` usa `weekData.book`, nao `contentFile`.
- `visualType` existe, mas o import dinamico ignora `visualType` e importa apenas por `book`.

### Riscos

- JSON invalido nao quebra o Index, mas pode fazer a Semana cair em "Conteudo em breve" sem diagnostico claro para o usuario.
- Divergencia entre schema e runtime pode enganar agentes futuros.
- Caminhos hardcoded com `/FaithSync/` podem gerar diferencas entre Live Server e GitHub Pages.

## 6. Validacao contra FAITHSYNC_PLAN.md

Implementado corretamente:

- ES6 Modules nativos estao em uso.
- Supabase esta centralizado em `js/db.js`.
- Estado usa nomes melhores (`planState`, `weekNotes`, `currentUserId`).
- Conteudo migrado para JSON, melhor que o plano antigo descrevia.
- `js/content/[livro].js` existe para render visual controlado.

Parcial ou divergente:

- O plano ainda tem contradicao historica dizendo "sem modulos ES6" em um ponto e exigindo ES6 em outro.
- O plano ainda cita `js/semanas.js` como referencia em algumas secoes, mas o arquivo foi removido.
- O plano diz que nao ha funcionalidade bloqueante, mas hoje ha loading infinito no Index.
- O plano proibe inline style, mas `semanas.html` ainda tem `style=`.
- O plano precisa documentar `data/weeks/*.json`, `js/content-loader.js`, `js/validators.js` e `schemas/week.schema.json` como arquitetura real.

## 7. Validacao contra CODE_REVIEW_FAITHSYNC_2026-04-29.md

Resolvido ou melhorado:

- Arquivos legados foram removidos.
- Conteudo saiu de `js/semanas.js`.
- JSON foi adotado com lazy loading.
- Login duplicado foi reduzido para um unico listener `submit` em `index.js`.
- Grid do Index recebeu media queries coerentes.
- Botoes principais receberam classes de design.
- Validacao de backup foi fortalecida, ainda que com bugs de contrato.

Ainda pendente:

- Repetir o padrao de loading resiliente nas paginas `semanas.html` e `anotacoes.html`.
- Inline styles em `semanas.html`.
- `innerHTML` amplo em renderizacoes.
- Acessibilidade de checkboxes customizados e modais.
- Otimizacao da logo.
- README e plano desatualizados.

## 8. Validacao contra nested-strolling-flamingo.md

Implementado:

- Fase 0 foi em boa parte executada: cards do Index, grid, botoes e login foram melhorados.
- Fase 1 foi executada: `week-32.json`, `js/content/daniel.js`, `schemas/week.schema.json`, `js/content-loader.js`, remocao de `js/semanas.js` e legados.
- Fase 2 foi parcialmente executada: `js/validators.js` existe e esta integrado.
- Fase 4a foi executada: 87 JSONs existem, com skeletons.

Pendente ou divergente:

- Fase 2 ainda nao fechou `#page-content` em `semanas.html`.
- Schema formal nao aceita os skeletons gerados.
- Validacao de import tem incompatibilidades com o estado real.
- Fase 3 de acessibilidade/performance ainda nao foi concluida.
- Fase 5 tooling ainda nao existe.
- Nenhum prompt do Gemini foi executado, o que esta correto conforme restricao.

## 9. Recomendacoes de Clean Code

- Criar helper compartilhado de bootstrap/loading para as tres paginas.
- Remover imports nao usados.
- Trocar `.onclick` remanescente por `addEventListener`.
- Manter renderizadores visuais pequenos e controlados.
- Fazer `validateWeekContent()` retornar `{ valid, errors }` para diagnostico.
- Padronizar comentarios em PT-BR quando explicarem regra de negocio.
- Evitar novos `innerHTML` com dados dinamicos sem `esc()`.

## 10. Recomendacoes de Clean Architecture

- Manter camadas atuais: `state`, `domain`, `db`, `validators`, `content-loader`, `ui`, `pages`.
- Nao introduzir framework agora.
- Separar contrato de dados em um documento curto: `WeekContent`, `PlanState`, `WeekCompletionHistory`.
- Centralizar base path em modulo unico.
- Separar controle de loading do render de paginas.
- Considerar `js/bootstrap.js` ou `js/app-ready.js` para padronizar falhas de inicializacao.

## 11. Recomendacoes especificas para JSON

- Corrigir `schemas/week.schema.json` para aceitar skeletons reais.
- Validar schema formal em script futuro.
- Manter JSON sem HTML, SVG ou JavaScript.
- Usar `visualType` para escolher renderizador, nao apenas `book`.
- Adicionar mensagens de erro especificas quando JSON falhar.
- Confirmar que todos os JSON skeletons possuem titulo e livro coerentes com `WEEKS_INDEX`.

## 12. Recomendacoes especificas para JavaScript

- Replicar o padrao corrigido do bootstrap do Index nas demais paginas.
- Validar `window.supabase` antes de criar client. **Aplicado em `js/db.js`.**
- Aceitar `planStartDate: null` em backup.
- Ajustar validacao de `weekCompletionHistory`.
- Remover `checkWeekCompletion` de `js/pages/index.js` se continuar sem uso.
- Trocar `.onclick` em `js/pages/anotacoes.js`.

## 13. Recomendacoes especificas para HTML

- Fechar `#page-content` em `semanas.html`.
- Remover `style=` de `semanas.html`.
- Adicionar `type="button"` em botoes que nao submetem formulario.
- Melhorar modais com `role="dialog"`, `aria-modal`, `aria-labelledby`, foco inicial e Escape.
- Manter scripts de pagina fora de containers principais quando possivel.

## 14. Recomendacoes especificas para CSS e responsividade

- Criar classes para os inline styles de `semanas.html`.
- Adicionar `:focus-visible` para botoes, cards clicaveis, checkboxes customizados e links.
- Otimizar layout do modal em desktop e mobile.
- Verificar manualmente larguras 360, 390, 768, 1024 e 1366.
- Otimizar `assets/faithsync-logo.jpg`.

## 15. Recomendacoes de performance

- Index deve continuar carregando somente `WEEKS_INDEX`, sem `data/weeks/*.json`.
- Semana deve continuar carregando apenas o JSON solicitado.
- Evitar primeira requisicao 404 em Live Server causada pelo fallback `/FaithSync/`.
- Adicionar cache simples em memoria ja existente (`loadedWeeks`) e manter sem persistir dados sensiveis.
- Considerar preload apenas para a semana atual/proxima depois de estabilizar bootstrap.

## 16. Recomendacoes de seguranca

- Manter `SUPABASE_ANON` publico; isso e correto em Supabase com RLS.
- Nao expor `service_role` em nenhum arquivo.
- Confirmar RLS no painel/Supabase antes de producao.
- Tratar falhas de Auth com mensagens genericas.
- Nao mostrar erros internos sensiveis na UI.
- Documentar no README que autorizacao real depende de RLS, nao do frontend.

## 17. Recomendacoes de documentacao

- Atualizar `docs/FAITHSYNC_PLAN.md` para refletir JSON, loader, schema e validators.
- Marcar o bug de loading como bloqueante ate correcao.
- Registrar que `docs/nested-strolling-flamingo.md` esta nao rastreado ou decidir versiona-lo.
- Atualizar README com Live Server, GitHub Pages e fluxo de validacao.
- Documentar que Gemini ainda nao foi executado.

## 18. Checklist de aceite para a proxima correcao

- `index.html` sem sessao mostra login sem spinner preso. **Coberto pela correcao aplicada; validar visualmente em Live Server/GitHub Pages.**
- Console limpo no carregamento inicial.
- Network sem 404 critico para JS/CSS.
- Falha do Supabase/CDN exibe erro amigavel.
- `semanas.html?week=32` renderiza Daniel normalmente.
- `semanas.html?week=1` renderiza skeleton "Conteudo em breve".
- `node --check` passa nos JS alterados.
- Todos os JSONs continuam validos.
- Schema e validator aceitam o mesmo contrato.
- Backup exportado pelo app pode ser importado pelo app.
- Nenhum arquivo de conteudo biblico real novo e gerado.

## 19. Plano incremental sugerido

1. Corrigir somente o bootstrap/loading do Index e padronizar ocultacao do spinner. **Concluido.**
2. Repetir o padrao em `semanas.js` e `anotacoes.js`.
3. Corrigir contrato de `validators.js` para `planStartDate` e `weekCompletionHistory`.
4. Ajustar `schemas/week.schema.json` para skeletons.
5. Fechar HTML e remover inline styles de `semanas.html`.
6. Melhorar diagnostico de erro do `content-loader`.
7. Atualizar `FAITHSYNC_PLAN.md` e README.
8. So depois seguir para prompts Gemini.

## 20. Lista de arquivos que provavelmente devem ser alterados

Arquivos alterados para corrigir o bloqueante:

- `js/pages/index.js`
- `js/db.js`
- `index.html`

Para estabilizar arquitetura:

- `js/pages/semanas.js`
- `js/pages/anotacoes.js`
- `js/validators.js`
- `js/content-loader.js`
- `schemas/week.schema.json`
- `semanas.html`
- `README.md`
- `docs/FAITHSYNC_PLAN.md`

Para performance/UX:

- `assets/faithsync-logo.jpg` ou novo `assets/faithsync-logo.webp`
- `css/style.css`

## 21. Conclusao

A arquitetura pos-JSON esta no caminho certo e ja e superior ao estado revisado em 2026-04-29. O risco principal agora nao e a estrategia de conteudo, mas a fragilidade do bootstrap inicial. Antes de qualquer prompt Gemini ou geracao de conteudo real, a proxima fase deve corrigir o loading infinito, alinhar schema/validators com os dados reais e fechar as pequenas quebras de HTML/CSS que ainda ficaram pendentes.

