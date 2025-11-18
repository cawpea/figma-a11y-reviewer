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
  type: string;
  children?: FigmaNodeData[];
  childrenCount?: number;

  // レイアウト
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
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
  lineHeight?: { unit: string; value: number } | number;
  letterSpacing?: { unit: string; value: number } | number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;

  // コンポーネント
  mainComponent?: {
    id?: string;
    name?: string;
  };
}

// 以下は既存のまま
export interface EvaluationRequest {
  fileKey: string;
  nodeId: string;
  nodeData: FigmaNodeData;
  evaluationTypes?: string[];
  userId?: string;
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
  score: number;
  issues: Issue[];
  positives?: string[];
}

export interface Suggestion extends Issue {
  category: string;
}

export interface EvaluationResult {
  overallScore: number;
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
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
