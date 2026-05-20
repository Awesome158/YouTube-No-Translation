/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

import { subtitlesLog, coreLog } from '../../utils/logger';
import { ExtensionSettings } from '../../types/types';
import { isSafari } from '../../utils/browser';


async function syncSubtitlesLanguagePreference(): Promise<boolean> {
    try {
        const result = await browser.storage.local.get('settings');
        const settings = result.settings as ExtensionSettings;

        if (!settings?.subtitlesTranslation?.enabled) {
            return false;
        }
        
        if (settings.subtitlesTranslation.language) {
            localStorage.setItem('ynt-subtitlesLanguage', settings.subtitlesTranslation.language);
        }
        const asrEnabled = settings.subtitlesTranslation.asrEnabled || false;
        localStorage.setItem('ynt-subtitlesAsrEnabled', asrEnabled.toString());

        return true;
    } catch (error) {
        subtitlesLog('Error syncing subtitle language preference:', error);
        return false;
    }
}

export async function handleSubtitlesTranslation() {
    const isEnabled = await syncSubtitlesLanguagePreference();
    if (!isEnabled) {
        return;
    }

    const url = browser.runtime.getURL('dist/content/scripts/subtitlesScript.js');

    if (isSafari()) {
        const code = await fetch(url).then(r => r.text());

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.textContent = code;

        document.documentElement.appendChild(script);
        script.remove();
        return;
    } else {
        const script = document.createElement('script');
        script.src = url;
        document.documentElement.appendChild(script);
    }
}

// Function to handle subtitle language selection
browser.runtime.onMessage.addListener((message: unknown) => {
    coreLog('Received message:', message); // Add debug log
    
    if (typeof message === 'object' && message !== null &&
        'feature' in message && typeof message.feature === 'string') {
        
        // Handle subtitle language changes
        if (message.feature === 'subtitlesLanguage' &&
            'language' in message && typeof message.language === 'string') {
            
            subtitlesLog(`Setting subtitle language preference to: ${message.language}`);
            localStorage.setItem('ynt-subtitlesLanguage', message.language);
            handleSubtitlesTranslation();
        }
        
        // Handle ASR subtitle setting changes
        if (message.feature === 'asrSubtitles' &&
            'isEnabled' in message && typeof message.isEnabled === 'boolean') {
            
            subtitlesLog(`Setting ASR subtitles enabled to: ${message.isEnabled}`);
            localStorage.setItem('ynt-subtitlesAsrEnabled', message.isEnabled.toString());
            handleSubtitlesTranslation();
        }
        
        // Handle general subtitles toggle changes
        if (message.feature === 'subtitles') {
            subtitlesLog('Subtitles setting changed, syncing preferences');
            syncSubtitlesLanguagePreference();
            handleSubtitlesTranslation();
        }
    }
    return true;
});