'use strict';

/* ==========================================
   ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК (анимация страницы)
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
    const targetPage = document.getElementById(`page-${target}`);
    targetPage.classList.add('active');

    if (target === 'library') renderLibrary();
  });
});

/* ==========================================
   ФАНДОМ / ОРИДЖИНАЛ
========================================== */
document.querySelectorAll('input[name="storyType"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('fandom-block').style.display =
      r.value === 'fandom' ? 'block' : 'none';
  });
});

/* ==========================================
   ЗАГРУЗКА КАРТИНКИ
========================================== */
const fileArea       = document.getElementById('fileUploadArea');
const fileInput      = document.getElementById('referenceImage');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreviewWrap  = document.getElementById('imagePreviewWrap');
const imagePreview   = document.getElementById('imagePreview');

let base64Image = null;
let imageMime   = null;

fileArea.addEventListener('click', () => fileInput.click());

fileArea.addEventListener('dragover', e => {
  e.preventDefault();
  fileArea.style.borderColor = 'var(--gold)';
});
fileArea.addEventListener('dragleave', () => {
  fileArea.style.borderColor = 'var(--frame)';
});
fileArea.addEventListener('drop', e => {
  e.preventDefault();
  fileArea.style.borderColor = 'var(--frame)';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadImage(file);
});
fileInput.addEventListener('change', e => {
  if (e.target.files[0]) loadImage(e.target.files[0]);
});

function loadImage(file) {
  imageMime = file.type;
  const reader = new FileReader();
  reader.onload = e => {
    base64Image = e.target.result.split(',')[1];
    imagePreview.src = e.target.result;
    uploadPlaceholder.style.display  = 'none';
    imagePreviewWrap.style.display   = 'block';
  };
  reader.readAsDataURL(file);
}

document.getElementById('removeImage').addEventListener('click', e => {
  e.stopPropagation();
  base64Image = null;
  imageMime   = null;
  fileInput.value = '';
  uploadPlaceholder.style.display  = 'block';
  imagePreviewWrap.style.display   = 'none';
});

/* ==========================================
   ПОЛЗУНКИ
========================================== */
const toneSlider   = document.getElementById('toneSlider');
const toneValue    = document.getElementById('toneValue');
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue  = document.getElementById('lengthValue');

const TONE_LABELS = {
  1: '1 — Чистая трагедия', 2: '2 — Тяжёлый ангст', 3: '3 — Много драмы',
  4: '4 — Напряжение',      5: '5 — Баланс',         6: '6 — Лёгкая грусть',
  7: '7 — Тепло',           8: '8 — Уютно',           9: '9 — Очень мило',
  10: '10 — Чистый флафф'
};
const LENGTH_LABELS = {
  1: 'Короткая (~1-2 тыс. слов)',
  2: 'Средняя (~3-5 тыс. слов)',
  3: 'Длинная (~6-8 тыс. слов)'
};

toneSlider.addEventListener('input', () => {
  toneValue.textContent = TONE_LABELS[toneSlider.value];
});
lengthSlider.addEventListener('input', () => {
  lengthValue.textContent = LENGTH_LABELS[lengthSlider.value];
});

// инициализация
toneValue.textContent   = TONE_LABELS[5];
lengthValue.textContent = LENGTH_LABELS[2];

/* ==========================================
   ТРИГГЕР-ВОРНИНГИ
========================================== */
document.getElementById('cbTrigger').addEventListener('change', e => {
  document.getElementById('triggerBlock').style.display = e.target.checked ? 'block' : 'none';
});

/* ==========================================
   СЧЁТЧИК ПРОГРЕССА (плавный, иногда замедляется)
========================================== */
let progressInterval = null;
let progress = 0;

function startProgress() {
  progress = 0;
  setProgress(0);
  progressInterval = setInterval(() => {
    if (Math.random() < 0.12) return;          // иногда пауза
    const remaining  = 99 - progress;
    const increment  = Math.random() * (remaining * 0.07) + 0.15;
    progress = Math.min(99, progress + increment);
    setProgress(Math.floor(progress));
    if (progress >= 99) clearInterval(progressInterval);
  }, 280);
}

function setProgress(val) {
  document.getElementById('progressFill').style.width = val + '%';
  document.getElementById('progressNum').textContent  = val + '%';
}

function finishProgress() {
  if (progressInterval) clearInterval(progressInterval);
  setProgress(100);
}

/* ==========================================
   СБОР ДАННЫХ ФОРМЫ
========================================== */
function collectForm() {
  return {
    storyType:      document.querySelector('input[name="storyType"]:checked').value,
    fandomName:     document.getElementById('fandomName').value.trim(),
    pairings:       document.getElementById('pairings').value.trim(),
    characters:     document.getElementById('characters').value.trim(),
    rating:         document.getElementById('rating').value,
    genres:         Array.from(document.getElementById('genre').selectedOptions).map(o => o.value),
    plotDescription:document.getElementById('plotDescription').value.trim(),
    authorNotes:    document.getElementById('authorNotes').value.trim(),
    tone:           parseInt(toneSlider.value),
    length:         parseInt(lengthSlider.value),
    addProfanity:   document.getElementById('cbProfanity').checked,
    charDeath:      document.getElementById('cbCharDeath').checked,
    triggerWarnings:document.getElementById('cbTrigger').checked
                      ? document.getElementById('triggerWarnings').value.trim()
                      : '',
    image:          base64Image,
    imageMimeType:  imageMime,
  };
}

/* ==========================================
   ГЕНЕРАЦИЯ ИСТОРИИ
========================================== */
const pagesContainer = document.getElementById('pagesContainer');
const tabNav         = document.querySelector('.tab-nav');
const loadingScreen  = document.getElementById('loadingScreen');
const resultScreen   = document.getElementById('resultScreen');

let currentStoryData = null;

document.getElementById('generateBtn').addEventListener('click', async () => {
  const formData = collectForm();

  // Показываем загрузку
  pagesContainer.style.display = 'none';
  tabNav.style.display         = 'none';
  resultScreen.classList.remove('visible');
  loadingScreen.classList.add('visible');
  startProgress();

  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await resp.json();

    if (!resp.ok) throw new Error(data.error || 'Ошибка сервера');

    finishProgress();

    setTimeout(() => {
      loadingScreen.classList.remove('visible');
      currentStoryData = { ...formData, text: data.text, date: new Date().toLocaleDateString('ru-RU') };
      showResult(data.text, formData);
    }, 700);

  } catch (err) {
    clearInterval(progressInterval);
    loadingScreen.classList.remove('visible');
    pagesContainer.style.display = 'block';
    tabNav.style.display         = 'flex';
    alert('❌ Ошибка: ' + err.message +
          '\n\nПроверь, что переменная GEMINI_API_KEY настроена в настройках Vercel.');
  }
});

/* ==========================================
   ОТОБРАЖЕНИЕ РЕЗУЛЬТАТА
========================================== */
function showResult(text, data) {
  const metaParts = [];
  if (data.storyType === 'fandom' && data.fandomName) metaParts.push(`Фандом: ${data.fandomName}`);
  if (data.pairings) metaParts.push(`Пэйринг: ${data.pairings}`);
  metaParts.push(`Рейтинг: ${data.rating}`);
  if (data.genres?.length) metaParts.push(data.genres.join(', '));

  document.getElementById('resultMeta').textContent = metaParts.join(' · ');

  // Разбиваем на абзацы
  const html = text.trim()
    .split(/\n{2,}/)
    .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  document.getElementById('resultContent').innerHTML = html;

  resultScreen.classList.add('visible');
  resultScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ==========================================
   НОВАЯ ИСТОРИЯ
========================================== */
document.getElementById('newStoryBtn').addEventListener('click', () => {
  resultScreen.classList.remove('visible');
  pagesContainer.style.display = 'block';
  tabNav.style.display         = 'flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ==========================================
   СОХРАНИТЬ В БИБЛИОТЕКУ
========================================== */
document.getElementById('saveLibraryBtn').addEventListener('click', () => {
  if (!currentStoryData) return;

  const library = getLibrary();
  const exists  = library.some(i => i.text === currentStoryData.text);
  if (exists) { showSavedFeedback('✅ Уже сохранено!'); return; }

  library.unshift({
    id:    Date.now(),
    title: buildTitle(currentStoryData),
    meta:  document.getElementById('resultMeta').textContent,
    text:  currentStoryData.text,
    date:  currentStoryData.date,
  });
  localStorage.setItem('fanfic_library', JSON.stringify(library));
  showSavedFeedback('✅ Сохранено!');
});

function showSavedFeedback(msg) {
  const btn = document.getElementById('saveLibraryBtn');
  const orig = btn.textContent;
  btn.textContent = msg;
  btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2200);
}

function buildTitle(d) {
  if (d.fandomName && d.pairings) return `${d.fandomName}: ${d.pairings}`;
  if (d.fandomName)  return d.fandomName;
  if (d.pairings)    return d.pairings;
  if (d.plotDescription) return d.plotDescription.slice(0, 55) + '…';
  return 'Безымянная история';
}

/* ==========================================
   СКАЧАТЬ PDF
========================================== */
document.getElementById('downloadPdfBtn').addEventListener('click', () => {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="font-family:Georgia,serif;background:#f7f2e8;padding:44px;color:#2c1810;max-width:680px;margin:0 auto;">
      <h1 style="font-family:Georgia,serif;font-size:2rem;text-align:center;color:#8b6914;margin-bottom:6px;">
        ${document.getElementById('resultTitle').textContent}
      </h1>
      <p style="text-align:center;font-style:italic;color:#5c3d2e;margin-bottom:28px;font-size:0.88rem;">
        ${document.getElementById('resultMeta').textContent}
      </p>
      <hr style="border:1px solid #c4a882;margin-bottom:28px;"/>
      <div style="font-size:1rem;line-height:1.9;">
        ${document.getElementById('resultContent').innerHTML}
      </div>
    </div>`;

  html2pdf().set({
    margin: [12, 14],
    filename: 'fanfic.pdf',
    image: { type: 'jpeg', quality: 0.97 },
    html2canvas: { scale: 2, backgroundColor: '#f7f2e8', useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(el).save();
});

/* ==========================================
   БИБЛИОТЕКА
========================================== */
function getLibrary() {
  return JSON.parse(localStorage.getItem('fanfic_library') || '[]');
}

function renderLibrary() {
  const list = getLibrary();
  const container = document.getElementById('libraryList');

  if (!list.length) {
    container.innerHTML = '<p class="empty-library">Твоя библиотека пуста.<br/>Создай первую историю!</p>';
    return;
  }

  container.innerHTML = list.map(item => `
    <div class="library-item">
      <div class="lib-item-title">${escapeHtml(item.title)}</div>
      <div class="lib-item-meta">${escapeHtml(item.meta)} · ${item.date}</div>
      <div class="lib-item-preview">${escapeHtml(item.text.slice(0, 160))}…</div>
      <div class="lib-item-actions">
        <button class="lib-btn read-btn" data-id="${item.id}">📖 Читать</button>
        <button class="lib-btn delete del-btn"  data-id="${item.id}">🗑️ Удалить</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.read-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(parseInt(btn.dataset.id)));
  });
  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(parseInt(btn.dataset.id)));
  });
}

function openModal(id) {
  const item = getLibrary().find(i => i.id === id);
  if (!item) return;
  document.getElementById('modalTitle').textContent   = item.title;
  document.getElementById('modalContent').textContent = item.text;
  document.getElementById('readModal').classList.add('open');
}

function deleteItem(id) {
  if (!confirm('Удалить эту историю?')) return;
  const updated = getLibrary().filter(i => i.id !== id);
  localStorage.setItem('fanfic_library', JSON.stringify(updated));
  renderLibrary();
}

document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('readModal').classList.remove('open');
});
document.getElementById('readModal').addEventListener('click', e => {
  if (e.target === document.getElementById('readModal'))
    document.getElementById('readModal').classList.remove('open');
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
