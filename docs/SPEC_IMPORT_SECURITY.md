# Specification Import Security

## 1. Zero Server Upload Boundary

- **Client-Side Only**: All image decoding, canvas manipulation, OCR execution, and regex text normalization run strictly in the user's browser runtime.
- **Zero Network Transmission**: Images and OCR text are never transmitted over the network to any third-party or first-party backend server.
- **No Third-Party CDNs**: OCR worker scripts and assets are bundled and self-hosted within the application bundle.

---

## 2. File Signature & Image Validation

Before any image processing begins, `validateAndSanitizeImageFile()` enforces:
1. **Magic Byte Signature Verification**:
   - PNG: `89 50 4E 47 0D 0A 1A 0A`
   - JPEG: `FF D8 FF`
   - WebP: `52 49 46 46 .... 57 45 42 50`
   - Non-matching files (e.g. renamed `.exe`, `.svg`, `.pdf`, `.zip`) are immediately rejected.
2. **File Size Limit**: Maximum $\le 8\text{ MB}$.
3. **Pixel Dimension Limit**: Maximum $\le 24\text{ Megapixels}$ ($24,000,000\text{ pixels}$) to prevent canvas decompression bombs.
4. **Metadata & EXIF Stripping**: Image is decoded onto an off-screen HTML5 Canvas and re-encoded via `toBlob('image/png')` to eliminate all GPS, camera, and device metadata.

---

## 3. Hostile Input Sanitization & Threat Modeling

Imported text (pasted or OCR-extracted) is treated as hostile untrusted input:
- **Prompt Injection Defense**: Explicit patterns like `ignore previous instructions`, `system prompt`, `you are an assistant` are neutralized before parsing.
- **XSS & Injection Protection**: HTML `<script>` tags, event handlers, and markdown links are rendered completely inert and never evaluated as HTML.
- **System Commands & URLs**: Shell commands (`curl`, `rm -rf`, `sudo`) and web URLs (`http://`, `https://`) are stripped or treated strictly as inert plain text strings.
- **Memory Safety**: Web Workers are cleanly terminated upon completion or cancellation. Object URLs created during processing are immediately revoked with `URL.revokeObjectURL()`.
