const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { uploadAudioFile } = require('./supabaseService');
const { cleanBookText } = require('../lib/textCleaner');

/**
 * Extract text from PDF file
 */
async function extractPDFText(filePath) {
    try {
        console.log('[Book Service] Extracting text from PDF:', filePath);

        const dataBuffer = fs.readFileSync(filePath);
        console.log('[Book Service] PDF file read, size:', dataBuffer.length, 'bytes');

        // Configure pdf-parse to handle PDFs with images
        const options = {
            max: 0, // Parse all pages
            version: 'default'
        };

        const data = await pdfParse(dataBuffer, options);

        console.log('[Book Service] PDF parsed successfully');
        console.log('[Book Service] Pages:', data.numpages);
        console.log('[Book Service] Raw text length:', data.text?.length || 0);

        // Check if text was actually extracted
        if (!data.text || data.text.trim().length === 0) {
            throw new Error('PDF contains no extractable text. This might be a scanned image or protected PDF. Try uploading a text-based PDF or TXT file instead.');
        }

        // Clean the extracted text
        const cleanedText = cleanBookText(data.text);
        console.log('[Book Service] Cleaned text length:', cleanedText.length);

        return {
            text: cleanedText,
            pages: data.numpages,
            info: data.info || {}
        };
    } catch (error) {
        console.error('[Book Service] PDF extraction error:', error.message);
        console.error('[Book Service] Error stack:', error.stack);

        if (error.message.includes('no extractable text')) {
            throw error; // Re-throw our custom error
        }

        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * Extract text from TXT file
 */
function extractTXTText(filePath) {
    try {
        console.log('[Book Service] Reading TXT file:', filePath);
        const text = fs.readFileSync(filePath, 'utf-8');
        return {
            text: text,
            pages: Math.ceil(text.length / 3000), // Estimate pages (3000 chars per page)
            info: {}
        };
    } catch (error) {
        console.error('[Book Service] TXT extraction error:', error);
        throw new Error('Failed to read TXT file');
    }
}

/**
 * Detect chapters from text
 */
function detectChapters(text) {
    const chapters = [];

    // Split by common chapter patterns
    const chapterRegex = /(?:^|\n)(?:Chapter|CHAPTER|Ch\.|CH\.)\s*(\d+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)[:\s\-]*(.*?)(?=\n(?:Chapter|CHAPTER|Ch\.|CH\.)\s*(?:\d+|[IVXLCDM]+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)|$)/gis;

    let match;
    let chapterIndex = 0;

    while ((match = chapterRegex.exec(text)) !== null) {
        const chapterNumber = match[1];
        const chapterTitle = match[2] ? match[2].trim() : `Chapter ${chapterNumber}`;
        const chapterText = match[0].trim();

        chapters.push({
            index: chapterIndex++,
            title: chapterTitle || `Chapter ${chapterNumber}`,
            text: chapterText,
            startPosition: match.index
        });
    }

    // Fallback: if no chapters detected, split by page breaks or every 1000 words
    if (chapters.length === 0) {
        console.log('[Book Service] No chapters detected, splitting by length');
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

    console.log(`[Book Service] Detected ${chapters.length} chapters`);
    return chapters;
}

/**
 * Process book file and extract metadata
 */
async function processBookFile(file) {
    console.log('[Book Service] Processing book:', file.originalname);
    console.log('[Book Service] File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('[Book Service] File path:', file.path);

    const fileExtension = path.extname(file.originalname).toLowerCase();
    console.log('[Book Service] File extension:', fileExtension);

    let extractedData;

    // Extract text based on file type
    if (fileExtension === '.pdf') {
        extractedData = await extractPDFText(file.path);
    } else if (fileExtension === '.txt') {
        extractedData = extractTXTText(file.path);
    } else {
        throw new Error('Unsupported file format. Please upload PDF or TXT files.');
    }

    // Detect chapters
    const chapters = detectChapters(extractedData.text);

    // Extract title from filename or PDF metadata
    const title = extractedData.info?.Title ||
        path.basename(file.originalname, fileExtension);

    const author = extractedData.info?.Author || 'Unknown Author';

    // Create book data object
    const bookData = {
        title: title,
        author: author,
        chapters: chapters,
        totalPages: extractedData.pages,
        wordCount: extractedData.text.split(/\s+/).length
    };

    // Save book data as JSON to Supabase
    const jsonFileName = `${Date.now()}-${file.originalname}.json`;
    const jsonPath = path.join(__dirname, '../temp', jsonFileName);

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(jsonPath, JSON.stringify(bookData, null, 2));

    // Upload JSON to Supabase
    const bookUrl = await uploadAudioFile(jsonPath, jsonFileName);

    // Clean up temp files
    try {
        fs.unlinkSync(file.path);
        fs.unlinkSync(jsonPath);
    } catch (e) {
        console.warn('[Book Service] Failed to delete temp files:', e.message);
    }

    // Generate cover URL using data URI (no external API calls)
    const titleText = title.length > 30 ? title.substring(0, 27) + '...' : title;
    const coverUrl = `data:image/svg+xml,${encodeURIComponent(`
        <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="#4A5568"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle" style="word-spacing: 100vw;">${titleText}</text>
        </svg>
    `)}`;

    const result = {
        title: title,
        author: author,
        bookUrl: bookUrl,
        coverUrl: coverUrl,
        totalPages: extractedData.pages,
        chapterCount: chapters.length,
        wordCount: bookData.wordCount,
        fileName: file.originalname,
        fileSize: file.size,
        type: 'book',
        source: 'upload'
    };

    console.log('[Book Service] Book processed successfully:', result.title);
    return result;
}

module.exports = {
    processBookFile,
    extractPDFText,
    extractTXTText,
    detectChapters
};
