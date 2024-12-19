const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const OpenAI = require("openai");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const port = 3000;

app.use(cors());

const openai = new OpenAI();
openai.apiKey = process.env.OPENAI_API_KEY;

const pool = new Pool({
  user: "teste",
  host: "localhost",
  database: "teste",
  password: "teste",
  port: 5434,
});

app.use(bodyParser.json());

app.get("/search", async (req, res) => {
  const { query } = req.query;
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    const queryEmbeddingString = JSON.stringify(queryEmbedding);

    const result = await pool.query(
      `
      SELECT id, name, description, embedding <=> '${queryEmbeddingString}' as score
      FROM products
      ORDER BY score
      LIMIT 10;`
    );

    res.json({
      results: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao realizar a busca.");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
