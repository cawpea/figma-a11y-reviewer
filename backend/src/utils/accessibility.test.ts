import { describe, expect, it } from '@jest/globals';

import { calculateWCAGContrast, hexToRgb, rgbToHex } from './accessibility';

describe('accessibility', () => {
  describe('rgbToHex', () => {
    it('0-1の範囲のRGB値を16進数カラーコードに変換できる', () => {
      expect(rgbToHex(1, 0, 0)).toBe('#FF0000');
      expect(rgbToHex(0, 1, 0)).toBe('#00FF00');
      expect(rgbToHex(0, 0, 1)).toBe('#0000FF');
      expect(rgbToHex(1, 1, 1)).toBe('#FFFFFF');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    it('小数点以下の値を正しく変換できる', () => {
      expect(rgbToHex(0.5, 0.5, 0.5)).toBe('#808080');
      expect(rgbToHex(0.2, 0.4, 0.6)).toBe('#336699');
    });

    it('1桁の16進数値を正しく0埋めする', () => {
      expect(rgbToHex(0.01, 0.01, 0.01)).toBe('#030303');
      expect(rgbToHex(0.02, 0.02, 0.02)).toBe('#050505');
    });
  });

  describe('hexToRgb', () => {
    it('16進数カラーコードをRGB配列に変換できる', () => {
      expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#00FF00')).toEqual([0, 255, 0]);
      expect(hexToRgb('#0000FF')).toEqual([0, 0, 255]);
      expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
    });

    it('#なしのカラーコードも変換できる', () => {
      expect(hexToRgb('FF0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('FFFFFF')).toEqual([255, 255, 255]);
    });

    it('小文字のカラーコードも変換できる', () => {
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#aabbcc')).toEqual([170, 187, 204]);
    });

    it('無効なカラーコードの場合はエラーをスローする', () => {
      expect(() => hexToRgb('#GGGGGG')).toThrow('Invalid hex color: #GGGGGG');
      expect(() => hexToRgb('#FFF')).toThrow('Invalid hex color: #FFF');
      expect(() => hexToRgb('invalid')).toThrow('Invalid hex color: invalid');
    });
  });

  describe('calculateWCAGContrast', () => {
    it('黒と白のコントラスト比は21である', () => {
      const result = calculateWCAGContrast({
        color1: '#000000',
        color2: '#FFFFFF',
      });

      expect(result.contrast_ratio).toBe(21);
      expect(result.wcag_compliance.A.normal_text).toBeNull();
      expect(result.wcag_compliance.A.large_text).toBeNull();
      expect(result.wcag_compliance.AA.normal_text).toBe(true);
      expect(result.wcag_compliance.AA.large_text).toBe(true);
      expect(result.wcag_compliance.AAA.normal_text).toBe(true);
      expect(result.wcag_compliance.AAA.large_text).toBe(true);
    });

    it('同じ色のコントラスト比は1である', () => {
      const result = calculateWCAGContrast({
        color1: '#808080',
        color2: '#808080',
      });

      expect(result.contrast_ratio).toBe(1);
      expect(result.wcag_compliance.A.normal_text).toBeNull();
      expect(result.wcag_compliance.A.large_text).toBeNull();
      expect(result.wcag_compliance.AA.normal_text).toBe(false);
      expect(result.wcag_compliance.AA.large_text).toBe(false);
      expect(result.wcag_compliance.AAA.normal_text).toBe(false);
      expect(result.wcag_compliance.AAA.large_text).toBe(false);
    });

    it('WCAG AA基準(4.5:1)をギリギリ満たすコントラスト比', () => {
      // 黒(#000000)とグレー(#767676)のコントラスト比は約4.62:1
      const result = calculateWCAGContrast({
        color1: '#000000',
        color2: '#767676',
      });

      expect(result.contrast_ratio).toBeGreaterThanOrEqual(4.5);
      expect(result.contrast_ratio).toBeLessThan(5.0);
      expect(result.wcag_compliance.AA.normal_text).toBe(true);
      expect(result.wcag_compliance.AAA.normal_text).toBe(false);
    });

    it('WCAG AAA基準(7:1)をギリギリ満たすコントラスト比', () => {
      // 白(#FFFFFF)と暗いグレー(#595959)のコントラスト比はちょうど7:1
      const result = calculateWCAGContrast({
        color1: '#FFFFFF',
        color2: '#595959',
      });

      expect(result.contrast_ratio).toBe(7.0);
      expect(result.wcag_compliance.AAA.normal_text).toBe(true);
      expect(result.wcag_compliance.AA.normal_text).toBe(true);
    });

    it('大きなテキストのAA基準(3:1)をギリギリ満たすコントラスト比', () => {
      // 白(#FFFFFF)とグレー(#949494)のコントラスト比は約3.03:1
      const result = calculateWCAGContrast({
        color1: '#FFFFFF',
        color2: '#949494',
      });

      expect(result.contrast_ratio).toBeGreaterThanOrEqual(3.0);
      expect(result.contrast_ratio).toBeLessThan(3.1);
      expect(result.wcag_compliance.AA.large_text).toBe(true);
      expect(result.wcag_compliance.AA.normal_text).toBe(false);
    });

    it('大きなテキストのAAA基準(4.5:1)をギリギリ満たすコントラスト比', () => {
      // 黒(#000000)とグレー(#767676)のコントラスト比は約4.62:1
      const result = calculateWCAGContrast({
        color1: '#000000',
        color2: '#767676',
      });

      expect(result.contrast_ratio).toBeGreaterThanOrEqual(4.5);
      expect(result.contrast_ratio).toBeLessThan(5.0);
      expect(result.wcag_compliance.AAA.large_text).toBe(true);
      expect(result.wcag_compliance.AAA.normal_text).toBe(false);
    });

    it('color1とcolor2の順序を入れ替えても同じコントラスト比になる', () => {
      const result1 = calculateWCAGContrast({
        color1: '#000000',
        color2: '#FFFFFF',
      });

      const result2 = calculateWCAGContrast({
        color1: '#FFFFFF',
        color2: '#000000',
      });

      expect(result1.contrast_ratio).toBe(result2.contrast_ratio);
    });

    it('色の輝度情報を正しく返す', () => {
      const result = calculateWCAGContrast({
        color1: '#000000',
        color2: '#FFFFFF',
      });

      expect(result.color1.hex).toBe('#000000');
      expect(result.color1.rgb).toEqual([0, 0, 0]);
      expect(result.color1.luminance).toBe(0);

      expect(result.color2.hex).toBe('#FFFFFF');
      expect(result.color2.rgb).toEqual([255, 255, 255]);
      expect(result.color2.luminance).toBe(1);
    });

    it('実際のカラーパレットでテスト: 青(#0066CC)と白(#FFFFFF)', () => {
      const result = calculateWCAGContrast({
        color1: '#0066CC',
        color2: '#FFFFFF',
      });

      // #0066CCと#FFFFFFのコントラスト比は約5.57:1
      expect(result.contrast_ratio).toBeGreaterThanOrEqual(5.0);
      expect(result.wcag_compliance.AA.normal_text).toBe(true);
      expect(result.wcag_compliance.AAA.normal_text).toBe(false);
    });

    it('実際のカラーパレットでテスト: ライトグレー(#F5F5F5)と白(#FFFFFF)', () => {
      const result = calculateWCAGContrast({
        color1: '#F5F5F5',
        color2: '#FFFFFF',
      });

      expect(result.contrast_ratio).toBeLessThan(1.2);
      expect(result.wcag_compliance.AA.normal_text).toBe(false);
      expect(result.wcag_compliance.AA.large_text).toBe(false);
    });

    it('Level Aのコントラスト比要件がnullである', () => {
      const result = calculateWCAGContrast({
        color1: '#000000',
        color2: '#FFFFFF',
      });

      // Level Aにはコントラスト比の要件がないため、常にnull
      expect(result.wcag_compliance.A.normal_text).toBeNull();
      expect(result.wcag_compliance.A.large_text).toBeNull();
    });
  });
});
