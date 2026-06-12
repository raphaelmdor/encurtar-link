const express = require('express');
const { nanoid } = require('nanoid');
const { query } = require('../db');

const router = express.Router();
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Criar link encurtado
router.post('/shorten', async (req, res) => {
  const { url, customCode } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória.' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'URL inválida.' });
  }

  const code = customCode || nanoid(4);

  if (customCode) {
    const existing = await query('SELECT id FROM urls WHERE code = $1', [code]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Código personalizado já está em uso.' });
    }
  }

  await query('INSERT INTO urls (code, original_url) VALUES ($1, $2)', [code, url]);

  return res.status(201).json({
    code,
    shortUrl: `${BASE_URL}/${code}`,
    originalUrl: url,
  });
});

// Listar todos os links
router.get('/', async (_req, res) => {
  const result = await query(
    'SELECT code, original_url, clicks, created_at FROM urls ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// Estatísticas de um link
router.get('/:code/stats', async (req, res) => {
  const { code } = req.params;
  const result = await query(
    'SELECT code, original_url, clicks, created_at FROM urls WHERE code = $1',
    [code]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Link não encontrado.' });
  }

  res.json(result.rows[0]);
});

// Deletar um link
router.delete('/:code', async (req, res) => {
  const { code } = req.params;
  const check = await query('SELECT id FROM urls WHERE code = $1', [code]);

  if (check.rows.length === 0) {
    return res.status(404).json({ error: 'Link não encontrado.' });
  }

  await query('DELETE FROM urls WHERE code = $1', [code]);
  res.json({ message: 'Link removido com sucesso.' });
});

module.exports = router;
