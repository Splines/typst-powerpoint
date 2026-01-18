import { insertOrUpdateFormula } from "./insertion.js";
import { setStatus, setTypstCode, getMathModeEnabled, setMathModeEnabled } from "./ui.js";
import { DOM_IDS, STORAGE_KEYS } from "./constants.js";
import { getButtonElement, getHTMLElement } from "./utils/dom.js";
import { storeValue, getStoredValue } from "./utils/storage.js";

// Store the file handle for persistent access
let fileHandle: FileSystemFileHandle | null = null;

const DB_NAME = "typst-powerpoint-file-handles";
const DB_VERSION = 1;
const STORE_NAME = "fileHandles";
const FILE_HANDLE_KEY = "lastFileHandle";

/**
 * Opens the IndexedDB database for storing file handles.
 */
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error(request.error?.message || "Failed to open database"));
    };
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Stores a file handle in IndexedDB.
 */
async function storeFileHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.put(handle, FILE_HANDLE_KEY);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(new Error(request.error?.message || "Failed to store file handle"));
      };
    });
  } catch (error) {
    console.error("Error storing file handle:", error);
  }
}

/**
 * Retrieves a file handle from IndexedDB.
 */
async function retrieveFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    const result = await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
      const request = store.get(FILE_HANDLE_KEY);
      request.onsuccess = () => {
        const handle = request.result as FileSystemFileHandle | undefined;
        resolve(handle ?? null);
      };
      request.onerror = () => {
        reject(new Error(request.error?.message || "Failed to retrieve file handle"));
      };
    });
    return result;
  } catch (error) {
    console.error("Error retrieving file handle:", error);
    return null;
  }
}

/**
 * Verifies that a file handle is still accessible.
 */
async function verifyFileHandle(handle: FileSystemFileHandle): Promise<boolean> {
  try {
    // Request permission to read the file
    const permission = await handle.queryPermission({ mode: "read" });
    if (permission === "granted") {
      return true;
    }

    // Try to request permission
    const requestedPermission = await handle.requestPermission({ mode: "read" });
    return requestedPermission === "granted";
  } catch (error) {
    console.error("Error verifying file handle:", error);
    return false;
  }
}

// Extend Window and FileSystemHandle interfaces to include File System Access API
declare global {
  interface Window {
    showOpenFilePicker(_options?: {
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
      multiple?: boolean;
    }): Promise<FileSystemFileHandle[]>;
  }

  interface FileSystemHandle {
    queryPermission(_descriptor?: { mode: "read" | "readwrite" }): Promise<PermissionState>;
    requestPermission(_descriptor?: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  }
}

/**
 * Opens the file picker using File System Access API.
 */
async function pickFile(): Promise<void> {
  try {
    // Use File System Access API to pick a file
    const handles = await window.showOpenFilePicker({
      types: [
        {
          description: "Typst files",
          accept: {
            "text/plain": [".typ", ".txt"],
          },
        },
      ],
      multiple: false,
    });

    if (handles.length > 0) {
      fileHandle = handles[0];
      const file = await fileHandle.getFile();

      await storeFileHandle(fileHandle);

      // Update UI
      const generateBtn = getButtonElement(DOM_IDS.GENERATE_FROM_FILE_BTN);
      const filePickerLabel = getHTMLElement(DOM_IDS.FILE_PICKER_LABEL);

      generateBtn.style.display = "block";
      filePickerLabel.textContent = `Selected: ${file.name}`;
      filePickerLabel.classList.add("show");
      filePickerLabel.classList.remove("error-state");

      // Store file name for display
      storeValue(STORAGE_KEYS.LAST_FILE_PATH as string, file.name);
    }
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name !== "AbortError") {
      console.error("Error picking file:", error);
    }
  }
}

/**
 * Handles file selection from the file picker.
 */
export function handleFileSelection() {
  // Trigger the File System Access API picker
  void pickFile();
}

/**
 * Handles generating formula from the selected file.
 */
export async function handleGenerateFromFile() {
  if (!fileHandle) {
    setStatus("Please select a file first", true);
    return;
  }

  try {
    // Read the file fresh from disk each time
    const file = await fileHandle.getFile();
    const content = await file.text();

    setTypstCode(content);
    setStatus(`Loaded content from ${file.name}`);

    // Temporarily disable math mode for file generation
    // since external files typically include their own $ delimiters
    const previousMathMode = getMathModeEnabled();
    setMathModeEnabled(false);

    try {
      await insertOrUpdateFormula();
    } finally {
      // Restore the previous math mode setting
      setMathModeEnabled(previousMathMode);
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    setStatus(`Error reading file: ${error}`, true);
    // Clear the file handle if it's no longer accessible
    fileHandle = null;
    getButtonElement(DOM_IDS.GENERATE_FROM_FILE_BTN).style.display = "none";
  }
}

/**
 * Shows the file picker error state when no file is selected.
 */
export function showFilePickerError() {
  const filePickerLabel = getHTMLElement(DOM_IDS.FILE_PICKER_LABEL);

  filePickerLabel.classList.add("error-state", "show");
  filePickerLabel.textContent = "Select a file";
}

/**
 * Clears the file picker error state.
 */
export function clearFilePickerError() {
  const filePickerLabel = getHTMLElement(DOM_IDS.FILE_PICKER_LABEL);

  filePickerLabel.classList.remove("error-state", "show");
}

/**
 * Function to be called from the ribbon button to generate from file.
 *
 * This is registered as a FunctionFile command in manifest.xml.
 */
export async function generateFromFile(event: Office.AddinCommands.Event) {
  try {
    if (!fileHandle) {
      await Office.addin.showAsTaskpane();
      showFilePickerError();
    } else {
      await handleGenerateFromFile();
    }

    event.completed();
  } catch (error) {
    console.error("Error in generateFromFile command:", error);
    event.completed();
  }
}

/**
 * Initializes the file picker with the last used file path.
 */
export async function initializeFilePicker() {
  const lastFilePath = getStoredValue(STORAGE_KEYS.LAST_FILE_PATH as string);
  if (!lastFilePath) return;

  const filePickerLabel = getHTMLElement(DOM_IDS.FILE_PICKER_LABEL);
  const generateBtn = getButtonElement(DOM_IDS.GENERATE_FROM_FILE_BTN);

  // Try to restore the file handle from IndexedDB
  const storedHandle = await retrieveFileHandle();
  if (storedHandle) {
    // Verify we still have access to the file
    const hasAccess = await verifyFileHandle(storedHandle);
    if (hasAccess) {
      try {
        // Get the file to verify it still exists and update the name
        const file = await storedHandle.getFile();
        fileHandle = storedHandle;

        filePickerLabel.textContent = `Last used: ${file.name}`;
        filePickerLabel.classList.add("show");
        filePickerLabel.classList.remove("error-state");
        generateBtn.style.display = "block";

        // Update stored file name in case it changed
        storeValue(STORAGE_KEYS.LAST_FILE_PATH as string, file.name);
        return;
      } catch (error) {
        console.error("Error accessing stored file:", error);
        // File no longer accessible, clear the handle
        fileHandle = null;
      }
    }
  }

  // If we couldn't restore the file handle, just show the last used name
  filePickerLabel.textContent = `Last used: ${lastFilePath}`;
  filePickerLabel.classList.add("show");
  filePickerLabel.classList.remove("error-state");

  // Don't show generate button since we don't have access
  generateBtn.style.display = "none";
}
