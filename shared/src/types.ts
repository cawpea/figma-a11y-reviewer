// 共通型定義
// figma-pluginとbackendの両方で使用される型

/**
 * Figmaノードタイプ
 * @see https://www.figma.com/plugin-docs/api/NodeType/
 */
export type FigmaNodeType =
  | 'BOOLEAN_OPERATION'
  | 'CODE_BLOCK'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'CONNECTOR'
  | 'DOCUMENT'
  | 'ELLIPSE'
  | 'EMBED'
  | 'FRAME'
  | 'GROUP'
  | 'HIGHLIGHT'
  | 'INSTANCE'
  | 'INTERACTIVE_SLIDE_ELEMENT'
  | 'LINE'
  | 'LINK_UNFURL'
  | 'MEDIA'
  | 'PAGE'
  | 'POLYGON'
  | 'RECTANGLE'
  | 'SECTION'
  | 'SHAPE_WITH_TEXT'
  | 'SLICE'
  | 'SLIDE'
  | 'SLIDE_GRID'
  | 'SLIDE_ROW'
  | 'STAMP'
  | 'STAR'
  | 'STICKY'
  | 'TABLE'
  | 'TABLE_CELL'
  | 'TEXT'
  | 'TEXT_PATH'
  | 'TRANSFORM_GROUP'
  | 'VECTOR'
  | 'WASHI_TAPE'
  | 'WIDGET';

// Figmaノードデータ（拡張版）
export interface FigmaNodeData {
  /**
   * Figma node ID
   *
   * Formats:
   * - Regular nodes: "1809:1836" (digits:digits)
   * - Instance nodes: "I1806:932;589:1207" (I prefix + semicolon-separated)
   * - Nested instances: "I1806:984;1809:902;105:1169" (multiple segments)
   */
  id: string;
  name: string;
  type: FigmaNodeType;
  children?: FigmaNodeData[];
  childrenCount?: number;

  // レイアウト
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;

  // サイズと位置
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // スタイル
  fills?: Array<{
    type: string;
    color?: { r: number; g: number; b: number };
    opacity?: number;
  }>;
  strokes?: Array<{
    type: string;
    color?: { r: number; g: number; b: number };
    opacity?: number;
  }>;
  strokeWeight?: number;
  effects?: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a?: number };
    offset?: { x: number; y: number };
    radius?: number;
    spread?: number;
  }>;
  cornerRadius?: number;
  opacity?: number;

  // テキスト
  characters?: string;
  fontSize?: number;
  fontName?: {
    family: string;
    style: string;
  };
  lineHeight?: { unit: string; value?: number } | number;
  letterSpacing?: { unit: string; value?: number } | number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;

  // コンポーネント
  mainComponent?: {
    id?: string;
    name?: string;
  };

  // スタイル参照情報
  boundVariables?: Record<string, VariableAlias | VariableAlias[]>;
  textStyleId?: string;
  textStyleName?: string;
  fillStyleId?: string;
  fillStyleName?: string;
  strokeStyleId?: string;
  strokeStyleName?: string;
  effectStyleId?: string;
  effectStyleName?: string;

  // その他
  note?: string;
}

// Variable参照情報
export interface VariableAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

// Variable情報
export interface VariableInfo {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode?: Record<string, unknown>;
}

// Style情報
export interface StyleInfo {
  id: string;
  name: string;
  description?: string;
}

/**
 * ファイル全体のスタイル定義情報
 *
 * トークン数削減のため、各カテゴリ最大100個までに制限される
 */
export interface FigmaStylesData {
  variables: VariableInfo[];
  textStyles: StyleInfo[];
  colorStyles: StyleInfo[];
  effectStyles: StyleInfo[];
  /** 取得したスタイル数の統計情報 */
  meta: {
    variablesCount: number;
    textStylesCount: number;
    colorStylesCount: number;
    effectStylesCount: number;
    /** いずれかのカテゴリで上限に達した場合true */
    truncated: boolean;
  };
}

export interface Issue {
  severity: 'high' | 'medium' | 'low';
  message: string;
  /**
   * Figma node ID of the issue target
   *
   * Formats:
   * - Regular nodes: "1809:1836"
   * - Instance nodes: "I1806:932;589:1207"
   * - Nested instances: "I1806:984;1809:902;105:1169"
   *
   * If undefined, the rootNodeId will be used as fallback
   */
  nodeId?: string;
  nodeHierarchy?: string[]; // 階層パス: [rootId, parentId, ..., nodeId]
  autoFixable: boolean;
  suggestion?: string;
}

export interface CategoryResult {
  issues: Issue[];
  positives?: string[];
}

export interface Suggestion extends Issue {
  category: string;
}

export interface TokenUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  estimatedCost: number; // USD
}

export interface EvaluationResult {
  categories: {
    [key: string]: CategoryResult;
  };
  suggestions: Suggestion[];
  metadata: {
    evaluatedAt: Date;
    duration: number;
    /**
     * Root node ID of the evaluated frame (used as fallback)
     *
     * When a specific issue nodeId cannot be found in Figma,
     * this rootNodeId is used to select the evaluation target frame instead
     */
    rootNodeId: string;
    usage?: TokenUsage;
  };
}

export interface EvaluationRequest {
  fileKey: string;
  nodeId: string;
  nodeData: FigmaNodeData;
  stylesData?: FigmaStylesData;
  evaluationTypes?: string[];
  platformType?: 'ios' | 'android';
  userId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/** 選択されたレイヤー情報 */
export interface SelectedLayer {
  id: string;
  name: string;
  type: FigmaNodeType;
}

/** 選択状態（検証結果含む） */
export interface SelectionState {
  layers: SelectedLayer[];
  isValid: boolean;
  errorMessage?: string;
}

/** スタイル取得時の上限定数 */
export const STYLES_LIMIT = {
  /** 各カテゴリごとの最大取得数 */
  MAX_ITEMS_PER_CATEGORY: 100,
} as const;

// 機能フラグイベント
export interface LoadFeatureFlagsHandler {
  name: 'LOAD_FEATURE_FLAGS';
  handler: () => void;
}

export interface FeatureFlagsLoadedHandler {
  name: 'FEATURE_FLAGS_LOADED';
  handler: (flags: Record<string, boolean>) => void;
}

export interface SaveFeatureFlagsHandler {
  name: 'SAVE_FEATURE_FLAGS';
  handler: (flags: Record<string, boolean>) => void;
}

export interface FeatureFlagsSavedHandler {
  name: 'FEATURE_FLAGS_SAVED';
  handler: () => void;
}
