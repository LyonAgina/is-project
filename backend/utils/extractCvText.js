const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// cvUrl is stored like "/uploads/16889123-cv.pdf" — convert to a real filesystem path
async function extractCvText(cvUrl) {
  if (!cvUrl) return '';

  const filename = cvUrl.replace(/^\/uploads\//, '');
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  if (!fs.existsSync(filePath)) {
    console.error('CV file not found on disk:', filePath);
    return '';
  }

  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text || '';
    }

    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }

    // Unsupported format (e.g. .doc, .png) — skip extraction rather than crash
    console.warn('Unsupported CV format for text extraction:', ext);
    return '';
  } catch (err) {
    console.error('Failed to extract CV text:', err);
    return '';
  }
}

module.exports = extractCvText;