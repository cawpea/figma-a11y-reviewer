"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const https_1 = require("firebase-functions/v2/https");
const error_handler_1 = require("./middleware/error-handler");
const evaluation_1 = __importDefault(require("./routes/evaluation"));
const debug_1 = require("./utils/debug");
// 環境変数を読み込む
dotenv_1.default.config();
// ★ デバッグ: 環境変数の読み込み確認
console.log('========== Environment Variables Check ==========');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=================================================');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// FigmaプラグインからのCORSリクエストに対応
app.use((0, cors_1.default)({
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
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' })); // Figmaデータが大きい可能性
// ロギングミドルウェア
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Routes
app.use('/api', evaluation_1.default);
// エラーハンドラー
app.use(error_handler_1.errorHandler);
if (process.env.NODE_ENV === 'development') {
    // サーバー起動
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoint: http://localhost:${PORT}/api/evaluate`);
        console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
    });
    (0, debug_1.cleanupOldDebugFiles)();
}
// Cloud Functions用エクスポート
exports.api = (0, https_1.onRequest)({
    region: 'asia-northeast1', // 東京リージョン
    timeoutSeconds: 300,
    memory: '1GiB',
    invoker: 'public', // 未認証アクセスを許可（Figmaプラグインからのアクセスに必要）
}, app);
