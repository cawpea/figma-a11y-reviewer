// sharedから共通の型定義をインポート
import type { EvaluationResult } from '../../shared/src/types';

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
