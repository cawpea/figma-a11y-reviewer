import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';

import { errorHandler } from './middleware/error-handler';
import evaluationRoutes from './routes/evaluation';
import { cleanupOldDebugFiles } from './utils/debug';

// 環境変数を読み込む
dotenv.config();

// ★ デバッグ: 環境変数の読み込み確認
console.log('========== Environment Variables Check ==========');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=================================================');

const app = express();
const PORT = process.env.PORT || 3000;

// FigmaプラグインからのCORSリクエストに対応
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'https://www.figma.com',
        'http://localhost:3000',
      ];

      // origin が undefined, null, 'null' の場合は許可
      // （Figmaプラグインやプリフライトリクエストの場合）
      if (!origin || origin === 'null') {
        callback(null, true);
      }
      else if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' })); // Figmaデータが大きい可能性

// ロギングミドルウェア
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', evaluationRoutes);

// エラーハンドラー
app.use(errorHandler);

if (process.env.NODE_ENV === 'development') {
  // サーバー起動
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/evaluate`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  });

  cleanupOldDebugFiles();
}

// Cloud Functions用エクスポート
export const api = onRequest(
  {
    region: 'asia-northeast1', // 東京リージョン
    timeoutSeconds: 300,
    memory: '1GiB',
    invoker: 'public', // 未認証アクセスを許可（Figmaプラグインからのアクセスに必要）
  },
  app
);
