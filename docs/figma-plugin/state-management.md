# State Management（状態管理）

このドキュメントでは、Figmaプラグインにおける状態の永続化とUI-main.ts間のデータ通信について説明します。

## 📋 概要

Figmaプラグインは**サンドボックス環境**で動作するため、通常のWebアプリとは異なるアーキテクチャが必要です。

**主な制約:**

- UI側（iframe内）から`figma` APIに直接アクセスできない
- `localStorage`が使用できない（Figma Desktop環境）
- UI側とmain.ts側は**メッセージパッシング**で通信する必要がある

**永続化の実装パターン:**

```
[UI] useEffect / Context
  ↓ emit('LOAD_*')
[main.ts] figma.clientStorage.getAsync()
  ↓ emit('*_LOADED', data)
[UI] setState(data)

[UI] ユーザー操作
  ↓ emit('SAVE_*', data)
[main.ts] figma.clientStorage.setAsync()
```

## 🏗️ アーキテクチャ

### データフローの全体像

```
┌─────────────────────────────────────────────────────────┐
│ UI側（iframe内） - Preactコンポーネント                   │
│                                                           │
│  ┌─────────────────────────────────────────────┐        │
│  │ useState / Context                          │        │
│  │ ・selectedAgents                             │        │
│  │ ・selectedPlatform                           │        │
│  │ ・featureFlags                               │        │
│  └─────────────────────────────────────────────┘        │
│           │                           ▲                  │
│           │ emit('LOAD_*')            │ on('*_LOADED')   │
│           ▼                           │                  │
└───────────────────────────────────────────────────────────┘
            │                           │
    ════════╪═══════ Message Passing ═══╪═══════════
            │                           │
┌───────────▼───────────────────────────┴───────────────────┐
│ main.ts（プラグインサンドボックス）                        │
│                                                            │
│  ┌─────────────────────────────────────────────┐         │
│  │ Event Handlers                              │         │
│  │ ・on('LOAD_*')                               │         │
│  │ ・on('SAVE_*')                               │         │
│  └─────────────────────────────────────────────┘         │
│           │                           ▲                   │
│           │ getAsync()                │ emit('*_LOADED')  │
│           ▼                           │                   │
│  ┌─────────────────────────────────────────────┐         │
│  │ figma.clientStorage                         │         │
│  │ ・'figma-ui-reviewer-selected-agents'        │         │
│  │ ・'figma-ui-reviewer-selected-platform'      │         │
│  │ ・'feature-flags'                            │         │
│  └─────────────────────────────────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 💻 実装パターン

### パターン1: エージェント選択状態の管理

<!-- CODE_REF: figma-plugin/src/components/Plugin/hooks/useAgentSelection.ts -->

#### UI側の実装

```typescript
export function useAgentSelection(agentOptions: AgentOption[]) {
  // 1. 初期状態は空配列（ちらつき防止）
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  // 2. 初期化時に保存された状態を読み込み
  useEffect(() => {
    const handleAgentSelectionLoaded = ({
      selectedAgents: savedAgents,
      selectedPlatform: savedPlatform,
    }) => {
      // 保存された選択状態がある場合は復元（空の配列も含む）
      if (savedAgents !== null && Array.isArray(savedAgents)) {
        setSelectedAgents(savedAgents);
      } else {
        // 保存された選択状態がない場合（null）はすべて選択
        setSelectedAgents(agentOptions.map((agent) => agent.id));
      }
    };

    on('AGENT_SELECTION_LOADED', handleAgentSelectionLoaded);
    emit('LOAD_AGENT_SELECTION');
  }, [agentOptions]);

  // 3. 状態変更時に保存
  const saveAgentSelection = useCallback((agents: string[]) => {
    emit('SAVE_AGENT_SELECTION', agents);
  }, []);

  // 4. ユーザー操作ハンドラー
  const handleAgentChange = useCallback(
    (agentId: string, checked: boolean) => {
      const newSelection = checked
        ? [...selectedAgents, agentId]
        : selectedAgents.filter((id) => id !== agentId);

      setSelectedAgents(newSelection);
      saveAgentSelection(newSelection);
    },
    [selectedAgents, saveAgentSelection]
  );

  return { selectedAgents, handleAgentChange };
}
```

<!-- CODE_REF: figma-plugin/src/main.ts:313-348 -->

#### main.ts側の実装

```typescript
// ストレージキーの定義
const AGENT_SELECTION_STORAGE_KEY = 'figma-ui-reviewer-selected-agents';
const PLATFORM_SELECTION_STORAGE_KEY = 'figma-ui-reviewer-selected-platform';

// 読み込みハンドラー
on('LOAD_AGENT_SELECTION', async () => {
  try {
    const selectedAgents = await figma.clientStorage.getAsync(
      AGENT_SELECTION_STORAGE_KEY
    );
    const selectedPlatform = await figma.clientStorage.getAsync(
      PLATFORM_SELECTION_STORAGE_KEY
    );
    emit('AGENT_SELECTION_LOADED', {
      selectedAgents: selectedAgents || null,
      selectedPlatform: selectedPlatform || null,
    });
  } catch (e) {
    console.error('Failed to load agent selection:', e);
    emit('AGENT_SELECTION_LOADED', {
      selectedAgents: null,
      selectedPlatform: null,
    });
  }
});

// 保存ハンドラー（エージェント）
on('SAVE_AGENT_SELECTION', async (selectedAgents: string[]) => {
  try {
    await figma.clientStorage.setAsync(
      AGENT_SELECTION_STORAGE_KEY,
      selectedAgents
    );
  } catch (e) {
    console.error('Failed to save agent selection:', e);
  }
});

// 保存ハンドラー（プラットフォーム）
on('SAVE_PLATFORM_SELECTION', async (selectedPlatform: 'ios' | 'android') => {
  try {
    await figma.clientStorage.setAsync(
      PLATFORM_SELECTION_STORAGE_KEY,
      selectedPlatform
    );
  } catch (e) {
    console.error('Failed to save platform selection:', e);
  }
});
```

### パターン2: 機能フラグの管理

<!-- CODE_REF: figma-plugin/src/contexts/FeatureFlagContext/index.tsx -->
<!-- CODE_REF: figma-plugin/src/main.ts:292-311 -->

機能フラグも同じパターンを使用します。詳細は[feature-toggles.md](./feature-toggles.md)を参照してください。

## 🔑 重要な実装ポイント

### 1. 初期化順序の最適化

<!-- CODE_REF: figma-plugin/src/components/Plugin/hooks/useAgentSelection.ts:16-50 -->

**問題**: デフォルト値を設定すると、復元前に一瞬表示されてちらつく

**解決策**:

1. 初期状態は空配列（`useState<string[]>([])`)
2. `AGENT_SELECTION_LOADED`イベントで適切な値を設定
3. `null`の場合はデフォルト値、それ以外は保存された値を使用

```typescript
// ❌ 悪い例: ちらつきが発生
const [selectedAgents, setSelectedAgents] = useState<string[]>(
  agentOptions.map((agent) => agent.id) // デフォルトで全選択
);

// ✅ 良い例: ちらつきなし
const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

useEffect(() => {
  const handleLoaded = ({ selectedAgents: saved }) => {
    if (saved !== null && Array.isArray(saved)) {
      setSelectedAgents(saved); // 保存された値を復元
    } else {
      setSelectedAgents(agentOptions.map((a) => a.id)); // デフォルト値
    }
  };
  // ...
}, []);
```

### 2. null vs 空配列の区別

**重要**: `null`と空配列`[]`は異なる意味を持ちます。

- **`null`**: 保存されたデータが存在しない（初回起動）
- **`[]`**: ユーザーが明示的にすべて選択解除した

```typescript
// nullチェックで区別
if (savedAgents !== null && Array.isArray(savedAgents)) {
  // 保存されたデータがある（空配列も含む）
  setSelectedAgents(savedAgents);
} else {
  // 保存されたデータがない → デフォルト値
  setSelectedAgents(defaultAgents);
}
```

### 3. エラーハンドリング

<!-- CODE_REF: figma-plugin/src/main.ts:317-332 -->

`figma.clientStorage`の操作は失敗する可能性があるため、必ずtry-catchで囲みます。

```typescript
on('LOAD_*', async () => {
  try {
    const data = await figma.clientStorage.getAsync(KEY);
    emit('*_LOADED', { data: data || null });
  } catch (e) {
    console.error('Failed to load:', e);
    emit('*_LOADED', { data: null }); // エラー時はnullを返す
  }
});
```

### 4. useEffectの依存配列

<!-- CODE_REF: figma-plugin/src/components/Plugin/hooks/useAgentSelection.ts:50 -->

`useEffect`の依存配列には、デフォルト値の計算に使用する値を含めます。

```typescript
useEffect(() => {
  // agentOptionsを使用してデフォルト値を計算
  const handleLoaded = ({ selectedAgents: saved }) => {
    if (saved === null) {
      setSelectedAgents(agentOptions.map((a) => a.id));
    }
  };
  // ...
}, [agentOptions]); // agentOptionsを依存配列に含める
```

## 🚫 避けるべきパターン

### ❌ UI側から直接figma APIにアクセス

```typescript
// ❌ これは動作しません！
function useAgentSelection() {
  useEffect(() => {
    // UI側からfigma.clientStorageにアクセスできない
    const saved = await figma.clientStorage.getAsync(KEY); // Error!
  }, []);
}
```

### ❌ localStorageの使用

```typescript
// ❌ Figma Desktopでは動作しません！
function useAgentSelection() {
  useEffect(() => {
    const saved = localStorage.getItem(KEY); // Figma Desktopで使用不可
  }, []);
}
```

### ❌ デフォルト値を初期stateに設定

```typescript
// ❌ ちらつきが発生します！
const [selectedAgents, setSelectedAgents] = useState<string[]>(
  defaultAgents // 復元前に一瞬表示される
);
```

## 🧪 テスト

<!-- CODE_REF: figma-plugin/src/components/Plugin/hooks/useAgentSelection.test.ts -->

### メッセージングのモック

```typescript
let messageHandlers: Record<string, (data: any) => void> = {};

const mockEmit = jest.fn((event: string, data?: any) => {
  // LOAD_*が呼ばれたら即座に*_LOADEDを発火
  if (event === 'LOAD_AGENT_SELECTION') {
    setTimeout(() => {
      messageHandlers['AGENT_SELECTION_LOADED']?.({
        selectedAgents: null,
        selectedPlatform: null,
      });
    }, 0);
  }
});

const mockOn = jest.fn((event: string, handler: (data: any) => void) => {
  messageHandlers[event] = handler;
});

jest.mock('@create-figma-plugin/utilities', () => ({
  emit: mockEmit,
  on: mockOn,
}));
```

### 初期化のテスト

```typescript
it('保存された選択状態がない場合はすべて選択される', async () => {
  const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

  // 初期状態は空配列
  expect(result.current.selectedAgents).toEqual([]);

  // AGENT_SELECTION_LOADEDが発火されるとすべて選択される
  await waitFor(() => {
    expect(result.current.selectedAgents).toEqual([
      'accessibility',
      'styleConsistency',
      'usability',
    ]);
  });
});

it('空の配列が保存されている場合も空として復元される', async () => {
  mockEmit.mockImplementation((event) => {
    if (event === 'LOAD_AGENT_SELECTION') {
      setTimeout(() => {
        messageHandlers['AGENT_SELECTION_LOADED']?.({
          selectedAgents: [], // 空配列
          selectedPlatform: 'ios',
        });
      }, 0);
    }
  });

  const { result } = renderHook(() => useAgentSelection(mockAgentOptions));

  await waitFor(() => {
    expect(result.current.selectedAgents).toEqual([]); // 空配列として復元
  });
});
```

## 📚 実装例一覧

### 現在の実装

| 状態                 | UI側の実装             | main.ts側のイベント         | ストレージキー                        |
| -------------------- | ---------------------- | --------------------------- | ------------------------------------- |
| エージェント選択     | `useAgentSelection.ts` | `LOAD/SAVE_AGENT_SELECTION` | `figma-ui-reviewer-selected-agents`   |
| プラットフォーム選択 | `useAgentSelection.ts` | `SAVE_PLATFORM_SELECTION`   | `figma-ui-reviewer-selected-platform` |
| 機能フラグ           | `FeatureFlagContext/`  | `LOAD/SAVE_FEATURE_FLAGS`   | `feature-flags`                       |

### 新しい状態を追加する場合

1. **UI側**: カスタムフックまたはContextを作成
2. **main.ts**: イベントハンドラーを追加
3. **shared/types.ts**: イベントの型定義を追加（必要に応じて）

## 🔗 関連ドキュメント

- [Feature Toggles](./feature-toggles.md) - 機能フラグの実装例
- [アーキテクチャ概要](../architecture/overview.md) - システム全体の構成
- [Figma API公式ドキュメント](https://www.figma.com/plugin-docs/api/figma-clientStorage/) -
  clientStorage API

## ⚠️ 注意事項

### figma.clientStorageの制約

- **アクセス可能な場所**: main.tsのみ
- **データ型**: JSONシリアライズ可能なオブジェクトのみ
- **非同期API**: `getAsync()`と`setAsync()`を使用
- **容量制限**: 不明（公式ドキュメントに記載なし）

### メッセージパッシングの制約

<!-- CODE_REF: figma-plugin/src/components/Plugin/hooks/useAgentSelection.ts:42-49 -->

- **イベントハンドラーの登録解除**:
  `@create-figma-plugin/utilities`の`on()`は登録解除の仕組みを提供していないため、複数回マウントされる場合に重複して実行される可能性がある
- **非同期通信**:
  UI側からの要求とmain.ts側からの応答は非同期のため、`waitFor()`などで待機する必要がある

### パフォーマンス考慮事項

- **頻繁な保存は避ける**: 各操作で保存するのではなく、適切なタイミングでバッチ保存を検討
- **初期化の最適化**: 不要なデフォルト値の設定を避け、ちらつきを防止
