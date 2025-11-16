// src/code.ts

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

    // Phase 1ではモックデータを返す
    // Phase 3でAPIコールに置き換える
    const mockResult = generateMockResult();

    figma.ui.postMessage({
      type: 'evaluation-complete',
      result: mockResult,
      nodeData: nodeData, // デバッグ用
    });
  } catch (error) {
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
  if ('absoluteBoundingBox' in node) {
    data.absoluteBoundingBox = node.absoluteBoundingBox;
  }

  // 塗り
  if ('fills' in node && node.fills !== figma.mixed) {
    data.fills = node.fills;
  }

  // ストローク
  if ('strokes' in node && Array.isArray(node.strokes)) {
    data.strokes = node.strokes;
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

// モック結果を生成（Phase 1用）
function generateMockResult() {
  return {
    overallScore: 78,
    categories: {
      accessibility: {
        score: 85,
        issues: [
          {
            severity: 'medium',
            message: 'テキストのコントラスト比が4.5:1を下回っています',
            nodeId: 'sample-node-1',
            autoFixable: false,
            suggestion: '背景色を#FFFFFF、テキスト色を#333333に変更してください',
          },
          {
            severity: 'low',
            message: 'タッチターゲットサイズが推奨値(44x44px)より小さいボタンがあります',
            nodeId: 'sample-node-2',
            autoFixable: true,
            suggestion: 'ボタンの高さを44px以上に設定してください',
          },
        ],
        positives: [
          'フォントサイズが適切に設定されています',
          'Auto Layoutが適切に使用されています',
        ],
      },
      designSystem: {
        score: 72,
        issues: [
          {
            severity: 'high',
            message: 'spacing値が8pxグリッドに準拠していません',
            nodeId: 'sample-node-3',
            autoFixable: true,
            suggestion: 'itemSpacingを12pxから16pxに変更してください',
          },
          {
            severity: 'medium',
            message: 'カラーパレット外の色が使用されています',
            nodeId: 'sample-node-4',
            autoFixable: false,
            suggestion: 'デザインシステムで定義された色を使用してください',
          },
        ],
        positives: [
          'コンポーネントが適切に抽象化されています',
        ],
      },
    },
    suggestions: [
      {
        category: 'designSystem',
        severity: 'high',
        message: 'spacing値が8pxグリッドに準拠していません',
        nodeId: 'sample-node-3',
        autoFixable: true,
      },
      {
        category: 'accessibility',
        severity: 'medium',
        message: 'テキストのコントラスト比が4.5:1を下回っています',
        nodeId: 'sample-node-1',
        autoFixable: false,
      },
      {
        category: 'designSystem',
        severity: 'medium',
        message: 'カラーパレット外の色が使用されています',
        nodeId: 'sample-node-4',
        autoFixable: false,
      },
      {
        category: 'accessibility',
        severity: 'low',
        message: 'タッチターゲットサイズが推奨値(44x44px)より小さいボタンがあります',
        nodeId: 'sample-node-2',
        autoFixable: true,
      },
    ],
    metadata: {
      evaluatedAt: new Date().toISOString(),
      duration: 2500,
    },
  };
}