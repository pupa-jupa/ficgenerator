/**
 * FicGenerator — Main Entry Point (ES Module)
 * Imports all modules and initializes the application.
 */
import { state } from './state.js';
import { callGemini, requireApiKey } from './api.js';
import { buildStoryPrompt } from './prompt.js';
import { FANFIC_IDEAS, RANDOM_DATA, getNextIdea } from './data.js';
import { runGeneration, showResult, initEditActions, startProgress, finishProgress } from './generation.js';
import { renderLibrary, initLibrary } from './library.js';
import { initCovers } from './covers.js';
import { initStats } from './stats.js';

/* ==========================================
   SETTINGS & API KEY
========================================== */
const apiKeyInput = document.getElementById('apiKeyInput');
const modelSelect = document.getElementById('modelSelect');

if (state.userGeminiKey) apiKeyInput.value = state.userGeminiKey;
modelSelect.value = state.selectedModel;

document.getElementById('saveKeyBtn').addEventListener('click', () => {
  const key   = apiKeyInput.value.trim();
  const model = modelSelect.value;
  const keyStatus = document.getElementById('keyStatus');
  if (key) {
    sessionStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_model', model);
    state.userGeminiKey = key;
    state.selectedModel = model;
    keyStatus.textContent = '✅ Настройки сохранены (только на время сессии)!';
    keyStatus.style.color = '#5b8c5a';
  } else {
    sessionStorage.removeItem('gemini_api_key');
    state.userGeminiKey = '';
    keyStatus.textContent = '❌ Ключ удалён.';
    keyStatus.style.color = '#c4555a';
  }
  setTimeout(() => { keyStatus.textContent = ''; }, 3000);
});

/* ==========================================
   TABS
========================================== */
const tabBtns = document.querySelectorAll('.tab-btn');
const pages   = document.querySelectorAll('.page');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    if (btn.classList.contains('active')) return;
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${target}`).classList.add('active');
    if (target === 'library') renderLibrary();
  });
});

/* ==========================================
   TOOLTIPS
========================================== */
const tooltipBox = document.getElementById('tooltipBox');
document.querySelectorAll('[data-tooltip]').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    const text = btn.getAttribute('data-tooltip');
    if (!text) return;
    tooltipBox.textContent = text;
    tooltipBox.classList.add('visible');
    const rect = btn.getBoundingClientRect();
    const tipW = 250;
    const tipH = tooltipBox.offsetHeight || 80;
    let left = rect.left + window.scrollX + rect.width / 2 - tipW / 2;
    let top  = rect.top + window.scrollY - tipH - 12;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 12;
    tooltipBox.style.left = left + 'px';
    tooltipBox.style.top  = top + 'px';
  });
  btn.addEventListener('mouseleave', () => tooltipBox.classList.remove('visible'));
});

/* ==========================================
   GENRES — CHIPS
========================================== */
document.querySelectorAll('.genre-chip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('selected'));
});

function getSelectedGenres() {
  return Array.from(document.querySelectorAll('.genre-chip.selected')).map(c => c.dataset.value);
}

/* ==========================================
   FANDOM / ORIGINAL TOGGLE
========================================== */
document.querySelectorAll('input[name="storyType"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('fandom-block').style.display = r.value === 'fandom' ? 'block' : 'none';
  });
});

/* ==========================================
   CHARACTER CARDS
========================================== */
function createCharCard() {
  state.charCount++;
  const id = state.charCount;
  const card = document.createElement('div');
  card.className = 'char-card';
  card.dataset.id = id;
  card.innerHTML = `
    <div class="char-card-header">
      <span class="char-card-num">Персонаж ${id}</span>
      <button class="char-remove" data-id="${id}">✕</button>
    </div>
    <input type="text" class="char-name" placeholder="Имя персонажа" />
    <select class="char-archetype" id="arch_${id}" style="margin-bottom: 15px; width: 100%;">
      <option value="Протагонист (Главный герой)">🌟 Протагонист (Главный герой)</option>
      <option value="Антагонист (Злодей)">😈 Антагонист (Злодей)</option>
      <option value="Верный друг / Сайдкик">💛 Верный друг / Сайдкик</option>
      <option value="Любовный интерес">💘 Любовный интерес</option>
      <option value="Наставник / Мудрец">🧠 Наставник / Мудрец</option>
      <option value="Антигерой (Морально серый)">🗡️ Антигерой (Морально серый)</option>
      <option value="Трикстер / Шут">🎭 Трикстер / Шут</option>
      <option value="Защитник / Телохранитель">🛡️ Защитник / Телохранитель</option>
      <option value="Второстепенный персонаж">👥 Второстепенный персонаж</option>
    </select>
    <textarea class="char-notes" rows="2" placeholder="Особенности характера, внешность, важные детали…"></textarea>`;
  
  card.querySelector(`.char-remove`).addEventListener('click', () => card.remove());
  return card;
}

document.getElementById('addCharBtn').addEventListener('click', () => {
  document.getElementById('characterCards').appendChild(createCharCard());
});

function collectCharacters() {
  const cards = document.querySelectorAll('.char-card');
  if (!cards.length) return '';
  return Array.from(cards).map(card => {
    const id   = card.dataset.id;
    const name = card.querySelector('.char-name').value.trim() || `Персонаж ${id}`;
    const arch = card.querySelector('.char-archetype').value;
    const note = card.querySelector('.char-notes')?.value.trim();
    let desc = `${name} — Роль/Архетип: ${arch}`;
    if (note) desc += `\nОписание: ${note}`;
    return desc;
  }).join('\n\n');
}

/* ==========================================
   IMAGE UPLOAD
========================================== */
const fileArea          = document.getElementById('fileUploadArea');
const fileInput         = document.getElementById('referenceImage');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreviewWrap  = document.getElementById('imagePreviewWrap');
const imagePreview      = document.getElementById('imagePreview');

fileArea.addEventListener('click', () => fileInput.click());
fileArea.addEventListener('dragover', e => { e.preventDefault(); fileArea.style.borderColor = 'var(--gold)'; });
fileArea.addEventListener('dragleave', () => { fileArea.style.borderColor = 'var(--frame)'; });
fileArea.addEventListener('drop', e => {
  e.preventDefault(); fileArea.style.borderColor = 'var(--frame)';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadImage(file);
});
fileInput.addEventListener('change', e => { if (e.target.files[0]) loadImage(e.target.files[0]); });

function loadImage(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert('Файл слишком большой. Максимальный размер 10 МБ.');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1024;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = (h / w) * maxDim; w = maxDim; }
        else { w = (w / h) * maxDim; h = maxDim; }
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/webp', 0.8);
      state.base64Image = dataUrl.split(',')[1];
      state.imageMime = 'image/webp';
      imagePreview.src = dataUrl;
      uploadPlaceholder.style.display = 'none';
      imagePreviewWrap.style.display  = 'block';
      canvas.width = 0; canvas.height = 0;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
document.getElementById('removeImage').addEventListener('click', e => {
  e.stopPropagation();
  state.base64Image = null; state.imageMime = null; fileInput.value = '';
  uploadPlaceholder.style.display = 'block';
  imagePreviewWrap.style.display  = 'none';
});

/* ==========================================
   SLIDERS & TRIGGERS
========================================== */
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue  = document.getElementById('lengthValue');
const LENGTH_LABELS = {
  1:'Короткая (~1-2 тыс. слов)', 2:'Средняя (~3-5 тыс. слов)', 3:'Длинная (~6-8 тыс. слов)'
};
lengthSlider.addEventListener('input', () => { lengthValue.textContent = LENGTH_LABELS[lengthSlider.value]; });
lengthValue.textContent = LENGTH_LABELS[2];

document.getElementById('cbTrigger').addEventListener('change', e => {
  document.getElementById('triggerBlock').style.display = e.target.checked ? 'block' : 'none';
});

/* ==========================================
   FORM COLLECTION
========================================== */
function collectForm() {
  return {
    storyType:       document.querySelector('input[name="storyType"]:checked').value,
    fandomName:      document.getElementById('fandomName').value.trim(),
    pairings:        document.getElementById('pairings').value.trim(),
    characters:      collectCharacters(),
    storyFormat:     document.getElementById('storyFormat').value,
    rating:          document.getElementById('rating').value,
    genres:          getSelectedGenres(),
    plotDescription: document.getElementById('plotDescription').value.trim(),
    authorNotes:     document.getElementById('authorNotes').value.trim(),
    length:          parseInt(lengthSlider.value),
    addProfanity:    document.getElementById('cbProfanity').checked,
    charDeath:       document.getElementById('cbCharDeath').checked,
    triggerWarnings: document.getElementById('cbTrigger').checked
                       ? document.getElementById('triggerWarnings').value.trim() : '',
    image:           state.base64Image,
    imageMimeType:   state.imageMime,
  };
}

/* ==========================================
   GENERATE BUTTON
========================================== */
document.getElementById('generateBtn').addEventListener('click', () => {
  if (!requireApiKey()) return;
  state.currentStoryData = collectForm();
  const prompt = buildStoryPrompt(state.currentStoryData);
  runGeneration(prompt, state.currentStoryData.image, state.currentStoryData.imageMimeType, false);
});

/* ==========================================
   IDEA MODAL
========================================== */
const ideaModal = document.getElementById('ideaModal');
const ideaGenre = document.getElementById('ideaGenre');
const ideaTitle = document.getElementById('ideaTitle');
const ideaText  = document.getElementById('ideaText');

function showIdea(idea) {
  ideaGenre.textContent = idea.genre;
  ideaTitle.textContent = idea.title;
  ideaText.textContent  = idea.text;
}
document.getElementById('getIdeaBtn').addEventListener('click', () => {
  showIdea(getNextIdea()); ideaModal.classList.add('open');
});
document.getElementById('ideaNext').addEventListener('click', () => showIdea(getNextIdea()));
document.getElementById('ideaClose').addEventListener('click', () => ideaModal.classList.remove('open'));
ideaModal.addEventListener('click', e => {
  if (e.target === ideaModal) ideaModal.classList.remove('open');
});
document.getElementById('ideaCopy').addEventListener('click', () => {
  navigator.clipboard.writeText(`${ideaGenre.textContent}\n${ideaTitle.textContent}\n\n${ideaText.textContent}`)
    .then(() => {
      const btn = document.getElementById('ideaCopy');
      const orig = btn.textContent; btn.textContent = '✅ Скопировано!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
});

/* ==========================================
   PLOT GENERATOR
========================================== */
document.getElementById('generatePlotBtn').addEventListener('click', async () => {
  if (!requireApiKey()) return;
  const input = document.getElementById('plotInput').value.trim();
  if (!input) { alert('Введи краткую идею для сюжета!'); return; }

  const plotLoadingScreen = document.getElementById('plotLoadingScreen');
  document.getElementById('plotResult').style.display = 'none';
  plotLoadingScreen.classList.add('visible');
  startProgress('plotProgressFill', 'plotProgressNum');
  document.getElementById('generatePlotBtn').disabled = true;

  try {
    const prompt = `Ты профессиональный писатель. На основе краткой идеи разработай четкий, структурированный план сюжета (идеальный промпт для последующей генерации).
Не пиши лишней воды и длинных вступлений. Сразу выдавай структуру:

1. **Завязка**: (описание)
2. **Развитие конфликта**: (описание)
3. **Кульминация**: (описание)
4. **Развязка**: (описание)

Сюжетная идея пользователя: ${input}`;
    const sysInst = 'Ты профи-сценарист. Выдавай только структурированный план.';
    const text = await callGemini(prompt, sysInst);
    finishProgress('plotProgressFill', 'plotProgressNum');
    setTimeout(() => {
      plotLoadingScreen.classList.remove('visible');
      document.getElementById('plotResultText').textContent = text;
      document.getElementById('plotResult').style.display = 'block';
      document.getElementById('generatePlotBtn').disabled = false;
    }, 600);
  } catch (err) {
    document.getElementById('generatePlotBtn').disabled = false;
    clearInterval(state.progressInterval);
    plotLoadingScreen.classList.remove('visible');
    alert('❌ Ошибка: ' + err.message);
  }
});

document.getElementById('copyPlotBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('plotResultText').textContent)
    .then(() => {
      const btn = document.getElementById('copyPlotBtn');
      const orig = btn.textContent; btn.textContent = '✅ Скопировано!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
});

/* ==========================================
   RANDOM DICE BUTTONS
========================================== */
document.getElementById('diceFandom')?.addEventListener('click', () => {
  const input = document.getElementById('fandomName');
  input.value = RANDOM_DATA.fandoms[Math.floor(Math.random() * RANDOM_DATA.fandoms.length)];
  document.querySelector('input[name="storyType"][value="fandom"]').click();
  input.style.transition = 'background 0.3s';
  input.style.background = 'rgba(212,175,55,0.18)';
  setTimeout(() => { input.style.background = ''; }, 800);
});

document.getElementById('dicePairings')?.addEventListener('click', () => {
  const input = document.getElementById('pairings');
  input.value = RANDOM_DATA.pairings[Math.floor(Math.random() * RANDOM_DATA.pairings.length)];
  input.style.transition = 'background 0.3s';
  input.style.background = 'rgba(212,175,55,0.18)';
  setTimeout(() => { input.style.background = ''; }, 800);
});

document.getElementById('dicePlot')?.addEventListener('click', () => {
  const input = document.getElementById('plotDescription');
  input.value = RANDOM_DATA.plots[Math.floor(Math.random() * RANDOM_DATA.plots.length)];
  input.style.transition = 'background 0.3s';
  input.style.background = 'rgba(212,175,55,0.18)';
  setTimeout(() => { input.style.background = ''; }, 800);
});

/* ==========================================
   INIT ALL MODULES
========================================== */
initEditActions();
initLibrary();
initCovers();
initStats();
