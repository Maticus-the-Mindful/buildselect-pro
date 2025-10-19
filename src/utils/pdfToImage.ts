import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PdfPageImage {
  pageNumber: number;
  base64: string;
  width: number;
  height: number;
}

/**
 * Converts a PDF file to images (one per page)
 *
 * @param pdfUrl - URL or data URL of the PDF file
 * @param maxPages - Maximum number of pages to convert (default: 10)
 * @param scale - Resolution scale (default: 2 for high quality)
 * @returns Array of page images as base64 strings
 */
export async function convertPdfToImages(
  pdfUrl: string,
  maxPages: number = 10,
  scale: number = 2
): Promise<PdfPageImage[]> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;

    const numPages = Math.min(pdf.numPages, maxPages);
    const pageImages: PdfPageImage[] = [];

    // Convert each page to an image
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // Create canvas to render PDF page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render the page
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Convert canvas to base64 image
      const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];

      pageImages.push({
        pageNumber: pageNum,
        base64,
        width: viewport.width,
        height: viewport.height,
      });

      // Clean up
      page.cleanup();
    }

    return pageImages;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error('Failed to convert PDF to images: ' + (error as Error).message);
  }
}

/**
 * Fetches a PDF from a URL and converts it to images
 *
 * @param url - Public URL of the PDF file
 * @param maxPages - Maximum number of pages to convert
 * @returns Array of page images
 */
export async function fetchPdfAndConvert(
  url: string,
  maxPages: number = 10
): Promise<PdfPageImage[]> {
  try {
    // Fetch the PDF file
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);

    return await convertPdfToImages(dataUrl, maxPages);
  } catch (error) {
    console.error('Error fetching and converting PDF:', error);
    throw error;
  }
}

/**
 * Helper function to convert Blob to data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts an image file to base64
 *
 * @param imageUrl - URL of the image file
 * @returns Base64 encoded image
 */
export async function convertImageToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);

    // Remove data URL prefix to get just the base64 string
    return dataUrl.split(',')[1];
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}
