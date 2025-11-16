// src/code.ts

// 設定
const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 60000; // 60秒
const MAX_DEPTH = 10; // 再帰の最大深さ（無限ループ防止）

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
    // ノードデータを抽出（再帰的に子要素も取得）
    const nodeData = await extractNodeData(selectedNode, 0);

    console.log('Extracted node data:', JSON.stringify(nodeData, null, 2));

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

/**
 * ノードデータを再帰的に抽出する関数
 */
async function extractNodeData(node: SceneNode, depth: number = 0): Promise<any> {
  // 最大深さチェック
  if (depth > MAX_DEPTH) {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      note: 'Max depth reached',
    };
  }

  const data: any = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // バウンディングボックス（サイズと位置）
  if ('absoluteBoundingBox' in node && node.absoluteBoundingBox) {
    data.absoluteBoundingBox = {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
      width: node.absoluteBoundingBox.width,
      height: node.absoluteBoundingBox.height,
    };
  }

  // レイアウト情報（Auto Layout）
  if ('layoutMode' in node) {
    data.layoutMode = node.layoutMode;
    data.primaryAxisSizingMode = node.primaryAxisSizingMode;
    data.counterAxisSizingMode = node.counterAxisSizingMode;
    data.primaryAxisAlignItems = node.primaryAxisAlignItems;
    data.counterAxisAlignItems = node.counterAxisAlignItems;
    data.paddingLeft = node.paddingLeft;
    data.paddingRight = node.paddingRight;
    data.paddingTop = node.paddingTop;
    data.paddingBottom = node.paddingBottom;
    data.itemSpacing = node.itemSpacing;
    data.counterAxisSpacing = node.counterAxisSpacing;
  }

  // 塗り（背景色など）
  if ('fills' in node && node.fills !== figma.mixed && Array.isArray(node.fills)) {
    data.fills = node.fills.map((fill) => {
      if (fill.type === 'SOLID') {
        return {
          type: fill.type,
          color: {
            r: fill.color.r,
            g: fill.color.g,
            b: fill.color.b,
          },
          opacity: fill.opacity,
        };
      } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
        return {
          type: fill.type,
          opacity: fill.opacity,
        };
      }
      return { type: fill.type };
    });
  }

  // ストローク（ボーダー）
  if ('strokes' in node && Array.isArray(node.strokes)) {
    data.strokes = node.strokes.map((stroke) => {
      if (stroke.type === 'SOLID') {
        return {
          type: stroke.type,
          color: {
            r: stroke.color.r,
            g: stroke.color.g,
            b: stroke.color.b,
          },
          opacity: stroke.opacity,
        };
      }
      return { type: stroke.type };
    });

    if ('strokeWeight' in node) {
      data.strokeWeight = node.strokeWeight;
    }
  }

  // エフェクト（シャドウ、ブラーなど）
  if ('effects' in node && Array.isArray(node.effects)) {
    data.effects = node.effects
      .filter(effect => effect.visible)
      .map((effect) => {
        if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
          return {
            type: effect.type,
            color: effect.color,
            offset: effect.offset,
            radius: effect.radius,
            spread: effect.spread,
          };
        }
        return { type: effect.type };
      });
  }

  // 角丸
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
    data.cornerRadius = node.cornerRadius;
  }

  // 透明度
  if ('opacity' in node) {
    data.opacity = node.opacity;
  }

  // テキスト情報
  if (node.type === 'TEXT') {
    data.characters = node.characters;
    
    // フォント情報
    if (typeof node.fontSize === 'number') {
      data.fontSize = node.fontSize;
    }
    
    if (node.fontName !== figma.mixed && typeof node.fontName === 'object') {
      data.fontName = {
        family: node.fontName.family,
        style: node.fontName.style,
      };
    }

    if (node.lineHeight !== figma.mixed && typeof node.lineHeight === 'object') {
      data.lineHeight = node.lineHeight;
    }

    if (node.letterSpacing !== figma.mixed && typeof node.letterSpacing === 'object') {
      data.letterSpacing = node.letterSpacing;
    }

    // テキストの配置
    if (typeof node.textAlignHorizontal === 'string') {
      data.textAlignHorizontal = node.textAlignHorizontal;
    }

    if (typeof node.textAlignVertical === 'string') {
      data.textAlignVertical = node.textAlignVertical;
    }
  }

  // コンポーネント情報
  if (node.type === 'INSTANCE') {
  try {
      const mainComponent = await node.getMainComponentAsync();
      if (mainComponent) {
        data.mainComponent = {
          id: mainComponent.id,
          name: mainComponent.name,
        };
      }
    } catch (error) {
      console.warn('Failed to get main component:', error);
      data.mainComponent = null;
    }
  }

  // 子要素を再帰的に取得
  if ('children' in node && node.children.length > 0) {
    data.children = [];
    
    for (const child of node.children) {
      const childData = await extractNodeData(child, depth + 1);
      data.children.push(childData);
    }

    data.childrenCount = node.children.length;
  }

  return data;
}

// バックエンドAPIを呼び出す
async function callEvaluationAPI(nodeData: any): Promise<any> {
  const requestBody = {
    fileKey: figma.fileKey || 'unknown',
    nodeId: nodeData.id,
    nodeData: nodeData,
    evaluationTypes: ['accessibility', 'designSystem'],
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