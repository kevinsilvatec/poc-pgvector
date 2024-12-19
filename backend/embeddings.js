const OpenAI = require("openai");
const { Pool } = require("pg");
require("dotenv").config();

// Configure a chave da API

const openai = new OpenAI();
openai.apiKey = process.env.OPENAI_API_KEY;

// Configure o PostgreSQL
const pool = new Pool({
  user: "teste",
  host: "localhost",
  database: "teste",
  password: "teste",
  port: 5434,
});

(async () => {
  try {
    // Obter produtos que ainda não têm embeddings
    const products = await pool.query(`
      SELECT id, name, description 
      FROM products 
      WHERE embedding IS NULL
    `);

    console.log(`Encontrados ${products.rows.length} produtos para processar.`);

    for (const product of products.rows) {
      const text = `${product.name} ${product.description}`;

      // Gerar embedding com a OpenAI
      const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      const embedding = response.data[0].embedding;
      const embeddingString = JSON.stringify(embedding);
      await pool.query(
        `
        UPDATE products
        SET embedding = '${embeddingString}'
        WHERE id = ${product.id}
        `);

      console.log(`Embedding gerado para o produto ID: ${product.id}`);
    }

    console.log("Todos os embeddings foram processados!");
  } catch (error) {
    console.error("Erro ao gerar embeddings:", error);
  } finally {
    // Fechar conexão com o banco
    await pool.end();
  }
})();