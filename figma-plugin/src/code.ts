// src/code.ts

// 設定
const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 60000; // 60秒

// プラグインUI表示
figma.showUI(__html__, {
  width: 400,
  height: 600,
  themeColors: true,
});

// UIからのメッセージを受信
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'evaluate-selection') {
    await handleEvaluation();
  } else if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

async function handleEvaluation() {
  const selection = figma.currentPage.selection;

  // 選択チェック
  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'error',
      message: 'フレームまたはコンポーネントを選択してください',
    });
    return;
  }

  if (selection.length > 1) {
    figma.ui.postMessage({
      type: 'error',
      message: '評価できるのは1つのフレームのみです',
    });
    return;
  }

  const selectedNode = selection[0];

  // フレームまたはコンポーネントかチェック
  if (selectedNode.type !== 'FRAME' && selectedNode.type !== 'COMPONENT') {
    figma.ui.postMessage({
      type: 'error',
      message: 'フレームまたはコンポーネントを選択してください',
    });
    return;
  }

  // 評価開始を通知
  figma.ui.postMessage({
    type: 'evaluation-started',
  });

  try {
    // ノードデータを抽出
    const nodeData = await extractNodeData(selectedNode);

    // バックエンドAPIに送信
    const result = await callEvaluationAPI(nodeData);

    figma.ui.postMessage({
      type: 'evaluation-complete',
      result: result,
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    figma.ui.postMessage({
      type: 'error',
      message: `評価中にエラーが発生しました: ${error}`,
    });
  }
}

// ノードデータを抽出する関数
async function extractNodeData(node: SceneNode): Promise<any> {
  const data: any = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // フレームまたはコンポーネントの場合
  if ('children' in node) {
    data.children = node.children.map((child) => ({
      id: child.id,
      name: child.name,
      type: child.type,
    }));
  }

  // レイアウト情報
  if ('layoutMode' in node) {
    data.layoutMode = node.layoutMode;
    data.primaryAxisSizingMode = node.primaryAxisSizingMode;
    data.counterAxisSizingMode = node.counterAxisSizingMode;
    data.paddingLeft = node.paddingLeft;
    data.paddingRight = node.paddingRight;
    data.paddingTop = node.paddingTop;
    data.paddingBottom = node.paddingBottom;
    data.itemSpacing = node.itemSpacing;
  }

  // バウンディングボックス
  if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
    data.absoluteBoundingBox = {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    };
  }

  // 塗り
  if ('fills' in node && node.fills !== figma.mixed && Array.isArray(node.fills)) {
    data.fills = node.fills.map((fill) => {
      if (fill.type === 'SOLID') {
        return {
          type: fill.type,
          color: fill.color,
          opacity: fill.opacity,
        };
      }
      return { type: fill.type };
    });
  }

  // ストローク
  if ('strokes' in node && Array.isArray(node.strokes)) {
    data.strokes = node.strokes.map((stroke) => {
      if (stroke.type === 'SOLID') {
        return {
          type: stroke.type,
          color: stroke.color,
          opacity: stroke.opacity,
        };
      }
      return { type: stroke.type };
    });
  }

  // テキストスタイル
  if (node.type === 'TEXT') {
    data.textStyle = {
      fontSize: node.fontSize,
      fontName: node.fontName,
      lineHeight: node.lineHeight,
      letterSpacing: node.letterSpacing,
    };
  }

  return data;
}

// バックエンドAPIを呼び出す
async function callEvaluationAPI(nodeData: any): Promise<any> {
  const requestBody = {
    fileKey: figma.fileKey || 'unknown',
    nodeId: nodeData.id,
    nodeData: nodeData,
    evaluationTypes: ['accessibility', 'designSystem'], // 評価タイプを指定
  };

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