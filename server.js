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
            <p style="font-size:15px;font-weight:bold;color:#1a1a1a;">あなたのエネルギーをさらに覚醒させ豊かさに変えるセッションをご用意しました。</p>
            <p style="color:#555;font-size:14px;line-height:1.9;">この診断結果「そうそう、まさに私だ」「ん？私はそんな感じじゃない・・・」どう感じましたか？<br>少しでもあなたの内面が動いたら、それは今まさにエネルギーが覚醒しようとしているサインです。</p>
            <p style="color:#555;font-size:14px;line-height:1.9;">えねヴェーダ覚醒セッションでは、あなたの診断結果をもとに<br>💎 エネルギーがお金や豊かさを引き寄せない本当の理由を特定<br>💎 無意識のブレーキをその場で外す体験<br>💎 2026年、エネルギーで飛躍するための具体的な次の一手をお伝えします</p>
            <p style="color:#555;font-size:14px;line-height:1.9;">その瞬間を、あなたにも体験してほしい。</p>
            <p style="font-size:14px;line-height:1.9;"><span style="text-decoration:line-through;color:#999;">通常 60分 11,000円</span><br><strong style="color:#B8860B;font-size:17px;">今だけ特別価格 30分 2,000円</strong></p>
            <p style="color:#c0392b;font-size:13px;font-weight:bold;">診断結果がとどいてから3日以内のお申込み限定</p>
            <p style="color:#555;font-size:14px;line-height:1.9;">セッションの枠には限りがあります。<br>ピンときた方は迷わず今すぐお申込みください。</p>
            <a href="https://ws.formzu.net/dist/S332405692/" style="display:inline-block;background:#B8860B;color:#fff;padding:.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:500;">今すぐセッションに申込む</a>
          </div>
        `
      });

      // 3日後にセッション案内（お申込み最終日リマインド）を予約送信
      try {
        await resend.emails.send({
          from: 'えねヴェーダ診断 <onboarding@resend.dev>',
          to: email,
          scheduledAt: 'in 3 days',
          subject: '【本日まで】えねヴェーダ覚醒セッションのご案内',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
              <h2 style="color:#B8860B;">${name}さんへ</h2>
              <p style="color:#555;font-size:14px;line-height:1.9;">先日は「えねヴェーダ診断」をお受けいただきありがとうございました。<br>あなたのエネルギーをさらに覚醒させ、豊かさに変えるセッションのご案内です。</p>
              <p style="color:#555;font-size:14px;line-height:1.9;">診断結果を読んで「そうそう、まさに私だ」「ん？私はそんな感じじゃない・・・」と、少しでも内面が動いたなら、それは今まさにエネルギーが覚醒しようとしているサインです。</p>
              <p style="color:#555;font-size:14px;line-height:1.9;">えねヴェーダ覚醒セッションでは、あなたの診断結果をもとに<br>💎 エネルギーがお金や豊かさを引き寄せない本当の理由を特定<br>💎 無意識のブレーキをその場で外す体験<br>💎 2026年、エネルギーで飛躍するための具体的な次の一手をお伝えします</p>
              <p style="font-size:14px;line-height:1.9;"><span style="text-decoration:line-through;color:#999;">通常 60分 11,000円</span><br><strong style="color:#B8860B;font-size:17px;">今だけ特別価格 30分 2,000円</strong></p>
              <p style="color:#c0392b;font-size:14px;font-weight:bold;">お申込みは本日まで。セッションの枠には限りがあります。</p>
              <a href="https://ws.formzu.net/dist/S332405692/" style="display:inline-block;background:#B8860B;color:#fff;padding:.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:500;">今すぐセッションに申込む</a>
              <hr style="border:none;border-top:1px solid #eee;margin:2rem 0;">
              <p style="color:#aaa;font-size:11px;line-height:1.7;">※ このメールは「えねヴェーダ診断」をお受けいただいた方にお送りしています。配信が不要な場合はお手数ですが返信にてお知らせください。</p>
            </div>
          `
        });
      } catch (fe) { console.error('Follow-up schedule error:', fe.message); }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // スプレッドシートに保存
    try {
      await fetch('https://script.google.com/macros/s/AKfycbzQttbkSJ523waBpYy2i1ifq55ws0vLNe4LWBpzBJ-559npE9Llv_pj1PsRLje63q2U/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, type: text.match(/^[^\n]+/)[0] })
      });
    } catch(se) { console.error('Sheet error:', se.message); }
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));