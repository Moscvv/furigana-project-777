"use strict";
const toggle = document.getElementById("toggleBtn");
const statusEl = document.getElementById("statusText");
function updateUI(enabled) {
    toggle.checked = enabled;
    statusEl.textContent = enabled ? "Furigana: ON" : "Furigana : OFF";
}
chrome.storage.sync.get(["furiganaEnabled"], (result) => {
    const enabled = result.furiganaEnabled != false;
    updateUI(enabled);
});
toggle.addEventListener("change", () => {
    const newState = toggle.checked;
    chrome.storage.sync.set({ furiganaEnabled: newState });
    updateUI(newState);
});
