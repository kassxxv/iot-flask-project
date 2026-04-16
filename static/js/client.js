const OP_SYMBOLS = { plus: '+', minus: '−', krat: '×', deleno: '÷' };
const REFRESH_INTERVAL = 5000;

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function setStatus(online) {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (!dot || !text) return;
  if (online) {
    dot.className  = 'dot green';
    text.textContent = 'Online';
    text.className   = 'badge badge-green';
  } else {
    dot.className  = 'dot red';
    text.textContent = 'Offline';
    text.className   = 'badge badge-gray';
  }
}

function setRefresh() {
  const el = document.getElementById('last-refresh');
  if (el) el.textContent = new Date().toLocaleTimeString('sk-SK');
}

async function loadCalcHistory() {
  try {
    const res  = await fetch('/api/historia-vypoctov');
    const rows = await res.json();

    // last result
    if (rows.length) {
      const last = rows[0];
      const sym  = OP_SYMBOLS[last.operacia] || last.operacia;
      const bigEl = document.getElementById('last-result');
      if (bigEl) bigEl.textContent = last.vysledok;
      const exEl = document.getElementById('last-expr');
      if (exEl) exEl.textContent = `${last.cislo1} ${sym} ${last.cislo2}`;
    }

    // stat
    const totalEl = document.getElementById('stat-calc');
    if (totalEl) totalEl.textContent = rows.length;

    // table
    const tbody = document.getElementById('tbody-vypocty');
    const empty = document.getElementById('empty-vypocty');
    if (tbody) {
      if (!rows.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
      } else {
        if (empty) empty.style.display = 'none';
        tbody.innerHTML = rows.slice(0, 20).map(r => {
          const sym = OP_SYMBOLS[r.operacia] || r.operacia;
          return `<tr>
            <td>${escHtml(r.cislo1)} ${escHtml(sym)} ${escHtml(r.cislo2)}</td>
            <td><strong>${escHtml(r.vysledok)}</strong></td>
            <td class="muted">${escHtml(r.cas)}</td>
          </tr>`;
        }).join('');
      }
    }

    setStatus(true);
  } catch {
    setStatus(false);
  }
}

async function loadConvHistory() {
  try {
    const res  = await fetch('/api/historia-prevodov');
    const rows = await res.json();

    const totalEl = document.getElementById('stat-prevod');
    if (totalEl) totalEl.textContent = rows.length;

    const tbody = document.getElementById('tbody-prevody');
    const empty = document.getElementById('empty-prevody');
    if (!tbody) return;

    const reversed = [...rows].reverse();
    if (!reversed.length) {
      tbody.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    tbody.innerHTML = reversed.slice(0, 20).map(r => {
      const badgeClass = r.typ.includes('c_to_f') ? 'badge-pink'
        : r.typ.includes('hpa') ? 'badge-blue' : 'badge-orange';
      return `<tr>
        <td>${escHtml(String(r.vstup))}</td>
        <td><span class="badge ${badgeClass}">${escHtml(r.typ)}</span></td>
        <td><strong>${escHtml(String(r.vysledok))}</strong></td>
        <td class="muted">${escHtml(r.cas)}</td>
      </tr>`;
    }).join('');
  } catch { /* ignore */ }
}

async function refresh() {
  await Promise.all([loadCalcHistory(), loadConvHistory()]);
  setRefresh();
}

document.addEventListener('DOMContentLoaded', () => {
  refresh();
  setInterval(refresh, REFRESH_INTERVAL);
});
