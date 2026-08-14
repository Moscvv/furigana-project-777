const DICT_URL = "https://moscvv.github.io/oFuriganalegal/dictionaries/dict-common.json";
const STORAGE_KEY = "dict-common";

type DictData = Record<string, DictEntry[]>;

async function downloadDictionary(): Promise<DictData> {
    const response = await fetch(DICT_URL);
    const data : DictData = await response.json();
    await chrome.storage.local.set({ [STORAGE_KEY]: data });
    return data;
}

async function getDictionary(): Promise<DictData> {
    const cached = await chrome.storage.local.get(STORAGE_KEY);
    if (cached[STORAGE_KEY]) {
        return cached[STORAGE_KEY] as DictData;
    }
    return downloadDictionary();
}

window.getDictionary = getDictionary;