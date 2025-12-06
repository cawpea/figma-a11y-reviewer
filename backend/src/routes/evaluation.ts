import { ApiResponse, EvaluationResult, FigmaNodeType } from '@shared/types';
import { Request, Response, Router } from 'express';
import { z } from 'zod';

import { EvaluationService } from '../services/evaluation.service';
import { saveDebugData } from '../utils/debug';
import { cleanupOldScreenshots, saveScreenshot } from '../utils/screenshot';

const router = Router();
const evaluationService = new EvaluationService();

const variableInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  resolvedType: z.string(),
  valuesByMode: z.record(z.string(), z.unknown()).optional(),
});

const styleInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

// Figmaノードタイプのzodスキーマ
const figmaNodeTypeSchema = z.enum([
  'BOOLEAN_OPERATION',
  'CODE_BLOCK',
  'COMPONENT',
  'COMPONENT_SET',
  'CONNECTOR',
  'DOCUMENT',
  'ELLIPSE',
  'EMBED',
  'FRAME',
  'GROUP',
  'HIGHLIGHT',
  'INSTANCE',
  'INTERACTIVE_SLIDE_ELEMENT',
  'LINE',
  'LINK_UNFURL',
  'MEDIA',
  'PAGE',
  'POLYGON',
  'RECTANGLE',
  'SECTION',
  'SHAPE_WITH_TEXT',
  'SLICE',
  'SLIDE',
  'SLIDE_GRID',
  'SLIDE_ROW',
  'STAMP',
  'STAR',
  'STICKY',
  'TABLE',
  'TABLE_CELL',
  'TEXT',
  'TEXT_PATH',
  'TRANSFORM_GROUP',
  'VECTOR',
  'WASHI_TAPE',
  'WIDGET',
]) satisfies z.ZodType<FigmaNodeType>;

// スクリーンショットデータのスキーマ
const screenshotDataSchema = z.object({
  imageData: z.string(),
  nodeName: z.string(),
  nodeId: z.string(),
  byteSize: z.number(),
});

// リクエストボディのバリデーションスキーマ
const evaluationRequestSchema = z.object({
  fileKey: z.string(),
  nodeId: z.string(),
  nodeData: z
    .object({
      id: z.string(),
      name: z.string(),
      type: figmaNodeTypeSchema,
    })
    .passthrough(), // 追加のプロパティを許可
  stylesData: z
    .object({
      variables: z.array(variableInfoSchema),
      textStyles: z.array(styleInfoSchema),
      colorStyles: z.array(styleInfoSchema),
      effectStyles: z.array(styleInfoSchema),
      meta: z.object({
        variablesCount: z.number(),
        textStylesCount: z.number(),
        colorStylesCount: z.number(),
        effectStylesCount: z.number(),
        truncated: z.boolean(),
      }),
    })
    .optional(),
  evaluationTypes: z.array(z.string()).optional(),
  platformType: z.enum(['ios', 'android']).optional(),
  userId: z.string().optional(),
  screenshot: screenshotDataSchema.optional(),
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
      evaluationTypes: req.body.evaluationTypes,
      hasScreenshot: !!req.body.screenshot,
    });

    // デバッグ用: データをファイルに保存
    if (process.env.NODE_ENV === 'development') {
      saveDebugData(req.body.nodeData);

      // スクリーンショットがあれば保存
      if (req.body.screenshot) {
        saveScreenshot(req.body.screenshot);
        cleanupOldScreenshots();
      }
    }

    // バリデーション
    const validatedData = evaluationRequestSchema.parse(req.body);

    // 評価実行
    const result = await evaluationService.evaluateDesign(
      validatedData.nodeData,
      validatedData.stylesData,
      validatedData.evaluationTypes,
      validatedData.nodeId,
      validatedData.platformType
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
