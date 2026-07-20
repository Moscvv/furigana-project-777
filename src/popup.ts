const btn = document.getElementById("toggleBtn") as HTMLButtonElement;

function updateButton(enabled: boolean) {
    btn.textContent = enabled ? "Furigana: ON" : "Furigana : OFF";
}

chrome.storage.sync.get(["furiganaEnabled"], (result) => {
    const enabled = result.furiganaEnabled != false;
    updateButton(enabled);
});

btn.addEventListener("click", () => {
    chrome.storage.sync.get(["furiganaEnabled"], (result) => {
        const newState = !(result.furiganaEnabled !== false);
        chrome.storage.sync.set({ furiganaEnabled: newState});
        updateButton(newState);
    });
});