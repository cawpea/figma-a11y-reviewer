import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { EvaluationService } from '../services/evaluation.service';
import { ApiResponse, EvaluationResult } from '../types';
import { saveDebugData } from '../utils/debug';

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