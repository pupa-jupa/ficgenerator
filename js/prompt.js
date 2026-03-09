/**
 * Sanitizes user input to prevent XML tag injection in prompts.
 */
export function sanitizePromptInput(str) {
  if (!str) return '';
  return str.replace(/</g, '＜').replace(/>/g, '＞').replace(/\n{3,}/g, '\n\n');
}

/**
 * Builds a structured prompt for story generation with XML tags and Chain-of-Thought.
 */
export function buildStoryPrompt(data, previousText = '') {
  const formatMap = {
    full:    'Полная история (законченный one-shot с началом, серединой и финалом)',
    chapter: 'Только первая глава — обрывается на самом интересном месте, как продолжение следует',
    scene:   'Одна конкретная сцена — без экспозиции, сразу погружение в момент'
  };

  // Sanitize all user inputs against prompt injection
  const san = sanitizePromptInput;
  data = { ...data, fandomName: san(data.fandomName), pairings: san(data.pairings),
    characters: san(data.characters), plotDescription: san(data.plotDescription),
    authorNotes: san(data.authorNotes), triggerWarnings: san(data.triggerWarnings) };
  if (previousText) previousText = san(previousText);

  const system = `Ты талантливый и профессиональный писатель-фикрайтер. Напиши художественный текст на русском языке. Пиши сразу готовый художественный текст без предисловий. Используй абзацы, описания и живые диалоги. Учитывай все указания пользователя.

ВАЖНОЕ ПРАВИЛО ФОРМАТИРОВАНИЯ:
Перед тем как начать писать саму историю, ты ОБЯЗАН провести планирование.
Напиши краткий пошаговый план сцен внутри тегов <planning>...</planning>. 
Сразу после закрывающего тега </planning> напиши сам текст истории строго внутри тегов <story>...</story>.`;

  let p = '';
  if (previousText) {
    p += `<previous_text>ВОТ УЖЕ НАПИСАННЫЙ ТЕКСТ, который нужно продолжить:\n"""\n${previousText}\n"""\n\nНапиши следующую часть, сохраняя тот же стиль, темп и голос повествования. НЕ повторяй уже написанный текст.</previous_text>\n\n`;
  }

  p += `<context>\n`;
  if (data.storyType === 'fandom' && data.fandomName) {
    p += `  <fandom>${data.fandomName}</fandom>\n`;
  } else {
    p += `  <type>Ориджинал (оригинальная история)</type>\n`;
  }
  if (data.pairings)   p += `  <pairings>${data.pairings}</pairings>\n`;
  if (data.characters) p += `  <characters>\n${data.characters}\n  </characters>\n`;
  if (data.genres?.length) p += `  <genres>${data.genres.join(', ')}</genres>\n`;
  p += `  <rating>${data.rating}</rating>\n`;
  p += `</context>\n\n`;

  p += `<rules>\n`;
  if (data.storyType === 'fandom' && data.fandomName) {
    p += `  <canon_rule>Если персонажи или события явно не указаны в <plot_directive>, СТРОГО следуй официальному канону выбранного фандома. Не выдумывай новых персонажей и события, противоречащие лору.</canon_rule>\n`;
  }
  p += `  <format>${formatMap[data.storyFormat] || formatMap.full}</format>\n`;

  const lengths = { 
    1: 'Очень быстрый темп повествования. Выдели 1-2 короткие ключевые сцены. Избегай затянутых описаний, фокусируйся на динамике и главном событии.', 
    2: 'Умеренный темп. Напиши 3-4 проработанные сцены. Удели равное внимание описаниям окружения, внутренним переживаниям героев и диалогам.', 
    3: 'Слоубёрн и погружение. Напиши масштабный текст с множеством сцен. Максимально детализируй окружение, запахи, звуки и микромимику персонажей. Прописывай длинные, насыщенные абзацы.' 
  };
  p += `  <pacing>${lengths[data.length]}</pacing>\n`;

  const triggers = [];
  if (data.addProfanity) triggers.push('нецензурная лексика разрешена');
  if (data.charDeath) triggers.push('СМЕРТЬ ОСНОВНОГО ПЕРСОНАЖА');
  if (data.triggerWarnings) triggers.push(data.triggerWarnings);
  if (triggers.length) p += `  <warnings>${triggers.join(', ')}</warnings>\n`;
  
  if (data.authorNotes) p += `  <author_notes>${data.authorNotes}</author_notes>\n`;
  p += `</rules>\n\n`;

  if (data.plotDescription) {
    p += `<plot_directive>\n${data.plotDescription}\n</plot_directive>\n`;
  }

  if (data.image) p += `\n<image_instruction>Прикреплена картинка-референс. Учти её атмосферу, освещение и детали в тексте.</image_instruction>\n`;
  return { system, user: p };
}
