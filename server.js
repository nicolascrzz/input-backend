const express = require("express");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const XLSX = require("xlsx");

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("/data/banco.db");

db.run(`
    CREATE TABLE IF NOT EXISTS dados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campo1 TEXT,
    campo2 TEXT,
    campo3 TEXT,
    data DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

app.post("/salvar", (req, res) => {
    const { campo1, campo2, campo3, campo4 } = req.body;

    db.run(
        "INSERT INTO dados (campo1, campo2, campo3) VALUES (?, ?, ?)",
        [campo1, campo2, campo3, campo4],
        () => res.send({ ok: true})    
    );
});

app.get("/exportar-excel", (req, res) => {
    db.all("SELECT * FROM dados", (err, rows) => {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dados");

        XLSX.writeFile(wb, "relatorio.xlsx")
        res.download("relatorio.xlsx");
    });
});


const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
    console.log("Servidor rodando a porta" + PORT);
});