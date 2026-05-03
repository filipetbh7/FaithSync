import { weekNotes } from '../state.js';
import { WEEKS_INDEX } from '../const.js';
import { confirmAction, renderPH, injectAppShell } from '../ui.js';
import { esc, fmtD, toast } from '../utils.js';
import { getUser, waitForSupabaseRuntime, dbLoad, dbDeleteAllNotes } from '../db.js';

const AUTH_TIMEOUT_MS = 7000;
const DATA_TIMEOUT_MS = 20000;

function withTimeout(promise, timeoutMs, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}

function renderNotes() {
  const c = document.getElementById('nl');
  const wks = Object.keys(weekNotes).map(k => parseInt(k)).filter(n => weekNotes[n] && weekNotes[n].trim()).sort((a, b) => a - b);
  
  const btnDelete = document.getElementById('btn-delete-notes');
  if (btnDelete) {
    if (wks.length > 0) {
      btnDelete.removeAttribute('disabled');
    } else {
      btnDelete.setAttribute('disabled', 'true');
    }
  }

  if (!wks.length) {
    c.innerHTML = '<div class="empty-state">' +
      '<p>Nenhuma anotação registrada ainda.</p>' +
      '<p>Acesse uma semana e escreva sua reflexão na seção de anotações.</p>' +
      '</div>';
    return;
  }
  let h = '';
  wks.forEach(wn => {
    const wi = WEEKS_INDEX[wn - 1]; if (!wi) return;
    h += '<div class="ne" data-week="' + wn + '">';
    h += '<div class="neh" data-week="' + wn + '">';
    h += '<div><div class="newk">Semana ' + wn + ' | ' + esc(wi.block) + '</div><div class="ner">' + esc(wi.range) + '</div><div class="ned">' + fmtD(wi.ds) + ' - ' + fmtD(wi.de) + '</div></div>';
    h += '<button class="nel" data-week="' + wn + '">Ir a semana &rarr;</button>';
    h += '</div><div class="neb">' + esc(weekNotes[wn]) + '</div></div>';
  });
  c.innerHTML = h;
  document.querySelectorAll('.neh,.nel').forEach(el => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      location.href = 'semanas.html?week=' + el.dataset.week;
    });
  });
}

function setupDeleteNotesHandler() {
  const btnDelete = document.getElementById('btn-delete-notes');
  if (!btnDelete) return;
  btnDelete.addEventListener('click', async () => {
    if (btnDelete.disabled) return;
    const ok = await confirmAction({
      title: 'Apagar anota\u00e7\u00f5es',
      message: 'Todas as anota\u00e7\u00f5es do plano ser\u00e3o removidas. Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.',
      confirmLabel: 'Apagar anota\u00e7\u00f5es',
      danger: true
    });
    if (!ok) return;
    btnDelete.disabled = true;
    const deleted = await dbDeleteAllNotes();
    if (deleted) {
      renderNotes();
      toast('Anota\u00e7\u00f5es apagadas.');
    } else {
      toast('Erro ao apagar anota\u00e7\u00f5es.');
      btnDelete.disabled = false;
    }
  });
}

async function init() {
  const sp = document.getElementById('spinner');
  const pc = document.getElementById('page-content');
  try {
    if (sp) sp.classList.remove('hidden');
    await waitForSupabaseRuntime();
    const user = await withTimeout(
      getUser(),
      AUTH_TIMEOUT_MS,
      'Tempo esgotado ao verificar a sessao.'
    );
    if (!user) return;
    injectAppShell('anotacoes');
    const e = document.getElementById('uemail'); if (e) e.textContent = user.email;
    setupDeleteNotesHandler();
    if (pc) pc.classList.remove('hidden');
    document.body.classList.add('ready');
    const ok = await withTimeout(
      dbLoad(user.id),
      DATA_TIMEOUT_MS,
      'Tempo esgotado ao carregar anotacoes.'
    );
    renderPH();
    renderNotes();
    if (!ok) toast('Erro ao carregar dados. Verifique sua conexao.');
  } catch (err) {
    console.error('init anotacoes:', err);
    if (pc) pc.classList.remove('hidden');
    document.body.classList.add('ready');
    const c = document.getElementById('nl');
    if (c) c.innerHTML = '<div class="empty-state"><p>N&atilde;o foi poss&iacute;vel carregar suas anota&ccedil;&otilde;es.</p><p>Verifique sua conex&atilde;o e tente novamente.</p></div>';
    toast('Erro ao carregar dados. Verifique sua conexao.');
  } finally {
    if (sp && !document.body.classList.contains('ready')) sp.classList.add('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
