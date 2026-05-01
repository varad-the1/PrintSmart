import { PDFDocument } from 'pdf-lib';

export interface ProcessedFile {
  id: string;
  file: File;
  originalPageCount: number;
  addedBlankPage: boolean;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

/**
 * Processes a single PDF file according to the PrintSmart rule:
 * If page count is ODD -> add 1 blank page at the end.
 * Returns the modified PDF as a Uint8Array.
 */
export async function processPdf(file: File): Promise<{
  data: Uint8Array;
  originalPageCount: number;
  addedBlankPage: boolean;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pageCount = pdfDoc.getPageCount();
  const isOdd = pageCount % 2 !== 0;

  if (isOdd) {
    const lastPage = pdfDoc.getPage(pageCount - 1);
    const { width, height } = lastPage.getSize();
    pdfDoc.addPage([width, height]);
  }

  const pdfBytes = await pdfDoc.save();
  return {
    data: pdfBytes,
    originalPageCount: pageCount,
    addedBlankPage: isOdd,
  };
}

/**
 * Merges multiple PDF files into one.
 * files: Array of Uint8Arrays representing processed PDF files.
 */
export async function mergePdfs(files: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const fileBytes of files) {
    const pdfDoc = await PDFDocument.load(fileBytes);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}
