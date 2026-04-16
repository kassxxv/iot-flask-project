/* ============================================================
   prevod.js — Unit Converter page logic
   ============================================================ */

const TYPES = {
  c_to_f:      { unit: '\u00b0C' },
  hpa_to_mmhg: { unit: 'hPa' },
  ms_to_kmh:   { unit: 'm/s' },
};

let selectedType = 'c_to_f';

function selectType(typ) {
  selectedType = typ;
  document.querySelectorAll('.pill-opt').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.typ === typ);
  });
  const unitEl = document.getElementById('input-unit');
  if (unitEl) unitEl.textContent = TYPES[typ]?.unit ?? '';
}

async function handleSubmit(e) {
  e.preventDefault();
  const hodnota = document.getElementById('prevod-hodnota').value.trim();
  const errEl   = document.getElementById('prevod-error');
  const resCard = document.getElementById('prevod-result');

  errEl.classList.remove('show');
  resCard.classList.remove('show');

  if (!hodnota) { showError('Zadajte hodnotu!'); return; }

  try {
    const res  = await fetch(`/api/prevod?hodnota=${encodeURIComponent(hodnota)}&typ=${selectedType}`);
    const data = await res.json();
    if (data.chyba) { showError(data.chyba); return; }

    document.getElementById('res-value').textContent = data.vysledok;
    document.getElementById('res-desc').textContent  = data.popis;
    resCard.classList.add('show');
  } catch {
    showError('Chyba spojenia so serverom!');
  }
}

function showError(msg) {
  const el = document.getElementById('prevod-error');
  el.textContent = msg;
  el.classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
  selectType(selectedType);
  document.getElementById('prevod-form').addEventListener('submit', handleSubmit);
});
