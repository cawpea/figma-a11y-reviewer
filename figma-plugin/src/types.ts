// 共通の型定義

export interface EvaluationRequest {
  fileKey: string;
  nodeId: string;
  nodeData: FigmaNodeData;
  evaluationTypes?: string[];
}

export interface EvaluationResult {
  overallScore: number;
  categories: Record<string, Category>;
  metadata: {
    evaluatedAt: string;
    duration: number;
    rootNodeId?: string;
    usage?: {
      totalInputTokens: number;
      totalOutputTokens: number;
      totalCachedTokens: number;
      estimatedCost: number;
    };
  };
}

export interface Category {
  score: number;
  issues: Issue[];
  positives?: string[];
}

export interface Issue {
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
  nodeId?: string;
  nodeHierarchy?: string[];
}

export interface FigmaNodeData {
  id: string;
  name: string;
  type: string;
  note?: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  layoutMode?: string;
  primaryAxisSizingMode?: string;
  counterAxisSizingMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  counterAxisSpacing?: number;
  fills?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
    };
    opacity?: number;
  }>;
  strokes?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
    };
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
  mainComponent?: {
    id: string;
    name: string;
  };
  children?: FigmaNodeData[];
  childrenCount?: number;
}

// プラグインメッセージの型
export interface PluginMessage {
  type: string;
  message?: string;
  result?: EvaluationResult;
  evaluationTypes?: string[];
  nodeId?: string;
  nodeHierarchy?: string[];
  rootNodeId?: string;
}