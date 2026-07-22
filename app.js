const STORAGE_KEY = "simple-notepad-notes";
const SETTINGS_KEY = "simple-notepad-settings";
// Keep file opening intentionally narrow so the app only reads text-like files.
const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".log", ".csv", ".json", ".js", ".html", ".css"];
const DEFAULT_SETTINGS = {
  fontFamily: "Consolas, 'Courier New', monospace",
  fontSize: 16,
  backgroundColor: "#ffffff"
};

const noteList = document.querySelector("#noteList");
const searchInput = document.querySelector("#searchInput");
const noteTitle = document.querySelector("#noteTitle");
const noteBody = document.querySelector("#noteBody");
const statusText = document.querySelector("#statusText");
const countText = document.querySelector("#countText");
const fileInput = document.querySelector("#fileInput");
const savedNotesPane = document.querySelector("#savedNotesPane");
const fontFamily = document.querySelector("#fontFamily");
const fontSize = document.querySelector("#fontSize");
const backgroundColor = document.querySelector("#backgroundColor");

let notes = loadNotes();
let settings = loadSettings();
let activeNoteId = notes[0]?.id || createBlankNote().id;

function loadNotes() {
  // Bad storage data should not break the app; we just start with a clean list.
  try {
    const savedNotes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return Array.isArray(savedNotes) ? savedNotes : [];
  } catch {
    return [];
  }
}

function loadSettings() {
  // Settings are separate from notes so appearance changes do not touch writing data.
  try {
    const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    return { ...DEFAULT_SETTINGS, ...savedSettings };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function createBlankNote() {
  // New notes get saved right away so they show up in the File > Saved notes list.
  const note = {
    id: createNoteId(),
    title: "Untitled note",
    body: "",
    updatedAt: new Date().toISOString()
  };

  notes.unshift(note);
  saveNotes();
  return note;
}

function createNoteId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getActiveNote() {
  return notes.find((note) => note.id === activeNoteId);
}

function setActiveNote(noteId) {
  activeNoteId = noteId;
  renderEditor();
  renderNoteList();
}

function updateActiveNote() {
  const note = getActiveNote();

  if (!note) {
    return;
  }

  // The browser becomes our notebook; each keystroke is saved locally.
  note.title = noteTitle.value.trim() || "Untitled note";
  note.body = noteBody.value;
  note.updatedAt = new Date().toISOString();
  notes = [note, ...notes.filter((item) => item.id !== note.id)];
  saveNotes();
  activeNoteId = note.id;
  renderNoteList();
  updateCounts();
  setStatus("Saved locally");
}

function renderEditor() {
  const note = getActiveNote();

  if (!note) {
    return;
  }

  noteTitle.value = note.title;
  noteBody.value = note.body;
  document.title = `${note.title || "Untitled note"} - Simple Notepad`;
  updateCounts();
  setStatus("Ready");
}

function renderNoteList() {
  // Build the list with DOM nodes instead of raw HTML so note text stays safe.
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredNotes = notes.filter((note) => {
    const haystack = `${note.title} ${note.body}`.toLowerCase();
    return haystack.includes(searchTerm);
  });

  noteList.innerHTML = "";

  if (filteredNotes.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.textContent = searchTerm ? "No notes match your search." : "No saved notes yet.";
    noteList.appendChild(emptyItem);
    return;
  }

  filteredNotes.forEach((note) => {
    const wrapper = document.createElement("li");
    const button = document.createElement("button");
    button.className = `note-item${note.id === activeNoteId ? " active" : ""}`;
    button.type = "button";

    const title = document.createElement("span");
    title.className = "note-item-title";
    title.textContent = note.title || "Untitled note";

    const meta = document.createElement("span");
    meta.className = "note-item-meta";
    meta.textContent = new Date(note.updatedAt).toLocaleString();

    button.append(title, meta);
    button.addEventListener("click", () => setActiveNote(note.id));
    wrapper.appendChild(button);
    noteList.appendChild(wrapper);
  });
}

function updateCounts() {
  const text = noteBody.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const characters = noteBody.value.length;
  countText.textContent = `${words} words | ${characters} characters`;
}

function setStatus(message) {
  statusText.textContent = message;
}

function createNewNote() {
  const note = createBlankNote();
  setActiveNote(note.id);
  noteBody.focus();
}

function deleteActiveNote() {
  const note = getActiveNote();

  if (!note) {
    return;
  }

  const shouldDelete = confirm(`Delete "${note.title}"?`);

  if (!shouldDelete) {
    return;
  }

  notes = notes.filter((item) => item.id !== note.id);
  activeNoteId = notes[0]?.id || createBlankNote().id;
  saveNotes();
  renderEditor();
  renderNoteList();
  setStatus("Note deleted");
}

function downloadActiveNote() {
  const note = getActiveNote();

  if (!note) {
    return;
  }

  const fileName = `${safeFileName(note.title)}.txt`;
  const blob = new Blob([note.body], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  setStatus(`Downloaded ${fileName}`);
}

function safeFileName(name) {
  return (name || "note").replace(/[<>:"/\\|?*]+/g, "-").slice(0, 80);
}

function openLocalFile(event) {
  // Opening a local file imports it as a new browser-saved note.
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const lowerName = file.name.toLowerCase();
  const isSupported = SUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));

  if (!isSupported) {
    alert(`Unsupported file type. Try: ${SUPPORTED_EXTENSIONS.join(", ")}`);
    fileInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const note = createBlankNote();
    note.title = file.name.replace(/\.[^/.]+$/, "") || "Imported note";
    note.body = String(reader.result || "");
    note.updatedAt = new Date().toISOString();
    saveNotes();
    setActiveNote(note.id);
    setStatus(`Opened ${file.name}`);
    fileInput.value = "";
  };

  reader.onerror = () => {
    setStatus("Could not open that file");
    fileInput.value = "";
  };

  reader.readAsText(file);
}

function applySettings() {
  // Clamp user-controlled values before applying them to the editor.
  const cleanSize = Number.parseInt(settings.fontSize, 10);
  settings.fontSize = Number.isFinite(cleanSize) ? Math.min(Math.max(cleanSize, 12), 48) : DEFAULT_SETTINGS.fontSize;
  settings.backgroundColor = /^#[0-9a-f]{6}$/i.test(settings.backgroundColor)
    ? settings.backgroundColor
    : DEFAULT_SETTINGS.backgroundColor;

  noteBody.style.fontFamily = settings.fontFamily;
  noteBody.style.fontSize = `${settings.fontSize}px`;
  document.documentElement.style.setProperty("--editor-bg", settings.backgroundColor);

  fontFamily.value = settings.fontFamily;
  fontSize.value = settings.fontSize;
  backgroundColor.value = settings.backgroundColor;
  saveSettings();
}

function updateFontSize(amount) {
  settings.fontSize = Math.min(Math.max(Number(fontSize.value || settings.fontSize) + amount, 12), 48);
  applySettings();
  setStatus(`Font size ${settings.fontSize}px`);
}

function resetAppearance() {
  settings = { ...DEFAULT_SETTINGS };
  applySettings();
  setStatus("Format reset");
}

function toggleSavedNotes(forceOpen) {
  // The pane is tucked away until the user opens it from File.
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : savedNotesPane.hidden;
  savedNotesPane.hidden = !shouldOpen;

  if (shouldOpen) {
    searchInput.focus();
  }
}

function closeMenus() {
  // Only one menu should be open at a time, and clicks outside close all menus.
  document.querySelectorAll(".menu-group.open").forEach((menuGroup) => {
    menuGroup.classList.remove("open");
    menuGroup.querySelector(".menu-button").setAttribute("aria-expanded", "false");
  });
}

function toggleMenu(button) {
  const menuGroup = button.closest(".menu-group");
  const wasOpen = menuGroup.classList.contains("open");

  closeMenus();

  if (!wasOpen) {
    menuGroup.classList.add("open");
    button.setAttribute("aria-expanded", "true");
  }
}

document.querySelector("#newNoteButton").addEventListener("click", createNewNote);
document.querySelector("#deleteButton").addEventListener("click", deleteActiveNote);
document.querySelector("#downloadButton").addEventListener("click", downloadActiveNote);
document.querySelector("#toggleNotesButton").addEventListener("click", () => toggleSavedNotes());
document.querySelector("#closeNotesButton").addEventListener("click", () => toggleSavedNotes(false));
document.querySelector("#fontSizeDown").addEventListener("click", () => updateFontSize(-1));
document.querySelector("#fontSizeUp").addEventListener("click", () => updateFontSize(1));
document.querySelector("#resetAppearanceButton").addEventListener("click", resetAppearance);

fileInput.addEventListener("change", openLocalFile);
searchInput.addEventListener("input", renderNoteList);
noteTitle.addEventListener("input", updateActiveNote);
noteBody.addEventListener("input", updateActiveNote);

fontFamily.addEventListener("change", () => {
  settings.fontFamily = fontFamily.value;
  applySettings();
  setStatus("Font changed");
});

fontSize.addEventListener("change", () => {
  settings.fontSize = fontSize.value;
  applySettings();
  setStatus(`Font size ${settings.fontSize}px`);
});

backgroundColor.addEventListener("input", () => {
  settings.backgroundColor = backgroundColor.value;
  applySettings();
  setStatus("Background changed");
});

document.querySelectorAll(".menu-button").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(button);
  });
});

document.querySelectorAll("#fileMenu .menu-item").forEach((item) => {
  item.addEventListener("click", closeMenus);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".menu-group")) {
    closeMenus();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenus();
  }
});

applySettings();
renderEditor();
renderNoteList();
