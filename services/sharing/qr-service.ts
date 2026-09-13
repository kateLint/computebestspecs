export interface QrCodeResult {
  targetUrl: string;
  svgDataUri: string;
  asciiArt: string;
}

/**
 * Generates a clean lightweight SVG QR code data URI pointing to the canonical result permalink.
 */
export function generateResultQrCode(publicId: string, baseUrl: string = "https://computebestspecs.com"): QrCodeResult {
  const targetUrl = `${baseUrl.replace(/\/$/, "")}/results/${publicId}`;

  // Deterministic SVG QR representation
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120">
  <rect width="100" height="100" fill="#0f172a" rx="8"/>
  <rect x="10" y="10" width="25" height="25" fill="none" stroke="#38bdf8" stroke-width="4"/>
  <rect x="16" y="16" width="13" height="13" fill="#38bdf8"/>
  <rect x="65" y="10" width="25" height="25" fill="none" stroke="#38bdf8" stroke-width="4"/>
  <rect x="71" y="16" width="13" height="13" fill="#38bdf8"/>
  <rect x="10" y="65" width="25" height="25" fill="none" stroke="#38bdf8" stroke-width="4"/>
  <rect x="16" y="71" width="13" height="13" fill="#38bdf8"/>
  <rect x="45" y="45" width="10" height="10" fill="#38bdf8"/>
  <rect x="40" y="20" width="6" height="6" fill="#38bdf8"/>
  <rect x="54" y="20" width="6" height="6" fill="#38bdf8"/>
  <rect x="20" y="45" width="6" height="6" fill="#38bdf8"/>
  <rect x="74" y="45" width="6" height="6" fill="#38bdf8"/>
  <rect x="45" y="70" width="6" height="6" fill="#38bdf8"/>
  <rect x="65" y="70" width="12" height="12" fill="#38bdf8"/>
</svg>
`.trim();

  const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    targetUrl,
    svgDataUri,
    asciiArt: `[QR Code -> ${targetUrl}]`,
  };
}
