/**
 * input.js — Key bindings and live input state.
 *
 * `bindings` and `keys` are mutable objects shared by reference across all
 * importers; mutate their properties in-place so every module sees the update.
 */

export const DEFAULT_BINDINGS = {
  up:    'ArrowUp',
  down:  'ArrowDown',
  left:  'ArrowLeft',
  right: 'ArrowRight',
};

/** Persisted key-code bindings — mutate properties, never replace the object. */
export const bindings = loadBindings();

/** Live key-pressed state — mutate properties, never replace the object. */
export const keys = { up: false, down: false, left: false, right: false };

/** Resets all pressed keys to false (e.g. when opening settings). */
export function resetKeys() {
  keys.up = keys.down = keys.left = keys.right = false;
}

/** Loads saved bindings from localStorage, or returns defaults. */
export function loadBindings() {
  try {
    const saved = JSON.parse(localStorage.getItem('lunar_bindings'));
    if (saved && saved.up && saved.down && saved.left && saved.right) return saved;
  } catch (_) { /* corrupt storage — fall through to defaults */ }
  return { ...DEFAULT_BINDINGS };
}

/** Persists current bindings to localStorage. */
export function saveBindings() {
  localStorage.setItem('lunar_bindings', JSON.stringify(bindings));
}

/**
 * Returns a short, human-readable label for a KeyboardEvent.code string.
 * @param {string} code
 * @returns {string}
 */
export function formatKey(code) {
  const labels = {
    ArrowUp:      '↑',       ArrowDown:    '↓',
    ArrowLeft:    '←',       ArrowRight:   '→',
    Space:        'ESPACE',  Enter:        'ENTRÉE',
    Escape:       'ÉCHAP',   Tab:          'TAB',
    Backspace:    'RETOUR',
    ShiftLeft:    'SHIFT G', ShiftRight:   'SHIFT D',
    ControlLeft:  'CTRL G',  ControlRight: 'CTRL D',
    AltLeft:      'ALT G',   AltRight:     'ALT D',
  };
  if (labels[code])              return labels[code];
  if (code.startsWith('Key'))    return code.slice(3);
  if (code.startsWith('Digit'))  return code.slice(5);
  if (code.startsWith('Numpad')) return 'NP' + code.slice(6);
  return code;
}
