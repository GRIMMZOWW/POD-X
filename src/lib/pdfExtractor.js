import * as pdfjsLib from 'pdfjs-dist';
import { cleanBookText } from './textCleaner';

// Set up the worker using the npm package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(file) {
    try {
        console.log('[PDF Extractor] Processing PDF:', file.name);

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        console.log('[PDF Extractor] PDF loaded, pages:', pdf.numPages);

        let fullText = '';

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');

            fullText += pageText + '\n\n';
        }

        console.log('[PDF Extractor] Raw text extracted, length:', fullText.length);

        // Clean the extracted text
        const cleanedText = cleanBookText(fullText);
        console.log('[PDF Extractor] Text cleaned, length:', cleanedText.length);

        return {
            text: cleanedText,
            numPages: pdf.numPages,
            title: file.name.replace('.pdf', ''),
            wordCount: cleanedText.split(/\s+/).length
        };
    } catch (error) {
        console.error('[PDF Extractor] Error:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * Extract text from TXT file
 */
export async function extractTextFromTXT(file) {
    try {
        console.log('[TXT Extractor] Reading TXT file:', file.name);

        const text = await file.text();

        return {
            text: text.trim(),
            numPages: Math.ceil(text.length / 3000), // Estimate pages
            title: file.name.replace('.txt', ''),
            wordCount: text.split(/\s+/).length
        };
    } catch (error) {
        console.error('[TXT Extractor] Error:', error);
        throw new Error(`Failed to read TXT file: ${error.message}`);
    }
}

/**
 * Detect chapters from text
 */
export function detectChapters(text) {
    const chapters = [];

    // Split by common chapter patterns
    const chapterRegex = /(?:^|\n)(?:Chapter|CHAPTER|Ch\.|CH\.)\s*(\d+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)[:\s\-]*(.*?)(?=\n(?:Chapter|CHAPTER|Ch\.|CH\.)\s*(?:\d+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)|$)/gis;

    let match;
    let chapterIndex = 0;
    let lastIndex = 0;

    while ((match = chapterRegex.exec(text)) !== null) {
        const chapterNumber = match[1];
        const chapterTitle = match[2] ? match[2].trim() : `Chapter ${chapterNumber}`;

        // Get text until next chapter
        const nextMatch = chapterRegex.exec(text);
        const endIndex = nextMatch ? nextMatch.index : text.length;
        chapterRegex.lastIndex = match.index + 1; // Reset for next iteration

        const chapterText = text.substring(match.index, endIndex).trim();

        chapters.push({
            index: chapterIndex++,
            title: chapterTitle || `Chapter ${chapterNumber}`,
            text: chapterText,
            startPosition: match.index
        });

        lastIndex = endIndex;
    }

    // Fallback: if no chapters detected, split by length
    if (chapters.length === 0) {
        console.log('[Chapter Detection] No chapters found, splitting by length');
        const words = text.split(/\s+/);
        const wordsPerChapter = 1000; // 1000 words per chunk to prevent TTS interruption

        const totalChunks = Math.ceil(words.length / wordsPerChapter);

        for (let i = 0; i < words.length; i += wordsPerChapter) {
            const chapterWords = words.slice(i, i + wordsPerChapter);
            const chunkNumber = Math.floor(i / wordsPerChapter) + 1;
            chapters.push({
                index: chapters.length,
                title: `Part ${chunkNumber} of ${totalChunks}`,
                text: chapterWords.join(' '),
                startPosition: i
            });
        }
    }

    console.log('[Chapter Detection] Detected', chapters.length, 'chapters');
    return chapters;
}

/**
 * Process book file (PDF or TXT)
 */
export async function processBookFile(file) {
    const fileExtension = file.name.toLowerCase().split('.').pop();

    let extractedData;

    if (fileExtension === 'pdf') {
        extractedData = await extractTextFromPDF(file);
    } else if (fileExtension === 'txt') {
        extractedData = await extractTextFromTXT(file);
    } else {
        throw new Error('Unsupported file format. Please upload PDF or TXT files.');
    }

    // Detect chapters
    const chapters = detectChapters(extractedData.text);

    return {
        title: extractedData.title,
        author: 'Unknown Author',
        chapters: chapters,
        totalPages: extractedData.numPages,
        wordCount: extractedData.wordCount,
        fileName: file.name,
        fileSize: file.size
    };
}
