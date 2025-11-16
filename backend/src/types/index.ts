// Figmaノードデータ
export interface FigmaNodeData {
  id: string;
  name: string;
  type: string;
  children?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: any[];
  strokes?: any[];
  textStyle?: {
    fontSize: any;
    fontName: any;
    lineHeight: any;
    letterSpacing: any;
  };
}

// 評価リクエスト
export interface EvaluationRequest {
  fileKey: string;
  nodeId: string;
  nodeData: FigmaNodeData;
  evaluationTypes?: string[];
  userId?: string;
}

// Issue（問題点）
export interface Issue {
  severity: 'high' | 'medium' | 'low';
  message: string;
  nodeId?: string;
  autoFixable: boolean;
  suggestion?: string;
}

// カテゴリ別評価結果
export interface CategoryResult {
  score: number;
  issues: Issue[];
  positives?: string[];
}

// Suggestion（改善提案）
export interface Suggestion extends Issue {
  category: string;
}

// 最終的な評価結果
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

// API レスポンス
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}