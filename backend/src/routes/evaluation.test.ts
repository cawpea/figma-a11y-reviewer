import express, { Express } from 'express';
import request from 'supertest';

import { USER_CONTEXT_MAX_LENGTH } from '../../../shared/src/constants';

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

  describe('userContextバリデーション', () => {
    it('userContextが制限以内の場合は受け付ける', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          ...validRequestBody,
          userContext: 'a'.repeat(USER_CONTEXT_MAX_LENGTH),
        });

      expect(response.status).not.toBe(400);
    });

    it('userContextがtrim後に制限以内の場合は受け付ける', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          ...validRequestBody,
          userContext: '  ' + 'a'.repeat(USER_CONTEXT_MAX_LENGTH) + '  ',
        });

      expect(response.status).not.toBe(400);
    });

    it('userContextが制限を超える場合は400エラーを返す', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          ...validRequestBody,
          userContext: 'a'.repeat(USER_CONTEXT_MAX_LENGTH + 1),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(response.body.details).toBeDefined();
    });

    it('userContextがtrim後に制限を超える場合は400エラーを返す', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          ...validRequestBody,
          userContext: '  ' + 'a'.repeat(USER_CONTEXT_MAX_LENGTH + 1) + '  ',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });

    it('userContextが空文字列の場合は受け付ける', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          ...validRequestBody,
          userContext: '',
        });

      expect(response.status).not.toBe(400);
    });

    it('userContextが省略された場合は受け付ける', async () => {
      const response = await request(app).post('/api/evaluate').send(validRequestBody);

      expect(response.status).not.toBe(400);
    });

    it('userContextが空白のみの場合は受け付ける（trim後は0文字）', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          ...validRequestBody,
          userContext: '   ',
        });

      expect(response.status).not.toBe(400);
    });
  });

  describe('その他のバリデーション', () => {
    it('必須フィールドが欠けている場合は400エラーを返す', async () => {
      const response = await request(app).post('/api/evaluate').send({
        fileKey: 'test-file-key',
        // nodeIdとnodeDataが欠けている
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
    });

    it('platformTypeが無効な値の場合は400エラーを返す', async () => {
      const response = await request(app)
        .post('/api/evaluate')
        .send({
          ...validRequestBody,
          platformType: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
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
