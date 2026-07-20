
function findJapaneseTextNodes(){
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const matches = [];

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
    );

    let node;

    while ((node = walker.nextNode())){
        if (japaneseRegex.test(node.textContent)) {
            matches.push(node);
        }
    }

    return matches;
}

const results = findJapaneseTextNodes();
console.log("Found", results.length, "Japanese text nodes");
