from flask import Flask, jsonify, render_template, request
from datetime import datetime

app = Flask(__name__)

history = []
_counter = 0


@app.route("/")
def calculator():
    return render_template("calculator.html")


@app.route("/history")
def history_page():
    return render_template("history.html")


@app.route("/calculate")
def calculate():
    global _counter

    a_raw = request.args.get("a", "")
    b_raw = request.args.get("b", "")
    op = request.args.get("op", "")

    try:
        a = float(a_raw)
        b = float(b_raw)
    except ValueError:
        return jsonify({"error": "Invalid numbers"}), 400

    if op == "+":
        result = a + b
    elif op == "-":
        result = a - b
    elif op == "*":
        result = a * b
    elif op == "/":
        if b == 0:
            return jsonify({"error": "Division by zero"}), 400
        result = a / b
    else:
        return jsonify({"error": "Invalid operator"}), 400

    result = round(result, 10)

    _counter += 1
    history.append({
        "id": _counter,
        "a": a,
        "op": op,
        "b": b,
        "result": result,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    })

    return jsonify({"result": result})


@app.route("/api/history")
def api_history():
    return jsonify(list(reversed(history)))


if __name__ == "__main__":
    app.run(debug=True)
