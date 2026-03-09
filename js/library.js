import { state } from './state.js';
import { callGemini, requireApiKey } from './api.js';
import { showResult } from './generation.js';

/* ==========================================
   LIBRARY STORAGE
========================================== */
export async function getLibraryAsync() {
  const lib = await localforage.getItem('fanfic_library');
  return lib || [];
}

function buildTitle(d) {
  if (d.fandomName && d.pairings) return `${d.fandomName}: ${d.pairings}`;
  if (d.fandomName) return d.fandomName;
  if (d.pairings) return d.pairings;
  if (d.plotDescription) return d.plotDescription.slice(0, 55) + '…';
  return 'Безымянная история';
}

/* ==========================================
   RENDER
========================================== */
export async function renderLibrary() {
  const list = await getLibraryAsync();
  const container = document.getElementById('libraryList');
  if (!list.length) {
    container.innerHTML = '<p class="empty-library">Твоя библиотека пуста.<br/>Создай первую историю!</p>';
    return;
  }
  container.innerHTML = '';
  
  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'library-item';
    
    const title = document.createElement('div');
    title.className = 'lib-item-title';
    title.textContent = `📜 ${item.title}`;
    
    const meta = document.createElement('div');
    meta.className = 'lib-item-meta';
    meta.textContent = `📅 ${item.date} · 🏷️ ${item.meta}`;
    
    const prev = document.createElement('div');
    prev.className = 'lib-item-preview';
    prev.textContent = item.text.slice(0, 160) + '…';
    
    const actions = document.createElement('div');
    actions.className = 'lib-item-actions';
    
    const btnRead = document.createElement('button');
    btnRead.className = 'lib-btn read-btn';
    btnRead.textContent = '📖 Читать';
    btnRead.onclick = () => openModal(item.id);
    
    const btnPdf = document.createElement('button');
    btnPdf.className = 'lib-btn pdf-btn';
    btnPdf.textContent = '📄 PDF';
    btnPdf.onclick = () => downloadItemPdf(item);

    const btnCont = document.createElement('button');
    btnCont.className = 'lib-btn play-btn';
    btnCont.textContent = '✍️ Продолжить';
    btnCont.onclick = () => continueLibraryStory(item);
    
    const btnDel = document.createElement('button');
    btnDel.className = 'lib-btn delete del-btn';
    btnDel.textContent = '🗑️ Удалить';
    btnDel.onclick = () => deleteItem(item.id);
    
    actions.append(btnRead, btnCont, btnPdf, btnDel);
    el.append(title, meta, prev, actions);
    container.append(el);
  });
}

/* ==========================================
   ACTIONS
========================================== */
function downloadItemPdf(item) {
  document.getElementById('printTitle').textContent = item.title.replace('📜 ', '');
  document.getElementById('printMeta').textContent = item.meta.replace('📅 ', '').replace('🏷️ ', '');
  document.getElementById('printContent').innerHTML = DOMPurify.sanitize(marked.parse(item.text));
  setTimeout(() => window.print(), 100);
}

function continueLibraryStory(item) {
  state.currentStoryData = item.data || { plotDescription: item.title }; 
  state.currentStoryText = item.text;
  state.isLibraryEditMode = true;

  document.getElementById('pagesContainer').style.display = 'none';
  document.querySelector('.tab-nav').style.display = 'none';
  document.getElementById('newStoryBtn').textContent = '⬅ Назад в библиотеку';
  
  showResult(state.currentStoryText, state.currentStoryData);
}

function openModal(id) {
  getLibraryAsync().then(library => {
    const item = library.find(i => i.id === id);
    if (!item) return;
    state.currentModalItemId = id;
    document.getElementById('modalTitle').textContent   = item.title;
    const html = DOMPurify.sanitize(marked.parse(item.text));
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('summaryResult').style.display = 'none';
    document.getElementById('readModal').classList.add('open');
  });
}

async function deleteItem(id) {
  if (!confirm('Удалить эту историю?')) return;
  const list = await getLibraryAsync();
  await localforage.setItem('fanfic_library', list.filter(i => i.id !== id));
  renderLibrary();
}

/* ==========================================
   INIT LIBRARY UI
========================================== */
export function initLibrary() {
  // Save to library
  document.getElementById('saveLibraryBtn').addEventListener('click', async () => {
    if (!state.currentStoryData) return;
    const library = await getLibraryAsync();
    if (library.some(i => i.text === state.currentStoryText)) {
      showSavedFeedback('✅ Уже сохранено!'); return;
    }
    library.unshift({
      id:    Date.now(),
      title: buildTitle(state.currentStoryData),
      meta:  document.getElementById('resultMeta').textContent,
      text:  state.currentStoryText,
      date:  new Date().toLocaleDateString('ru-RU'),
      data:  state.currentStoryData
    });
    await localforage.setItem('fanfic_library', library);
    showSavedFeedback('✅ Сохранено!');
  });

  // PDF from result screen
  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const title = document.getElementById('resultTitle').textContent || "История";
    document.getElementById('printTitle').textContent = title;
    document.getElementById('printMeta').textContent = document.getElementById('resultMeta').textContent;
    document.getElementById('printContent').innerHTML = document.getElementById('resultContent').innerHTML;
    setTimeout(() => window.print(), 100);
  });

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', () =>
    document.getElementById('readModal').classList.remove('open'));
  document.getElementById('readModal').addEventListener('click', e => {
    if (e.target === document.getElementById('readModal'))
      document.getElementById('readModal').classList.remove('open');
  });

  // Summary generation
  document.getElementById('modalSummaryBtn').addEventListener('click', async () => {
    if (!requireApiKey()) return;
    const library = await getLibraryAsync();
    const item = library.find(i => i.id === state.currentModalItemId);
    if (!item) return;

    const btn = document.getElementById('modalSummaryBtn');
    const orig = btn.textContent;
    btn.textContent = '⏳ Генерирую…'; btn.disabled = true;

    try {
      const prompt = `Прочитай этот фанфик и напиши для него два варианта краткого описания (саммари) для публикации на Ficbook или AO3 на русском языке:
1. Интригующее описание (3-4 предложения), которое захватывает читателя и не раскрывает финал.
2. Краткое полное описание (2-3 предложения) с указанием основного сюжета.

ТЕКСТ ФАНФИКА:
"""
${item.text.slice(0, 4000)}
"""

Верни только два описания, без лишних пояснений.`;

      const text = await callGemini(prompt);
      document.getElementById('summaryText').textContent = text;
      document.getElementById('summaryResult').style.display = 'block';
    } catch (err) {
      alert('❌ Ошибка: ' + err.message);
    } finally {
      btn.textContent = orig; btn.disabled = false;
    }
  });

  document.getElementById('copySummaryBtn').addEventListener('click', () => {
    const text = document.getElementById('summaryText').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copySummaryBtn');
      const orig = btn.textContent; btn.textContent = '✅ Скопировано!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
  });

  // New story / back button
  document.getElementById('newStoryBtn').addEventListener('click', () => {
    document.getElementById('resultScreen').classList.remove('visible');
    document.getElementById('pagesContainer').style.display = 'block';
    document.querySelector('.tab-nav').style.display         = 'flex';
    window.scrollTo({ top:0, behavior:'smooth' });

    if (state.isLibraryEditMode) {
      document.querySelector('.tab-btn[data-tab="library"]').click();
      state.isLibraryEditMode = false;
      document.getElementById('newStoryBtn').textContent = '✍️ Новая история';
    } else {
      document.querySelector('.tab-btn[data-tab="create"]').click();
    }
  });
}

function showSavedFeedback(msg) {
  const btn = document.getElementById('saveLibraryBtn');
  const orig = btn.textContent; btn.textContent = msg; btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2200);
}
