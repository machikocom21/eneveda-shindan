require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/diagnose', async (req, res) => {
  try {
    const { prompt } = req.body;
    const cleanPrompt = Buffer.from(prompt, 'utf8').toString('utf8');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: cleanPrompt }]
      })
    });
    
    const data = await response.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    const text = data.content.map(c => c.text || '').join('');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));