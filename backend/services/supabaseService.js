const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

/**
 * Upload audio file to Supabase Storage
 * @param {string} filePath - Local file path
 * @param {string} fileName - Destination file name
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadAudioFile(filePath, fileName) {
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
        .from('audio-files')
        .upload(fileName, fileBuffer, {
            contentType: 'audio/mpeg',
            cacheControl: '3600',
            upsert: true // Overwrite if exists
        });

    if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

/**
 * Delete audio file from Supabase Storage
 * @param {string} fileName - File name to delete
 */
async function deleteAudioFile(fileName) {
    const { error } = await supabase.storage
        .from('audio-files')
        .remove([fileName]);

    if (error) {
        console.error('Failed to delete file:', error.message);
    }
}

/**
 * Check if file exists in storage
 * @param {string} fileName - File name to check
 * @returns {Promise<boolean>}
 */
async function fileExists(fileName) {
    const { data, error } = await supabase.storage
        .from('audio-files')
        .list('', {
            search: fileName
        });

    if (error) return false;
    return data && data.length > 0;
}

module.exports = {
    uploadAudioFile,
    deleteAudioFile,
    fileExists,
    supabase
};
