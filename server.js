const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const { Pool } = require("pg");

require("dotenv").config();

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

 app.post("/admin/login", (req, res) => {

  const { senha } = req.body;

  if (!senha) {
    return res.status(400).json({
      ok: false,
      mensagem: "Senha não enviada"
    });
  }

  if (senha === process.env.ADMIN_PASSWORD) {

    return res.json({
      ok: true
    });

  } else {

    return res.status(401).json({
      ok: false,
      mensagem: "Senha incorreta"
    })
  }
})

app.post("/admin/comando", (req, res) => {

  const { comando } = req.body;

  switch (comando.toLowerCase()) {

    case "ping":
      return res.json({ resposta: "pong ✅" });

    case "status":
      return res.json({ resposta: "Servidor online 🟢" });
      
    case "limpar banco":
      return res.json({ resposta: "Comando bloqueado ⚠️" });

    default:
      return res.json({ resposta: "Comando não listado" });
  }
})

app.post("/admin/limpar-registro", async (req, res) => {

  const senha = req.headers["x-admin-password"]

  if (senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      ok: false,
      mensagem: "Não Autorizado"
  });
}

  try {
    await pool.query("TRUNCATE TABLE registros RESTART IDENTITY");

    return res.json({
      ok: true,
      mensagem: "Relatório Limpo"
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      mensagem: "Erro ao limpar registros"
    });
  }
});