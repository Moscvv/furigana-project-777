const toggle = document.getElementById("toggleBtn") as HTMLInputElement;
const statusEl = document.getElementById("statusText") as HTMLDivElement;

function updateUI(enabled: boolean) {
    toggle.checked = enabled;
    statusEl.textContent = enabled ? "Furigana: ON" : "Furigana : OFF";
}

chrome.storage.sync.get(["furiganaEnabled"], (result) => {
    const enabled = result.furiganaEnabled != false;
    updateUI(enabled);
});

toggle.addEventListener("change", () => {
    const newState = toggle.checked;
    chrome.storage.sync.set({ furiganaEnabled : newState});
    updateUI(newState);
});    