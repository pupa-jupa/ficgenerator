import { state } from './state.js';

/**
 * Generates a cover art prompt from story metadata using Pollinations.ai (free, no API key).
 */
function buildCoverPrompt(data) {
  const parts = ['dark academia aesthetic, book cover art, dramatic lighting, moody atmosphere'];

  if (data.storyType === 'fandom' && data.fandomName) {
    parts.push(`inspired by ${data.fandomName}`);
  }

  const genreMap = {
    'Романтика': 'romantic, warm golden tones, two silhouettes',
    'Ангст': 'melancholic, rain, cold blue tones, solitude',
    'Флафф': 'soft pastel light, warmth, comfort, cozy',
    'Драма': 'intense, theatrical, chiaroscuro lighting',
    'Хоррор': 'eerie, dark shadows, fog, unsettling',
    'Фэнтези': 'magical, mystical glow, enchanted forest',
    'Hurt/Comfort': 'bittersweet, embrace, tears and hope',
    'Юмор': 'whimsical, playful, bright accents',
    'Детектив': 'noir, magnifying glass, shadows, mystery',
    'Экшен': 'dynamic, motion blur, sparks, energy',
  };

  if (data.genres?.length) {
    data.genres.forEach(g => {
      if (genreMap[g]) parts.push(genreMap[g]);
    });
  }

  const ratingStyles = {
    'G': 'innocent, gentle, soft',
    'PG-13': 'mature atmosphere, subtle tension',
    'R': 'intense, dark, passionate',
    'NC-17': 'provocative, dark elegance, sensual shadows',
  };
  if (ratingStyles[data.rating]) parts.push(ratingStyles[data.rating]);

  parts.push('high quality digital art, artstation, cinematic composition, no text, no letters, no words');

  return parts.join(', ');
}

/**
 * Initializes cover generation UI and events.
 */
export function initCovers() {
  const generateBtn = document.getElementById('generateCoverBtn');
  const downloadBtn = document.getElementById('downloadCoverBtn');
  const retryBtn    = document.getElementById('retryCoverBtn');
  const coverImg    = document.getElementById('coverImage');
  const coverPlaceholder = document.getElementById('coverPlaceholder');
  const coverLoading     = document.getElementById('coverLoading');
  const coverResult      = document.getElementById('coverResult');

  if (!generateBtn) return;

  function generateCover() {
    if (!state.currentStoryData) return;

    coverPlaceholder.style.display = 'none';
    coverLoading.style.display = 'flex';
    coverResult.style.display = 'none';

    const prompt = buildCoverPrompt(state.currentStoryData);
    const seed = Math.floor(Math.random() * 999999);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=1024&seed=${seed}&nologo=true`;

    coverImg.onload = () => {
      coverLoading.style.display = 'none';
      coverResult.style.display = 'block';
      retryBtn.style.display = 'inline-block';
      downloadBtn.style.display = 'inline-block';
    };
    coverImg.onerror = () => {
      coverLoading.style.display = 'none';
      coverPlaceholder.style.display = 'flex';
      coverPlaceholder.innerHTML = '<span class="cover-placeholder-icon">⚠️</span><span>Не удалось загрузить обложку</span>';
    };
    coverImg.src = url;
  }

  generateBtn.addEventListener('click', generateCover);
  retryBtn?.addEventListener('click', generateCover);

  downloadBtn?.addEventListener('click', async () => {
    try {
      const response = await fetch(coverImg.src);
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cover_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback: open in new tab
      window.open(coverImg.src, '_blank');
    }
  });
}
