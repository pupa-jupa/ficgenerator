import { state } from './state.js';
import { callGemini, requireApiKey } from './api.js';
import { buildStoryPrompt } from './prompt.js';
import { updateStats } from './stats.js';

/* ==========================================
   PROGRESS
========================================== */
export function startProgress(fillId, numId) {
  state.progress = 0; setProgress(fillId, numId, 0);
  state.progressInterval = setInterval(() => {
    if (Math.random() < 0.12) return;
    const inc = Math.random() * ((99 - state.progress) * 0.07) + 0.15;
    state.progress = Math.min(99, state.progress + inc);
    setProgress(fillId, numId, Math.floor(state.progress));
    if (state.progress >= 99) clearInterval(state.progressInterval);
  }, 280);
}

export function setProgress(fillId, numId, val) {
  document.getElementById(fillId).style.width    = val + '%';
  document.getElementById(numId).textContent     = val + '%';
}

export function finishProgress(fillId, numId) {
  if (state.progressInterval) { clearInterval(state.progressInterval); state.progressInterval = null; }
  setProgress(fillId, numId, 100);
}

/* ==========================================
   RESULT DISPLAY
========================================== */
export function showResult(text, data) {
  if (!data) return;
  const metaParts = [];
  if (data.storyType === 'fandom' && data.fandomName) metaParts.push(`Фандом: ${data.fandomName}`);
  if (data.pairings) metaParts.push(`Пэйринг: ${data.pairings}`);
  metaParts.push(`Рейтинг: ${data.rating}`);
  if (data.genres?.length) metaParts.push(data.genres.join(', '));
  document.getElementById('resultMeta').textContent = metaParts.join(' · ');
  
  const html = DOMPurify.sanitize(marked.parse(text));
  document.getElementById('resultContent').innerHTML = html;
  
  const resultScreen = document.getElementById('resultScreen');
  resultScreen.classList.add('visible');
  resultScreen.scrollIntoView({ behavior:'smooth', block:'start' });
  updateStats();
}

/* ==========================================
   MAIN GENERATION
========================================== */
export async function runGeneration(promptObj, imageData, mimeType, isEdit = false) {
  if (!requireApiKey()) return;
  
  const pagesContainer = document.getElementById('pagesContainer');
  const tabNav         = document.querySelector('.tab-nav');
  const loadingScreen  = document.getElementById('loadingScreen');
  const resultScreen   = document.getElementById('resultScreen');

  document.querySelectorAll('.action-btn, .edit-btn, .generate-btn, .plot-action-btn').forEach(b => b.disabled = true);
  pagesContainer.style.display = 'none';
  tabNav.style.display         = 'none';
  resultScreen.classList.remove('visible');
  
  const loadingModelInfo = document.getElementById('loadingModelInfo');
  loadingModelInfo.textContent = state.selectedModel.includes('lite')
    ? 'Пишет Gemini 2.5 Flash Lite (сверхбыстрая генерация)…'
    : 'Пишет Gemini 2.5 Flash…';
  loadingScreen.classList.add('visible');
  startProgress('progressFill', 'progressNum');

  try {
    const userText = typeof promptObj === 'string' ? promptObj : promptObj.user;
    const sysText  = typeof promptObj === 'string' ? '' : promptObj.system;
    const text = await callGemini(userText, sysText, imageData, mimeType);
    finishProgress('progressFill', 'progressNum');
    setTimeout(() => {
      loadingScreen.classList.remove('visible');
      
      let parsedText = text;
      const storyMatch = text.match(/<story>([\s\S]*)<\/story>/i);
      if (storyMatch) {
        parsedText = storyMatch[1].trim();
      } else {
        parsedText = text.replace(/<planning>[\s\S]*?<\/planning>/gi, '').trim();
      }
      parsedText = parsedText.replace(/<\/?(planning|story|context|rules|plot_directive|pacing|fandom|rating|format|canon_rule|warnings|author_notes|image_instruction|previous_text|user_prompt)[^>]*>/gi, '').trim();

      if (isEdit) {
        state.currentStoryText += '\n\n─────────────────\n\n' + parsedText;
      } else {
        state.currentStoryText = parsedText;
      }
      showResult(state.currentStoryText, state.currentStoryData);
      document.querySelectorAll('.action-btn, .edit-btn, .generate-btn, .plot-action-btn').forEach(b => b.disabled = false);
    }, 700);
  } catch (err) {
    clearInterval(state.progressInterval);
    loadingScreen.classList.remove('visible');
    pagesContainer.style.display = 'block';
    tabNav.style.display         = 'flex';
    document.querySelectorAll('.action-btn, .edit-btn, .generate-btn, .plot-action-btn').forEach(b => b.disabled = false);
    alert('❌ Ошибка: ' + err.message);
  }
}

/* ==========================================
   EDIT ACTIONS
========================================== */
const editActions = {
  drama:    'Возьми этот текст и добавь в него драматичный момент — внезапное откровение, ссору или горькую потерю. Вплети его органично.',
  twist:    'Возьми этот текст и добавь неожиданный сюжетный поворот, который переворачивает всё с ног на голову.',
  fluff:    'Возьми этот текст и добавь нежный, тёплый момент между персонажами — случайное касание, тихий диалог или уютную сцену.',
  dialogue: 'Возьми этот текст и добавь живой, эмоциональный диалог между персонажами, раскрывающий их характеры.',
};

export function initEditActions() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!requireApiKey()) return;
      const action = btn.dataset.action;

      if (action === 'continue') {
        const prompt = buildStoryPrompt(state.currentStoryData, state.currentStoryText);
        runGeneration(prompt, null, null, true);
        return;
      }

      const instruction = editActions[action];
      if (!instruction) return;
      const prompt = `${instruction}\n\nТЕКСТ:\n"""\n${state.currentStoryText}\n"""\n\nВерни ТОЛЬКО переработанный текст, без пояснений.`;
      btn.disabled = true;
      btn.textContent = '⏳';
      try {
        const newText = await callGemini(prompt);
        state.currentStoryText = newText;
        showResult(state.currentStoryText, state.currentStoryData);
      } catch (err) {
        if (err.message !== 'Запрос отменён новым действием') alert('❌ Ошибка: ' + err.message);
      } finally {
        btn.disabled = false;
        const labels = { drama:'🌹 Добавить драму', twist:'⚡ Сюжетный поворот', fluff:'☁️ Добавить флафф', dialogue:'💬 Добавить диалог' };
        btn.textContent = labels[action] || btn.textContent;
      }
    });
  });

  // Contenteditable debounce
  let contentEditDebounce = null;
  document.getElementById('resultContent').addEventListener('input', () => {
    clearTimeout(contentEditDebounce);
    contentEditDebounce = setTimeout(() => {
      state.currentStoryText = document.getElementById('resultContent').innerText;
    }, 300);
  });

  // Custom edit prompt
  document.getElementById('sendCustomEditBtn').addEventListener('click', async () => {
    if (!requireApiKey()) return;
    const userPrompt = document.getElementById('customEditPrompt').value.trim();
    if (!userPrompt) return;
    const prompt = `Пользовательский запрос к тексту: "${userPrompt}"\n\nТЕКСТ ДЛЯ РЕДАКТИРОВАНИЯ:\n"""\n${state.currentStoryText}\n"""\n\nВыполни этот запрос и верни ТОЛЬКО переработанный текст, без пояснений.`;
    const btn = document.getElementById('sendCustomEditBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Отправляем...';
    try {
      const newText = await callGemini(prompt);
      state.currentStoryText = newText;
      showResult(state.currentStoryText, state.currentStoryData);
      document.getElementById('customEditPrompt').value = '';
    } catch (err) {
      alert('❌ Ошибка: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Отправить запрос ИИ';
    }
  });

  // Toggle edit mode
  document.getElementById('toggleEditBtn').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const content = document.getElementById('resultContent');
    const isEditing = content.getAttribute('contenteditable') === 'true';
    if (isEditing) {
      content.setAttribute('contenteditable', 'false');
      btn.textContent = '✏️ Редактировать текст';
      btn.style.background = 'rgba(196, 162, 89, 0.1)';
      btn.style.color = 'var(--gold-light)';
      state.currentStoryText = content.innerText;
    } else {
      content.setAttribute('contenteditable', 'true');
      content.focus();
      btn.textContent = '💾 Сохранить изменения';
      btn.style.background = 'var(--gold)';
      btn.style.color = 'var(--bg)';
    }
  });

  // Reader controls
  function applyReaderStyle(prop, value) {
    const el = document.getElementById('resultContent');
    el.style[prop] = value;
    el.querySelectorAll('p, h1, h2, h3, ul, li').forEach(c => c.style[prop] = value);
  }
  
  document.getElementById('fontIncrease').addEventListener('click', () => {
    state.fontSize = Math.min(24, state.fontSize + 1);
    applyReaderStyle('fontSize', state.fontSize + 'px');
  });
  document.getElementById('fontDecrease').addEventListener('click', () => {
    state.fontSize = Math.max(12, state.fontSize - 1);
    applyReaderStyle('fontSize', state.fontSize + 'px');
  });
  document.getElementById('fontSerifToggle').addEventListener('click', () => {
    state.isSerif = !state.isSerif;
    applyReaderStyle('fontFamily', state.isSerif ? "Georgia, 'Cormorant', serif" : "'Helvetica Neue', Arial, sans-serif");
  });
}
