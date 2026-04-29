import { planState } from './state.js';
import { TOTAL_CHAPTERS, TOTAL_WEEKS, AT_CHAPTERS, NT_CHAPTERS, BOOKS, WEEKS_INDEX } from './const.js';
import { WEEKS_DATA } from './semanas.js';
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
      if (typeof WEEKS_DATA !== 'undefined' && WEEKS_DATA[s]) {
        const wd = WEEKS_DATA[s];
        if (wd.days && wd.days[d] && wd.days[d].reading) {
          const reading = wd.days[d].reading;
          const bk = BOOKS.find(b => reading.startsWith(b[0]));
          if (bk) {
            const rest = reading.substring(bk[0].length).trim();
            const match = rest.match(/\d+/);
            if (match) chNum = bk[3] + parseInt(match[0]) - 1;
            else chNum = bk[3];
          }
        }
        if (chNum === null && wd.chaptersStart !== undefined) {
          chNum = wd.chaptersStart + d;
          if (wd.chaptersEnd !== undefined) chNum = Math.min(wd.chaptersEnd, chNum);
        }
      }
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

  if (wk !== undefined && typeof WEEKS_DATA !== 'undefined') {
    const wd = WEEKS_DATA[wk];
    if (wd) {
      const bk = getBook(wd.chaptersStart);
      let bkCh = 0;
      Object.keys(planState.completedDays).forEach(key => {
        if (!planState.completedDays[key]) return;
        const wn = parseInt(key.split('-')[0]);
        const d2 = WEEKS_DATA[wn]; if (!d2) return;
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
      <div class="psts2">
        <div class="si2">
          <div class="sl2">Livro Atual</div>
          <div class="sbw">
            <div class="sbm"><div class="sbf fg" id="bbk"></div></div>
            <span class="spct" id="pbk">0%</span>
          </div>
          <div style="font-size:.73rem;color:var(--ts);margin-top:.1rem" id="lbk">-</div>
        </div>
        <div class="si2">
          <div class="sl2">Antigo Testamento</div>
          <div class="sbw">
            <div class="sbm"><div class="sbf fb" id="bat" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso Antigo Testamento"></div></div>
            <span class="spct" id="pat">0%</span>
          </div>
          <div style="font-size:.66rem;color:var(--td);margin-top:.1rem">929 cap&iacute;tulos</div>
        </div>
        <div class="si2">
          <div class="sl2">Novo Testamento</div>
          <div class="sbw">
            <div class="sbm"><div class="sbf ft" id="bnt" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso Novo Testamento"></div></div>
            <span class="spct" id="pnt">0%</span>
          </div>
          <div style="font-size:.66rem;color:var(--td);margin-top:.1rem">260 cap&iacute;tulos</div>
        </div>
      </div>
      <div class="bvb">
        <div class="bbdg" id="bbdg">-</div>
        <div>
          <div class="bvt" id="bvt" style="color:var(--td)">Selecione uma semana.</div>
          <div class="bvr" id="bvr"></div>
        </div>
      </div>
    </div>
  `;
}

export function setupNav() {
  document.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = () => window.location.href = b.dataset.nav;
  });
  const lo = document.getElementById('btnLogout');
  if (lo) lo.onclick = doLogout;
}

export function injectAppShell(activePage) {
  const placeholder = document.getElementById('app-shell');
  if (!placeholder) return;
  placeholder.innerHTML = buildAppShell(activePage);
  setupNav();
}
