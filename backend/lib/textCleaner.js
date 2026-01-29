/**
 * Text Cleaning Pipeline for PDF Extraction
 * Removes OCR artifacts, headers, footers, page numbers, and other unwanted text
 */

/**
 * Clean extracted book text
 */
function cleanBookText(rawText) {
    let cleaned = rawText;

    // 1. Remove OCR artifacts and special symbols
    cleaned = cleaned.replace(/[©®™§¶†‡•·]/g, ''); // Special symbols
    cleaned = cleaned.replace(/\b[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]\b/g, ''); // Single letter sequences
    cleaned = cleaned.replace(/[_@#$%^&*(){}\[\]|\\/<>~`+=]/g, ' '); // Random symbols

    // 2. Remove page numbers (standalone numbers on their own lines)
    cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');
    cleaned = cleaned.replace(/\bPage\s+\d+\b/gi, ''); // "Page 23"

    // 3. Filter lines to remove common headers/footers
    const lines = cleaned.split('\n');
    const filteredLines = lines.filter(line => {
        const lower = line.toLowerCase().trim();
        const trimmed = line.trim();

        // Skip if matches these patterns
        if (lower.includes('copyright')) return false;
        if (lower.includes('all rights reserved')) return false;
        if (lower.includes('printed in')) return false;
        if (lower.includes('published by')) return false;
        if (lower.includes('table of contents') && trimmed.length < 50) return false;
        if (lower === 'contents') return false;
        if (lower.includes('isbn')) return false;
        if (lower.includes('www.') || lower.includes('http')) return false;

        // Remove TOC-style chapter lines (short lines with just chapter numbers)
        if (lower.match(/^chapter\s+[ivx\d]+$/i) && trimmed.length < 20) return false;

        // Remove running headers (repeated book/chapter titles)
        if (lower.includes('sherlock holmes') && trimmed.length < 40) return false;
        if (lower.includes('adventures of') && trimmed.length < 40) return false;

        // Remove lines that are just numbers
        if (trimmed.match(/^\d+$/)) return false;

        // Remove very short lines (likely artifacts)
        if (trimmed.length < 3) return false;

        return true;
    });

    cleaned = filteredLines.join('\n');

    // 4. Try to find where actual story starts
    // Look for common story opening patterns
    const storyStartPatterns = [
        /CHAPTER\s+I\b/i,
        /CHAPTER\s+1\b/i,
        /Chapter\s+One\b/i,
        /^I\./m, // "I." at start of line (common in first-person)
        /Once upon/i,
        /It was/i,
        /In the year/i,
        /To Sherlock Holmes/i // Specific to Sherlock stories
    ];

    for (const pattern of storyStartPatterns) {
        const match = cleaned.match(pattern);
        if (match && match.index > 500) {
            // Only cut if there's substantial text before (likely front matter)
            cleaned = cleaned.slice(match.index);
            break;
        }
    }

    // 5. Fix spacing and formatting
    cleaned = cleaned.replace(/\s+/g, ' '); // Multiple spaces to one
    cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Multiple newlines to double newline
    cleaned = cleaned.replace(/([.!?])\s*([A-Z])/g, '$1 $2'); // Ensure space after sentence

    return cleaned.trim();
}

module.exports = {
    cleanBookText
};
