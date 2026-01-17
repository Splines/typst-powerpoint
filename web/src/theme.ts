import { updatePreview } from "./preview.js";
import { getInputElement } from "./utils/dom";
import { DOM_IDS, STORAGE_KEYS, THEMES } from "./constants.js";

/**
 * Initializes dark mode based on stored preference (defaults to light mode).
 */
export function initializeDarkMode() {
  const isDarkMode = isDarkModeEnabled();
  applyTheme(isDarkMode);

  const darkModeToggle = getInputElement(DOM_IDS.DARK_MODE_TOGGLE);
  updateToggleClass(darkModeToggle);
  darkModeToggle.checked = !isDarkMode;
}

/**
 * @returns whether dark mode is enabled
 */
function isDarkModeEnabled(): boolean {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  return savedTheme === null ? false : savedTheme === THEMES.DARK;
}

/**
 * Applies the theme to the document.
 */
function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark-mode");
  } else {
    root.classList.remove("dark-mode");
  }
}

/**
 * Sets up the dark mode toggle listener.
 */
export function setupDarkModeToggle() {
  const darkModeToggle = getInputElement(DOM_IDS.DARK_MODE_TOGGLE);
  darkModeToggle.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;
    updateToggleClass(target);

    const isDark = !target.checked;
    applyTheme(isDark);
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? THEMES.DARK : THEMES.LIGHT);
    void updatePreview();
  });
}

/**
 * Updates the label's checked class based on checkbox state.
 */
function updateToggleClass(checkbox: HTMLInputElement) {
  const label = checkbox.parentElement;
  if (!label) return;

  if (checkbox.checked) {
    label.classList.add("checked");
  } else {
    label.classList.remove("checked");
  }
}
