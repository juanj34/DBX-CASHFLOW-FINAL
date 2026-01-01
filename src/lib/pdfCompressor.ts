import { PDFDocument } from 'pdf-lib';

const MAX_PAGES = 10;
const TARGET_SIZE_MB = 15;

export interface CompressionResult {
  compressedBlob: Blob;
  originalSize: number;
  compressedSize: number;
  pageCount: number;
  pagesExtracted: number;
}

export async function compressPdf(
  file: File,
  onProgress?: (stage: string, percent: number) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  
  onProgress?.('Leyendo PDF...', 10);
  
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  
  const pageCount = pdfDoc.getPageCount();
  onProgress?.('Procesando páginas...', 30);
  
  // Create a new document with only the first N pages
  const newPdfDoc = await PDFDocument.create();
  const pagesToExtract = Math.min(pageCount, MAX_PAGES);
  
  for (let i = 0; i < pagesToExtract; i++) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(copiedPage);
    onProgress?.(`Extrayendo página ${i + 1}/${pagesToExtract}...`, 30 + (i / pagesToExtract) * 50);
  }
  
  onProgress?.('Comprimiendo...', 85);
  
  // Save with compression options
  const compressedBytes = await newPdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });
  
  onProgress?.('Completado', 100);
  
  // Convert to Blob safely
  const compressedBlob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' });
  
  return {
    compressedBlob,
    originalSize,
    compressedSize: compressedBlob.size,
    pageCount,
    pagesExtracted: pagesToExtract,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function shouldCompress(file: File): boolean {
  // Compress if PDF is larger than 10MB
  return file.type === 'application/pdf' && file.size > 10 * 1024 * 1024;
}
