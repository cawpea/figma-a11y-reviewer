import express, { Express } from 'express';
import request from 'supertest';

import evaluationRouter from './evaluation';

// EvaluationServiceをモック
jest.mock('../services/evaluation.service');
jest.mock('../utils/debug');
jest.mock('../utils/screenshot');

describe('POST /api/evaluate', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', evaluationRouter);
  });

  const validRequestBody = {
    fileKey: 'test-file-key',
    nodeId: '1:2',
    nodeData: {
      id: '1:2',
      name: 'Test Frame',
      type: 'FRAME' as const,
    },
  };

  describe('バリデーション', () => {
    it('必須フィールドが欠けている場合は400エラーを返す', async () => {
      const response = await request(app).post('/api/evaluate').send({
        fileKey: 'test-file-key',
        // nodeIdとnodeDataが欠けている
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });
  });
});

describe('GET /api/health', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', evaluationRouter);
  });

  it('ヘルスチェックが成功する', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.timestamp).toBeDefined();
  });
});
