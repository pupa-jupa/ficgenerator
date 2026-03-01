import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { idea } = req.body;
  if (!idea) return res.status(400).json({ error: 'Идея не передана' });

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Ты — профессиональный автор фанфиков и литературных сюжетов. 
На основе краткой идеи напиши подробный сюжет-синопсис (до 1000 слов) на русском языке.

Структура ответа:
1. **Завязка** — представь мир, героев и начальный конфликт
2. **Развитие** — нарастание напряжения, ключевые события, повороты
3. **Кульминация** — главное столкновение или открытие
4. **Развязка** — как всё заканчивается, что меняется в героях

Пиши живо, образно, с деталями атмосферы. Избегай клише.

Идея пользователя: ${idea}`
      }]
    });

    const text = message.content[0].text;
    res.status(200).json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
