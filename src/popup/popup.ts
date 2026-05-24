/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

import { ExtensionSettings, Message, ToggleConfig } from "../types/types";
import { DEFAULT_SETTINGS } from "../config/constants";
import { sanitizeSettings } from "../utils/settings";
import { coreLog, coreErrorLog } from "../utils/logger";
import { isSafari } from "../utils/browser";
import { displayExtensionVersion, displayExtensionName } from "../utils/display";
import { getMessage, localizeDocument } from "../utils/i18n";


const titleToggle = document.getElementById('titleTranslation') as HTMLInputElement;
const originalThumbnailsToggle = document.getElementById('originalThumbnails') as HTMLInputElement;
const audioToggle = document.getElementById('audioTranslation') as HTMLInputElement;
const audioLanguageSelect = document.getElementById('audioLanguage') as HTMLSelectElement;
const descriptionToggle = document.getElementById('descriptionTranslation') as HTMLInputElement;
const subtitlesToggle = document.getElementById('subtitlesTranslation') as HTMLInputElement;
const subtitlesLanguageSelect = document.getElementById('subtitlesLanguage') as HTMLSelectElement;
const asrSubtitlesToggle = document.getElementById('asrSubtitlesEnabled') as HTMLInputElement;
const asrToggleContainer = document.getElementById('asrToggleContainer') as HTMLDivElement;
const youtubeDataApiToggle = document.getElementById('youtubeDataApiEnabled') as HTMLInputElement;
const youtubeDataApiKeyInput = document.getElementById('youtubeDataApiKey') as HTMLInputElement;
const youtubeApiKeyContainer = document.getElementById('youtubeApiKeyContainer') as HTMLDivElement;
const devLogToggle = document.getElementById('devLogEnabled') as HTMLInputElement;
const clearCacheBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement;

const titleLanguageFilterToggle = document.getElementById('titleLanguageFilterEnabled') as HTMLInputElement;
const titleLanguageFilterContainer = document.getElementById('titleLanguageFilterContainer') as HTMLDivElement;
const titleLanguageFilterChips = document.getElementById('titleLanguageFilterChips') as HTMLDivElement;
const titleLanguageFilterInput = document.getElementById('titleLanguageFilterInput') as HTMLInputElement;
const titleLanguageFilterSuggestions = document.getElementById('titleLanguageFilterSuggestions') as HTMLUListElement;

// Extra settings collapsible section - only exists in popup
const extraSettingsToggle = document.getElementById('extraSettingsToggle') as HTMLDivElement;
const extraSettingsContent = document.getElementById('extraSettingsContent') as HTMLDivElement;
const extraSettingsArrow = document.getElementById('extraSettingsArrow');

// Language filter chip UI elements
// Full language list (ISO 639-3 code → display name)
const LANGUAGE_OPTIONS: { code: string; name: string }[] = [
    { code: 'cmn', name: 'Mandarin Chinese' }, { code: 'spa', name: 'Spanish' },
    { code: 'eng', name: 'English' }, { code: 'rus', name: 'Russian' },
    { code: 'arb', name: 'Standard Arabic' }, { code: 'ben', name: 'Bengali' },
    { code: 'hin', name: 'Hindi' }, { code: 'por', name: 'Portuguese' },
    { code: 'ind', name: 'Indonesian' }, { code: 'jpn', name: 'Japanese' },
    { code: 'fra', name: 'French' }, { code: 'deu', name: 'German' },
    { code: 'jav', name: 'Javanese' }, { code: 'kor', name: 'Korean' },
    { code: 'tel', name: 'Telugu' }, { code: 'vie', name: 'Vietnamese' },
    { code: 'mar', name: 'Marathi' }, { code: 'ita', name: 'Italian' },
    { code: 'tam', name: 'Tamil' }, { code: 'tur', name: 'Turkish' },
    { code: 'urd', name: 'Urdu' }, { code: 'guj', name: 'Gujarati' },
    { code: 'pol', name: 'Polish' }, { code: 'ukr', name: 'Ukrainian' },
    { code: 'kan', name: 'Kannada' }, { code: 'mal', name: 'Malayalam' },
    { code: 'pes', name: 'Iranian Persian' }, { code: 'mya', name: 'Burmese' },
    { code: 'swh', name: 'Swahili' }, { code: 'ron', name: 'Romanian' },
    { code: 'nld', name: 'Dutch' }, { code: 'hrv', name: 'Croatian' },
    { code: 'tha', name: 'Thai' }, { code: 'ell', name: 'Modern Greek' },
    { code: 'ces', name: 'Czech' }, { code: 'bel', name: 'Belarusian' },
    { code: 'heb', name: 'Hebrew' }, { code: 'tgk', name: 'Tajik' },
    { code: 'cat', name: 'Catalan' }, { code: 'kat', name: 'Georgian' },
    { code: 'lao', name: 'Lao' }, { code: 'lit', name: 'Lithuanian' },
    { code: 'fin', name: 'Finnish' }, { code: 'slk', name: 'Slovak' },
    { code: 'dan', name: 'Danish' }, { code: 'nob', name: 'Norwegian Bokmål' },
    { code: 'nno', name: 'Norwegian Nynorsk' }, { code: 'swe', name: 'Swedish' },
    { code: 'bul', name: 'Bulgarian' }, { code: 'mkd', name: 'Macedonian' },
    { code: 'slv', name: 'Slovenian' }, { code: 'lvs', name: 'Standard Latvian' },
    { code: 'kaz', name: 'Kazakh' }, { code: 'hun', name: 'Hungarian' },
    { code: 'afr', name: 'Afrikaans' }, { code: 'sin', name: 'Sinhala' },
    { code: 'npi', name: 'Nepali' }, { code: 'tgl', name: 'Tagalog' },
    { code: 'ceb', name: 'Cebuano' }, { code: 'khm', name: 'Khmer' },
    { code: 'kin', name: 'Kinyarwanda' }, { code: 'zul', name: 'Zulu' },
    { code: 'som', name: 'Somali' }, { code: 'hau', name: 'Hausa' },
    { code: 'yor', name: 'Yoruba' }, { code: 'ibo', name: 'Igbo' },
    { code: 'amh', name: 'Amharic' }, { code: 'epo', name: 'Esperanto' },
    { code: 'glg', name: 'Galician' }, { code: 'ekk', name: 'Standard Estonian' },
    { code: 'pan', name: 'Panjabi' }, { code: 'bod', name: 'Tibetan' },
    { code: 'tat', name: 'Tatar' }, { code: 'xho', name: 'Xhosa' },
    { code: 'hye', name: 'Armenian' }, { code: 'tir', name: 'Tigrinya' },
    { code: 'wol', name: 'Wolof' }, { code: 'kir', name: 'Kirghiz' },
    { code: 'war', name: 'Waray' }, { code: 'min', name: 'Minangkabau' },
];

let currentFilterLanguages: string[] = [];

function renderFilterChips() {
    if (!titleLanguageFilterChips) return;
    titleLanguageFilterChips.innerHTML = '';
    currentFilterLanguages.forEach(code => {
        const lang = LANGUAGE_OPTIONS.find(l => l.code === code);
        const name = lang ? lang.name : code;
        const chip = document.createElement('span');
        chip.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-700 text-white text-xs font-medium';
        chip.textContent = name;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = '×';
        btn.className = 'ml-1 hover:text-red-300 font-bold leading-none';
        btn.addEventListener('click', () => {
            currentFilterLanguages = currentFilterLanguages.filter(c => c !== code);
            renderFilterChips();
            saveFilterLanguages();
        });
        chip.appendChild(btn);
        titleLanguageFilterChips.appendChild(chip);
    });
}

function addFilterLanguage(code: string) {
    if (!currentFilterLanguages.includes(code)) {
        currentFilterLanguages.push(code);
        renderFilterChips();
        saveFilterLanguages();
    }
    if (titleLanguageFilterInput) titleLanguageFilterInput.value = '';
    if (titleLanguageFilterSuggestions) titleLanguageFilterSuggestions.classList.add('hidden');
}

async function saveFilterLanguages() {
    try {
        const data = await browser.storage.local.get('settings');
        const settings = data.settings as ExtensionSettings;
        await browser.storage.local.set({
            settings: {
                ...settings,
                titleLanguageFilter: {
                    ...settings.titleLanguageFilter,
                    languages: currentFilterLanguages
                }
            }
        });
    } catch (error) {
        console.error('Failed to save titleLanguageFilter.languages:', error);
    }
}

function showSuggestions(query: string) {
    if (!titleLanguageFilterSuggestions) return;
    const q = query.toLowerCase();
    const matches = LANGUAGE_OPTIONS.filter(l =>
        (l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)) &&
        !currentFilterLanguages.includes(l.code)
    ).slice(0, 8);

    titleLanguageFilterSuggestions.innerHTML = '';
    if (matches.length === 0 || !q) {
        titleLanguageFilterSuggestions.classList.add('hidden');
        return;
    }
    matches.forEach(lang => {
        const li = document.createElement('li');
        li.className = 'px-3 py-1.5 hover:bg-gray-700 cursor-pointer';
        li.textContent = `${lang.name} (${lang.code})`;
        li.addEventListener('mousedown', (e) => {
            e.preventDefault();
            addFilterLanguage(lang.code);
        });
        titleLanguageFilterSuggestions.appendChild(li);
    });
    titleLanguageFilterSuggestions.classList.remove('hidden');
}

// Function to toggle extra settings section
function toggleExtraSettings() {
    if (!extraSettingsContent || !extraSettingsArrow) return;

    const isHidden = extraSettingsContent.classList.contains('hidden');
    if (isHidden) {
        extraSettingsContent.classList.remove('hidden');
        extraSettingsArrow.style.transform = 'rotate(180deg)';
        adjustTooltipPositions();
    } else {
        extraSettingsContent.classList.add('hidden');
        extraSettingsArrow.style.transform = 'rotate(0deg)';
    }
}

// Function to update ASR toggle visibility
function updateAsrToggleVisibility() {
    if (!asrToggleContainer) return;
    
    const subtitlesEnabled = subtitlesToggle.checked;
    const selectedLanguage = subtitlesLanguageSelect.value;
    const shouldShow = subtitlesEnabled && selectedLanguage !== 'disabled';
    
    asrToggleContainer.style.display = shouldShow ? 'block' : 'none';
}

// Initialize toggle states from storage
document.addEventListener('DOMContentLoaded', async () => {
    // Localize all static text
    localizeDocument();
    
    displayExtensionVersion();
    displayExtensionName();
    try {
        const data = await browser.storage.local.get('settings');
        
        let settings: ExtensionSettings;
        let needsUpdate = false;

        if (!data.settings) {
            // No settings at all, use complete defaults
            settings = DEFAULT_SETTINGS;
            needsUpdate = true;
            coreLog('No settings found, using defaults');
        } else {
            // Start with existing settings and sanitize them
            settings = { ...data.settings } as ExtensionSettings;
            
            const { added, removed, fixed } = sanitizeSettings(settings, DEFAULT_SETTINGS);
            const changes: string[] = [];
            if (added.length) changes.push(`added: ${added.join(', ')}`);
            if (removed.length) changes.push(`removed: ${removed.join(', ')}`);
            if (fixed.length) changes.push(`fixed types: ${fixed.join(', ')}`);
            
            if (changes.length > 0) {
                coreLog(`Settings sanitized: ${changes.join(' | ')}`);
                needsUpdate = true;
            }
        }

        // Save updated settings if any changes were made
        if (needsUpdate) {
            await browser.storage.local.set({ settings });
            coreLog('Updated settings saved to storage');
        }

        // Apply settings to UI elements
        titleToggle.checked = settings.titleTranslation;
        titleLanguageFilterToggle.checked = settings.titleLanguageFilter.enabled;
        // Restore selected languages as chips
        currentFilterLanguages = [...(settings.titleLanguageFilter.languages || [])];
        renderFilterChips();
        titleLanguageFilterContainer.style.display = settings.titleLanguageFilter.enabled ? 'block' : 'none';
        originalThumbnailsToggle.checked = settings.originalThumbnails.enabled;
        audioToggle.checked = settings.audioTranslation.enabled;
        audioLanguageSelect.value = settings.audioTranslation.language;
        descriptionToggle.checked = settings.descriptionTranslation;
        subtitlesToggle.checked = settings.subtitlesTranslation.enabled;
        subtitlesLanguageSelect.value = settings.subtitlesTranslation.language;
        asrSubtitlesToggle.checked = settings.subtitlesTranslation.asrEnabled;
        youtubeDataApiToggle.checked = settings.youtubeDataApi.enabled;
        youtubeDataApiKeyInput.value = settings.youtubeDataApi.apiKey;
        if (devLogToggle) devLogToggle.checked = settings.devLog ?? false;
        
        // Update ASR toggle visibility based on current settings
        updateAsrToggleVisibility();
        
        // Show/hide API key input based on toggle state
        if (youtubeDataApiToggle.checked && youtubeApiKeyContainer && youtubeApiKeyContainer.style.display !== undefined) {
            youtubeApiKeyContainer.style.display = 'block';
        }
        
        coreLog(
            'Settings loaded - Title translation prevention is: %c%s',
            settings.titleTranslation ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold',
            settings.titleTranslation ? 'ON' : 'OFF'
        );
        coreLog(
            'Settings loaded - Original thumbnails is: %c%s',
            settings.originalThumbnails.enabled ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold',
            settings.originalThumbnails.enabled ? 'ON' : 'OFF'
        );
        coreLog(
            'Settings loaded - Audio translation prevention is: %c%s',
            settings.audioTranslation.enabled ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold',
            settings.audioTranslation.enabled ? 'ON' : 'OFF'
        );
        coreLog(
            'Settings loaded - Description translation prevention is: %c%s',
            settings.descriptionTranslation ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold',
            settings.descriptionTranslation ? 'ON' : 'OFF'
        );
        coreLog(
            'Settings loaded - Subtitles translation prevention is: %c%s',
            settings.subtitlesTranslation.enabled ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold',
            settings.subtitlesTranslation.enabled ? 'ON' : 'OFF'
        );
    } catch (error) {
        coreErrorLog('Settings load error:', error);
    }
});

// Check if this is a welcome page (first install)
const urlParams = new URLSearchParams(window.location.search);
const isWelcome = urlParams.get('welcome') === 'true';

if (isWelcome) {
    const pageTitle = document.getElementById('pageTitle');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (pageTitle) {
        // Keep the image and change only the text part
        const imgElement = pageTitle.querySelector('img');
        const extensionName = browser.runtime.getManifest().name;
        
        if (imgElement) {
            pageTitle.innerHTML = '';
            pageTitle.appendChild(imgElement);
            pageTitle.appendChild(document.createTextNode(getMessage('settings_welcome_titleComplete', extensionName)));
        }
    }
    
    if (welcomeMessage) {
        welcomeMessage.classList.remove('hidden');
    }
}

// Handle extra settings toggle click - only if element exists
if (extraSettingsToggle) {
    extraSettingsToggle.addEventListener('click', toggleExtraSettings);
}


async function handleToggleChange(config: ToggleConfig) {
    const isEnabled = config.element.checked;
    try {
        const data = await browser.storage.local.get('settings');
        let settings = data.settings as ExtensionSettings;

        // Update property in settings object
        if (config.storagePath && config.storagePath.length > 0) {
            let obj: any = settings;
            for (let i = 0; i < config.storagePath.length - 1; i++) {
                obj = obj[config.storagePath[i] as keyof typeof obj];
            }
            obj[config.storagePath[config.storagePath.length - 1] as keyof typeof obj] = isEnabled;
        } else {
            (settings as any)[config.storageKey] = isEnabled;
        }

        await browser.storage.local.set({ settings });

        // Update UI if needed
        if (config.uiUpdate) config.uiUpdate();

        // Send message to content script (only if YouTube tab is active)
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id && tabs[0]?.url) {
                // Check if current tab is YouTube
                const isYouTubeTab = tabs[0].url.includes('youtube.com') || tabs[0].url.includes('youtube-nocookie.com');
                
                if (isYouTubeTab) {
                    await browser.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleTranslation',
                        feature: config.messageFeature,
                        isEnabled
                    });
                    coreLog(`Message sent to YouTube tab for ${config.messageFeature}`);
                } else {
                    coreLog(`Settings updated but not sending message (not a YouTube tab): ${tabs[0].url}`);
                }
            }
        } catch (messageError) {
            // Ignore message sending errors (content script might not be loaded)
            coreLog(`Could not send message to content script for ${config.messageFeature}:`, messageError);
        }
        coreLog(`${config.storageKey} state updated`);
    } catch (error) {
        coreErrorLog(`${config.storageKey} update error:`, error);
    }
}

// Utilisation pour chaque toggle :
titleToggle.addEventListener('change', () =>
    handleToggleChange({
        element: titleToggle,
        storageKey: 'titleTranslation',
        messageFeature: 'titles'
    })
);

titleLanguageFilterToggle.addEventListener('change', async () => {
    const enabled = titleLanguageFilterToggle.checked;
    titleLanguageFilterContainer.style.display = enabled ? 'block' : 'none';

    try {
        const data = await browser.storage.local.get('settings');
        const settings = data.settings as ExtensionSettings;
        await browser.storage.local.set({
            settings: {
                ...settings,
                titleLanguageFilter: {
                    ...settings.titleLanguageFilter,
                    enabled
                }
            }
        });
        console.log('[YNT] Title language filter enabled:', enabled);
    } catch (error) {
        console.error('Failed to save titleLanguageFilter.enabled:', error);
    }
});

if (titleLanguageFilterInput) {
    titleLanguageFilterInput.addEventListener('input', () => {
        showSuggestions(titleLanguageFilterInput.value);
    });
    titleLanguageFilterInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = titleLanguageFilterInput.value.toLowerCase();
            const match = LANGUAGE_OPTIONS.find(l =>
                (l.name.toLowerCase() === q || l.code.toLowerCase() === q) &&
                !currentFilterLanguages.includes(l.code)
            );
            if (match) addFilterLanguage(match.code);
        }
        if (e.key === 'Escape') {
            titleLanguageFilterSuggestions?.classList.add('hidden');
        }
    });
    titleLanguageFilterInput.addEventListener('blur', () => {
        setTimeout(() => titleLanguageFilterSuggestions?.classList.add('hidden'), 150);
    });
}

originalThumbnailsToggle.addEventListener('change', () =>
    handleToggleChange({
        element: originalThumbnailsToggle,
        storageKey: 'originalThumbnails',
        storagePath: ['originalThumbnails', 'enabled'],
        messageFeature: 'thumbnails'
    })
);

audioToggle.addEventListener('change', () =>
    handleToggleChange({
        element: audioToggle,
        storageKey: 'audioTranslation',
        storagePath: ['audioTranslation', 'enabled'],
        messageFeature: 'audio'
    })
);

descriptionToggle.addEventListener('change', () =>
    handleToggleChange({
        element: descriptionToggle,
        storageKey: 'descriptionTranslation',
        messageFeature: 'description'
    })
);

subtitlesToggle.addEventListener('change', () =>
    handleToggleChange({
        element: subtitlesToggle,
        storageKey: 'subtitlesTranslation',
        storagePath: ['subtitlesTranslation', 'enabled'],
        messageFeature: 'subtitles',
        uiUpdate: updateAsrToggleVisibility
    })
);

asrSubtitlesToggle.addEventListener('change', () =>
    handleToggleChange({
        element: asrSubtitlesToggle,
        storageKey: 'subtitlesTranslation',
        storagePath: ['subtitlesTranslation', 'asrEnabled'],
        messageFeature: 'asrSubtitles'
    })
);

// Handle YouTube Data API toggle change
youtubeDataApiToggle.addEventListener('change', () =>
    handleToggleChange({
        element: youtubeDataApiToggle,
        storageKey: 'youtubeDataApi',
        storagePath: ['youtubeDataApi', 'enabled'],
        messageFeature: 'youtubeDataApi',
        uiUpdate: () => {
            // Show/hide API key input only if container exists and has display style
            if (youtubeApiKeyContainer && youtubeApiKeyContainer.style.display !== undefined) {
                youtubeApiKeyContainer.style.display = youtubeDataApiToggle.checked ? 'block' : 'none';
            }
        }
    })
);

// Handle Dev Log toggle change
if (devLogToggle) {
    devLogToggle.addEventListener('change', () =>
        handleToggleChange({
            element: devLogToggle,
            storageKey: 'devLog',
            messageFeature: 'devLog'
        })
    );
}

// Handle subtitles language selection changes
subtitlesLanguageSelect.addEventListener('change', async () => {
    const selectedLanguage = subtitlesLanguageSelect.value;
    
    // Update ASR toggle visibility
    updateAsrToggleVisibility();
    
    // Save language preference
    try {
        const data = await browser.storage.local.get('settings');
        const settings = data.settings as ExtensionSettings;
        
        await browser.storage.local.set({
            settings: {
                ...settings,
                subtitlesTranslation: {
                    ...settings.subtitlesTranslation,
                    language: selectedLanguage
                }
            }
        });
        
        coreLog('Subtitles language saved:', selectedLanguage);
        
        // Inform active tab about the change (only if YouTube)
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id && tabs[0]?.url) {
                const isYouTubeTab = tabs[0].url.includes('youtube.com') || tabs[0].url.includes('youtube-nocookie.com');
                
                if (isYouTubeTab) {
                    await browser.tabs.sendMessage(tabs[0].id, {
                        feature: 'subtitlesLanguage',
                        language: selectedLanguage
                    });
                }
            }
        } catch (messageError) {
            coreLog('Could not send language change message:', messageError);
        }
    } catch (error) {
        coreErrorLog('Failed to save subtitles language:', error);
    }
});

// Handle audio language selection changes
audioLanguageSelect.addEventListener('change', async () => {
    const selectedLanguage = audioLanguageSelect.value;
    
    try {
        const data = await browser.storage.local.get('settings');
        const settings = data.settings as ExtensionSettings;
        
        await browser.storage.local.set({
            settings: {
                ...settings,
                audioTranslation: {
                    ...settings.audioTranslation,
                    language: selectedLanguage
                }
            }
        });
        
        coreLog('Audio language saved:', selectedLanguage);
        
        // Inform active tab about the change (only if YouTube)
        try {
            const tabs = await browser.tabs.query({ active: true, currentWindow: true });
            if (tabs[0]?.id && tabs[0]?.url) {
                const isYouTubeTab = tabs[0].url.includes('youtube.com') || tabs[0].url.includes('youtube-nocookie.com');
                
                if (isYouTubeTab) {
                    await browser.tabs.sendMessage(tabs[0].id, {
                        feature: 'audioLanguage',
                        language: selectedLanguage
                    });
                }
            }
        } catch (messageError) {
            coreLog('Could not send audio language change message:', messageError);
        }
    } catch (error) {
        coreErrorLog('Failed to save audio language:', error);
    }
});

// Adjust tooltip positions if they overflow the viewport
function adjustTooltipPositions() {
    const tooltipGroups = document.querySelectorAll('.tooltip') as NodeListOf<HTMLDivElement>;
    const bodyWidth = document.body.clientWidth;
    tooltipGroups.forEach((group) => {
        const tooltip = group.querySelector('span') as HTMLSpanElement;
        if (!tooltip) return;
        tooltip.style.marginLeft = ''; // Reset previous adjustment
        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > bodyWidth) {
            tooltip.style.marginLeft = `-${tooltipRect.right - bodyWidth + 20}px`;
        }
    });
}
adjustTooltipPositions();


// Handle YouTube Data API key changes
youtubeDataApiKeyInput.addEventListener('input', async () => {
    const apiKey = youtubeDataApiKeyInput.value.trim();
    
    try {
        const data = await browser.storage.local.get('settings');
        const settings = data.settings as ExtensionSettings;
        
        await browser.storage.local.set({
            settings: {
                ...settings,
                youtubeDataApi: {
                    ...settings.youtubeDataApi,
                    apiKey: apiKey
                }
            }
        });
        coreLog('YouTube Data API key saved');
    } catch (error) {
        coreErrorLog('YouTube Data API key save error:', error);
    }
});

// Handle cache clearing
clearCacheBtn.addEventListener('click', async () => {
    const originalText = clearCacheBtn.textContent;
    
    try {
        clearCacheBtn.disabled = true;
        clearCacheBtn.textContent = getMessage('popup_clearCache_clearing');
        
        // Clear both title and description caches
        await browser.storage.local.remove('ynt-cache');
        
        // Send message to content scripts to clear their in-memory caches
        try {
            const tabs = await browser.tabs.query({ 
                url: ["*://*.youtube.com/*", "*://*.youtube-nocookie.com/*"] 
            });
            
            let clearedTabs = 0;
            for (const tab of tabs) {
                if (tab.id) {
                    try {
                        await browser.tabs.sendMessage(tab.id, {
                            action: 'clearCache'
                        });
                        clearedTabs++;
                    } catch (messageError) {
                        // Ignore tabs where content script is not loaded
                        coreLog(`Could not send clear cache message to tab ${tab.id}`);
                    }
                }
            }
            
            clearCacheBtn.textContent = getMessage('popup_clearCache_clearedTabs', clearedTabs.toString());
            coreLog(`Cache cleared successfully. Notified ${clearedTabs} YouTube tabs.`);
        } catch (error) {
            clearCacheBtn.textContent = getMessage('popup_clearCache_cacheCleared');
            coreLog('Cache cleared from storage, but could not notify content scripts:', error);
        }
        
        // Reset button after 2 seconds
        setTimeout(() => {
            clearCacheBtn.textContent = originalText;
            clearCacheBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        coreErrorLog('Failed to clear cache:', error);
        clearCacheBtn.textContent = getMessage('popup_clearCache_error');
        clearCacheBtn.disabled = false;
        
        // Reset button after 2 seconds
        setTimeout(() => {
            clearCacheBtn.textContent = originalText;
        }, 2000);
    }
});

// Handle reload of all YouTube tabs from the welcome page
if (isWelcome) {
    const reloadBtn = document.getElementById('reloadYoutubeTabsBtn') as HTMLButtonElement | null;
    if (reloadBtn) {
        // Hide button on Safari (tabs.reload is not reliable)
        if (isSafari()) {
            reloadBtn.style.display = 'none';
        } else {
            reloadBtn.onclick = async () => {
                try {
                    const tabs = await browser.tabs.query({
                        url: [
                            "*://*.youtube.com/*",
                            "*://*.youtube-nocookie.com/*"
                        ]
                    });
                    let count = 0;
                    for (const tab of tabs) {
                        // Only reload tabs that are not discarded
                        if (tab.id && tab.discarded === false) {
                            await browser.tabs.reload(tab.id);
                            count++;
                        }
                    }
                    reloadBtn.textContent = getMessage('settings_welcome_reloadButton_done', count.toString());
                    reloadBtn.disabled = true;
                } catch (error) {
                    reloadBtn.textContent = getMessage('settings_welcome_reloadButton_error');
                    reloadBtn.disabled = true;
                    coreErrorLog("Failed to reload YouTube tabs:", error);
                }
            };
        }
    }
}

function setExtensionName() {
    const manifest = browser.runtime.getManifest();
    // Set all elements with id 'extensionName'
    document.querySelectorAll('#extensionName').forEach(el => {
        el.textContent = manifest.name;
    });
    // Set the <title>
    const titleEl = document.getElementById('extensionTitle');
    if (titleEl) {
        titleEl.textContent = manifest.name;
    }
}

document.addEventListener('DOMContentLoaded', setExtensionName);