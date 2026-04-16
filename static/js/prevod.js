const UNIT_TYPES = {
  c_to_f:      { unit: '\u00b0C' },
  hpa_to_mmhg: { unit: 'hPa'    },
  ms_to_kmh:   { unit: 'm/s'    },
};

let selectedType = 'c_to_f';

function selectType(typ) {
  selectedType = typ;
  document.querySelectorAll('.pill-opt').forEach(btn =>
    btn.classList.toggle('selected', btn.dataset.typ === typ)
  );
  const el = document.getElementById('input-unit');
  if (el) el.textContent = UNIT_TYPES[typ]?.unit ?? '';
}

async function handleUnitSubmit(e) {
  e.preventDefault();
  const hodnota = document.getElementById('prevod-hodnota').value.trim();
  const errEl   = document.getElementById('prevod-error');
  const resCard = document.getElementById('prevod-result');

  errEl.classList.remove('show');
  resCard.classList.remove('show');

  if (!hodnota) { showUnitError('Zadajte hodnotu!'); return; }

  try {
    const res  = await fetch(`/api/prevod?hodnota=${encodeURIComponent(hodnota)}&typ=${selectedType}`);
    const data = await res.json();
    if (data.chyba) { showUnitError(data.chyba); return; }

    document.getElementById('res-value').textContent = data.vysledok;
    document.getElementById('res-desc').textContent  = data.popis;
    resCard.classList.add('show');
  } catch {
    showUnitError('Chyba spojenia so serverom!');
  }
}

function showUnitError(msg) {
  const el = document.getElementById('prevod-error');
  el.textContent = msg;
  el.classList.add('show');
}

/* ── Number System Converter ── */

const BASE_HINTS = { 2: '(binarny)', 8: '(oktalovy)', 10: '(desiatkov)', 16: '(hexadecimalny)' };
let selectedBase = 10;

function selectBase(base) {
  selectedBase = base;
  document.querySelectorAll('.base-btn').forEach(btn =>
    btn.classList.toggle('selected', parseInt(btn.dataset.base) === base)
  );
  const hint = document.getElementById('sys-hint');
  if (hint) hint.textContent = BASE_HINTS[base] ?? '';

  // Update input placeholder
  const inp = document.getElementById('sys-input');
  if (inp) {
    const placeholders = { 2: '1010', 8: '377', 10: '255', 16: 'FF' };
    inp.placeholder = placeholders[base] ?? '0';
    inp.value = '';
  }
  clearSysOutputs();
  convertSystems();
}

function clearSysOutputs() {
  ['dec','bin','oct','hex'].forEach(k => {
    const el = document.getElementById('val-' + k);
    if (el) el.textContent = '—';
    const box = document.getElementById('sys-' + k);
    if (box) box.classList.remove('highlight');
  });
}

async function convertSystems() {
  const raw   = document.getElementById('sys-input').value.trim();
  const errEl = document.getElementById('sys-error');
  errEl.classList.remove('show');

  if (!raw) { clearSysOutputs(); return; }

  try {
    const res  = await fetch(`/api/sys-konverzia?hodnota=${encodeURIComponent(raw)}&zaklad=${selectedBase}`);
    const data = await res.json();

    if (data.chyba) {
      errEl.textContent = data.chyba;
      errEl.classList.add('show');
      clearSysOutputs();
      return;
    }

    const baseMap = { 2: 'bin', 8: 'oct', 10: 'dec', 16: 'hex' };
    const srcKey  = baseMap[selectedBase];

    ['dec','bin','oct','hex'].forEach(k => {
      const el  = document.getElementById('val-' + k);
      const box = document.getElementById('sys-' + k);
      if (el)  el.textContent = data[k];
      if (box) box.classList.toggle('highlight', k === srcKey);
    });
  } catch {
    errEl.textContent = 'Chyba spojenia!';
    errEl.classList.add('show');
  }
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  selectType(selectedType);
  selectBase(selectedBase);
  document.getElementById('prevod-form').addEventListener('submit', handleUnitSubmit);
});
