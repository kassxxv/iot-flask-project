let a = null;
let op = null;
let currentInput = "";
let justCalculated = false;

const screen = document.getElementById("screen");
const expression = document.getElementById("expression");

function updateScreen(val) {
  screen.textContent = val || "0";
}

document.querySelectorAll(".btn.num").forEach(btn => {
  btn.addEventListener("click", () => {
    const val = btn.dataset.val;
    if (justCalculated) {
      currentInput = "";
      justCalculated = false;
    }
    if (val === "." && currentInput.includes(".")) return;
    if (val === "." && currentInput === "") currentInput = "0";
    currentInput += val;
    updateScreen(currentInput);
  });
});

document.querySelectorAll(".btn.op").forEach(btn => {
  btn.addEventListener("click", () => {
    const selectedOp = btn.dataset.op;
    if (currentInput === "" && a === null) return;

    if (currentInput !== "" && a !== null) {
      sendCalculate(a, selectedOp, parseFloat(currentInput));
      return;
    }

    a = parseFloat(currentInput || screen.textContent);
    op = selectedOp;
    expression.textContent = `${a} ${selectedOp}`;
    currentInput = "";
    justCalculated = false;
  });
});

function calculate() {
  if (a === null || op === null || currentInput === "") return;
  const b = parseFloat(currentInput);
  sendCalculate(a, op, b, true);
}

function sendCalculate(numA, operator, numB, isFinal = false) {
  const params = new URLSearchParams({ a: numA, op: operator, b: numB });
  fetch(`/calculate?${params}`)
    .then(r => r.json())
    .then(data => {
      if (data.error) {
        expression.textContent = "";
        updateScreen("Error: " + data.error);
        a = null; op = null; currentInput = "";
        return;
      }
      expression.textContent = `${numA} ${operator} ${numB} =`;
      updateScreen(data.result);
      if (isFinal) {
        a = data.result;
        op = null;
        currentInput = "";
        justCalculated = true;
      } else {
        a = data.result;
        op = operator;
        expression.textContent = `${data.result} ${operator}`;
        currentInput = "";
      }
    })
    .catch(() => {
      updateScreen("Network error");
    });
}

function clearAll() {
  a = null; op = null; currentInput = "";
  justCalculated = false;
  updateScreen("0");
  expression.textContent = "";
}
