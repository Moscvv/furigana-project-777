declare const kuromoji: any;
type DictEntry = { r: string; m: string[] };

interface Window {
    furiganaTokenizer: any;
    getDictionary: () => Promise<Record<string, DictEntry[]>>;
}


