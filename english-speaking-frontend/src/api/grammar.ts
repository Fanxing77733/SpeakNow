import { request } from './client';

export interface Correction {
    originalText: string;
    correctedText: string;
    errorType: string;
    explanation: string;
}

export interface GrammarCheckResult {
    corrections: Correction[];
    resultId: string;
}

/** 语法纠错 */
export function checkGrammar(text: string, inputType: string = 'text'): Promise<GrammarCheckResult> {
    return request<GrammarCheckResult>({
        method: 'POST',
        url: '/grammar/check',
        data: { text, inputType },
    });
}

/** 收藏到错题本 */
export function saveBookmark(item: Correction): Promise<void> {
    return request<void>({
        method: 'POST',
        url: '/grammar/bookmark',
        data: item,
    });
}

/** 查看错题本 */
export function getBookmarks(errorType?: string): Promise<Correction[]> {
    return request<Correction[]>({
        method: 'GET',
        url: '/grammar/bookmarks',
        params: errorType ? { errorType } : undefined,
    });
}
