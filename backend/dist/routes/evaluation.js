"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const evaluation_service_1 = require("../services/evaluation.service");
const debug_1 = require("../utils/debug");
const screenshot_1 = require("../utils/screenshot");
const router = (0, express_1.Router)();
const evaluationService = new evaluation_service_1.EvaluationService();
const variableInfoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    resolvedType: zod_1.z.string(),
    valuesByMode: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
const styleInfoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
// Figmaノードタイプのzodスキーマ
const figmaNodeTypeSchema = zod_1.z.enum([
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
]);
// スクリーンショットデータのスキーマ
const screenshotDataSchema = zod_1.z.object({
    imageData: zod_1.z.string(),
    nodeName: zod_1.z.string(),
    nodeId: zod_1.z.string(),
    byteSize: zod_1.z.number(),
});
// リクエストボディのバリデーションスキーマ
const evaluationRequestSchema = zod_1.z.object({
    fileKey: zod_1.z.string(),
    nodeId: zod_1.z.string(),
    nodeData: zod_1.z
        .object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        type: figmaNodeTypeSchema,
    })
        .passthrough(), // 追加のプロパティを許可
    stylesData: zod_1.z
        .object({
        variables: zod_1.z.array(variableInfoSchema),
        textStyles: zod_1.z.array(styleInfoSchema),
        colorStyles: zod_1.z.array(styleInfoSchema),
        effectStyles: zod_1.z.array(styleInfoSchema),
        meta: zod_1.z.object({
            variablesCount: zod_1.z.number(),
            textStylesCount: zod_1.z.number(),
            colorStylesCount: zod_1.z.number(),
            effectStylesCount: zod_1.z.number(),
            truncated: zod_1.z.boolean(),
        }),
    })
        .optional(),
    evaluationTypes: zod_1.z.array(zod_1.z.string()).optional(),
    userId: zod_1.z.string().optional(),
    userContext: zod_1.z.string().optional(),
    screenshot: screenshotDataSchema.optional(),
    apiKey: zod_1.z.string().min(1, 'API Key is required'),
});
/**
 * POST /api/evaluate
 * デザインを評価
 */
router.post('/evaluate', async (req, res) => {
    try {
        console.log('Received evaluation request:', {
            nodeId: req.body.nodeId,
            nodeName: req.body.nodeData?.name,
            evaluationTypes: req.body.evaluationTypes,
            hasScreenshot: !!req.body.screenshot,
        });
        // デバッグ用: データをファイルに保存
        if (process.env.NODE_ENV === 'development') {
            (0, debug_1.saveDebugData)(req.body.nodeData);
            // スクリーンショットがあれば保存
            if (req.body.screenshot) {
                (0, screenshot_1.saveScreenshot)(req.body.screenshot);
                (0, screenshot_1.cleanupOldScreenshots)();
            }
        }
        // バリデーション
        const validatedData = evaluationRequestSchema.parse(req.body);
        // 評価実行
        const result = await evaluationService.evaluateDesign(validatedData.nodeData, validatedData.apiKey, validatedData.stylesData, validatedData.evaluationTypes, validatedData.nodeId, validatedData.screenshot);
        const response = {
            success: true,
            data: result,
        };
        res.json(response);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const response = {
                success: false,
                error: 'Invalid request data',
                details: error.issues,
            };
            res.status(400).json(response);
        }
        else {
            console.error('Evaluation error:', error);
            const response = {
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
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
        },
    });
});
exports.default = router;
