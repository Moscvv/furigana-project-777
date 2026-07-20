"use strict";
const btn = document.getElementById("toggleBtn");
function updateButton(enabled) {
    btn.textContent = enabled ? "Furigana: ON" : "Furigana : OFF";
}
chrome.storage.sync.get(["furiganaEnabled"], (result) => {
    const enabled = result.furiganaEnabled != false;
    updateButton(enabled);
});
btn.addEventListener("click", () => {
    chrome.storage.sync.get(["furiganaEnabled"], (result) => {
        const newState = !(result.furiganaEnabled !== false);
        chrome.storage.sync.set({ furiganaEnabled: newState });
        updateButton(newState);
    });
});
