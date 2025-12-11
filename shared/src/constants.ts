// 共通定数定義
// figma-pluginとbackendの両方で使用される定数

/** スタイル取得時の上限定数 */
export const STYLES_LIMIT = {
  /** 各カテゴリごとの最大取得数 */
  MAX_ITEMS_PER_CATEGORY: 100,
} as const;
