import { planState } from './state.js';
import { TOTAL_CHAPTERS, TOTAL_WEEKS, AT_CHAPTERS, NT_CHAPTERS, WEEKS_INDEX } from './const.js';
import { getBook } from './utils.js';
import { doLogout } from './db.js';

export function renderPH(wk) {
  const tot = Object.values(planState.completedDays).filter(Boolean).length;
  const wkd = Object.keys(planState.completedComplements).filter(k => planState.completedComplements[k]).length;
  const ch = Math.min(tot, TOTAL_CHAPTERS);
  const pct = Math.round(ch / TOTAL_CHAPTERS * 100);
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  const setW = (id, v) => { const e = document.getElementById(id); if (e) { e.style.width = v + '%'; if (e.getAttribute('role') === 'progressbar') e.setAttribute('aria-valuenow', Math.round(v)); } };
  
  setW('pfil', pct); set('ppct', pct + '%');
  set('swk', wkd + ' / ' + TOTAL_WEEKS);
  set('sch', ch + ' / ' + TOTAL_CHAPTERS);
  set('sst', tot);

  let atCompleted = 0;
  let ntCompleted = 0;
  if (planState.completedDays) {
    Object.keys(planState.completedDays).forEach(key => {
      if (!planState.completedDays[key]) return;
      const parts = key.split('-');
      const s = parseInt(parts[0]);
      const d = parseInt(parts[1]);
      let chNum = null;
      if (chNum === null && typeof WEEKS_INDEX !== 'undefined') {
        const wi = WEEKS_INDEX.find(w => w.num === s);
        if (wi && wi.chaptersStart !== undefined) {
          chNum = wi.chaptersStart + d;
          if (wi.chaptersEnd !== undefined) chNum = Math.min(wi.chaptersEnd, chNum);
        }
      }
      if (chNum !== null) {
        const book = getBook(chNum);
        if (book[2] === "AT") atCompleted++;
        else if (book[2] === "NT") ntCompleted++;
      } else {
        if (s >= 66) ntCompleted++;
        else atCompleted++;
      }
    });
  }
  const patVal = Math.min(100, Math.round(atCompleted / AT_CHAPTERS * 100));
  const pntVal = Math.min(100, Math.round(ntCompleted / NT_CHAPTERS * 100));
  const patWidth = Math.min(100, atCompleted / AT_CHAPTERS * 100);
  const pntWidth = Math.min(100, ntCompleted / NT_CHAPTERS * 100);
  setW('bat', patWidth); set('pat', patVal + '%');
  setW('bnt', pntWidth); set('pnt', pntVal + '%');

  if (wk !== undefined && typeof WEEKS_INDEX !== 'undefined') {
    const wd = WEEKS_INDEX[wk - 1];
    if (wd && wd.chaptersStart !== undefined) {
      const bk = getBook(wd.chaptersStart);
      let bkCh = 0;
      Object.keys(planState.completedDays).forEach(key => {
        if (!planState.completedDays[key]) return;
        const wn = parseInt(key.split('-')[0]);
        const d2 = WEEKS_INDEX[wn - 1]; if (!d2 || d2.chaptersStart === undefined) return;
        if (getBook(d2.chaptersStart)[3] === bk[3]) bkCh++;
      });
      const bp = Math.min(100, Math.round(bkCh / bk[1] * 100));
      setW('bbk', bp); set('pbk', bp + '%'); set('lbk', bk[0]);
      set('bbdg', bk[0].toUpperCase());
      set('bvt', bk[4] ? '"' + bk[4] + '"' : ' ');
      set('bvr', bk[5] || '');
    }
  }
}

export function buildAppShell(activePage) {
  const isIndex = activePage === 'index' ? ' act' : '';
  const isSemanas = activePage === 'semanas' ? ' act' : '';
  const isAnotacoes = activePage === 'anotacoes' ? ' act' : '';
  const isWeekPage = activePage === 'semanas';
  const progressDetailClass = isWeekPage ? 'psts2' : 'psts2 psts2-summary';
  const bookProgress = isWeekPage ? `
        <div class="si2">
          <div class="sl2">Livro Atual</div>
          <div class="sbw">
            <div class="sbm"><div class="sbf fg" id="bbk"></div></div>
            <span class="spct" id="pbk">0%</span>
          </div>
          <div class="book-label" id="lbk">-</div>
        </div>` : '';
  const bookVerse = isWeekPage ? `
      <div class="bvb">
        <div class="bbdg" id="bbdg">-</div>
        <div>
          <div class="bvt muted" id="bvt">Selecione uma semana.</div>
          <div class="bvr" id="bvr"></div>
        </div>
      </div>` : '';

  return `
    <header class="hdr">
      <div class="hdrorn">&#10022; FaithSync &#10022;</div>
      <h1 class="hdrttl">Plano de Leitura B&iacute;blica</h1>
      <p class="hdrsub">Estudo em Fam&iacute;lia - G&ecirc;nesis ao Apocalipse</p>
    </header>
    <nav class="tnav" aria-label="Navega&ccedil;&atilde;o principal">
      <button class="tbtn${isIndex}" data-nav="index.html" aria-label="Ir para o &Iacute;ndice">&#205;ndice</button>
      <span class="tsep">|</span>
      <button class="tbtn${isSemanas}" data-nav="semanas.html" aria-label="Ir para Semanas">Semanas</button>
      <span class="tsep">|</span>
      <button class="tbtn${isAnotacoes}" data-nav="anotacoes.html" aria-label="Ir para Anota&ccedil;&otilde;es">Anota&ccedil;&otilde;es</button>
      <span class="tsep">|</span>
      <span class="uinf" id="uemail"></span>
      <span class="usep" aria-hidden="true"></span>
      <button class="lout" id="btnLogout" aria-label="Sair da conta">sair</button>
    </nav>
    <div class="psec">
      <div class="plbl"><span>Progresso Geral</span><span id="ppct">0%</span></div>
      <div class="ptrk"><div class="pfil" id="pfil"></div></div>
      <div class="psts">
        <div class="si"><span class="sv" id="swk">0 / 87</span><span class="sl">Semanas conclu&iacute;das</span></div>
        <div class="si"><span class="sv" id="sch">0 / 1189</span><span class="sl">Cap&iacute;tulos lidos</span></div>
        <div class="si"><span class="sv" id="sst">0</span><span class="sl">Dias seguidos</span></div>
      </div>
      <div class="sdiv"></div>
      <div class="${progressDetailClass}">
        ${bookProgress}
        <div class="si2">
          <div class="sl2">Antigo Testamento</div>
          <div class="sbw">
            <div class="sbm"><div class="sbf fb" id="bat" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso Antigo Testamento"></div></div>
            <span class="spct" id="pat">0%</span>
          </div>
          <div class="chapter-note">929 cap&iacute;tulos</div>
        </div>
        <div class="si2">
          <div class="sl2">Novo Testamento</div>
          <div class="sbw">
            <div class="sbm"><div class="sbf ft" id="bnt" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso Novo Testamento"></div></div>
            <span class="spct" id="pnt">0%</span>
          </div>
          <div class="chapter-note">260 cap&iacute;tulos</div>
        </div>
      </div>
      ${bookVerse}
    </div>
  `;
}

let confirmState = null;

function ensureConfirmDialog() {
  let modal = document.getElementById('app-confirm-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'app-confirm-modal';
  modal.className = 'modal confirm-modal hidden';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'app-confirm-title');
  modal.innerHTML = `
    <div class="modal-content confirm-content">
      <button class="modal-close" type="button" data-confirm-cancel aria-label="Fechar">&times;</button>
      <h2 id="app-confirm-title"></h2>
      <p id="app-confirm-message" class="confirm-message"></p>
      <div class="confirm-actions">
        <button class="abtn" type="button" data-confirm-cancel>Cancelar</button>
        <button class="abtn danger" type="button" data-confirm-ok>Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-confirm-cancel]')) {
      closeConfirmDialog(false);
    }
    if (event.target.closest('[data-confirm-ok]')) {
      closeConfirmDialog(true);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && confirmState) closeConfirmDialog(false);
  });

  return modal;
}

function closeConfirmDialog(result) {
  if (!confirmState) return;
  const { modal, resolve, previousFocus } = confirmState;
  modal.classList.add('hidden');
  confirmState = null;
  if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  resolve(result);
}

export function confirmAction(options) {
  const modal = ensureConfirmDialog();
  const title = modal.querySelector('#app-confirm-title');
  const message = modal.querySelector('#app-confirm-message');
  const okBtn = modal.querySelector('[data-confirm-ok]');
  const cancelBtn = modal.querySelector('.confirm-actions [data-confirm-cancel]');

  title.textContent = options.title || 'Confirmar a\u00e7\u00e3o';
  message.textContent = options.message || '';
  okBtn.textContent = options.confirmLabel || 'Confirmar';
  cancelBtn.textContent = options.cancelLabel || 'Cancelar';
  okBtn.classList.toggle('danger', options.danger !== false);

  modal.classList.remove('hidden');

  return new Promise((resolve) => {
    confirmState = {
      modal,
      resolve,
      previousFocus: document.activeElement
    };
    okBtn.focus();
  });
}

export function setupNav() {
  document.querySelectorAll('[data-nav]').forEach(b => {
    b.addEventListener('click', () => window.location.href = b.dataset.nav);
  });
  const lo = document.getElementById('btnLogout');
  if (lo) lo.addEventListener('click', doLogout);
}

export function injectAppShell(activePage) {
  const placeholder = document.getElementById('app-shell');
  if (!placeholder) return;
  placeholder.innerHTML = buildAppShell(activePage);
  setupNav();
}
