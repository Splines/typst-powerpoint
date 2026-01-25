import { initializeUIState, setupEventListeners } from "./ui.js";
import { initTypst } from "./typst.js";
import { setupPreviewListeners, updateButtonState } from "./preview.js";
import { initializeDarkMode, setupDarkModeToggle } from "./theme.js";
import { handleSelectionChange } from "./selection.js";
import { generateFromFile, initializeDropzone } from "./file/file.js";
import { DOM_IDS } from "./constants.js";
import { getHTMLElement } from "./utils/dom.js";

Office.actions.associate("generateFromFile", (event: Office.AddinCommands.Event) => {
  void generateFromFile(event);
});

/**
 * Sets up the About modal functionality.
 */
function setupAboutModal() {
  const aboutLink = getHTMLElement(DOM_IDS.ABOUT_LINK);
  const aboutModal = getHTMLElement(DOM_IDS.ABOUT_MODAL);
  const closeBtn = getHTMLElement(DOM_IDS.ABOUT_MODAL_CLOSE);

  aboutLink.addEventListener("click", (e) => {
    e.preventDefault();
    aboutModal.classList.add("active");
  });

  closeBtn.addEventListener("click", () => {
    aboutModal.classList.remove("active");
  });

  // Close modal when clicking outside of it
  aboutModal.addEventListener("click", (e) => {
    if (e.target === aboutModal) {
      aboutModal.classList.remove("active");
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aboutModal.classList.contains("active")) {
      aboutModal.classList.remove("active");
    }
  });
}

/**
 * Main initialization function for Office Add-in.
 */
await Office.onReady(async (info) => {
  if (info.host !== Office.HostType.PowerPoint) {
    return;
  }

  await initTypst();

  initializeDarkMode();
  setupDarkModeToggle();
  setupAboutModal();

  initializeUIState();
  initializeDropzone();
  setupEventListeners();
  setupPreviewListeners();
  updateButtonState();

  Office.context.document.addHandlerAsync(
    Office.EventType.DocumentSelectionChanged,
    handleSelectionChange,
  );

  await handleSelectionChange();
});
