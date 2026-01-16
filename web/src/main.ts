import { setupPreviewListeners, initializeDarkMode, setupDarkModeToggle, initializeUIState } from "./ui.js";
import { insertOrUpdateFormula, handleSelectionChange } from "./powerpoint.js";
import { initTypst } from "./typst.js";
import { DOM_IDS } from "./constants.js";

/**
 * Sets up event listeners for UI interactions
 */
function setupEventListeners() {
  const insertButton = document.getElementById(DOM_IDS.INSERT_BTN);
  if (insertButton) {
    insertButton.onclick = insertOrUpdateFormula;
  }

  const typstInput = document.getElementById(DOM_IDS.TYPST_INPUT);
  if (typstInput) {
    typstInput.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        void insertOrUpdateFormula();
      }
    });
  }

  setupPreviewListeners();
}

/**
 * Main initialization function for Office Add-in
 */
await Office.onReady(async (info) => {
  if (info.host !== Office.HostType.PowerPoint) {
    return;
  }

  await initTypst();

  initializeDarkMode();
  setupDarkModeToggle();

  initializeUIState();
  setupEventListeners();

  Office.context.document.addHandlerAsync(
    Office.EventType.DocumentSelectionChanged,
    handleSelectionChange,
  );

  await handleSelectionChange();
});
