import { emit, on, showUI } from '@create-figma-plugin/utilities';
import type {
  EvaluationRequest,
  EvaluationResult,
  FigmaNodeData,
  FigmaStylesData,
} from '@shared/types';

import { extractFileStyles, extractNodeData } from './utils/figma.utils';

// 設定
const API_BASE_URL = 'http://localhost:3000/api';

// エラーメッセージ定数
const ERROR_MESSAGES = {
  NO_SELECTION: 'フレーム、コンポーネント、またはインスタンスを選択してください',
  MULTIPLE_SELECTION: '評価できるのは1つのフレームのみです',
  INVALID_NODE_TYPE: 'フレーム、コンポーネント、またはインスタンスを選択してください',
} as const;

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

async function handleEvaluation(evaluationTypes?: string[]) {
  const selection = figma.currentPage.selection;

  // 選択チェック
  if (selection.length === 0) {
    emit('ERROR', ERROR_MESSAGES.NO_SELECTION);
    return;
  }

  if (selection.length > 1) {
    emit('ERROR', ERROR_MESSAGES.MULTIPLE_SELECTION);
    return;
  }

  const selectedNode = selection[0];

  // フレーム、コンポーネント、またはインスタンスかチェック
  if (
    selectedNode.type !== 'FRAME' &&
    selectedNode.type !== 'COMPONENT' &&
    selectedNode.type !== 'INSTANCE'
  ) {
    emit('ERROR', ERROR_MESSAGES.INVALID_NODE_TYPE);
    return;
  }

  // 評価開始を通知
  emit('EVALUATION_STARTED');

  try {
    // ノードデータを抽出（再帰的に子要素も取得）
    const nodeData = await extractNodeData(selectedNode, 0);

    console.log('Extracted node data:', JSON.stringify(nodeData, null, 2));

    // ファイル全体のスタイル情報を取得
    const stylesData = await extractFileStyles();

    console.log('Extracted styles data:', JSON.stringify(stylesData, null, 2));

    // バックエンドAPIに送信
    const result = await callEvaluationAPI(nodeData, stylesData, evaluationTypes);

    emit('EVALUATION_COMPLETE', result);
  } catch (error) {
    console.error('Evaluation error:', error);
    emit('ERROR', `評価中にエラーが発生しました: ${error}`);
  }
}

// バックエンドAPIを呼び出す
async function callEvaluationAPI(
  nodeData: FigmaNodeData,
  stylesData: FigmaStylesData,
  evaluationTypes?: string[]
): Promise<EvaluationResult> {
  const requestBody: Partial<EvaluationRequest> = {
    fileKey: figma.fileKey || 'unknown',
    nodeId: nodeData.id,
    nodeData: nodeData,
    stylesData: stylesData,
  };

  if (evaluationTypes) {
    requestBody.evaluationTypes = evaluationTypes;
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

  // UIからのイベントを受信
  on('EVALUATE_SELECTION', handleEvaluation);

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
    figma.closePlugin();
  });
}
