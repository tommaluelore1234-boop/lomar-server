const express = require('express');
const app = express();
app.use(express.json());

const ACCESS_TOKEN = 'TEST-5176831108527295-042823-b6503c1aefbd9e4b53e028a844735040-290638225';

const PLANOS = {
  basico:  { titulo: 'Plano Básico LOMAR',  preco: 49.90,  creditos: 15 },
  pro:     { titulo: 'Plano Pro LOMAR',      preco: 79.90,  creditos: 30 },
  premium: { titulo: 'Plano Premium LOMAR',  preco: 119.90, creditos: 50 },
};

const CREDITOS = {
  c1:  { titulo: '1 Crédito LOMAR',   preco: 2.50,  creditos: 1  },
  c10: { titulo: '10 Créditos LOMAR', preco: 19.90, creditos: 10 },
  c25: { titulo: '25 Créditos LOMAR', preco: 39.90, creditos: 25 },
};

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/criarPreferencia', async (req, res) => {
  try {
    const { tipo, itemId, prestadorId } = req.body;
    const item = tipo === 'plano' ? PLANOS[itemId] : CREDITOS[itemId];
    if (!item) return res.status(400).json({ error: 'Item inválido' });

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [{ title: item.titulo, unit_price: item.preco, quantity: 1, currency_id: 'BRL' }],
        metadata: { prestador_id: prestadorId, tipo, item_id: itemId, creditos: item.creditos },
        back_urls: {
          success: 'https://lomar-app.firebaseapp.com/sucesso',
          failure: 'https://lomar-app.firebaseapp.com/falha',
          pending: 'https://lomar-app.firebaseapp.com/pendente',
        },
        auto_return: 'approved',
      }),
    });

    const data = await response.json();
    if (!data.sandbox_init_point) return res.status(500).json({ error: data.message });
    res.json({ checkoutUrl: data.sandbox_init_point });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LOMAR API rodando na porta ${PORT}`));
