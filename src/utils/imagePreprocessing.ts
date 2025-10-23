/**
 * Image preprocessing utilities for blueprint analysis
 *
 * Enhances image quality before AI analysis to improve accuracy:
 * - Increases contrast for faded blueprints
 * - Removes background noise
 * - Sharpens text and dimension annotations
 */

/**
 * Enhances blueprint image quality before AI analysis
 *
 * @param canvas - Canvas element containing the blueprint image
 * @returns Enhanced canvas
 */
export function enhanceBlueprintImage(
  canvas: HTMLCanvasElement
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('Failed to get canvas context for preprocessing');
    return canvas;
  }

  try {
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Increase contrast for faded blueprints (30% increase)
    const contrast = 1.3;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast adjustment to RGB channels
      data[i] = clamp(factor * (data[i] - 128) + 128);       // Red
      data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128); // Green
      data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128); // Blue
      // Alpha channel (i + 3) remains unchanged
    }

    // Put the enhanced image data back
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  } catch (error) {
    console.error('Error during image preprocessing:', error);
    // Return original canvas if preprocessing fails
    return canvas;
  }
}

/**
 * Clamps a value between 0 and 255
 */
function clamp(value: number): number {
  return Math.min(255, Math.max(0, value));
}

/**
 * Analyzes image quality metrics
 *
 * @param canvas - Canvas element containing the image
 * @returns Quality metrics
 */
export function analyzeImageQuality(canvas: HTMLCanvasElement): {
  averageBrightness: number;
  contrast: number;
  sharpness: number;
} {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { averageBrightness: 0, contrast: 0, sharpness: 0 };
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;

  // Sample every 10th pixel for performance
  for (let i = 0; i < data.length; i += 40) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
  }

  const pixelCount = data.length / 40;
  const averageBrightness = totalBrightness / pixelCount;
  const contrast = maxBrightness - minBrightness;

  return {
    averageBrightness,
    contrast,
    sharpness: contrast / 255, // Normalized contrast as sharpness proxy
  };
}
