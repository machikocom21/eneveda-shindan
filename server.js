require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/api/diagnose', async (req, res) => {
  try {
    const { prompt, name, email } = req.body;
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

    if (email) {
      await resend.emails.send({
        from: 'えねヴェーダ診断 <onboarding@resend.dev>',
        to: email,
        subject: 'えねヴェーダ診断の結果',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
            <h2 style="color:#B8860B;">${name}さんのえねヴェーダ診断結果</h2>
            <div style="line-height:1.9;color:#333;">
              ${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>').replace(/^/, '<p>').replace(/$/, '</p>')}
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:2rem 0;">
            <p style="color:#888;font-size:13px;">ヘブンリーまち子の個別セッション（無料）では、あなたのエネルギータイプと今の詰まりを一緒にほぐしていきます。</p>
            <a href="https://lin.ee/qOAtgQE" style="display:inline-block;background:#B8860B;color:#fff;padding:.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:500;">個別セッションを申し込む</a>
          </div>
        `
      });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));