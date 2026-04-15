const API_URL = window.location.origin;

// --- CALCULATOR LOGIC ---
let calcState = { buffer: '', c1: '', op: '', phase: 'c1' };
const ops = { plus: '+', minus: '−', krat: '×', deleno: '÷' };

function updateCalcDisplay() {
    document.getElementById('calc-display').textContent = calcState.buffer || '0';
    document.getElementById('calc-expr').textContent = 
        calcState.phase === 'c2' ? `${calcState.c1} ${ops[calcState.op]}` : '';
}

async function calcPress(val) {
    if ('0123456789.'.includes(val)) {
        if (calcState.buffer === '0' && val !== '.') calcState.buffer = val;
        else calcState.buffer += val;
    } else if (val === 'AC') {
        calcState = { buffer: '', c1: '', op: '', phase: 'c1' };
    } else if (val === '+/-') {
        if (calcState.buffer && calcState.buffer !== '0') {
            calcState.buffer = calcState.buffer.startsWith('-') ? calcState.buffer.slice(1) : '-' + calcState.buffer;
        }
    } else if (val === '%') {
        if (calcState.buffer) {
            calcState.buffer = String(parseFloat(calcState.buffer) / 100);
        }
    } else if (['plus','minus','krat','deleno'].includes(val)) {
        calcState.c1 = calcState.buffer || '0';
        calcState.op = val;
        calcState.buffer = '';
        calcState.phase = 'c2';
    } else if (val === '=') {
        if (calcState.phase === 'c2') {
            const url = `${API_URL}/api/vypocet?cislo1=${calcState.c1}&cislo2=${calcState.buffer}&operacia=${calcState.op}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.chyba) alert(data.chyba);
            else {
                calcState.buffer = String(data.vysledok);
                calcState.phase = 'c1';
                document.getElementById('calc-status').textContent = `Posledný výsledok: ${data.vysledok}`;
                loadHistory();
            }
        }
    }
    updateCalcDisplay();
}

// --- CONVERTER LOGIC ---
async function handlePrevod(e) {
    e.preventDefault();
    const hodnota = document.getElementById('prevod-hodnota').value;
    const typ = document.getElementById('prevod-typ').value;
    
    const url = `${API_URL}/api/prevod?hodnota=${encodeURIComponent(hodnota)}&typ=${typ}`;
    history.pushState(null, '', `?hodnota=${hodnota}&typ=${typ}`);
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.chyba) alert(data.chyba);
    else {
        const resBox = document.getElementById('prevod-result');
        document.getElementById('prevod-val').textContent = data.vysledok;
        document.getElementById('prevod-desc').textContent = data.popis;
        resBox.style.display = 'block';
        loadHistory();
    }
    return false;
}

// --- HISTORY LOGIC ---
async function loadHistory() {
    const [vypRes, prevRes] = await Promise.all([
        fetch(`${API_URL}/api/historia-vypoctov`),
        fetch(`${API_URL}/api/historia-prevodov`)
    ]);
    
    const vypocty = await vypRes.json();
    const prevody = await prevRes.json();
    
    renderTable('historia-vypoctov', ['Výpočet', 'Vys'], vypocty.slice(0, 5).map(v => [
        `${v.cislo1} ${ops[v.operacia]} ${v.cislo2}`, v.vysledok
    ]));
    
    renderTable('historia-prevodov', ['Prevod', 'Čas'], prevody.slice().reverse().slice(0, 5).map(p => [
        p.popis, p.cas.split(' ')[1]
    ]));
}

function renderTable(id, headers, rows) {
    let html = '<table><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
    html += rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    html += '</table>';
    document.getElementById(id).innerHTML = html;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});
