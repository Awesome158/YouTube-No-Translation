/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

import { ExtensionSettings } from "../../types/types";
import { audioLog, audioErrorLog } from '../../utils/logger';
import { isMobileSite } from '../../utils/navigation';
import { isSafari } from "../../utils/browser";


// Update: returns a boolean indicating if audio translation is enabled
async function syncAudioLanguagePreference(): Promise<boolean> {
    try {
        const result = await browser.storage.local.get('settings');
        const settings = result.settings as ExtensionSettings;
        
        if (!settings?.audioTranslation?.enabled) {
            return false;
        }

        if (settings?.audioTranslation?.language) {
            localStorage.setItem('ynt-audioLanguage', settings.audioTranslation.language);
        }
        return true;
    } catch (error) {
        audioErrorLog('Error syncing audio language preference:', error);
        return false;
    }
}

export async function handleAudioTranslation() {   
    if (isMobileSite()) {
        return;
    }
    
    const isEnabled = await syncAudioLanguagePreference();
    if (!isEnabled) {
        return;
    }

    const url = browser.runtime.getURL('dist/content/scripts/audioScript.js');

    if (isSafari()) {
        const code = await (await fetch(url)).text();

        const script = document.createElement('script');
        script.textContent = code;

        (document.head || document.documentElement).appendChild(script);
        script.remove();
    } else {
        const script = document.createElement('script');
        script.src = url;
        (document.head || document.documentElement).appendChild(script);
    }
}

// Function to handle audio language selection
browser.runtime.onMessage.addListener((message: unknown) => {
    if (typeof message === 'object' && message !== null &&
        'feature' in message && message.feature === 'audioLanguage' &&
        'language' in message && typeof message.language === 'string') {
        
        audioLog(`Setting audio language preference to: ${message.language}`);
        localStorage.setItem('ynt-audioLanguage', message.language);
        
        // Reapply audio if a video is currently playing
        handleAudioTranslation();
    }
    return true;
});