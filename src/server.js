require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { init, query } = require('./db');
const urlsRouter = require('./routes/urls');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(require('path').join(__dirname, '..', 'public')));

// Redirecionar link encurtado
app.get('/:code', async (req, res, next) => {
  const { code } = req.params;

  // Ignorar rotas da API
  if (code.startsWith('api')) return next();

  const result = await query(
    'SELECT original_url FROM urls WHERE code = $1',
    [code]
  );

  if (result.rows.length === 0) {
    return res.status(404).send('Link não encontrado.');
  }

  await query('UPDATE urls SET clicks = clicks + 1 WHERE code = $1', [code]);

  res.redirect(result.rows[0].original_url);
});

app.use('/api/urls', urlsRouter);

init().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Erro ao conectar ao banco de dados:', err.message);
  process.exit(1);
});
