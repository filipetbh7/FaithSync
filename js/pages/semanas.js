import { planState, weekNotes } from '../state.js';
import { TOTAL_WEEKS, WEEKS_INDEX } from '../const.js';
import { loadWeek } from '../content-loader.js';
import { calculateWeekDates, checkWeekCompletion } from '../domain.js';
import { renderPH, injectAppShell } from '../ui.js';
import { esc, fmtD, fmtDFull, isToday, toast } from '../utils.js';
import { sb, dbLoad, dbSave, dbSaveNote } from '../db.js';
import { validateImportState } from '../validators.js';

let CW = 32;

function getWkFromURL() {
  const p = new URLSearchParams(location.search);
  return parseInt(p.get('week')) || planState.currentWeek || 32;
}

async function navWk(d) {
  const n = CW + d;
  if (n < 1 || n > TOTAL_WEEKS) return;
  CW = n;
  history.replaceState(null, '', 'semanas.html?week=' + n);
  await renderWk(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function renderWk(wn) {
  CW = wn;
  const wi = WEEKS_INDEX[wn - 1];
  const mc = document.getElementById('mc');
  if (!wi || !mc) return false;
  renderWeekHeader(wn, wi, null);
  const wk = wi.hasContent ? await loadWeek(wn) : null;
  if (CW !== wn) return true;
  renderWeekHeader(wn, wi, wk);
  if (!wk || !Array.isArray(wk.days) || !wk.days.length) {
    mc.innerHTML = renderEmptyWeek(wn, wi, wk);
    attachWeekNavHandlers();
    return true;
  }
  mc.innerHTML = renderDays(wk) + renderVisual(wk) + renderComplement(wk) + renderReflection(wk) + renderNoteSection(wn);
  attachWeekHandlers();
  return true;
}

function renderWeekHeader(wn, wi, wk) {
  document.getElementById('btnP').disabled = wn <= 1;
  document.getElementById('btnN').disabled = wn >= TOTAL_WEEKS;
  document.getElementById('wknum').textContent = 'Semana ' + wn;
  document.getElementById('wkttl').textContent = (wk && wk.title) || 'Semana ' + wn;
  
  const weekDates = calculateWeekDates();
  let subText = wi.range;
  if (weekDates && weekDates[wn]) {
    subText = fmtD(weekDates[wn].dateStart) + ' - ' + fmtD(weekDates[wn].dateEnd) + ' | ' + wi.range;
  }
  document.getElementById('wksub').textContent = subText;
  
  const bannerContainer = document.getElementById('delay-banner-container');
  if (bannerContainer) {
    if (weekDates && weekDates[wn] && weekDates[wn].delayed) {
      bannerContainer.innerHTML = '<div class="delay-banner">⚠ Semana em atraso — marque o domingo quando possível</div>';
    } else {
      bannerContainer.innerHTML = '';
    }
  }
  
  renderPH(wn);
}

function renderEmptyWeek(wn, wi, wk) {
  const range = (wk && wk.title) || wi.range;
  return '<div class="empty-state">' +
    '<p>Conte&uacute;do em breve.</p>' +
    '<p>Semana <strong>' + wn + '</strong> &mdash; <em>' + esc(range) + '</em></p>' +
    '<p>O conte&uacute;do ser&aacute; adicionado progressivamente.</p>' +
    '</div>';
}

function renderDays(wk) {
  let h = '';
  h += '<div class="sh">Leitura Di&aacute;ria | 15 minutos por dia</div>';
  h += '<div class="dgrd">';
  const weekDates = calculateWeekDates();
  wk.days.forEach((day, i) => {
    const key = CW + '-' + i;
    const ck = !!planState.completedDays[key];
    
    let actualDate = null;
    if (weekDates && weekDates[CW]) {
      actualDate = new Date(weekDates[CW].dateStart);
      actualDate.setDate(actualDate.getDate() + i);
    }
    
    const td = actualDate ? isToday(actualDate) : false;
    h += '<div class="dc' + (ck ? ' ck' : '') + (td ? ' td' : '') + '" data-key="' + key + '">';
    h += '<div class="dch"><div><div class="dlbl">' + esc(day.dayOfWeek) + '</div><div class="ddt">' + (actualDate ? fmtD(actualDate) : '') + '</div></div>';
    h += '<div class="dchk' + (ck ? ' ck' : '') + '" data-key="' + key + '"></div></div>';
    h += '<div class="dr">' + esc(day.reading) + (day.verses ? ' <span class="verse-detail">' + esc(day.verses) + '</span>' : '') + '</div>';
    h += '<div class="dctx">' + esc(day.context) + '</div>';
    h += (td ? '<div class="dbdg td">Hoje</div>' : ck ? '<div class="dbdg">Lido</div>' : '');
    h += '</div>';
  });
  h += '</div>';
  return h;
}

function renderVisual(wk) {
  if (typeof wk._renderVisual !== 'function') return '';
  const visual = wk._renderVisual(wk.visualData);
  if (!visual) return '';
  const title = wk.visualData && wk.visualData.heading ? wk.visualData.heading : 'Visual da Semana';
  let h = '';
  h += '<div class="sh">Visual da Semana</div>';
  h += '<div class="vcnt"><div class="vttl">' + esc(title) + '</div>' + visual + '</div>';
  return h;
}

function renderComplement(wk) {
  let h = '';
  const cd = !!planState.completedComplements[CW];
  const weekDates = calculateWeekDates();
  let compDate = null;
  if (weekDates && weekDates[CW]) {
    compDate = new Date(weekDates[CW].dateStart);
    compDate.setDate(compDate.getDate() + 6);
  }
  
  h += '<div class="sh">Complementa&ccedil;&atilde;o Semanal | ~1 hora' + (compDate ? ' | ' + fmtD(compDate) : '') + '</div>';
  h += '<div class="ccard"><div class="cchdr"><div class="cttl">Estudo Complementar - ' + esc(wk.title) + '</div>';
  h += '<div class="comp-meta"><div class="cdt">' + (compDate ? fmtDFull(compDate) : '') + '</div>';
  h += '<div class="dchk' + (cd ? ' ck' : '') + '" data-comp="' + CW + '"></div></div></div>';
  h += '<p class="cintro">' + esc(wk.complement.intro) + '</p><div class="rgrd">';
  wk.complement.resources.forEach(r => {
    h += '<div class="rb ' + r.type + '"><div class="rsrc">' + esc(r.title) + '</div><div class="rcnt"><ul>';
    r.items.forEach(x => { h += '<li>' + esc(x) + '</li>'; });
    h += '</ul></div></div>';
  });
  h += '</div></div>';
  return h;
}

function renderReflection(wk) {
  let h = '';
  h += '<div class="sh">Reflex&atilde;o da Semana</div>';
  h += '<div class="rfcard"><div class="rforn">"</div><div class="rfq">' + esc(wk.reflection.verse) + '</div>';
  h += '<div class="rfref">' + esc(wk.reflection.reference) + '</div><div class="rfq2">* ' + esc(wk.reflection.question) + '</div></div>';
  return h;
}

function renderNoteSection(wn) {
  let h = '';
  h += '<div class="sh">Anota&ccedil;&otilde;es da Semana</div>';
  h += '<textarea class="ntxt" id="ntxt" data-week="' + wn + '" placeholder="Insights, perguntas, vers&iacute;culos marcantes...">' + esc(weekNotes[wn] || '') + '</textarea>';

  h += '<div class="abar">';
  h += '<button class="abtn sv" id="btnSv">Salvar</button>';
  h += '<button class="abtn" id="btnExp">&#8595; Backup Local</button>';
  h += '<button class="abtn" id="btnImp">&#8593; Restaurar Backup</button>';
  h += '<input type="file" id="fImp" accept=".json" class="hidden">';
  h += '<button class="abtn danger" id="btnRst">Reiniciar Semana</button>';
  h += '</div>';
  return h;
}

function attachWeekHandlers() {
  attachWeekNavHandlers();
  document.querySelectorAll('[data-key]').forEach(el => {
    el.addEventListener('click', (ev) => { ev.stopPropagation(); togDay(el.dataset.key); });
  });
  document.querySelectorAll('[data-comp]').forEach(el => {
    el.addEventListener('click', (ev) => { ev.stopPropagation(); togComp(parseInt(el.dataset.comp)); });
  });
  const nt = document.getElementById('ntxt');
  if (nt) {
    nt.addEventListener('input', () => {
      const wn = parseInt(nt.dataset.week);
      clearTimeout(_nt);
      _np = { wn: wn, txt: nt.value };
      _nt = setTimeout(async () => { await dbSaveNote(wn, nt.value); _np = null; }, 1500);
    });
  }
  const bSv = document.getElementById('btnSv'); if (bSv) bSv.addEventListener('click', doSave);
  const bEx = document.getElementById('btnExp'); if (bEx) bEx.addEventListener('click', doExport);
  const bIm = document.getElementById('btnImp'); if (bIm) bIm.addEventListener('click', () => document.getElementById('fImp').click());
  const fI = document.getElementById('fImp'); if (fI) fI.addEventListener('change', doImport);
  const bR = document.getElementById('btnRst'); if (bR) bR.addEventListener('click', doReset);
}

function attachWeekNavHandlers() {
  const btnP = document.getElementById('btnP');
  const btnN = document.getElementById('btnN');
  if (btnP && !btnP.dataset.bound) {
    btnP.addEventListener('click', () => navWk(-1));
    btnP.dataset.bound = 'true';
  }
  if (btnN && !btnN.dataset.bound) {
    btnN.addEventListener('click', () => navWk(1));
    btnN.dataset.bound = 'true';
  }
}

let _nt = null, _np = null;

async function togDay(key) {
  planState.completedDays[key] = !planState.completedDays[key];
  const wn = parseInt(key.split('-')[0]);
  checkWeekCompletion(wn);
  await renderWk(CW);
  const ok = await dbSave();
  toast(ok ? (planState.completedDays[key] ? 'Leitura marcada' : 'Marcacao removida') : 'Erro - use botao Salvar');
}

async function togComp(wn) {
  planState.completedComplements[wn] = !planState.completedComplements[wn];
  checkWeekCompletion(wn);
  await renderWk(wn);
  const ok = await dbSave();
  toast(ok ? (planState.completedComplements[wn] ? 'Complementacao concluida' : 'Marcacao removida') : 'Erro - use botao Salvar');
}

async function doSave() {
  const btn = document.getElementById('btnSv');
  if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true; }
  if (_np) { clearTimeout(_nt); await dbSaveNote(_np.wn, _np.txt); _np = null; }
  const ok = await dbSave();
  if (btn) {
    btn.disabled = false;
    if (ok) { btn.classList.add('svok'); btn.textContent = 'Salvo'; setTimeout(() => { btn.classList.remove('svok'); btn.textContent = 'Salvar'; }, 2500); }
    else { btn.textContent = 'Erro!'; setTimeout(() => btn.textContent = 'Salvar', 3000); }
  }
}

function doExport() {
  const ts = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    state: planState,
    notes: weekNotes
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'faithsync_backup_' + ts + '.json';
  a.click(); URL.revokeObjectURL(url);
  toast('Backup salvo: faithsync_backup_' + ts + '.json');
}

async function doImport(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  if (!confirm('Restaurar backup? O progresso atual no servidor sera substituido.')) return;
  const r = new FileReader();
  r.onload = async (e) => {
    try {
      const d = JSON.parse(e.target.result);
      const check = validateImport(d);
      if (!check.valid) { toast(check.reason); return; }
      if (Object.prototype.hasOwnProperty.call(d, 'state')) {
        const stateCheck = validateImportState(d.state);
        if (!stateCheck.valid) {
          toast('Backup invalido: ' + stateCheck.errors[0]);
          return;
        }
        Object.assign(planState, d.state);
      }
      const notesResult = await importValidNotes(d.notes);
      const ok = await dbSave();
      if (ok) {
        await renderWk(CW);
        if (notesResult.ignored > 0) toast('Backup restaurado. ' + notesResult.ignored + ' anotacao(oes) ignorada(s) por dados invalidos.');
        else toast('Backup restaurado com sucesso');
      }
      else toast('Erro ao salvar no servidor — tente novamente');
    } catch (err) {
      console.error('doImport error:', err);
      toast('Arquivo invalido ou corrompido');
    }
  };
  r.readAsText(file);
}

function validateImport(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return { valid: false, reason: 'Arquivo invalido ou corrompido' };
  if (!Object.prototype.hasOwnProperty.call(d, 'version')) return { valid: false, reason: 'Arquivo invalido: versao do backup ausente' };
  const hasState = Object.prototype.hasOwnProperty.call(d, 'state');
  const hasNotes = Object.prototype.hasOwnProperty.call(d, 'notes');
  if (!hasState && !hasNotes) return { valid: false, reason: 'Arquivo nao contem dados para restaurar' };
  if (hasState && (!d.state || typeof d.state !== 'object' || Array.isArray(d.state))) return { valid: false, reason: 'Arquivo invalido: estado do backup corrompido' };
  if (hasNotes && (!d.notes || typeof d.notes !== 'object' || Array.isArray(d.notes))) return { valid: false, reason: 'Arquivo invalido: anotacoes do backup corrompidas' };
  return { valid: true };
}

async function importValidNotes(notes) {
  let ignored = 0;
  if (!notes) return { ignored: ignored };
  for (const k in notes) {
    if (!Object.prototype.hasOwnProperty.call(notes, k)) continue;
    const wn = Number(k);
    if (!Number.isInteger(wn) || wn < 1 || wn > TOTAL_WEEKS || typeof notes[k] !== 'string') {
      ignored++;
      continue;
    }
    await dbSaveNote(wn, notes[k]);
  }
  return { ignored: ignored };
}

async function doReset() {
  if (confirm('Reiniciar marcacoes desta semana? Anotacoes mantidas.')) {
    const wk = await loadWeek(CW);
    if (wk && Array.isArray(wk.days)) {
      wk.days.forEach((_, i) => { delete planState.completedDays[CW + '-' + i]; });
    }
    delete planState.completedComplements[CW];
    if (planState.weekCompletionHistory) delete planState.weekCompletionHistory[CW];
    dbSave(); await renderWk(CW);
    toast('Semana reiniciada');
  }
}

async function initApp() {
  const sp = document.getElementById('spinner');
  const pc = document.getElementById('page-content');
  try {
    if (sp) sp.classList.remove('hidden');
    const { data: { session } } = await sb().auth.getSession();
    if (!session) {
      window.location.href = 'index.html?err=session';
      return;
    }
    const user = session.user;
    const ok = await dbLoad(user.id);
    
    injectAppShell('semanas');
    
    if (!await renderWk(getWkFromURL())) throw new Error('Semana nao encontrada');
    if (pc) pc.classList.remove('hidden');
    document.body.classList.add('ready');
    const e = document.getElementById('uemail'); if (e) e.textContent = user.email;
    if (!ok) toast('Erro ao carregar dados. Verifique sua conexao.');
  } catch (err) {
    console.error('init semanas:', err);
    showInitError('Nao foi possivel carregar esta semana. Tente novamente em instantes.');
  } finally {
    if (sp && !document.body.classList.contains('ready')) sp.classList.add('hidden');
  }
}

function showInitError(msg) {
  const pc = document.getElementById('page-content');
  const mc = document.getElementById('mc');
  if (pc) pc.classList.remove('hidden');
  document.body.classList.add('ready');
  if (mc) mc.innerHTML = '<div class="phbox"><div class="init-error-icon">*</div>' +
    '<div class="init-error-title">ERRO AO CARREGAR</div>' +
    '<div class="init-error-msg">' + esc(msg) + '</div>' +
    '<button class="abtn init-error-back" id="btnBack">&larr; Voltar ao &Iacute;ndice</button></div>';
  const bb = document.getElementById('btnBack');
  if (bb) bb.addEventListener('click', () => location.href = 'index.html');
  toast(msg);
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
