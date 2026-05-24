/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 *
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

import { franc } from 'franc';

/**
 * Detects the language of a given text string.
 * Returns an ISO 639-3 language code (e.g. 'eng', 'fra', 'deu'),
 * or 'und' if undetermined.
 */
export function detectLanguage(text: string): string {
    if (!text || text.trim().length < 20) {
        // franc needs at least ~20 chars to be reliable
        return 'und';
    }
    return franc(text);
}

/**
 * Checks whether a title's detected language is in the user's skip list.
 * @param title      The displayed (possibly translated) title text
 * @param skipLangs  Array of ISO 639-3 codes the user wants to skip, e.g. ['eng', 'fra']
 * @returns true if the title should be skipped (language matches a filter)
 */
export function isTitleInSkippedLanguage(title: string, skipLangs: string[]): boolean {
    if (!skipLangs || skipLangs.length === 0) return false;
    const detected = detectLanguage(title);
    if (detected === 'und') return false;
    return skipLangs.includes(detected);
}