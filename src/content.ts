
chrome.storage.sync.get(["furiganaEnabled"], (result) => {
    const enabled = result.furiganaEnabled !== false;
    if(enabled) {
        initFurigana();
    }
});


chrome.storage.sync.get(["furiganaColor" , "furiganaFont", "furiganaSize"], (result) => {
    applyStyles(result.furiganaColor as string, result.furiganaFont as string, result.furiganaSize as string);
});


function initFurigana() {
    kuromoji.builder({ dicPath: chrome.runtime.getURL("dict/") }).build((err: any, tokenizer: any) => {
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


function getReadings(text: string) {
    if (!window.furiganaTokenizer) return [];
    const tokens = window.furiganaTokenizer.tokenize(text);
    return tokens.map((token: any) => ({
        surface: token.surface_form,
        reading: token.reading
    }));
}

function katakanaToHiragana(str: string) {
    return str.replace(/[\u30A1-\u30F6]/g, (char: string) =>
        String.fromCharCode(char.charCodeAt(0) - 0x60)
    );
}

function tokenToHTML(token: any) {
    const hasKanji = /[\u4E00-\u9FAF]/.test(token.surface_form);
    if (!hasKanji) return token.surface_form;

    const hiraganaReading = katakanaToHiragana(token.reading || token.surface_form);
    const { prefix, kanji, kanjiReading, suffix } = split0kurigana(token.surface_form, hiraganaReading);

    if(!kanji) return token.surface_form;
    return `${prefix}<ruby>${kanji}<rt>${kanjiReading}</rt></ruby>${suffix}`;
}

function split0kurigana(surface: string, hiraganaReading: string){
    let start = 0
    while (
        start < surface.length &&
        surface[start] === hiraganaReading[start] &&
        !/[\u4E00-\u9FAF]/.test(surface[start])
    ) {
        start++;    
    }
    let end = 0;
     while (
        end < (surface.length - start) &&
        surface[surface.length -1 - end] === hiraganaReading[hiraganaReading.length - 1 - end] &&
        !/[\u4E00-\u9FAF]/.test(surface[surface.length - 1 - end])
    ) {
        end++;
    }

    return {
        prefix: surface.slice(0, start),
        kanji: surface.slice(start, surface.length - end),
        kanjiReading: hiraganaReading.slice(start, hiraganaReading.length - end),
        suffix: surface.slice(surface.length - end)
    }; 
}


function addFurigana(text: string) {
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

    let node: Text | null;

    while ((node = walker.nextNode() as Text | null)){
        if (node.textContent && japaneseRegex.test(node.textContent)) {
            matches.push(node);
        }
    }

    return matches;
}

function applyFurigana() {
    const nodes = findJapaneseTextNodes();
    nodes.forEach(node => {
        if (!node.textContent) return;
        const html = addFurigana(node.textContent);
        const span = document.createElement("span");
        span.className = "furigana-span";
        span.dataset.original = node.textContent;
        span.innerHTML = html;
        node.replaceWith(span);
    });
}

let contentObserver: MutationObserver | undefined;

function watchForNewContent() {
    contentObserver = new MutationObserver(() => {
        contentObserver?.disconnect();
        applyFurigana();
        contentObserver?.observe(document.body, { childList: true, subtree: true });
    });

    contentObserver.observe(document.body, { childList: true, subtree: true });
}

function removeFurigana() {
    document.querySelectorAll<HTMLElement>(".furigana-span").forEach(span => {
        const textNode = document.createTextNode(span.dataset.original ?? "");
        span.replaceWith(textNode);
    });
}


function applyStyles(color?: string, font?: string, size?: string) {
    document.documentElement.style.setProperty("--furigana-color", color || "#555555");
    document.documentElement.style.setProperty("--furigana-font", font || "sans-serif");
    document.documentElement.style.setProperty("--furigana-size", (size || 14) + "px");
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

chrome.storage.onChanged.addListener((changes) => {
    if (!changes.furiganaColor && !changes.furiganaFont && !changes.furiganaSize) return;

    chrome.storage.sync.get(["furiganaColor", "furiganaFont", "furiganaSize"], (result) => {
            applyStyles(result.furiganaColor as string, result.furiganaFont as string, result.furiganaSize as string);
        });
});