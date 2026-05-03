import { planState } from '../state.js';
import { WEEKS_INDEX } from '../const.js';
import { calculateWeekDates } from '../domain.js';
import { confirmAction, renderPH, injectAppShell } from '../ui.js';
import { esc, fmtD, fmtDFull, toast } from '../utils.js';
import { sb, waitForSupabaseRuntime, dbLoad, dbSaveProgress } from '../db.js';

const AUTH_TIMEOUT_MS = 7000;
const DATA_TIMEOUT_MS = 20000;
const MATERIALS_REFERENCES = [
  'BIBLIA Thompson. Edicao contemporanea. Sao Paulo: Editora Vida, 2024.',
  'BIBLIA de Estudo Scofield. Sao Paulo: Editora Vida, 2020.',
  'STERN, David H. Biblia Judaica Completa. Sao Paulo: Editora Vida, 2011.',
  'DICIONARIO Biblico Crescer. Sao Paulo: Geografica Editora, 2010.',
  'SOARES, Matheus. Enciclopedia da vida dos personagens biblicos. 3. ed. [S.l.]: [s.n.], 2018.',
  'PENTECOST, J. Dwight. Manual de escatologia. Sao Paulo: Editora Vida, 2024.',
  'LAHAYE, Tim. Enciclopedia popular de profecia biblica. Rio de Janeiro: CPAD, 2024.',
  'LAHAYE, Tim; ICE, Thomas. Charting the End Times. Eugene, OR: Harvest House Publishers, 2021.',
  'REINKE, Andre Daniel. Atlas ilustrado da Biblia. 3. ed. Rio de Janeiro: Thomas Nelson Brasil, 2024.',
  'RASMUSSEN, Carl G. Zondervan Atlas of the Bible. Rev. ed. Grand Rapids, MI: Zondervan, 2010.'
];

function goWeek(n) { location.href = "semanas.html?week=" + n; }

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

function finishLoading() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.classList.add('hidden');
  document.body.classList.add('ready');
}

function showSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.classList.remove('hidden');
}

function showAuthChecking() {
  const lscr = document.getElementById('lscr');
  const iscr = document.getElementById('iscr');
  if (lscr) lscr.classList.add('hidden');
  if (iscr) iscr.classList.add('hidden');
  showSpinner();
}

function showLogin(message) {
  const lscr = document.getElementById('lscr');
  const iscr = document.getElementById('iscr');
  const err = document.getElementById('lerr');
  if (lscr) lscr.classList.remove('hidden');
  if (iscr) iscr.classList.add('hidden');
  if (err && message) err.textContent = message;
  finishLoading();
}

function showAuthenticatedShell(user) {
  const lscr = document.getElementById('lscr');
  const iscr = document.getElementById('iscr');
  if (lscr) lscr.classList.add('hidden');
  if (iscr) iscr.classList.remove('hidden');
  injectAppShell('index');
  const email = document.getElementById('uemail');
  if (email) email.textContent = user.email || '';
}

function showIndexError(message) {
  const c = document.getElementById('igc');
  if (c) {
    c.innerHTML = '<div class="empty-state"><p>' + esc(message) + '</p><p>Atualize a pagina ou tente novamente em instantes.</p></div>';
  }
  toast(message);
}

function planStartLabel() {
  if (!planState.planStartDate) return '';
  return 'Plano iniciado em ' + new Date(planState.planStartDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function updatePlanControls() {
  const startBtn = document.getElementById('btn-start-plan');
  const resetBtn = document.getElementById('btn-reset-plan');
  const info = document.getElementById('plan-start-info');
  const histBtn = document.getElementById('btn-history');
  const hasStart = !!planState.planStartDate;
  
  if (startBtn) startBtn.disabled = hasStart;
  if (resetBtn) resetBtn.disabled = !hasStart;
  
  if (info) {
    info.textContent = planStartLabel();
    if (hasStart) info.classList.remove('hidden');
    else info.classList.add('hidden');
  }
  
  if (histBtn) {
    const hasHistory = planState.weekCompletionHistory && Object.keys(planState.weekCompletionHistory).length > 0;
    if (hasHistory) histBtn.classList.remove('hidden');
    else histBtn.classList.add('hidden');
  }
}

async function startPlanToday() {
  const btn = document.getElementById('btn-start-plan');
  if (planState.planStartDate) return;
  planState.planStartDate = new Date().toISOString();
  if (btn) btn.disabled = true;
  renderIndex();
  const ok = await dbSaveProgress();
  if (!ok) {
    planState.planStartDate = null;
    renderIndex();
    toast('Nao foi possivel salvar o inicio do plano.');
    return;
  }
  renderIndex();
}

async function resetCurrentPlan() {
  const ok = await confirmAction({
    title: 'Apagar plano atual',
    message: 'Todo o progresso, hist\u00f3rico e dias marcados ser\u00e3o removidos. As anota\u00e7\u00f5es ser\u00e3o mantidas. Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.',
    confirmLabel: 'Apagar plano',
    danger: true
  });
  if (!ok) return;
  planState.planStartDate = null;
  planState.completedDays = {};
  planState.completedComplements = {};
  planState.weekCompletionHistory = {};
  planState.currentWeek = 1;
  const saved = await dbSaveProgress();
  if (saved) location.reload();
  else toast('Nao foi possivel apagar o plano agora.');
}

function wkStatus(wn) {
  const dc = !!planState.completedComplements[wn];
  const dd = Object.keys(planState.completedDays).filter(k => k.startsWith(wn + '-') && planState.completedDays[k]).length;
  if (dd >= 6 && dc) return 'done';
  if (dd > 0 || dc) return 'prog';
  return 'none';
}

function renderIndex() {
  updatePlanControls();
  const c = document.getElementById('igc');
  if (!c) return;
  c.classList.add('igrd');
  c.innerHTML = '';
  const dates = typeof calculateWeekDates === 'function' ? calculateWeekDates() || {} : {};
  WEEKS_INDEX.forEach(w => {
    const d = document.createElement('div');
    const status = wkStatus(w.num);
    const wcClass = status === 'done' ? 'sd' : (status === 'prog' ? 'sp' : '');
    d.className = 'wc ' + wcClass;
    if (dates[w.num] && dates[w.num].delayed) d.classList.add('wc-delayed');
    d.addEventListener('click', () => goWeek(w.num));
    let dateInfo = '';
    const weekDates = dates && dates[w.num] ? dates[w.num] : null;
    const dateStart = weekDates ? weekDates.dateStart : w.ds;
    const dateEnd = weekDates ? weekDates.dateEnd : w.de;
    if (dateStart && dateEnd) {
      const isDelayed = weekDates && weekDates.delayed;
      const delayedBadge = isDelayed ? '<span class="badge-delayed">Atrasada</span>' : '';
      dateInfo = `<div class="wcd">${fmtD(dateStart)} - ${fmtD(dateEnd)}${delayedBadge}</div>`;
    }
    d.innerHTML = `
      <div class="wch">
        <div class="wcn">Semana ${w.num}</div>
        <div class="wcs">
          <div class="sdt ${status}"></div>
        </div>
      </div>
      ${dateInfo}
      <div class="wcr">${w.block}</div>
      <div class="wcb">${esc(w.range || '')}</div>
      <div class="wca">Ver &rarr;</div>
    `;
    c.appendChild(d);
  });
}

async function doLogin() {
  const email = document.getElementById('lem').value.trim();
  const pass = document.getElementById('lpw').value;
  const err = document.getElementById('lerr');
  const btn = document.getElementById('lbtn');
  err.textContent = '';
  btn.textContent = 'Entrando...';
  btn.disabled = true;
  try {
    await waitForSupabaseRuntime();
    const { data, error } = await withTimeout(
      sb().auth.signInWithPassword({ email, password: pass }),
      AUTH_TIMEOUT_MS,
      'Tempo esgotado ao tentar entrar.'
    );
    if (error) {
      err.textContent = 'E-mail ou senha incorretos.';
      btn.textContent = 'Entrar';
      btn.disabled = false;
    } else if (data && data.session && data.user) {
      await renderAuthenticatedIndex(data.user);
    } else {
      err.textContent = 'Login recebido, mas a sessao nao foi criada. Tente novamente.';
      btn.textContent = 'Entrar';
      btn.disabled = false;
    }
  } catch (error) {
    console.error('doLogin:', error);
    err.textContent = 'Nao foi possivel conectar. Verifique sua conexao e tente novamente.';
    btn.textContent = 'Entrar';
    btn.disabled = false;
  }
}

async function renderAuthenticatedIndex(user) {
  try {
    showSpinner();
    showAuthenticatedShell(user);
    let ok = false;
    try {
      ok = await withTimeout(
        dbLoad(user.id),
        DATA_TIMEOUT_MS,
        'Tempo esgotado ao carregar dados do usuario.'
      );
    } catch (dataError) {
      console.warn('dbLoad:', dataError);
    }
    try {
      renderPH();
      renderIndex();
    } catch (renderError) {
      console.error('renderIndex:', renderError);
      showIndexError('Nao foi possivel renderizar o indice agora.');
    }
    finishLoading();
    if (!ok) toast('Nao foi possivel carregar seus dados agora.');
    return true;
  } catch (error) {
    console.error('renderAuthenticatedIndex:', error);
    showAuthenticatedShell(user || {});
    showIndexError('Voce entrou, mas nao foi possivel carregar o indice agora.');
    return false;
  } finally {
    finishLoading();
  }
}

async function initApp() {
  try {
    showAuthChecking();
    await waitForSupabaseRuntime();
    const { data: { session } } = await withTimeout(
      sb().auth.getSession(),
      AUTH_TIMEOUT_MS,
      'Tempo esgotado ao verificar a sessao.'
    );
    if (!session) {
      const sessionExpired = new URLSearchParams(location.search).get('err') === 'session';
      showLogin(sessionExpired ? 'Sessao expirada. Entre novamente.' : '');
      return false;
    }
    return await renderAuthenticatedIndex(session.user);
  } catch (error) {
    console.error('initApp:', error);
    showLogin('Nao foi possivel conectar. Verifique sua conexao e tente novamente.');
    return false;
  } finally {
    finishLoading();
  }
}

function setupModalHistory() {
  const btn = document.getElementById('btn-history');
  const modal = document.getElementById('modal-history');
  const closeBtn = modal?.querySelector('.modal-close');
  const list = document.getElementById('history-list');
  
  if (btn && modal && list) {
    btn.addEventListener('click', () => {
      list.innerHTML = '';
      if (planState.weekCompletionHistory) {
        const sortedKeys = Object.keys(planState.weekCompletionHistory).map(Number).sort((a, b) => a - b);
        if (sortedKeys.length === 0) {
          list.innerHTML = '<div class="empty-state">Nenhuma semana concluída ainda.</div>';
        } else {
          sortedKeys.forEach(wk => {
            const entry = planState.weekCompletionHistory[wk];
            const wi = WEEKS_INDEX[wk - 1];
            const title = wi ? wi.block : 'Semana';
            
            const compDateObj = new Date(entry.completedAt || entry);
            const compDateStr = fmtDFull(compDateObj);
            const delayedBadge = entry.wasDelayed ? '<span class="badge-delayed">Atrasada</span>' : '';
            const daysStr = entry.daysElapsed ? `<div class="history-days">Dias até concluir: ${entry.daysElapsed}</div>` : '';
            
            const div = document.createElement('div');
            div.className = 'rb';
            div.innerHTML = `
              <div class="rsrc">Semana ${wk} &mdash; ${title}</div>
              <div class="rcnt">
                <div>Concluída em: ${compDateStr}${delayedBadge}</div>
                ${daysStr}
              </div>
            `;
            list.appendChild(div);
          });
        }
      }
      modal.classList.remove('hidden');
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
}

function setupModalMaterials() {
  const btn = document.getElementById('btn-materials');
  const modal = document.getElementById('modal-materials');
  const closeBtn = modal?.querySelector('.modal-close');
  const list = modal?.querySelector('ol');
  if (list) {
    list.innerHTML = MATERIALS_REFERENCES.map(item => '<li>' + esc(item) + '</li>').join('');
  }
  
  if (btn && modal) {
    btn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
}

function bootstrapIndex() {
  const lfrm = document.getElementById('lfrm');
  if (lfrm) lfrm.addEventListener('submit', e => { e.preventDefault(); doLogin(); });
  const startPlanBtn = document.getElementById('btn-start-plan');
  const resetPlanBtn = document.getElementById('btn-reset-plan');
  if (startPlanBtn) startPlanBtn.addEventListener('click', startPlanToday);
  if (resetPlanBtn) resetPlanBtn.addEventListener('click', resetCurrentPlan);
  setupModalHistory();
  setupModalMaterials();
  initApp();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapIndex);
} else {
  bootstrapIndex();
}
