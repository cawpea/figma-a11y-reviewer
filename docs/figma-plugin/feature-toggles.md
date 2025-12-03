# Feature Toggles（機能トグル）

このドキュメントでは、Figmaプラグインの機能トグルシステムについて説明します。

## 📋 概要

機能トグルは、開発時に実験的な機能や開発中の機能を有効/無効にするためのシステムです。

**主な特徴:**

- 開発環境（`NODE_ENV=development`）でのみ表示
- 右下のフローティングボタンから設定画面にアクセス
- `figma.clientStorage`による永続化
- React Context + メッセージパッシングによる状態管理

## 🎯 使用目的

- 開発中の機能を段階的にリリース
- A/Bテストや実験的機能の管理
- デバッグモードやログ出力の切り替え
- プラットフォーム固有の機能の制御

## 🏗️ アーキテクチャ

### データフロー

```
[UI] FeatureFlagContext
  ↓ emit('LOAD_FEATURE_FLAGS')
[main.ts] figma.clientStorage.getAsync()
  ↓ emit('FEATURE_FLAGS_LOADED', flags)
[UI] Context state更新

[UI] toggleFlag()
  ↓ emit('SAVE_FEATURE_FLAGS', flags)
[main.ts] figma.clientStorage.setAsync()
  ↓ emit('FEATURE_FLAGS_SAVED')
[UI] 完了
```

### 主要コンポーネント

<!-- CODE_REF: figma-plugin/src/components/FeatureTogglePanel/index.tsx -->

**FeatureTogglePanel**: 機能トグルUIのコンテナコンポーネント

- 開発環境チェック（本番では非表示）
- フローティングボタンとポップアップメニューの制御
- クリック外検出による自動クローズ

<!-- CODE_REF: figma-plugin/src/contexts/FeatureFlagContext/index.tsx -->

**FeatureFlagProvider**: Context プロバイダー

- 機能フラグの状態管理（メモリ内）
- main.tsとのメッセージパッシング
- フラグのトグル・セット機能

### 永続化

<!-- CODE_REF: figma-plugin/src/main.ts:267-286 -->

機能フラグは`figma.clientStorage` APIを使用して永続化されます:

```typescript
const FEATURE_FLAGS_STORAGE_KEY = 'feature-flags';

// 読み込み
on('LOAD_FEATURE_FLAGS', async () => {
  const flags = await figma.clientStorage.getAsync(FEATURE_FLAGS_STORAGE_KEY);
  emit('FEATURE_FLAGS_LOADED', flags || {});
});

// 保存
on('SAVE_FEATURE_FLAGS', async (flags: Record<string, boolean>) => {
  await figma.clientStorage.setAsync(FEATURE_FLAGS_STORAGE_KEY, flags);
});
```

**重要**: Figmaプラグインでは`localStorage`が使用できないため、`figma.clientStorage`を使用します。

## 💻 使い方

### 1. 機能トグルUIにアクセス

開発環境（`npm run build:dev`でビルド）でプラグインを起動すると、右下に青いフローティングボタンが表示されます。

ボタンをクリックすると、機能トグル設定メニューが開きます。

### 2. コンポーネントで機能フラグを使用

<!-- CODE_REF: figma-plugin/src/contexts/FeatureFlagContext/useFeatureFlags.ts -->

```typescript
import { useFeatureFlags } from '../../contexts/FeatureFlagContext/useFeatureFlags';
import { FeatureFlag } from '../../constants/featureFlags';

function MyComponent() {
  const { isEnabled } = useFeatureFlags();

  return (
    <div>
      {isEnabled(FeatureFlag.EXAMPLE_FEATURE) && (
        <ExperimentalFeature />
      )}
    </div>
  );
}
```

### 3. 新しい機能フラグを追加

<!-- CODE_REF: figma-plugin/src/constants/featureFlags.ts -->

`src/constants/featureFlags.ts`を編集:

```typescript
export enum FeatureFlag {
  EXAMPLE_FEATURE = 'example_feature',
  MY_NEW_FEATURE = 'my_new_feature', // 追加
}

export const featureFlagConfigs: FeatureFlagConfig[] = [
  // ... 既存のフラグ ...
  {
    key: FeatureFlag.MY_NEW_FEATURE,
    label: '新しい機能',
    description: 'この機能の説明',
    defaultEnabled: false,
  },
];
```

これだけで、機能トグルUIに新しいフラグが表示されます。

## 🔧 実装詳細

### ディレクトリ構成

```
src/
├── constants/
│   └── featureFlags.ts          # フラグ定義
├── contexts/
│   └── FeatureFlagContext/
│       ├── index.tsx            # Provider
│       ├── types.ts             # 型定義
│       └── useFeatureFlags.ts   # カスタムフック
├── hooks/
│   └── useClickOutside.ts       # クリック外検出フック
└── components/
    └── FeatureTogglePanel/
        ├── index.tsx                    # コンテナ
        ├── FeatureToggleButton.tsx      # ボタン
        └── FeatureToggleMenu.tsx        # メニュー
```

### 型定義

<!-- CODE_REF: figma-plugin/src/constants/featureFlags.ts:1-14 -->

```typescript
export enum FeatureFlag {
  EXAMPLE_FEATURE = 'example_feature',
}

export interface FeatureFlagConfig {
  key: FeatureFlag;
  label: string;
  description: string;
  defaultEnabled: boolean;
}
```

<!-- CODE_REF: figma-plugin/src/contexts/FeatureFlagContext/types.ts -->

```typescript
export interface FeatureFlagContextValue {
  flags: Record<FeatureFlag, boolean>;
  isEnabled: (flag: FeatureFlag) => boolean;
  toggleFlag: (flag: FeatureFlag) => void;
  setFlag: (flag: FeatureFlag, enabled: boolean) => void;
}
```

### useFeatureFlagsフックAPI

| メソッド | 説明 | 戻り値 |
|---------|------|--------|
| `isEnabled(flag)` | フラグが有効かチェック | `boolean` |
| `toggleFlag(flag)` | フラグをトグル | `void` |
| `setFlag(flag, enabled)` | フラグを明示的にセット | `void` |
| `flags` | すべてのフラグの状態 | `Record<FeatureFlag, boolean>` |

### UIコンポーネント

#### FeatureToggleButton

<!-- CODE_REF: figma-plugin/src/components/FeatureTogglePanel/FeatureToggleButton.tsx -->

- 位置: `fixed bottom-4 right-4`
- スタイル: 青色の丸ボタン、ホバーエフェクト
- z-index: 40（通常のUI要素の上）
- アイコン: トグルスイッチのSVG

#### FeatureToggleMenu

<!-- CODE_REF: figma-plugin/src/components/FeatureTogglePanel/FeatureToggleMenu.tsx -->

- 位置: ボタンの上（`fixed bottom-20 right-4`）
- 幅: 320px
- z-index: 50（LoadingViewと同レベル）
- アニメーション: スライドアップ（`animate-slide-up`）

**構造:**
```
[ヘッダー]
  機能トグル設定     [×]

[フラグリスト]
  ☐ フラグ名
     説明文

[フッター]
  Development環境でのみ表示されます
```

### スタイリング

<!-- CODE_REF: figma-plugin/tailwind.config.js:12-20 -->

カスタムアニメーションを使用:

```javascript
animation: {
  'slide-up': 'slideUp 0.2s ease-out',
},
keyframes: {
  slideUp: {
    '0%': { transform: 'translateY(10px)', opacity: '0' },
    '100%': { transform: 'translateY(0)', opacity: '1' },
  },
},
```

## 🧪 テスト

### テスト方針

<!-- CODE_REF: figma-plugin/src/components/FeatureTogglePanel/index.test.tsx -->

環境別の表示テスト:

```typescript
it('開発環境でボタンが表示される', () => {
  mockProcessEnv('development');
  render(<FeatureFlagProvider><FeatureTogglePanel /></FeatureFlagProvider>);
  expect(screen.getByRole('button')).toBeTruthy();
});

it('本番環境でボタンが表示されない', () => {
  mockProcessEnv('production');
  const { container } = render(<FeatureFlagProvider><FeatureTogglePanel /></FeatureFlagProvider>);
  expect(container.firstChild).toBeNull();
});
```

## ⚠️ 注意事項

### 環境変数のビルド時埋め込み

<!-- CODE_REF: figma-plugin/build-figma-plugin.config.js:18-24 -->

`NODE_ENV`はビルド時に埋め込まれます:

```javascript
define: {
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
}
```

環境変数を変更した場合は、必ず再ビルドが必要です:

```bash
# 開発環境用
npm run build:dev

# 本番環境用
npm run build:prod
```

### figma.clientStorageについて

- **利用可能な場所**: main.ts（プラグインサンドボックス）のみ
- **UI側からのアクセス**: emit/onによるメッセージパッシングが必要
- **非同期API**: `getAsync()`と`setAsync()`を使用
- **データ型**: JSONシリアライズ可能なオブジェクト

### 既存コードの課題

現在の`useAgentSelection.ts`は`localStorage`を使用していますが、Figma Desktop環境では動作しません。将来的に`figma.clientStorage`への移行を検討する必要があります。

### Z-indexレイヤリング

- **FeatureToggleButton**: z-40（通常のUI要素の上）
- **FeatureToggleMenu**: z-50（LoadingViewと同レベル）
- **LoadingView**: z-50（全画面オーバーレイ）

LoadingView表示中は操作がブロックされるため、視覚的な競合はありません。

## 🔍 トラブルシューティング

### フラグが保存されない

- `figma.clientStorage`のエラーログを確認
- main.tsのイベントハンドラーが正しく登録されているか確認

### 本番環境でボタンが表示される

- ビルド環境を確認: `npm run build:prod`を実行
- `process.env.NODE_ENV`が正しく埋め込まれているか確認

### フラグの状態が復元されない

- `LOAD_FEATURE_FLAGS`イベントが正しく発火しているか確認
- `figma.clientStorage.getAsync`のエラーログを確認

## 🔗 関連ファイル

| ファイル | 説明 |
|---------|------|
| `shared/src/types.ts` | 機能フラグイベント型定義 |
| `figma-plugin/src/main.ts` | figma.clientStorageハンドラー |
| `figma-plugin/src/ui.tsx` | FeatureFlagProvider統合 |
| `figma-plugin/src/env.d.ts` | NODE_ENV型定義 |
| `figma-plugin/build-figma-plugin.config.js` | ビルド設定 |
