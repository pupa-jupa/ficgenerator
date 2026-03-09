import { state } from './state.js';

/**
 * Calculates comprehensive text statistics.
 */
function computeStats(text) {
  if (!text || !text.trim()) {
    return { words: 0, chars: 0, charsNoSpace: 0, sentences: 0, paragraphs: 0, readingMin: 0, avgWordLength: 0, dialogueLines: 0, longestSentence: 0 };
  }

  const clean = text.trim();
  const words = clean.split(/\s+/).filter(w => w.length > 0);
  const chars = clean.length;
  const charsNoSpace = clean.replace(/\s/g, '').length;
  const sentences = clean.split(/[.!?…]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = clean.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  const readingMin = Math.max(1, Math.round(words.length / 200));

  const totalWordLen = words.reduce((sum, w) => sum + w.replace(/[^а-яёa-z]/gi, '').length, 0);
  const avgWordLength = words.length ? +(totalWordLen / words.length).toFixed(1) : 0;

  // Count dialogue lines (lines starting with — or containing « »)
  const dialogueLines = clean.split('\n').filter(line => {
    const t = line.trim();
    return t.startsWith('—') || t.startsWith('–') || t.startsWith('"') || (t.includes('«') && t.includes('»'));
  }).length;

  // Longest sentence
  const sentencesList = clean.split(/[.!?…]+/).filter(s => s.trim().length > 0);
  const longestSentence = sentencesList.reduce((max, s) => {
    const wc = s.trim().split(/\s+/).length;
    return wc > max ? wc : max;
  }, 0);

  return { words: words.length, chars, charsNoSpace, sentences, paragraphs, readingMin, avgWordLength, dialogueLines, longestSentence };
}

/**
 * Animates a counter from 0 to target value.
 */
function animateCounter(element, target, suffix = '', duration = 1200) {
  const start = performance.now();
  const isFloat = String(target).includes('.');

  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = isFloat ? (target * eased).toFixed(1) : Math.floor(target * eased);
    element.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/**
 * Renders statistics panel with animated counters.
 */
function renderStats(stats) {
  const items = [
    { id: 'statWords',      value: stats.words,          suffix: '', icon: '📝', label: 'Слов' },
    { id: 'statChars',      value: stats.charsNoSpace,   suffix: '', icon: '🔤', label: 'Знаков' },
    { id: 'statSentences',  value: stats.sentences,      suffix: '', icon: '📖', label: 'Предложений' },
    { id: 'statParagraphs', value: stats.paragraphs,     suffix: '', icon: '📄', label: 'Абзацев' },
    { id: 'statReading',    value: stats.readingMin,      suffix: ' мин', icon: '⏱️', label: 'Чтение' },
    { id: 'statAvgWord',    value: stats.avgWordLength,   suffix: '', icon: '📏', label: 'Средн. слово' },
    { id: 'statDialogue',   value: stats.dialogueLines,   suffix: '', icon: '💬', label: 'Диалогов' },
    { id: 'statLongest',    value: stats.longestSentence, suffix: ' сл.', icon: '📐', label: 'Макс. предл.' },
  ];

  items.forEach(({ id, value, suffix, icon, label }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const valEl = el.querySelector('.stat-value');
    const iconEl = el.querySelector('.stat-icon');
    const labelEl = el.querySelector('.stat-label');
    if (iconEl) iconEl.textContent = icon;
    if (labelEl) labelEl.textContent = label;
    if (valEl) animateCounter(valEl, value, suffix);
  });
}

/**
 * Initializes statistics panel.
 */
export function initStats() {
  // Stats are updated whenever showResult is called
}

/**
 * Updates statistics for the current story text.
 */
export function updateStats() {
  const statsPanel = document.getElementById('statsPanel');
  if (!statsPanel) return;

  if (!state.currentStoryText) {
    statsPanel.style.display = 'none';
    return;
  }

  statsPanel.style.display = 'block';
  const stats = computeStats(state.currentStoryText);
  renderStats(stats);
}
