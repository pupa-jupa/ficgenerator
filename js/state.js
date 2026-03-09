/**
 * Centralized mutable state for the application.
 * All modules import this object and read/write properties directly.
 */
export const state = {
  userGeminiKey: sessionStorage.getItem('gemini_api_key') || '',
  selectedModel: localStorage.getItem('gemini_model') || 'gemini-2.5-flash',

  // Story generation
  currentStoryData: null,
  currentStoryText: '',

  // Image upload
  base64Image: null,
  imageMime: null,

  // Characters
  charCount: 0,

  // Reader
  fontSize: 16,
  isSerif: true,

  // API / progress
  currentAbortController: null,
  progressInterval: null,
  progress: 0,

  // Library
  isLibraryEditMode: false,
  currentModalItemId: null,

  // Debounce
  contentEditDebounce: null,
};
