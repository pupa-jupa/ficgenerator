import { state } from './state.js';

/**
 * Calls the Gemini API with retry logic and abort controller.
 */
export async function callGemini(promptText, systemText = '', imageData = null, mimeType = null, retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${state.selectedModel}:generateContent?key=${state.userGeminiKey}`;
  const parts = [{ text: `<user_prompt>\n${promptText}\n</user_prompt>` }];
  if (imageData && mimeType) parts.push({ inline_data: { mime_type: mimeType, data: imageData } });

  const payload = { contents: [{ parts }], generationConfig: { temperature: 0.9 } };
  if (systemText) {
    payload.system_instruction = { parts: [{ text: systemText }] };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (state.currentAbortController) state.currentAbortController.abort();
      state.currentAbortController = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: state.currentAbortController.signal
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429 && attempt < retries) {
          console.warn(`Rate limit 429. Retrying...`);
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error(data.error?.message || 'Ошибка сервера');
      }
      if (!data.candidates?.[0]?.content) throw new Error('Нейросеть вернула пустой ответ');
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Запрос отменён новым действием');
      if (attempt === retries) throw err;
    }
  }
}

/**
 * Checks if an API key is set, prompts user if not.
 */
export function requireApiKey() {
  if (!state.userGeminiKey) {
    alert('Сначала введи бесплатный ключ Google Gemini во вкладке Настройки!');
    document.querySelector('.tab-btn[data-tab="settings"]').click();
    return false;
  }
  return true;
}
