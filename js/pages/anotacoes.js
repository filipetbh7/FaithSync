import { weekNotes } from '../state.js';
import { WEEKS_INDEX } from '../const.js';
import { renderPH, injectAppShell } from '../ui.js';
import { esc, fmtD, toast } from '../utils.js';
import { getUser, dbLoad, dbDeleteAllNotes } from '../db.js';

function renderNotes() {
  const c = document.getElementById('nl');
  const wks = Object.keys(weekNotes).map(k => parseInt(k)).filter(n => weekNotes[n] && weekNotes[n].trim()).sort((a, b) => a - b);
  
  const btnDelete = document.getElementById('btn-delete-notes');
  if (btnDelete) {
    if (wks.length > 0) {
      btnDelete.removeAttribute('disabled');
      btnDelete.onclick = async () => {
        if (confirm("Apagar todas as anotações? Esta ação não pode ser desfeita.")) {
          btnDelete.disabled = true;
          const ok = await dbDeleteAllNotes();
          if (ok) {
            location.reload();
          } else {
            if (typeof toast === 'function') toast('Erro ao apagar anotações.');
            btnDelete.disabled = false;
          }
        }
      };
    } else {
      btnDelete.setAttribute('disabled', 'true');
      btnDelete.onclick = null;
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
    el.onclick = (ev) => { ev.stopPropagation(); location.href = 'semanas.html?week=' + el.dataset.week; };
  });
}

async function init() {
  const sp = document.getElementById('spinner');
  const pc = document.getElementById('page-content');
  try {
    if (sp) sp.classList.remove('hidden');
    const user = await getUser();
    if (!user) return;
    const ok = await dbLoad(user.id);
    
    injectAppShell('anotacoes');
    
    const e = document.getElementById('uemail'); if (e) e.textContent = user.email;
    renderPH();
    renderNotes();
    if (pc) pc.classList.remove('hidden');
    document.body.classList.add('ready');
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
