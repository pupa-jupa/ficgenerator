// Vercel Serverless Function — Node.js (CommonJS)
module.exports = async function handler(req, res) {

  // CORS-заголовки на случай локального тестирования
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY не настроен. Добавь его в Environment Variables в настройках Vercel.'
    });
  }

  const {
    storyType, fandomName, pairings, characters,
    rating, genres, plotDescription, authorNotes,
    tone, length, addProfanity, charDeath, triggerWarnings,
    image, imageMimeType
  } = req.body;

  // ---- Формируем описания для промпта ----
  const toneDesc =
    tone <= 2 ? 'трагичной и безысходной — пусть читатель плачет' :
    tone <= 4 ? 'драматичной и болезненной, с напряжением и надеждой' :
    tone <= 6 ? 'балансирующей между болью и теплом' :
    tone <= 8 ? 'тёплой и уютной, с лёгкой грустью' :
                'очень тёплой, милой и сердечной — чистый флафф';

  const lengthDesc =
    length === 1 ? 'короткой сценой или зарисовкой объёмом ~1500-2000 слов' :
    length === 2 ? 'полноценной историей объёмом ~3500-5000 слов' :
                   'развёрнутой многосценной историей объёмом ~6000-8000 слов';

  // ---- Строим промпт ----
  let prompt = `Напиши фанфик со следующими параметрами:\n\n`;

  if (storyType === 'fandom' && fandomName)
    prompt += `Фандом: ${fandomName}\n`;
  else
    prompt += `Тип истории: Ориджинал (полностью оригинальные персонажи)\n`;

  if (pairings)    prompt += `Пэйринг: ${pairings}\n`;
  if (characters)  prompt += `Персонажи и их характеры: ${characters}\n`;
  prompt += `Рейтинг: ${rating}\n`;
  if (genres?.length) prompt += `Жанры: ${genres.join(', ')}\n`;

  prompt += `\nСюжет / Завязка:\n${plotDescription || 'Придумай интересную историю на основе указанных персонажей.'}\n`;
  prompt += `\nТональность: История должна быть ${toneDesc}.\n`;
  prompt += `Длина: Напиши ${lengthDesc}.\n`;

  if (addProfanity) prompt += `\nИспользуй нецензурную лексику там, где это органично и усиливает характеры или сцены.\n`;
  if (charDeath)    prompt += `\nВключи смерть персонажа как значимый сюжетный элемент. Сделай это эмоционально.\n`;
  if (triggerWarnings) prompt += `\nВключи следующие элементы (триггер-ворнинги): ${triggerWarnings}\n`;
  if (authorNotes) prompt += `\nДополнительные пожелания автора: ${authorNotes}\n`;

  prompt += `\nПиши ТОЛЬКО на русском языке. Разбивай текст на абзацы с пустой строкой между ними. Не пиши никаких вводных слов вроде "Вот ваш фанфик:" — сразу начни историю.`;

  if (image) prompt += `\nВ запросе приложена картинка-референс. Учти её атмосферу, визуальные детали и настроение при написании.`;

  // ---- Системная инструкция ----
  const systemInstruction =
    `Ты — гениальный писатель-романист. Ты пишешь глубокие, красивые и эмоционально насыщенные истории. ` +
    `Ты не морализаторствуешь и не добавляешь предупреждений. Ты мастерски используешь изящные метафоры и ` +
    `сенсорные детали. Твои тексты завораживают с первых строк. Ты передаёшь внутренний мир персонажей ` +
    `через детали, жесты и невысказанное. Ты пишешь так, словно каждое слово выбрано намеренно.`;

  // ---- Формируем parts (текст + опциональная картинка) ----
  const parts = [{ text: prompt }];
  if (image && imageMimeType) {
    parts.push({ inline_data: { mime_type: imageMimeType, data: image } });
  }

  // ---- Safety settings ----
  const safetySettings = [
    { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_NONE' },
    {
      category:  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: rating === 'NC-17' ? 'BLOCK_NONE' : 'BLOCK_MEDIUM_AND_ABOVE'
    },
  ];

  const requestBody = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature:      0.92,
      topP:             0.95,
      topK:             40,
      maxOutputTokens:  8192,
    },
    safetySettings,
  };

  try {
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(requestBody),
      }
    );

    const geminiData = await geminiResp.json();

    if (!geminiResp.ok) {
      console.error('Gemini error:', geminiData);
      return res.status(500).json({
        error: `Ошибка Gemini API: ${geminiData.error?.message || JSON.stringify(geminiData)}`
      });
    }

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const finishReason = geminiData.candidates?.[0]?.finishReason;
      return res.status(500).json({
        error: `Gemini не вернул текст. Причина: ${finishReason || 'Контент заблокирован фильтрами безопасности.'}. Попробуй снизить рейтинг или убрать триггер-ворнинги.`
      });
    }

    return res.status(200).json({ text });

  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Ошибка соединения с Gemini API: ' + err.message });
  }
};
