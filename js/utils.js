import { BOOKS, AT_CHAPTERS, NT_CHAPTERS } from './const.js';

export function getBook(n) {
  for (let i = BOOKS.length - 1; i >= 0; i--) {
    if (n >= BOOKS[i][3]) return BOOKS[i];
  }
  return BOOKS[0];
}

export function atPct(n) {
  return Math.min(100, Math.round(Math.max(0, n - 1) / AT_CHAPTERS * 100));
}

export function ntPct(n) {
  if (n < 930) return 0;
  return Math.min(100, Math.round((n - 930) / NT_CHAPTERS * 100));
}

export function fmtD(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function fmtDFull(d) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

export function isToday(d) {
  return d.toDateString() === new Date().toDateString();
}

export function esc(t) {
  return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}
