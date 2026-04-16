import os
import json
import sqlite3
import datetime
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE = "databaza.db"
CONVERSIONS_FILE = "prevody.json"

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vypocty (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cislo1 REAL NOT NULL,
            cislo2 REAL NOT NULL,
            operacia TEXT NOT NULL,
            vysledok REAL NOT NULL,
            cas TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

def load_conversions():
    if not os.path.exists(CONVERSIONS_FILE):
        return []
    try:
        with open(CONVERSIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def save_conversion(zaznam):
    prevody = load_conversions()
    zaznam["id"] = len(prevody) + 1
    prevody.append(zaznam)
    with open(CONVERSIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(prevody, f, ensure_ascii=False, indent=2)

@app.route("/")
def index():
    return render_template("frontend_a.html")

@app.route("/klient")
def client():
    return render_template("frontend_b.html")

@app.route("/prevod")
def prevod_page():
    return render_template("prevod.html")

# --- CALCULATOR API (SQLite) ---
@app.route("/api/vypocet")
def api_vypocet():
    c1_str = request.args.get("cislo1", "0")
    c2_str = request.args.get("cislo2", "0")
    op = request.args.get("operacia", "plus")
    try:
        c1, c2 = float(c1_str), float(c2_str)
    except ValueError:
        return jsonify({"chyba": "Neplatné čísla!"}), 400

    if op == "plus": res = c1 + c2
    elif op == "minus": res = c1 - c2
    elif op == "krat": res = c1 * c2
    elif op == "deleno":
        if c2 == 0: return jsonify({"chyba": "Delenie nulou!"}), 400
        res = c1 / c2
    else: return jsonify({"chyba": "Neznáma operácia!"}), 400

    cas = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO vypocty (cislo1, cislo2, operacia, vysledok, cas) VALUES (?, ?, ?, ?, ?)", (c1, c2, op, res, cas))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": new_id, "cislo1": c1, "cislo2": c2, "operacia": op, "vysledok": round(res, 4), "cas": cas})

@app.route("/api/historia-vypoctov")
def api_historia_vypoctov():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vypocty ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

# --- UNIT & NUMBER SYSTEM CONVERTER API (JSON) ---
@app.route("/api/prevod")
def api_prevod():
    hodnota_raw = request.args.get("hodnota", "")
    typ = request.args.get("typ", "c_to_f")

    if not hodnota_raw:
        return jsonify({"chyba": "Zadajte hodnotu!"}), 400

    try:
        # IoT Unit Conversions
        if typ == "c_to_f":
            v = float(hodnota_raw)
            res = (v * 9/5) + 32
            popis = f"{v} °C = {res:.2f} °F"
        elif typ == "hpa_to_mmhg":
            v = float(hodnota_raw)
            res = v * 0.75006
            popis = f"{v} hPa = {res:.2f} mmHg"
        elif typ == "ms_to_kmh":
            v = float(hodnota_raw)
            res = v * 3.6
            popis = f"{v} m/s = {res:.2f} km/h"
        
        # Number System Conversions
        elif typ == "dec_to_bin":
            res = bin(int(hodnota_raw))[2:]
            popis = f"DEC {hodnota_raw} = BIN {res}"
        elif typ == "dec_to_hex":
            res = hex(int(hodnota_raw))[2:].upper()
            popis = f"DEC {hodnota_raw} = HEX {res}"
        elif typ == "bin_to_dec":
            res = int(hodnota_raw, 2)
            popis = f"BIN {hodnota_raw} = DEC {res}"
        elif typ == "hex_to_dec":
            res = int(hodnota_raw, 16)
            popis = f"HEX {hodnota_raw} = DEC {res}"
        else:
            return jsonify({"chyba": "Neznámy typ prevodu!"}), 400
    except ValueError:
        return jsonify({"chyba": "Neplatný formát vstupu pre daný prevod!"}), 400

    zaznam = {
        "vstup": hodnota_raw,
        "typ": typ,
        "vysledok": res if isinstance(res, str) else round(res, 2),
        "popis": popis,
        "cas": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    save_conversion(zaznam)
    return jsonify(zaznam)

@app.route("/api/historia-prevodov")
def api_historia_prevodov():
    return jsonify(load_conversions())

# --- NUMBER SYSTEM ALL-IN-ONE CONVERTER ---
@app.route("/api/sys-konverzia")
def api_sys_konverzia():
    hodnota_raw = request.args.get("hodnota", "").strip()
    zaklad_raw  = request.args.get("zaklad", "10")

    if not hodnota_raw:
        return jsonify({"chyba": "Zadajte hodnotu!"}), 400

    try:
        zaklad = int(zaklad_raw)
        if zaklad not in (2, 8, 10, 16):
            return jsonify({"chyba": "Nepodporovana zakl. sustava!"}), 400

        # Parse input value in the given base
        if zaklad == 16:
            n = int(hodnota_raw, 16)
        elif zaklad == 8:
            n = int(hodnota_raw, 8)
        elif zaklad == 2:
            n = int(hodnota_raw, 2)
        else:
            n = int(hodnota_raw)

        if n < 0:
            return jsonify({"chyba": "Iba nezaporne cisla!"}), 400

        result = {
            "dec": str(n),
            "bin": bin(n)[2:],
            "oct": oct(n)[2:],
            "hex": hex(n)[2:].upper(),
        }
        return jsonify(result)

    except ValueError:
        return jsonify({"chyba": "Neplatny format pre zvolenu sustavu!"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
