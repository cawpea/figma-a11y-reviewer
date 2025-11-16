// Figmaノードデータ（拡張版）
export interface FigmaNodeData {
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
    color?: any;
    offset?: any;
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
  lineHeight?: any;
  letterSpacing?: any;
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
  nodeId?: string;
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
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}