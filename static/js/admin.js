const OP_SYMBOLS = { plus: '+', minus: '−', krat: '×', deleno: '÷' };

const state = {
  display: '0',
  c1: null,
  op: null,
  waitingForC2: false,
  justCalc: false,
};

function updateDisplay() {
  document.getElementById('calc-display').textContent = state.display;
}

function setExpr(txt) {
  const el = document.getElementById('calc-expr');
  if (el) el.textContent = txt;
}

function setStatus(msg, isError) {
  const el = document.getElementById('calc-status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#c62828' : 'var(--accent)';
}

function calcPress(key) {
  if (key === 'AC') {
    state.display = '0';
    state.c1 = null;
    state.op = null;
    state.waitingForC2 = false;
    state.justCalc = false;
    setExpr('');
    setStatus('');
    updateDisplay();
    return;
  }

  if (key === '+/-') {
    state.display = String(-parseFloat(state.display) || 0);
    updateDisplay();
    return;
  }

  if (key === '%') {
    state.display = String(parseFloat(state.display) / 100);
    updateDisplay();
    return;
  }

  const isOp = ['plus', 'minus', 'krat', 'deleno'].includes(key);

  if (isOp) {
    state.c1 = parseFloat(state.display);
    state.op = key;
    state.waitingForC2 = true;
    state.justCalc = false;
    setExpr(`${state.c1} ${OP_SYMBOLS[key]}`);
    return;
  }

  if (key === '=') {
    if (state.c1 === null || state.op === null) return;
    const c2 = parseFloat(state.display);
    submitCalc(state.c1, c2, state.op);
    return;
  }

  if (key === '.') {
    if (state.waitingForC2) { state.display = '0.'; state.waitingForC2 = false; }
    else if (!state.display.includes('.')) state.display += '.';
    updateDisplay();
    return;
  }

  // digit
  if (state.waitingForC2 || state.justCalc) {
    state.display = key;
    state.waitingForC2 = false;
    state.justCalc = false;
  } else {
    state.display = state.display === '0' ? key : state.display + key;
  }
  updateDisplay();
}

async function submitCalc(c1, c2, op) {
  setStatus('Počítam…');
  try {
    const res = await fetch(`/api/vypocet?cislo1=${c1}&cislo2=${c2}&operacia=${op}`);
    const data = await res.json();
    if (data.chyba) { setStatus(data.chyba, true); return; }

    state.display = String(data.vysledok);
    state.justCalc = true;
    state.c1 = null;
    state.op = null;
    setExpr(`${c1} ${OP_SYMBOLS[op]} ${c2} =`);
    updateDisplay();
    setStatus('');

    // update result panel
    const bigEl = document.getElementById('result-big');
    if (bigEl) bigEl.textContent = data.vysledok;
    const lbl = document.getElementById('result-label');
    if (lbl) lbl.textContent = `${c1} ${OP_SYMBOLS[op]} ${c2}`;

  } catch {
    setStatus('Chyba spojenia!', true);
  }
}

// init
document.addEventListener('DOMContentLoaded', () => {
  updateDisplay();
});
