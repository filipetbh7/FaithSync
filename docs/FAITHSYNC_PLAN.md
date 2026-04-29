# FaithSync — Plano de Desenvolvimento

## Visão Geral

FaithSync é um plano de leitura bíblica familiar com estudo complementar semanal,
desenvolvido como Progressive Web App estático hospedado no GitHub Pages com
persistência via Supabase.

**Stack:** HTML + CSS + JS (vanilla) · Supabase (Auth + PostgreSQL + RLS) · GitHub Pages  
**Repositório:** `filipetbh7/FaithSync`  
**URL:** `https://filipetbh7.github.io/FaithSync/`

---

## Estrutura de Arquivos

```
FaithSync/
├── index.html          → Login + Índice
├── semanas.html        → Página de semana
├── anotacoes.html      → Página de anotações
├── style.css           → CSS compartilhado
├── shared.js           → Supabase client, dbLoad/dbSave, renderPH, setupNav, WEEKS_INDEX
├── index.js            → goWeek, wkStatus, renderIndex, doLogin, initApp
├── semanas.js          → WEEKS_DATA + generateDanielTimeline (gerado a cada bloco)
├── semanas-logic.js    → renderWk, togDay, togComp, doSave, doExport, doImport, init
├── anotacoes.js        → renderNotes, init
├── favicon.svg         → Ícone livro aberto com luz dourada
├── favicon.ico         → Fallback para browsers antigos
├── faithsync-logo.jpg  → Logo para tela de login e PWA
└── manifest.json       → PWA manifest (Fase 3A)
```

---

## Banco de Dados (Supabase)

### Tabelas atuais

```sql
-- Progresso do plano (por família futuramente)
progress (
  id uuid PK,
  user_id uuid FK auth.users UNIQUE,
  data jsonb,  -- { completedDays, completedComplements, currentWeek, planStartDate }
  updated_at timestamptz
)

-- Anotações por semana
notes (
  id uuid PK,
  user_id uuid FK auth.users,
  week_number integer,
  content text,
  updated_at timestamptz,
  UNIQUE(user_id, week_number)
)
```

### Tabelas futuras (Fase 3D — Grupos Familiares)

```sql
families (
  id uuid PK,
  name text,
  invite_code text UNIQUE,
  invite_expires_at timestamptz,
  created_at timestamptz
)

family_members (
  user_id uuid FK auth.users,
  family_id uuid FK families,
  role text CHECK(role IN ('owner','member')),
  joined_at timestamptz,
  PRIMARY KEY(user_id, family_id)
)

-- progress e notes migram user_id → family_id
```

---

## Plano de Desenvolvimento

### ✅ Fase 1 — Correções imediatas (CONCLUÍDA)
- Labels de acessibilidade no formulário de login
- Flash de login eliminado (spinner + opacity transition)
- Favicon SVG + ICO
- Botões renomeados: "Backup Local" e "Restaurar Backup"
- doExport melhorado (version, exportedAt, timestamp no nome)
- doImport com confirmação e feedback de erro

### ✅ Fase 2 — Separação de arquivos (CONCLUÍDA)
- `style.css` — CSS compartilhado
- `shared.js` — lógica compartilhada
- `semanas.js` — apenas dados gerados
- `semanas-logic.js` — lógica da página de semanas
- `index.js` — lógica do índice
- `anotacoes.js` — lógica de anotações
- HTMLs sem JS inline

### 🔲 Fase 3 — Features + PWA

#### 3A — PWA Básico
- `manifest.json` com nome, ícones, cores, display standalone
- Meta tags nos três HTMLs
- Permite "Adicionar à tela inicial" no Android e iOS
- Sem service worker por ora

#### 3B — Controle de Início e Apagar Plano
**Localização:** índice, abaixo das barras de progresso AT/NT, antes da legenda das semanas

**Comportamento:**
- Botão **"Iniciar Plano Hoje"**
  - Ativo: plano não iniciado
  - Ao clicar: salva `planStartDate = hoje` no Supabase, exibe "Plano iniciado em dd/mm/yyyy", desabilita botão
  - Inativo: plano já iniciado
- Botão **"Apagar Plano Atual"**
  - Ativo: plano iniciado
  - Ao clicar: confirmação — *"Apagar plano? Todo o progresso, histórico e dias marcados serão removidos. As anotações serão mantidas. Esta ação não pode ser desfeita."*
  - Se confirmar: apaga `planStartDate`, zera `completedDays`, zera `completedComplements`, apaga histórico de conclusões, salva no Supabase, recarrega índice
  - Inativo: plano não iniciado

**Dados salvos em `progress.data`:**
```json
{
  "planStartDate": "2026-04-28",
  "completedDays": {},
  "completedComplements": {},
  "weekCompletionHistory": {},
  "currentWeek": 1
}
```

#### 3C — Datas Dinâmicas e Atrasos

**Regras de planejamento:**
- Semana 1 inicia no domingo após (ou igual a) `planStartDate`
- Cada semana subsequente inicia no domingo após a conclusão da semana anterior
- Concluída = 6 dias de leitura + complementação do sábado marcados

**Regras de atraso:**
- Uma semana em andamento é marcada como **"Atrasada"** se:
  - O dia corrente é segunda-feira ou posterior, E
  - O domingo desta semana não foi marcado
- Uma semana não iniciada **nunca** é marcada como atrasada — apenas a semana em andamento pode ser
- Ao concluir uma semana atrasada, o replanejamento ocorre automaticamente:
  - Data de início da próxima semana = próximo domingo após a data de conclusão
  - Se concluiu na quarta, próxima semana começa no domingo seguinte

**Indicadores visuais:**
- Card no índice: marcador de status adicional **"Atrasada"** (cor âmbar) além dos existentes (Não iniciado / Em andamento / Concluído)
- Página da semana: banner de alerta sutil indicando atraso

#### 3D — Progresso AT/NT Global (correção de bug)
- `renderPH` hoje usa dias da semana exibida para calcular AT/NT
- Corrigir para usar todos os `completedDays` globalmente
- Livro atual continua baseado na semana exibida (comportamento correto)

#### 3E — Modal de Materiais
**Localização:** botão discreto próximo ao rodapé do índice  
**Comportamento:** abre modal com lista dos 10 recursos bibliográficos  
**Conteúdo:**
1. Bíblia Thompson — Editora Vida, 2024
2. Bíblia Scofield — Editora Vida, 2020
3. Bíblia Judaica Completa — Editora Vida, 2011
4. Dicionário Bíblico Crescer — Geográfica Editora, 2010
5. Enciclopédia da vida dos personagens bíblicos — Matheus Soares, 3ª ed., 2018
6. Manual de Escatologia — J. Dwight Pentecost — Editora Vida, 2024
7. Enciclopédia popular de profecia bíblica — Tim LaHaye — CPAD, 2024
8. Charting the End Times — Tim LaHaye, Thomas Ice — Harvest, 2021
9. Atlas Ilustrado da Bíblia — André Daniel Reinke — Thomas Nelson, 3ª ed., 2024
10. Zondervan Atlas of the Bible — Carl G. Rasmussen, Revised Edition, 2010

#### 3F — Apagar Anotações
**Localização:** página de Anotações, próximo ao cabeçalho  
**Comportamento:**
- Botão **"Apagar Todas as Anotações"**
- Ativo: se existir pelo menos uma anotação
- Inativo: se não houver anotações
- Confirmação: *"Apagar todas as anotações? Esta ação não pode ser desfeita."*
- Se confirmar: apaga todas as notas do Supabase, recarrega página

#### 3G — Histórico de Conclusões
**Localização:** botão "📅 Histórico" discreto no índice  
**Comportamento:** abre modal com linha do tempo das semanas concluídas  
**Conteúdo por entrada:**
- Número e referência da semana
- Data em que foi concluída
- Quantos dias levou (se atrasada, indicar)
**Nota:** apagado junto com o plano (botão Apagar Plano)

#### 3H — Grupos Familiares
**Objetivo:** múltiplos usuários compartilhando o mesmo progresso

**Fluxo de cadastro:**
1. Novo usuário cria conta (email + senha) na tela de login
2. Após primeiro login: tela de boas-vindas com duas opções:
   - "Criar nova família" → gera código de convite (ex: `FAITH-4829`), válido por 7 dias ou uso único configurável
   - "Entrar em família existente" → digita código, passa a compartilhar progresso

**Telas necessárias:**
- Cadastro de conta (email + senha + confirmação)
- Recuperação de senha (via email — requer Resend/SMTP)
- Configurações da família (ver membros, gerar novo código, remover membro)

**Migração de dados:**
- `progress.user_id` → `progress.family_id`
- `notes.user_id` → `notes.family_id`
- RLS atualizado para `family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())`

#### 3I — PWA com Notificações (futuro)
**Objetivo:** lembrete diário de leitura (estilo Duolingo)
**Requer:** service worker + Push API + VAPID keys
**Funciona com:** GitHub Pages (mesmo domínio) + Supabase (armazena preferência de horário)
**Fluxo:** usuário define horário → service worker registra → browser envia notificação no horário mesmo com app fechado
**Nota:** implementar após grupos familiares estabilizarem

---

## Geração de Conteúdo — Instruções para Agentes

### Contexto
A Bíblia tem 1.189 capítulos distribuídos em 87 semanas de leitura.
Cada semana tem 6 dias de leitura (Dom–Sex, ~15 min/dia) + 1 sábado de complementação (~1h).
O arquivo `semanas.js` contém o objeto `WEEKS_DATA` com todas as semanas geradas.

### Estrutura de dados de uma semana

```javascript
WEEKS_DATA[N] = {
  number: N,
  title: "Título descritivo da semana",
  dateStart: new Date(YYYY, MM, DD),  // calculado dinamicamente
  dateEnd: new Date(YYYY, MM, DD),
  range: "Livro X – Livro Y",
  complementDay: new Date(YYYY, MM, DD),
  chaptersStart: NNN,  // capítulo global (1-1189) onde começa
  chaptersEnd: NNN,
  days: [
    {
      dayOfWeek: "Domingo",   // sempre começa Domingo
      date: new Date(...),
      reading: "Gênesis 1",
      verses: null,           // ou "v.1-25" se for parcial
      context: "Descrição breve e contextualizada do conteúdo (~1-2 frases)",
      isToday: false
    },
    // ... Segunda, Terça, Quarta, Quinta, Sexta (6 dias total)
  ],
  complement: {
    date: new Date(...),  // sábado
    intro: "Parágrafo introdutório da sessão de complementação (3-5 frases)",
    resources: [
      {
        type: "thompson",      // ou: scofield, atlas, escatologia, personagens, dicionario, judaica, extra
        title: "Bíblia Thompson",
        items: [
          "Item específico a consultar neste recurso para esta semana",
          // 2-4 itens por recurso, concretos e acionáveis
        ]
      },
      // incluir apenas recursos relevantes para a semana — não forçar todos
    ]
  },
  reflection: {
    verse: "\"Versículo da semana entre aspas\"",
    reference: "Livro X:Y",
    question: "Pergunta de reflexão para discussão familiar (adequada para criança de 9 anos)"
  },
  visual: generateDanielTimeline()  // substituir por função/SVG específico quando relevante
}
```

### Densidades por livro
| Categoria | Capítulos/dia | Exemplos |
|---|---|---|
| Narrativo fluido | 1.5 | Gênesis, Rute, Ester, Atos |
| Narrativo com lei | 1.0 | Êxodo, Lucas, João |
| Denso/poético/profético | 0.5 | Jó, Isaías, Romanos, Hebreus |

### Regras de geração
1. Nunca quebrar no meio de uma perícope narrativa importante (criação, dilúvio, paixão de Cristo, etc.)
2. O campo `context` deve ser acessível para uma criança de 9 anos
3. Os `items` de cada recurso devem ser específicos (mencionar páginas, cadeias temáticas, verbetes quando possível)
4. O recurso `extra` é para sugestões criativas de engajamento familiar (desenhar, conectar com NT, versículo para memorizar)
5. O recurso `escatologia` (LaHaye, Pentecost, Charting) só aparece em livros proféticos
6. O recurso `judaica` aparece quando o contexto judaico enriquece a leitura (festas, nomes hebraicos, etc.)
7. A `reflection.question` deve estimular conversa, não ter resposta certa/errada
8. Datas são placeholders — serão recalculadas dinamicamente pelo app

### Processo de geração por bloco

**Sessão por livro (recomendado):**
1. Gênesis — ~5 semanas
2. Êxodo — ~3 semanas
3. Levítico — ~2 semanas
4. Números — ~3 semanas
5. Deuteronômio — ~2 semanas
6. ...e assim por diante

**Para cada sessão:**
1. Informar ao agente: livro, total de capítulos, semanas que vai cobrir, última semana gerada
2. Agente gera o bloco de semanas como JS puro
3. Revisar contexto e recursos manualmente
4. Append ao `semanas.js` existente
5. Subir apenas `semanas.js` no GitHub

### Comando modelo para agente

```
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

---

## Estado Atual do Projeto (Abril 2026)

### Funcional
- Login com Supabase Auth
- Índice com 87 semanas (semana 32 com conteúdo completo — Daniel 7-12)
- Página de semanas com leitura diária, visual, complementação, reflexão, anotações
- Página de anotações com leitura e link para semana correspondente
- Progresso salvo no Supabase com RLS por usuário autenticado
- Backup local (export/import JSON)
- Spinner de carregamento sem flash de login
- PWA parcial (sem manifest ainda)
- Favicon SVG + ICO

### Pendente
- Todas as fases 3A–3I descritas acima
- Geração de conteúdo: semanas 1–31 e 33–87

### Supabase
- Projeto: `faithsync`
- Região: South America (São Paulo)
- Tabelas: `progress`, `notes`
- RLS: `to authenticated`, `auth.uid() = user_id`
- Usuário familiar: [email do usuário familiar]
