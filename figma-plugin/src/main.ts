import { emit, on, showUI } from '@create-figma-plugin/utilities';
import type {
  EvaluationRequest,
  EvaluationResult,
  FigmaNodeData,
  FigmaStylesData,
  ScreenshotData,
  SelectionState,
} from '@shared/types';

import { FeatureFlag } from './constants/featureFlags';
import { callMockEvaluationAPI } from './services/mockApi';
import { debounce } from './utils/debounce';
import { extractFileStyles, extractNodeData } from './utils/figma.utils';
import { captureNodeScreenshot } from './utils/screenshot';

// 設定
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// 型定義
type FeatureFlagsStorage = {
  [K in FeatureFlag]?: boolean;
};

// エラーメッセージ定数
const ERROR_MESSAGES = {
  NO_SELECTION: 'フレーム、コンポーネント、インスタンスを選択してください',
  MULTIPLE_SELECTION: '評価できるのは1つのフレームのみです',
  INVALID_NODE_TYPE: 'フレーム、コンポーネント、インスタンスを選択してください',
} as const;

/**
 * 選択の検証
 * @returns 検証結果（isValid: 有効かどうか, errorMessage: エラーメッセージ）
 */
function validateSelection(selection: readonly SceneNode[]): {
  isValid: boolean;
  errorMessage?: string;
} {
  // 空選択は有効（エラーではない）
  if (selection.length === 0) {
    return { isValid: true };
  }

  // 複数選択はエラー
  if (selection.length > 1) {
    return {
      isValid: false,
      errorMessage: ERROR_MESSAGES.MULTIPLE_SELECTION,
    };
  }

  // フレーム、コンポーネント、インスタンス以外はエラー
  const selectedNode = selection[0];
  if (
    selectedNode.type !== 'FRAME' &&
    selectedNode.type !== 'COMPONENT' &&
    selectedNode.type !== 'INSTANCE'
  ) {
    return {
      isValid: false,
      errorMessage: `フレーム、コンポーネント、インスタンスを選択してください（選択中: ${selectedNode.type}）`,
    };
  }

  return { isValid: true };
}

/**
 * フォールバック付きノード選択
 * ターゲットノードが見つからない場合、階層を逆順に辿って親ノードを選択
 * 最終的にはルートノード（評価対象フレーム）にフォールバック
 */
async function selectNodeWithFallback(
  nodeId: string,
  nodeHierarchy?: string[],
  fallbackRootNodeId?: string
): Promise<boolean> {
  try {
    // ターゲットノードを試す
    const node = await figma.getNodeByIdAsync(nodeId);
    if (node) {
      figma.currentPage.selection = [node as SceneNode];
      figma.viewport.scrollAndZoomIntoView([node as SceneNode]);
      console.log('✅ Selected target node:', nodeId, node.name);
      return true;
    }

    console.warn('⚠️  Target node not found, attempting fallback selection');

    // 階層パスがある場合、親ノードへフォールバック
    if (nodeHierarchy && nodeHierarchy.length > 1) {
      // 最後のIDがターゲット、その前が親、さらに前が祖父...
      // 階層を逆順に辿る（親 → 祖父 → ... → ルート）
      for (let i = nodeHierarchy.length - 2; i >= 0; i--) {
        const ancestorId = nodeHierarchy[i];
        const ancestorNode = await figma.getNodeByIdAsync(ancestorId);

        if (ancestorNode) {
          const levelsUp = nodeHierarchy.length - 1 - i;
          console.log(
            `✅ Fallback: Selected ancestor ${levelsUp} level(s) up:`,
            ancestorId,
            ancestorNode.name
          );
          figma.currentPage.selection = [ancestorNode as SceneNode];
          figma.viewport.scrollAndZoomIntoView([ancestorNode as SceneNode]);
          return true;
        }
      }
    }

    // 階層フォールバックが失敗した場合、ルートノードを試す
    if (fallbackRootNodeId && fallbackRootNodeId !== nodeId) {
      console.log('⚠️  Attempting fallback to root node:', fallbackRootNodeId);
      const rootNode = await figma.getNodeByIdAsync(fallbackRootNodeId);
      if (rootNode) {
        figma.currentPage.selection = [rootNode as SceneNode];
        figma.viewport.scrollAndZoomIntoView([rootNode as SceneNode]);
        console.log('✅ Fallback: Selected root evaluation frame');
        return true;
      }
    }

    // すべてのフォールバックが失敗
    console.error('❌ All fallback attempts failed for nodeId:', nodeId);

    // nodeIdの形式をチェック
    // 通常: "1809:1836", インスタンス: "I1806:932;589:1207"
    if (!nodeId.match(/^[I]?\d+:\d+(;\d+:\d+)*$/)) {
      console.error('Invalid nodeId format:', nodeId);
      figma.notify('エラー: 無効なノードIDです（システム内部エラー）');
    } else {
      figma.notify('該当するレイヤーが見つかりませんでした');
    }
    return false;
  } catch (error) {
    console.error('Failed to select node:', error);
    figma.notify('レイヤーの選択に失敗しました');
    return false;
  }
}

async function handleEvaluation(evaluationTypes?: string[], platformType?: 'ios' | 'android') {
  const selection = figma.currentPage.selection;

  // 選択を検証
  const validation = validateSelection(selection);
  if (!validation.isValid) {
    emit('ERROR', validation.errorMessage || ERROR_MESSAGES.NO_SELECTION);
    return;
  }

  // 選択が空の場合はエラー（評価には選択が必要）
  if (selection.length === 0) {
    emit('ERROR', ERROR_MESSAGES.NO_SELECTION);
    return;
  }

  const selectedNode = selection[0];

  // 評価開始を通知
  emit('EVALUATION_STARTED');

  try {
    // スクリーンショットを取得（評価前に取得）
    const screenshot = await captureNodeScreenshot(selectedNode);
    if (screenshot) {
      console.log('✅ Screenshot successfully captured and will be sent to backend');
    } else {
      console.warn('⚠️ Screenshot capture failed, continuing evaluation without screenshot');
    }

    // ノードデータを抽出（再帰的に子要素も取得）
    const nodeData = await extractNodeData(selectedNode, 0);
    // ファイル全体のスタイル情報を取得
    const stylesData = await extractFileStyles();

    // バックエンドAPIに送信（スクリーンショット含む）
    const result = await callEvaluationAPI(
      nodeData,
      stylesData,
      evaluationTypes,
      platformType,
      screenshot
    );

    emit('EVALUATION_COMPLETE', result);
  } catch (error) {
    console.error('Evaluation error:', error);

    // 非表示ノードエラーの特別な処理
    if (error instanceof Error && error.message.includes('非表示')) {
      emit('ERROR', error.message);
      return;
    }

    // その他のエラーは既存の処理
    emit('ERROR', `評価中にエラーが発生しました: ${error}`);
  }
}

// バックエンドAPIを呼び出す
async function callEvaluationAPI(
  nodeData: FigmaNodeData,
  stylesData: FigmaStylesData,
  evaluationTypes?: string[],
  platformType?: 'ios' | 'android',
  screenshot?: ScreenshotData | null
): Promise<EvaluationResult> {
  // 機能フラグの確認
  const flags =
    ((await figma.clientStorage.getAsync('feature-flags')) as FeatureFlagsStorage) || {};
  const useMockApi = flags[FeatureFlag.MOCK_API] === true;

  // モックAPIモードの場合
  if (useMockApi) {
    console.log('[Mock API] Using mock evaluation data');
    return callMockEvaluationAPI({
      evaluationTypes,
      platformType,
      delay: 1500,
    });
  }

  // 既存の実APIロジック
  const requestBody: Partial<EvaluationRequest> = {
    fileKey: figma.fileKey || 'unknown',
    nodeId: nodeData.id,
    nodeData: nodeData,
    stylesData: stylesData,
  };

  if (evaluationTypes) {
    requestBody.evaluationTypes = evaluationTypes;
  }

  if (platformType) {
    requestBody.platformType = platformType;
  }

  // スクリーンショットを追加（nullの場合は含めない）
  if (screenshot) {
    requestBody.screenshot = screenshot;
  }

  console.log('Sending request to API:', API_BASE_URL + '/evaluate');

  try {
    const response = await fetch(API_BASE_URL + '/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Unknown API error');
    }

    return data.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw new Error(`API接続に失敗しました: ${error}`);
  }
}

export default function () {
  // UIを表示
  showUI({
    width: 400,
    height: 600,
  });

  // 選択変更の監視（デバウンス付き）
  const handleSelectionChange = () => {
    const selection = figma.currentPage.selection;
    const layers = selection.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
    }));

    // 選択を検証
    const validation = validateSelection(selection);

    const selectionState: SelectionState = {
      layers,
      isValid: validation.isValid,
      errorMessage: validation.errorMessage,
    };

    emit('SELECTION_CHANGED', selectionState);
  };

  // デバウンスされた関数への参照を保持
  const debouncedSelectionChange = debounce(handleSelectionChange, 100);
  figma.on('selectionchange', debouncedSelectionChange);

  // UIからのイベントを受信
  on('EVALUATE_SELECTION', handleEvaluation);

  // UIが初期選択状態をリクエストしたら送信
  on('REQUEST_INITIAL_SELECTION', () => {
    handleSelectionChange();
  });

  // 機能フラグハンドラー
  const FEATURE_FLAGS_STORAGE_KEY = 'feature-flags';

  on('LOAD_FEATURE_FLAGS', async () => {
    try {
      const flags = await figma.clientStorage.getAsync(FEATURE_FLAGS_STORAGE_KEY);
      emit('FEATURE_FLAGS_LOADED', flags || {});
    } catch (e) {
      console.error('Failed to load feature flags:', e);
      emit('FEATURE_FLAGS_LOADED', {});
    }
  });

  on('SAVE_FEATURE_FLAGS', async (flags: Record<string, boolean>) => {
    try {
      await figma.clientStorage.setAsync(FEATURE_FLAGS_STORAGE_KEY, flags);
      emit('FEATURE_FLAGS_SAVED');
    } catch (e) {
      console.error('Failed to save feature flags:', e);
    }
  });

  // エージェント選択ハンドラー
  const AGENT_SELECTION_STORAGE_KEY = 'figma-ui-reviewer-selected-agents';
  const PLATFORM_SELECTION_STORAGE_KEY = 'figma-ui-reviewer-selected-platform';

  on('LOAD_AGENT_SELECTION', async () => {
    try {
      const selectedAgents = await figma.clientStorage.getAsync(AGENT_SELECTION_STORAGE_KEY);
      const selectedPlatform = await figma.clientStorage.getAsync(PLATFORM_SELECTION_STORAGE_KEY);
      emit('AGENT_SELECTION_LOADED', {
        selectedAgents: selectedAgents || null,
        selectedPlatform: selectedPlatform || null,
      });
    } catch (e) {
      console.error('Failed to load agent selection:', e);
      emit('AGENT_SELECTION_LOADED', {
        selectedAgents: null,
        selectedPlatform: null,
      });
    }
  });

  on('SAVE_AGENT_SELECTION', async (selectedAgents: string[]) => {
    try {
      await figma.clientStorage.setAsync(AGENT_SELECTION_STORAGE_KEY, selectedAgents);
    } catch (e) {
      console.error('Failed to save agent selection:', e);
    }
  });

  on('SAVE_PLATFORM_SELECTION', async (selectedPlatform: 'ios' | 'android') => {
    try {
      await figma.clientStorage.setAsync(PLATFORM_SELECTION_STORAGE_KEY, selectedPlatform);
    } catch (e) {
      console.error('Failed to save platform selection:', e);
    }
  });

  on(
    'SELECT_NODE',
    async ({
      nodeId,
      nodeHierarchy,
      rootNodeId,
    }: {
      nodeId: string;
      nodeHierarchy?: string[];
      rootNodeId?: string;
    }) => {
      if (nodeId) {
        await selectNodeWithFallback(nodeId, nodeHierarchy, rootNodeId);
      }
    }
  );

  on('CANCEL', () => {
    // ペンディング中のデバウンスタイマーをクリーンアップ
    // Note: figma.closePluginが呼ばれた時点で自動的にクリーンアップされますが、
    // 明示的にdebounceタイマーをキャンセルすることで、ペンディング中の処理を確実に停止
    debouncedSelectionChange.cancel();
    figma.off('selectionchange', debouncedSelectionChange); // 明示的にリスナー削除

    figma.closePlugin();
  });
}
