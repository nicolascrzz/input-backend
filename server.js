const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// cria tabela se não existir
pool.query(`
  CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    valor NUMERIC,
    tipo TEXT,
    observacao TEXT,
    data DATE
  )
`);

// salvar dados
app.post("/salvar", async (req, res) => {
  const { valor, tipo, observacao, data } = req.body;

  await pool.query(
    "INSERT INTO registros (valor, tipo, observacao, data) VALUES ($1, $2, $3, $4)",
    [valor, tipo, observacao, data]
  );

  res.json({ ok: true });
});

// exportar excel
app.get("/exportar-excel", async (req, res) => {
  const result = await pool.query("SELECT * FROM registros ORDER BY id");

  const ws = XLSX.utils.json_to_sheet(result.rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");

  const filePath = "/tmp/relatorio.xlsx";
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
