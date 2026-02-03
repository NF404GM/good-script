export interface ScriptStats {
    totalWords: number;
    dialogueWords: number;
    actionWords: number;
    characterStats: Record<string, {
        words: number;
        percentage: number;
        lines: number;
    }>;
    readability: {
        score: number;
        level: string;
    };
    pacing: {
        sceneDensity: number[]; // Words per scene
        averageWordsPerScene: number;
    };
}

export const analyzeScript = (html: string): ScriptStats => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const paragraphs = Array.from(doc.querySelectorAll('p'));

    let totalWords = 0;
    let dialogueWords = 0;
    let actionWords = 0;
    const characterStats: Record<string, { words: number; percentage: number; lines: number }> = {};
    const sceneDensity: number[] = [];

    let currentCharacter: string | null = null;
    let currentSceneWords = 0;
    let totalSentences = 0;
    let totalSyllables = 0;

    paragraphs.forEach((p) => {
        const text = p.textContent?.trim() || '';
        if (!text) return;

        const words = text.split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        totalWords += wordCount;

        // Syllable heuristic (approximate: count vowels)
        words.forEach(word => {
            const syllables = word.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]{1,2}/g)?.length || 1;
            totalSyllables += syllables;
        });

        // Sentence count (approximate)
        totalSentences += (text.match(/[.!?]+/g) || []).length || 1;

        if (p.classList.contains('s-slug')) {
            if (currentSceneWords > 0) sceneDensity.push(currentSceneWords);
            currentSceneWords = 0;
        }

        if (p.classList.contains('s-character')) {
            currentCharacter = text.toUpperCase().replace(/\(.*\)/, '').trim();
            if (!characterStats[currentCharacter]) {
                characterStats[currentCharacter] = { words: 0, percentage: 0, lines: 0 };
            }
        } else if (p.classList.contains('s-dialogue')) {
            dialogueWords += wordCount;
            currentSceneWords += wordCount;
            if (currentCharacter) {
                characterStats[currentCharacter].words += wordCount;
                characterStats[currentCharacter].lines += 1;
            }
        } else if (p.classList.contains('s-action')) {
            actionWords += wordCount;
            currentSceneWords += wordCount;
        } else {
            currentSceneWords += wordCount;
        }
    });

    if (currentSceneWords > 0) sceneDensity.push(currentSceneWords);

    // Calculate Percentages
    Object.keys(characterStats).forEach(name => {
        characterStats[name].percentage = dialogueWords > 0
            ? Math.round((characterStats[name].words / dialogueWords) * 100)
            : 0;
    });

    // Flesch Reading Ease
    // 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
    let readabilityScore = 0;
    if (totalWords > 0 && totalSentences > 0) {
        readabilityScore = 206.835 - 1.015 * (totalWords / totalSentences) - 84.6 * (totalSyllables / totalWords);
    }

    let readabilityLevel = 'Calculated';
    if (readabilityScore > 90) readabilityLevel = '5th Grade (Very Easy)';
    else if (readabilityScore > 80) readabilityLevel = '6th Grade (Easy)';
    else if (readabilityScore > 70) readabilityLevel = '7th Grade (Fairly Easy)';
    else if (readabilityScore > 60) readabilityLevel = '8th-9th Grade (Standard)';
    else if (readabilityScore > 50) readabilityLevel = '10th-12th Grade (Fairly Difficult)';
    else if (readabilityScore > 30) readabilityLevel = 'College (Difficult)';
    else readabilityLevel = 'College Grad (Very Difficult)';

    return {
        totalWords,
        dialogueWords,
        actionWords,
        characterStats,
        readability: {
            score: Math.max(0, Math.min(100, Math.round(readabilityScore))),
            level: readabilityLevel
        },
        pacing: {
            sceneDensity,
            averageWordsPerScene: sceneDensity.length > 0
                ? Math.round(sceneDensity.reduce((a, b) => a + b, 0) / sceneDensity.length)
                : 0
        }
    };
};
