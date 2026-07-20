
chrome.storage.sync.get(["furiganaEnabled"], (result) => {
    const enabled = result.furiganaEnabled !== false;
    if(enabled) {
        initFurigana();
    }
});

function initFurigana() {
    kuromoji.builder({ dicPath: chrome.runtime.getURL("dict/") }).build((err, tokenizer) => {
    if (err) {
        console.error("Failed to load kuromoji:", err);
        return;

    }
    console.log("Kuromoji tokenizer ready!");
    window.furiganaTokenizer = tokenizer;
    applyFurigana();
    watchForNewContent();
    });
}


function getReadings(text) {
    if (!window.furiganaTokenizer) return [];
    const tokens = window.furiganaTokenizer.tokenize(text);
    return tokens.map(token => ({
        surface: token.surface_form,
        reading: token.reading
    }));
}

function katakanaToHiragana(str) {
    return str.replace(/[\u30A1-\u30F6]/g, char =>
        String.fromCharCode(char.charCodeAt(0) - 0x60)
    );
}

function tokenToHTML(token) {
    const hasKanji = /[\u4E00-\u9FAF]/.test(token.surface_form);
    if (!hasKanji) return token.surface_form;

    const hiraganaReading = katakanaToHiragana(token.reading || token.surface_form);
    return `<ruby>${token.surface_form}<rt>${hiraganaReading}</rt></ruby>`;
}

function addFurigana(text) {
    const tokens = window.furiganaTokenizer.tokenize(text);
    return tokens.map(tokenToHTML).join("");
}

function findJapaneseTextNodes(){
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const matches = [];

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const tag = node.parentElement?.tagName;
                if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") {
                    return NodeFilter.FILTER_REJECT;
                }
                if (node.parentElement?.closest("ruby")) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }    
    );

    let node;

    while ((node = walker.nextNode())){
        if (japaneseRegex.test(node.textContent)) {
            matches.push(node);
        }
    }

    return matches;
}

function applyFurigana() {
    const nodes = findJapaneseTextNodes();
    nodes.forEach(node => {
        const html = addFurigana(node.textContent);
        const span = document.createElement("span");
        span.className = "furigana-span";
        span.dataset.original = node.textContent;
        span.innerHTML = html;
        node.replaceWith(span);
    });
}

let contentObserver;

function watchForNewContent() {
    contentObserver = new MutationObserver(() => {
        contentObserver.disconnect();
        applyFurigana();
        contentObserver.observe(document.body, { childList: true, subtree: true });
    });

    contentObserver.observe(document.body, { childList: true, subtree: true });
}

function removeFurigana() {
    document.querySelectorAll(".furigana-span").forEach(span => {
        const textNode = document.createTextNode(span.dataset.original);
        span.replaceWith(textNode);
    });
}

chrome.storage.onChanged.addListener((changes) => {
    if (!changes.furiganaEnabled) return;

    const enabled = changes.furiganaEnabled.newValue;
    if (enabled) {
        if (window.furiganaTokenizer) {
            applyFurigana();
            watchForNewContent();
        } else {
            initFurigana();
        }
    } else {
        removeFurigana();
        if (contentObserver) contentObserver.disconnect();
    }
});