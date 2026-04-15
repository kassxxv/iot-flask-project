const API_URL = window.location.origin;
const ops = { plus: '+', minus: '−', krat: '×', deleno: '÷' };

async function updateDashboard() {
    try {
        const [vypRes, prevRes] = await Promise.all([
            fetch(`${API_URL}/api/historia-vypoctov`),
            fetch(`${API_URL}/api/historia-prevodov`)
        ]);

        const vypocty = await vypRes.json();
        const prevody = await prevRes.json();

        // Update Last Calc
        const lastCalcValEl = document.getElementById('last-calc-val');
        const lastCalcExprEl = document.getElementById('last-calc-expr');

        if (vypocty.length > 0) {
            const last = vypocty[0];
            lastCalcValEl.textContent = last.vysledok;
            lastCalcExprEl.textContent = `${last.cislo1} ${ops[last.operacia]} ${last.cislo2} (ID: #${last.id})`;
        }

        // Update Tables
        renderTable('table-vypocty', ['ID', 'Výpočet', 'Výsledok', 'Čas'], 
            vypocty.slice(0, 10).map(v => [
                `#${v.id}`, `${v.cislo1} ${ops[v.operacia]} ${v.cislo2}`, 
                `<strong>${v.vysledok}</strong>`, v.cas.split(' ')[1]
            ])
        );

        renderTable('table-prevody', ['Vstup', 'Typ', 'Výsledok', 'Čas'], 
            prevody.slice().reverse().slice(0, 15).map(p => [
                p.vstup, `<span class="badge badge-blue">${p.typ}</span>`, 
                `<strong>${p.vysledok}</strong>`, p.cas
            ])
        );

        // Update Status
        const statusBackendEl = document.getElementById('status-backend');
        const statusRefreshEl = document.getElementById('status-refresh');
        
        statusBackendEl.textContent = 'Online';
        statusBackendEl.className = 'badge badge-blue';
        statusRefreshEl.textContent = new Date().toLocaleTimeString('sk-SK');

    } catch (err) {
        console.error('Refresh error:', err);
        const statusBackendEl = document.getElementById('status-backend');
        if (statusBackendEl) {
            statusBackendEl.textContent = 'Chyba';
            statusBackendEl.className = 'badge badge-red';
        }
    }
}

function renderTable(id, headers, rows) {
    const el = document.getElementById(id);
    if (!el) return;

    if (rows.length === 0) {
        el.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">Žiadne záznamy.</p>';
        return;
    }
    let html = '<table><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    html += rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    html += '</tbody></table>';
    el.innerHTML = html;
}

// Initial load and polling
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    setInterval(updateDashboard, 5000);
});
