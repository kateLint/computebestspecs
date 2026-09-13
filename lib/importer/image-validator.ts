/**
 * Client-Side Image Validation & Magic Byte Security Verification
 * Enforces file signature validation, size limits (<= 8MB), dimension limits (<= 24MP),
 * and canvas metadata stripping. Zero server uploads.
 */

export interface ImageValidationResult {
  valid: boolean;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  error?: string;
  sanitizedCanvas?: HTMLCanvasElement;
}

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_TOTAL_PIXELS = 24_000_000;         // 24 Megapixels

/**
 * Validates magic file signatures (file headers) to prevent polyglot or disguised files.
 */
export async function validateImageFileSignature(file: File): Promise<{ isValid: boolean; format?: "png" | "jpeg" | "webp"; error?: string }> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum 8 MB limit.`,
    };
  }

  // Read first 16 bytes for magic signature check
  const slice = file.slice(0, 16);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { isValid: true, format: "png" };
  }

  // 2. JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { isValid: true, format: "jpeg" };
  }

  // 3. WebP: RIFF (52 49 46 46) .... WEBP (57 45 42 50)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { isValid: true, format: "webp" };
  }

  return {
    isValid: false,
    error: "Invalid file signature. Only authentic PNG, JPEG, and WebP images are supported.",
  };
}

/**
 * Loads, validates dimensions, and strips EXIF metadata by re-encoding through a clean HTML5 Canvas.
 */
export async function sanitizeAndDecodeImage(file: File): Promise<ImageValidationResult> {
  const sigCheck = await validateImageFileSignature(file);
  if (!sigCheck.isValid) {
    return {
      valid: false,
      sizeBytes: file.size,
      error: sigCheck.error || "File signature verification failed.",
    };
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const totalPixels = width * height;

      if (totalPixels > MAX_TOTAL_PIXELS) {
        resolve({
          valid: false,
          sizeBytes: file.size,
          width,
          height,
          error: `Image resolution (${width}x${height} = ${(totalPixels / 1_000_000).toFixed(1)} MP) exceeds maximum 24 MP limit.`,
        });
        return;
      }

      if (width < 50 || height < 50) {
        resolve({
          valid: false,
          sizeBytes: file.size,
          width,
          height,
          error: "Image is too small to contain readable specification text.",
        });
        return;
      }

      // Draw onto isolated canvas to sanitize EXIF and obtain raw ImageData
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({
          valid: false,
          sizeBytes: file.size,
          error: "Unable to initialize browser 2D rendering canvas.",
        });
        return;
      }

      ctx.drawImage(img, 0, 0);

      resolve({
        valid: true,
        sizeBytes: file.size,
        mimeType: `image/${sigCheck.format}`,
        width,
        height,
        sanitizedCanvas: canvas,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        sizeBytes: file.size,
        error: "Image decoding failed. File may be corrupted or malformed.",
      });
    };

    img.src = objectUrl;
  });
}

/**
 * Validates, strips metadata, and returns a clean sanitized Blob.
 */
export async function validateAndSanitizeImageFile(file: File): Promise<{
  valid: boolean;
  cleanBlob: Blob;
  width: number;
  height: number;
}> {
  const result = await sanitizeAndDecodeImage(file);
  if (!result.valid || !result.sanitizedCanvas) {
    throw new Error(result.error || "Image validation failed.");
  }
  const cleanBlob = await new Promise<Blob>((resolve, reject) => {
    result.sanitizedCanvas!.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to export sanitized canvas image"));
    }, "image/png");
  });
  return {
    valid: true,
    cleanBlob,
    width: result.width || 0,
    height: result.height || 0,
  };
}
