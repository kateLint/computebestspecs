/**
 * Ambiguity-Aware Hardware Resolver
 * Classifies raw user hardware input into EXACT matches, AMBIGUOUS candidates
 * (requiring user disambiguation), PARSED_GENERIC fallback, or UNKNOWN.
 * Prevents silent mispredictions (e.g. coercing "RTX 4070" blindly into desktop).
 */

export interface DisambiguationOption {
  id: string;
  displayName: string;
  formFactor: 'DESKTOP' | 'LAPTOP' | 'INTEGRATED' | 'WORKSTATION';
  vramGib?: number;
  cores?: number;
  tdpWatts?: number;
  confidenceScore: number;
  specDifferencesSummary: string;
}

export type HardwareResolutionStatus = 'EXACT' | 'AMBIGUOUS' | 'PARSED_GENERIC' | 'UNKNOWN';

export interface HardwareResolutionResult {
  rawQuery: string;
  status: HardwareResolutionStatus;
  canonicalId?: string;
  normalizedName?: string;
  candidateOptions?: DisambiguationOption[];
  disambiguationPrompt?: string;
  parsedSpecs?: {
    cores?: number;
    ramGib?: number;
    vramGib?: number;
    isDiscrete?: boolean;
    architecture?: 'X86_64' | 'ARM64';
  };
  confidence: number; // 0.0 - 1.0
  reasoning: string;
}

/**
 * Knowledge base of known ambiguous hardware families and their exact canonical variants
 */
const AMBIGUOUS_HARDWARE_FAMILIES: Array<{
  pattern: RegExp;
  familyName: string;
  disambiguationPrompt: string;
  variants: DisambiguationOption[];
}> = [
  {
    pattern: /\brtx\s*4070\b(?!.*(ti|super|laptop|mobile))/i,
    familyName: 'NVIDIA GeForce RTX 4070',
    disambiguationPrompt: 'We found multiple RTX 4070 variants. Are you using the Desktop 12GB, Laptop 8GB, or Super edition?',
    variants: [
      {
        id: 'nvidia-rtx-4070-desktop',
        displayName: 'NVIDIA GeForce RTX 4070 (Desktop, 12GB VRAM)',
        formFactor: 'DESKTOP',
        vramGib: 12,
        tdpWatts: 200,
        confidenceScore: 0.95,
        specDifferencesSummary: 'Desktop full AD104 GPU with 12GB GDDR6X VRAM and 200W TDP.'
      },
      {
        id: 'nvidia-rtx-4070-laptop',
        displayName: 'NVIDIA GeForce RTX 4070 Laptop GPU (8GB VRAM)',
        formFactor: 'LAPTOP',
        vramGib: 8,
        tdpWatts: 105,
        confidenceScore: 0.90,
        specDifferencesSummary: 'Laptop mobile AD106 GPU with 8GB GDDR6 VRAM and lower 105W TDP.'
      },
      {
        id: 'nvidia-rtx-4070-super',
        displayName: 'NVIDIA GeForce RTX 4070 Super (Desktop, 12GB VRAM)',
        formFactor: 'DESKTOP',
        vramGib: 12,
        tdpWatts: 220,
        confidenceScore: 0.85,
        specDifferencesSummary: 'Enhanced desktop AD104 GPU with +20% CUDA cores and 220W TDP.'
      }
    ]
  },
  {
    pattern: /\brtx\s*4060\b(?!.*(ti|laptop|mobile))/i,
    familyName: 'NVIDIA GeForce RTX 4060',
    disambiguationPrompt: 'Is your RTX 4060 in a Desktop PC (8GB) or a Laptop (8GB mobile)?',
    variants: [
      {
        id: 'nvidia-rtx-4060-desktop',
        displayName: 'NVIDIA GeForce RTX 4060 (Desktop, 8GB VRAM)',
        formFactor: 'DESKTOP',
        vramGib: 8,
        tdpWatts: 115,
        confidenceScore: 0.95,
        specDifferencesSummary: 'Desktop 115W AD107 GPU with 8GB GDDR6.'
      },
      {
        id: 'nvidia-rtx-4060-laptop',
        displayName: 'NVIDIA GeForce RTX 4060 Laptop GPU (8GB VRAM)',
        formFactor: 'LAPTOP',
        vramGib: 8,
        tdpWatts: 75,
        confidenceScore: 0.90,
        specDifferencesSummary: 'Laptop 45-115W AD107 GPU with thermal-constrained clocks.'
      }
    ]
  },
  {
    pattern: /\bapple\s*m3\b(?!.*(pro|max|ultra))/i,
    familyName: 'Apple M3 Chip Family',
    disambiguationPrompt: 'Which Apple M3 chip do you have (Base M3, M3 Pro, or M3 Max)?',
    variants: [
      {
        id: 'apple-m3-base',
        displayName: 'Apple M3 (Base 8-core CPU, 10-core GPU)',
        formFactor: 'LAPTOP',
        cores: 8,
        confidenceScore: 0.95,
        specDifferencesSummary: 'Base M3 with 100 GB/s memory bandwidth and max 24GB Unified RAM.'
      },
      {
        id: 'apple-m3-pro',
        displayName: 'Apple M3 Pro (12-core CPU, 18-core GPU)',
        formFactor: 'LAPTOP',
        cores: 12,
        confidenceScore: 0.90,
        specDifferencesSummary: 'M3 Pro with 150 GB/s memory bandwidth and up to 36GB Unified RAM.'
      },
      {
        id: 'apple-m3-max',
        displayName: 'Apple M3 Max (16-core CPU, 40-core GPU)',
        formFactor: 'LAPTOP',
        cores: 16,
        confidenceScore: 0.85,
        specDifferencesSummary: 'Flagship M3 Max with 400 GB/s memory bandwidth and up to 128GB Unified RAM.'
      }
    ]
  },
  {
    pattern: /\bryzen\s*7\s*7800\b(?!.*x3d)/i,
    familyName: 'AMD Ryzen 7 7800 Series',
    disambiguationPrompt: 'Did you mean the Desktop Ryzen 7 7800X3D or Mobile 7840HS?',
    variants: [
      {
        id: 'amd-ryzen-7-7800x3d',
        displayName: 'AMD Ryzen 7 7800X3D (8-core, 3D V-Cache Desktop)',
        formFactor: 'DESKTOP',
        cores: 8,
        confidenceScore: 0.95,
        specDifferencesSummary: 'Desktop 8-core gaming champion with 96MB 3D V-Cache.'
      },
      {
        id: 'amd-ryzen-7-7840hs',
        displayName: 'AMD Ryzen 7 7840HS (8-core Mobile APU + Radeon 780M)',
        formFactor: 'LAPTOP',
        cores: 8,
        confidenceScore: 0.85,
        specDifferencesSummary: 'Laptop 8-core Zen 4 APU with integrated Radeon 780M graphics.'
      }
    ]
  }
];

/**
 * Known exact catalog mapping dictionary for instant high-confidence resolution
 */
const EXACT_MATCH_DICTIONARY: Record<string, { id: string; normalizedName: string }> = {
  'rtx 4090': { id: 'nvidia-rtx-4090', normalizedName: 'NVIDIA GeForce RTX 4090' },
  'rtx 4090 desktop': { id: 'nvidia-rtx-4090', normalizedName: 'NVIDIA GeForce RTX 4090' },
  'rtx 4080': { id: 'nvidia-rtx-4080', normalizedName: 'NVIDIA GeForce RTX 4080' },
  'rtx 3080': { id: 'nvidia-rtx-3080', normalizedName: 'NVIDIA GeForce RTX 3080' },
  'gtx 1060': { id: 'nvidia-gtx-1060', normalizedName: 'NVIDIA GeForce GTX 1060 6GB' },
  'apple m1': { id: 'apple-m1', normalizedName: 'Apple M1' },
  'apple m2': { id: 'apple-m2', normalizedName: 'Apple M2' },
  'apple m3 max': { id: 'apple-m3-max', normalizedName: 'Apple M3 Max' },
  'apple m4': { id: 'apple-m4', normalizedName: 'Apple M4' },
  'i9 14900k': { id: 'intel-i9-14900k', normalizedName: 'Intel Core i9-14900K' },
  'i7 13700k': { id: 'intel-i7-13700k', normalizedName: 'Intel Core i7-13700K' },
  'i5 13600k': { id: 'intel-i5-13600k', normalizedName: 'Intel Core i5-13600K' },
  'ryzen 7 7800x3d': { id: 'amd-ryzen-7-7800x3d', normalizedName: 'AMD Ryzen 7 7800X3D' },
  'ryzen 9 7950x': { id: 'amd-ryzen-9-7950x', normalizedName: 'AMD Ryzen 9 7950X' }
};

/**
 * Resolves a raw hardware string, returning exact matches or ambiguity options
 */
export function resolveHardwareQuery(rawQuery: string): HardwareResolutionResult {
  const trimmed = rawQuery.trim();
  if (!trimmed) {
    return {
      rawQuery,
      status: 'UNKNOWN',
      confidence: 0,
      reasoning: 'Hardware query is empty or blank.'
    };
  }

  const clean = trimmed.toLowerCase().replace(/[\-_,\.]+/g, ' ').replace(/\s+/g, ' ');

  // 1. Check Exact Match Dictionary
  if (EXACT_MATCH_DICTIONARY[clean]) {
    const match = EXACT_MATCH_DICTIONARY[clean];
    return {
      rawQuery,
      status: 'EXACT',
      canonicalId: match.id,
      normalizedName: match.normalizedName,
      confidence: 1.0,
      reasoning: `Exact match found in canonical hardware dictionary for '${match.normalizedName}'.`
    };
  }

  // 2. Check for Ambiguous Families
  for (const family of AMBIGUOUS_HARDWARE_FAMILIES) {
    if (family.pattern.test(trimmed)) {
      return {
        rawQuery,
        status: 'AMBIGUOUS',
        candidateOptions: family.variants,
        disambiguationPrompt: family.disambiguationPrompt,
        confidence: 0.70,
        reasoning: `Query '${trimmed}' matches multiple known variants of ${family.familyName}. Prompting user to disambiguate.`
      };
    }
  }

  // 3. Check for Generic Regex Pattern Extraction
  const ramMatch = trimmed.match(/(\d+)\s*(?:gb|gib)\s*(?:ram|memory)?/i);
  const coreMatch = trimmed.match(/(\d+)\s*(?:core|threads)/i);
  const isArm = /arm|snapdragon|apple silicon|m\d/i.test(trimmed);

  if (ramMatch || coreMatch) {
    return {
      rawQuery,
      status: 'PARSED_GENERIC',
      parsedSpecs: {
        ramGib: ramMatch ? parseInt(ramMatch[1], 10) : undefined,
        cores: coreMatch ? parseInt(coreMatch[1], 10) : undefined,
        architecture: isArm ? 'ARM64' : 'X86_64'
      },
      confidence: 0.60,
      reasoning: `Parsed generic specifications from freeform query: ${ramMatch ? ramMatch[1] + 'GB RAM ' : ''}${coreMatch ? coreMatch[1] + ' cores' : ''}.`
    };
  }

  // 4. Default to UNKNOWN
  return {
    rawQuery,
    status: 'UNKNOWN',
    confidence: 0.20,
    reasoning: `Hardware string '${trimmed}' could not be matched with high confidence in the canonical catalog.`
  };
}
