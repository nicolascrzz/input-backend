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

function formatarData(dataISO) {
  const d = new Date(dataISO);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1). padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// exportar excel
app.get("/exportar-excel", async (req, res) => {
  const { dataInicio, dataFim } = req.query;

  const result = await pool.query(
    `
    SELECT 
      data,
      valor,
      tipo,
      observacao
    FROM registros
    WHERE data BETWEEN $1 AND $2
    ORDER BY data
    `,
    [dataInicio, dataFim]
  );

  const dadosFormatados = result.rows.map(r => ({
    data: formatarData(r.data),
    valor: `R$ ${Number(r.valor).toFixed(2).replace(".",",")}`,
    tipo: r.tipo,
    observacao: r.observacao
  }));

  const ws = XLSX.utils.json_to_sheet(dadosFormatados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  const filePath = "/tmp/relatorio.xlsx";
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
