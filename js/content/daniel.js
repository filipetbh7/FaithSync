function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function renderEmpire(empire) {
  const nameY = empire.position === 'top' ? 68 : 200;
  const creatureY = empire.position === 'top' ? 82 : 214;
  const referenceY = empire.position === 'top' ? 95 : 227;
  const periodY = empire.position === 'top' ? 155 : 110;
  const figureY = empire.position === 'top' ? 168 : 98;
  const lineY1 = empire.position === 'top' ? 122 : 138;
  const lineY2 = empire.position === 'top' ? 75 : 185;

  return `
    <circle cx="${empire.x}" cy="130" r="8" fill="${esc(empire.color)}" opacity="0.9"/>
    <line x1="${empire.x}" y1="${lineY1}" x2="${empire.x}" y2="${lineY2}" stroke="${esc(empire.color)}" stroke-width="1" opacity="0.6"/>
    <text x="${empire.x}" y="${nameY}" text-anchor="middle" font-family="'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif" font-size="9.5" fill="${esc(empire.nameColor || empire.color)}" letter-spacing="1">${esc(empire.name)}</text>
    <text x="${empire.x}" y="${creatureY}" text-anchor="middle" font-size="9" fill="#7a6e5a">${esc(empire.creature)}</text>
    <text x="${empire.x}" y="${referenceY}" text-anchor="middle" font-size="9" fill="#7a6e5a">${esc(empire.reference)}</text>
    <text x="${empire.x}" y="${periodY}" text-anchor="middle" font-family="'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif" font-size="8" fill="#5a4020" letter-spacing="1">${esc(empire.period)}</text>
    <text x="${empire.x}" y="${figureY}" text-anchor="middle" font-size="8.5" fill="#5a5040" font-style="italic">${esc(empire.figure)}</text>`;
}

export function render(visualData) {
  if (!visualData || !Array.isArray(visualData.empires)) return '';
  const terminal = visualData.terminal || {};
  const terminalLines = Array.isArray(terminal.lines) ? terminal.lines : [];

  return `
  <svg viewBox="0 0 800 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#1a1208"/>
        <stop offset="50%" stop-color="#2c1f0e"/>
        <stop offset="100%" stop-color="#1a1208"/>
      </linearGradient>
      <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#3d2b14"/>
        <stop offset="20%" stop-color="#c9a84c"/>
        <stop offset="80%" stop-color="#c9a84c"/>
        <stop offset="100%" stop-color="#3d2b14"/>
      </linearGradient>
    </defs>
    <rect width="800" height="280" fill="url(#bg)"/>
    <text x="400" y="28" text-anchor="middle" font-family="'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif" font-size="11" fill="#7a6030" letter-spacing="3">${esc(visualData.title)}</text>
    <line x1="60" y1="130" x2="740" y2="130" stroke="url(#line-grad)" stroke-width="1.5"/>
    ${visualData.empires.map(renderEmpire).join('')}
    <line x1="740" y1="130" x2="780" y2="130" stroke="#c9a84c" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>
    <text x="790" y="127" font-size="9" fill="#c9a84c" font-style="italic">${esc(terminalLines[0])}</text>
    <text x="790" y="138" font-size="9" fill="#c9a84c" font-style="italic">${esc(terminalLines[1])}</text>
    <text x="790" y="149" font-size="7.5" fill="#7a6030">${esc(terminal.reference)}</text>
    <path d="M 146 130 L 274 130" stroke="#3d2b14" stroke-width="1" marker-end="url(#arr)"/>
    <path d="M 306 130 L 454 130" stroke="#3d2b14" stroke-width="1"/>
    <path d="M 486 130 L 624 130" stroke="#3d2b14" stroke-width="1"/>
    <text x="400" y="262" text-anchor="middle" font-size="8.5" fill="#5a4020" font-style="italic">${esc(visualData.note)}</text>
  </svg>`;
}
