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
  // Hex to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const cleaned = hex.replace('#', '');
    return [
      parseInt(cleaned.substring(0, 2), 16),
      parseInt(cleaned.substring(2, 4), 16),
      parseInt(cleaned.substring(4, 6), 16),
    ];
  };

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
