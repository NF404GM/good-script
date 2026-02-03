export const ScriptFormatter = {
    /**
     * Analyzes text and applies standard screenplay formatting classes
     */
    format: (content: string): string => {
        // Strip existing HTML tags to start fresh (or handling existing structure is too complex)
        // For MVP we work with the raw text content to apply structure
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const text = tempDiv.innerText;

        const lines = text.split('\n');
        let formattedHtml = '';

        // Regex Patterns
        const SLUG_REGEX = /^(INT\.|EXT\.|INT\/EXT|I\/E|EST\.)/i;
        const TRANSITION_REGEX = /^(CUT TO:|FADE IN:|FADE OUT:|DISSOLVE TO:)$/i;
        const PARENTHETICAL_REGEX = /^\(.*\)$/;

        let previousType = 'none';

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) {
                formattedHtml += '<p><br></p>';
                previousType = 'empty';
                return;
            }

            let type = 'action'; // Default

            // 1. Slugline
            if (SLUG_REGEX.test(trimmed)) {
                type = 'slug';
            }
            // 2. Transition
            else if (TRANSITION_REGEX.test(trimmed) || (trimmed === trimmed.toUpperCase() && trimmed.endsWith('TO:'))) {
                type = 'transition';
            }
            // 3. Parenthetical
            else if (PARENTHETICAL_REGEX.test(trimmed)) {
                type = 'parenthetical';
            }
            // 4. Character (Heuristic: All Caps, Short, Preceded by Empty or Action, NOT Slug/Transition)
            else if (
                trimmed === trimmed.toUpperCase() &&
                trimmed.length < 50 &&
                !trimmed.includes('?') && // Usually implies dialogue shouting
                previousType !== 'character' // Characters rarely talk to themselves in separate blocks immediately
            ) {
                type = 'character';
            }
            // 5. Dialogue (Heuristic: Follows Character or Parenthetical)
            else if (previousType === 'character' || previousType === 'parenthetical') {
                type = 'dialogue';
            }

            // Apply Class
            // We use inline styles for generic Tiptap support or specific classes if CSS modules exist.
            // Using generic classes 's-slug', 's-action' etc.
            formattedHtml += `<p class="s-${type}">${trimmed}</p>`;
            previousType = type;
        });

        return formattedHtml;
    }
};
