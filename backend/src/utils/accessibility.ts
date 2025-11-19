/**
 * RGBを16進数カラーコードに変換
 * @param r - 赤成分 (0-1の範囲)
 * @param g - 緑成分 (0-1の範囲)
 * @param b - 青成分 (0-1の範囲)
 * @returns 16進数カラーコード (例: #FF0000)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => {
    const hex = Math.round(value * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * 16進数カラーコードをRGBに変換
 * @param hex - 16進数カラーコード (例: #FF0000)
 * @returns RGB配列 [r, g, b] (0-255の範囲)
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(cleaned.substring(0, 2), 16),
    parseInt(cleaned.substring(2, 4), 16),
    parseInt(cleaned.substring(4, 6), 16),
  ];
}

export type CalculateWCAGContrastParams = {
  color1: string;
  color2: string;
};

// WCAGコントラスト計算関数
export type WCAGContrastResult = {
  contrast_ratio: number;
  color1: {
    hex: string;
    rgb: [number, number, number];
    luminance: number;
  };
  color2: {
    hex: string;
    rgb: [number, number, number];
    luminance: number;
  };
  wcag_compliance: {
    AA: {
      normal_text: boolean;
      large_text: boolean;
    };
    AAA: {
      normal_text: boolean;
      large_text: boolean;
    };
  };
};

export function calculateWCAGContrast({
  color1,
  color2,
}: CalculateWCAGContrastParams): WCAGContrastResult {
  // sRGB to Linear RGB
  const srgbToLinear = (value: number): number => {
    const normalized = value / 255;
    if (normalized <= 0.03928) {
      return normalized / 12.92;
    }
    return Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  // 相対輝度の計算
  const calculateLuminance = (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb;
    const rLinear = srgbToLinear(r);
    const gLinear = srgbToLinear(g);
    const bLinear = srgbToLinear(b);
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const l1 = calculateLuminance(rgb1);
  const l2 = calculateLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const contrastRatio = (lighter + 0.05) / (darker + 0.05);

  return {
    contrast_ratio: Math.round(contrastRatio * 100) / 100,
    color1: {
      hex: color1,
      rgb: rgb1,
      luminance: Math.round(l1 * 1000) / 1000,
    },
    color2: {
      hex: color2,
      rgb: rgb2,
      luminance: Math.round(l2 * 1000) / 1000,
    },
    wcag_compliance: {
      AA: {
        normal_text: contrastRatio >= 4.5,
        large_text: contrastRatio >= 3.0,
      },
      AAA: {
        normal_text: contrastRatio >= 7.0,
        large_text: contrastRatio >= 4.5,
      },
    },
  };
}
