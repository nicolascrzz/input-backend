const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");

const app = express();
app.use(cors());
app.use(express.json());

const { pool } = require("pg")

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

pool.query(`
  CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    valor NUMERIC,
    tipo TEXT,
    observacao TEXT,
    data DATE
  )
`)

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