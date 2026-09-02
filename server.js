// override:true … シェル側に同名の環境変数が残っていても .env の値を優先する。
// これがないと、開発者のシェルに export された ANTHROPIC_API_KEY（Claude Code用）を
// アプリが使ってしまい、キーを分けた意味がなくなる。
// 本番では .env を配置せずプラットフォームの環境変数を使うため影響なし。
require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

// セッション案内の締め2行を季節に連動させる（index.htmlのseasonCtaと同じ8区分・同じ境界日）
function seasonCta(now) {
  const d = now || new Date(), md = (d.getMonth() + 1) * 100 + d.getDate();
  if (md >= 117 && md <= 203) return 'ここから春への切り替わりの始まり🌙✨<br>ここから思い切り次のステージへの準備を整えたいという方だけお越しくださいね。';
  if (md >= 204 && md <= 416) return 'ここから芽吹きの始まり🌱✨<br>ここから思い切り新しいエネルギーを受け取りたいという方だけお越しくださいね。';
  if (md >= 417 && md <= 504) return 'ここから夏への切り替わりの始まり🌤✨<br>ここから思い切り勢いあるエネルギーを受け取りたいという方だけお越しくださいね。';
  if (md >= 505 && md <= 718) return 'ここから燃え上がる季節の始まり🔥✨<br>ここから思い切り力強いエネルギーを受け取りたいという方だけお越しくださいね。';
  if (md >= 719 && md <= 806) return 'ここから実りへ向かう切り替わりの始まり🌾✨<br>ここから思い切り豊かさへの一歩を受け取りたいという方だけお越しくださいね。';
  if (md >= 807 && md <= 1019) return 'ここから実りの秋の始まり🌾✨<br>ここから思い切り豊潤な豊かさを受け取りたいという方だけお越しくださいね。';
  if (md >= 1020 && md <= 1106) return 'ここから冬への切り替わりの始まり🍂✨<br>ここから思い切り受け取ったものを味わいたいという方だけお越しくださいね。';
  return 'ここから静けさの中で満ちていく季節の始まり❄️✨<br>ここから思い切り内なる豊かさを整えたいという方だけお越しくださいね。'; // 11/7〜1/16
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
// 背景画像などの静的ファイルを配信（imagesディレクトリのみ公開）
app.use('/images', express.static(__dirname + '/images'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/api/diagnose', async (req, res) => {
  try {
    const { prompt, name, email, answerDetails, typeLabel } = req.body;
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
        max_tokens: 4000,
        messages: [{ role: 'user', content: cleanPrompt }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(JSON.stringify(data.error));
    const text = data.content.map(c => c.text || '').join('');

    if (email) {
      await resend.emails.send({
        from: 'ヘブンリーまち子 <info@heavenly-feeling.com>',
        to: email,
        subject: 'えねヴェーダ診断の結果',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
            <h2 style="color:#B8860B;">${name}さんのえねヴェーダ診断結果</h2>
            <p style="font-size:17px;font-weight:600;color:#1a1a1a;margin-bottom:1rem;">${typeLabel || ''}</p>
            <div style="line-height:1.9;color:#333;">
              ${text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>').replace(/^/, '<p>').replace(/$/, '</p>')}
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:2rem 0;">
            <p style="font-size:15px;font-weight:bold;color:#1a1a1a;">あなたのエネルギーをさらに豊かさへと変えるセッションをご用意しました。</p>
            <p style="color:#555;font-size:14px;line-height:1.9;">この診断結果「そうそう、まさに私だ」「ん？私はそんな感じじゃない・・・」どう感じましたか？<br>少しでもあなたの内面が動いたら、それは今まさにエネルギーが変容し本来の豊かさにアクセスしようとしているサインです。</p>
            <p style="color:#555;font-size:14px;line-height:1.9;">えねヴェーダ Abundanceセッションでは、あなたの診断結果をもとに<br>💎 お金や豊かさを止めている本当の理由<br>💎 無意識のブレーキをその場で外す体験<br>💎 2026年、全方位で豊かさを受け取るための具体的な次の一手をお伝えします</p>
            <p style="font-size:14px;line-height:1.9;"><span style="text-decoration:line-through;color:#999;">通常 60分 15,000円</span><br><strong style="color:#B8860B;font-size:17px;">今だけ特別価格 30分 5,500円</strong></p>
            <p style="color:#c0392b;font-size:13px;font-weight:bold;">診断結果がとどいてから3日以内のお申込み限定</p>
            <p style="color:#555;font-size:14px;line-height:1.9;">${seasonCta()}</p>
            <a href="https://ws.formzu.net/dist/S332405692/" style="display:inline-block;background:#B8860B;color:#fff;padding:.75rem 2rem;border-radius:8px;text-decoration:none;font-weight:500;">今すぐセッションに申込む</a>
          </div>
        `
      });

      // 3日後にセッション案内（お申込み最終日リマインド）を予約送信
      try {
        await resend.emails.send({
          from: 'ヘブンリーまち子 <info@heavenly-feeling.com>',
          to: email,
          scheduledAt: 'in 3 days',
          subject: '【本日まで】えねヴェーダ覚醒セッションのご案内',
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
              <h2 style="color:#B8860B;">${name}さんへ</h2>
              <p style="color:#555;font-size:14px;line-height:1.9;">先日は「えねヴェーダ診断」をお受けいただきありがとうございました。<br>あなたのエネルギーをさらに覚醒させ、豊かさに変えるセッションのご案内です。</p>
              <p style="color:#555;font-size:14px;line-height:1.9;">診断結果を読んで「そうそう、まさに私だ」「ん？私はそんな感じじゃない・・・」と、少しでも内面が動いたなら、それは今まさにエネルギーが覚醒しようとしているサインです。</p>
              <p style="color:#555;font-size:14px;line-height:1.9;">えねヴェーダ覚醒セッションでは、あなたの診断結果をもとに<br>💎 エネルギーがお金や豊かさを引き寄せない本当の理由を特定<br>💎 無意識のブレーキをその場で外す体験<br>💎 2026年、エネルギーで飛躍するための具体的な次の一手をお伝えします</p>
              <p style="font-size:14px;line-height:1.9;"><span style="text-decoration:line-through;color:#999;">通常 60分 15,000円</span><br><strong style="color:#B8860B;font-size:17px;">今だけ特別価格 30分 5,500円</strong></p>
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
        body: JSON.stringify({
          name: name,
          email: email,
          type: typeLabel || '',
          text: text,
          answerDetails: answerDetails || {}
        })
      });
    } catch(se) { console.error('Sheet error:', se.message); }
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));