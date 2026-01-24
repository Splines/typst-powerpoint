/**
 * UI update functions for file handling.
 */

import { DOM_IDS } from "../constants.js";
import { getButtonElement, getHTMLElement } from "../utils/dom.js";
import { setStatus, setFileButtonText } from "../ui.js";

/**
 * Updates the UI with the selected file information.
 *
 * @param file The file to display
 * @param isEditingExistingFormula Whether a formula is currently selected
 */
export function updateFileUI(file: File, isEditingExistingFormula: boolean): void {
  const generateBtn = getButtonElement(DOM_IDS.GENERATE_FROM_FILE_BTN);
  generateBtn.style.display = "block";

  const fileInfo = getHTMLElement(DOM_IDS.FILE_INFO);
  fileInfo.classList.add("show");

  const fileName = getHTMLElement(DOM_IDS.FILE_NAME);
  fileName.textContent = file.name;

  const dropzoneLabel = getHTMLElement(DOM_IDS.DROPZONE_LABEL);
  dropzoneLabel.style.borderColor = "";

  setFileButtonText(isEditingExistingFormula);
}

/**
 * Shows the file picker error state when no file is selected.
 */
export function showFilePickerError(): void {
  const dropzoneLabel = getHTMLElement(DOM_IDS.DROPZONE_LABEL);
  dropzoneLabel.style.borderColor = "var(--error-color)";
  setStatus("Please select a file first", true);
}

/**
 * Hides the file UI and clears file information.
 */
export function hideFileUI(): void {
  getButtonElement(DOM_IDS.GENERATE_FROM_FILE_BTN).style.display = "none";
  const fileInfo = getHTMLElement(DOM_IDS.FILE_INFO);
  fileInfo.classList.remove("show");
}
