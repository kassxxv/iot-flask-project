const tbody = document.getElementById("history-body");
const status = document.getElementById("status");

function opSymbol(op) {
  return { "+": "+", "-": "−", "*": "×", "/": "÷" }[op] || op;
}

function formatNum(n) {
  return parseFloat(n.toPrecision(10)).toString();
}

function loadHistory() {
  fetch("/api/history")
    .then(r => r.json())
    .then(data => {
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">No calculations yet.</td></tr>';
      } else {
        tbody.innerHTML = data.map(row => `
          <tr>
            <td>${row.id}</td>
            <td>${formatNum(row.a)} ${opSymbol(row.op)} ${formatNum(row.b)}</td>
            <td>${formatNum(row.result)}</td>
            <td>${row.timestamp}</td>
          </tr>
        `).join("");
      }
      status.textContent = `Last updated: ${new Date().toLocaleTimeString()} · Auto-refresh every 10s`;
    })
    .catch(() => {
      status.textContent = "Failed to load history.";
    });
}

loadHistory();
setInterval(loadHistory, 10000);
