import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { EvaluationService } from '../services/evaluation.service';
import { ApiResponse, EvaluationResult } from '../types';

const router = Router();
const evaluationService = new EvaluationService();

// リクエストボディのバリデーションスキーマ
const evaluationRequestSchema = z.object({
  fileKey: z.string(),
  nodeId: z.string(),
  nodeData: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }).passthrough(), // 追加のプロパティを許可
  evaluationTypes: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

/**
 * デバッグ用: ノードデータをファイルに保存
 */
function saveDebugData(nodeData: any) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    // logsディレクトリのパス（backendディレクトリ直下）
    const logsDir = join(__dirname, '../logs');
    
    // logsディレクトリが存在しない場合は作成
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created logs directory:', logsDir);
    }

    // タイムスタンプ付きファイル名
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    const nodeName = nodeData.name.replace(/[^a-zA-Z0-9]/g, '_'); // 安全なファイル名に変換
    const filename = `debug-${nodeName}-${timestamp}.json`;
    const filepath = join(logsDir, filename);

    // データを整形して保存
    const debugData = {
      timestamp: new Date().toISOString(),
      nodeId: nodeData.id,
      nodeName: nodeData.name,
      nodeType: nodeData.type,
      childrenCount: nodeData.childrenCount || 0,
      summary: {
        hasChildren: !!nodeData.children,
        childrenCount: nodeData.children?.length || 0,
        hasLayoutMode: !!nodeData.layoutMode,
        hasFills: !!nodeData.fills,
      },
      fullData: nodeData,
    };

    writeFileSync(filepath, JSON.stringify(debugData, null, 2));
    console.log(`✅ Debug data saved to: logs/${filename}`);
    console.log(`   Children count: ${debugData.childrenCount}`);
  } catch (error) {
    console.error('❌ Failed to save debug file:', error);
  }
}

/**
 * POST /api/evaluate
 * デザインを評価
 */
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    console.log('Received evaluation request:', {
      nodeId: req.body.nodeId,
      nodeName: req.body.nodeData?.name,
    });

    // デバッグ用: データをファイルに保存
    if (process.env.NODE_ENV === 'development') {
      saveDebugData(req.body.nodeData);
    }

    // バリデーション
    const validatedData = evaluationRequestSchema.parse(req.body);

    // 評価実行
    const result = await evaluationService.evaluateDesign(
      validatedData.nodeData,
      validatedData.evaluationTypes
    );

    const response: ApiResponse<EvaluationResult> = {
      success: true,
      data: result,
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid request data',
        details: error.issues,
      };
      res.status(400).json(response);
    } else {
      console.error('Evaluation error:', error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      };
      res.status(500).json(response);
    }
  }
});

/**
 * GET /api/health
 * ヘルスチェック
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;