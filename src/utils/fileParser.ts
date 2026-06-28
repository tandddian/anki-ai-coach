export async function parsePDF(buffer: Uint8Array): Promise<string> {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF parsing error:', error);
    return extractTextFromBuffer(buffer);
  }
}

export async function parseDOCX(buffer: Uint8Array): Promise<string> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('DOCX parsing error:', error);
    return '';
  }
}

export async function parsePPTX(buffer: Uint8Array): Promise<string> {
  try {
    const JSZip = require('docx4js');
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
      .sort();
    const texts: string[] = [];
    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('text');
      const textMatches = content.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
      for (const match of textMatches) {
        const text = match.replace(/<[^>]+>/g, '').trim();
        if (text) texts.push(text);
      }
    }
    return texts.join('\n');
  } catch (error) {
    console.error('PPTX parsing error:', error);
    return '';
  }
}

export async function parseMD(content: string): Promise<string> {
  return content;
}

export async function parseAnkiFile(content: string): Promise<string> {
  try {
    const lines = content.split('\n');
    const texts: string[] = [];
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        texts.push(`Q: ${parts[0].trim()}`);
        texts.push(`A: ${parts[1].trim()}`);
      } else if (parts.length === 1 && parts[0].trim()) {
        texts.push(parts[0].trim());
      }
    }
    return texts.join('\n');
  } catch (error) {
    console.error('Anki file parsing error:', error);
    return content;
  }
}

export async function parseFile(filePath: string, buffer: Uint8Array, fileType: string): Promise<{ text: string; type: string }> {
  const extension = getFileExtension(filePath).toLowerCase();
  const decoder = new TextDecoder();
  switch (extension) {
    case 'pdf': return { text: await parsePDF(buffer), type: 'pdf' };
    case 'docx': return { text: await parseDOCX(buffer), type: 'docx' };
    case 'pptx': return { text: await parsePPTX(buffer), type: 'pptx' };
    case 'md': case 'markdown': return { text: await parseMD(decoder.decode(buffer)), type: 'md' };
    case 'apkg': case 'csv': case 'tsv': case 'txt': return { text: await parseAnkiFile(decoder.decode(buffer)), type: 'anki' };
    default:
      try { return { text: decoder.decode(buffer), type: 'md' }; }
      catch { return { text: '', type: 'unknown' }; }
  }
}

function extractTextFromBuffer(buffer: Uint8Array): string {
  try {
    const decoder = new TextDecoder();
    const text = decoder.decode(buffer);
    const readableParts: string[] = [];
    const textMatcher = /[\x20-\x7E\u00A0-\uFFFF]{10,}/g;
    let match;
    while ((match = textMatcher.exec(text)) !== null) {
      readableParts.push(match[0]);
    }
    return readableParts.join('\n');
  } catch {
    return '';
  }
}

function getFileExtension(filePath: string): string {
  const parts = filePath.split('.');
  return parts[parts.length - 1] || '';
}
