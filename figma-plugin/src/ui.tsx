import { render } from '@create-figma-plugin/ui'
import { on, emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import type { EvaluationResult, Issue, Category } from './types'
import '!./output.css'

// 設定
const STORAGE_KEY = 'figma-ui-reviewer-selected-agents';
const AGENT_TIME_ESTIMATE = 30; // seconds per agent

const agentOptions = [
  {
    id: 'accessibility',
    label: 'アクセシビリティ',
    description: 'WCAG 2.2 AA準拠、色のコントラスト、タッチターゲットサイズを評価'
  },
  {
    id: 'designSystem',
    label: 'デザインシステム',
    description: '8pxグリッド、スペーシング、タイポグラフィの一貫性を評価'
  },
  {
    id: 'usability',
    label: 'ユーザビリティ',
    description: 'Nielsen\'s 10原則に基づき、使いやすさと直感性を評価'
  }
];

const categoryLabels: Record<string, string> = {
  accessibility: 'アクセシビリティ',
  designSystem: 'デザインシステム',
  usability: 'ユーザビリティ',
  layout: 'レイアウト',
  naming: '命名規則',
};

function Plugin() {
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['accessibility', 'designSystem', 'usability']);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // 初期化：保存された選択状態を復元
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSelectedAgents(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load agent selection:', e);
    }
  }, []);

  // 選択状態を保存
  const saveAgentSelection = useCallback((agents: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
  }, []);

  // チェックボックス変更ハンドラー
  const handleAgentChange = useCallback((agentId: string, checked: boolean) => {
    const newSelection = checked 
      ? [...selectedAgents, agentId]
      : selectedAgents.filter(id => id !== agentId);
    
    setSelectedAgents(newSelection);
    saveAgentSelection(newSelection);
  }, [selectedAgents, saveAgentSelection]);

  // 全選択/全解除
  const handleSelectAll = useCallback(() => {
    const allAgents = agentOptions.map(agent => agent.id);
    setSelectedAgents(allAgents);
    saveAgentSelection(allAgents);
  }, [saveAgentSelection]);

  const handleDeselectAll = useCallback(() => {
    setSelectedAgents([]);
    saveAgentSelection([]);
  }, [saveAgentSelection]);

  // 評価開始
  const handleEvaluate = useCallback(() => {
    if (selectedAgents.length === 0) {
      setError('評価項目を1つ以上選択してください');
      return;
    }

    setIsSettingsOpen(false);
    emit('EVALUATE_SELECTION', selectedAgents);
  }, [selectedAgents]);

  // プラグインメッセージ受信
  useEffect(() => {
    const unsubscribeError = on('ERROR', (message: string) => {
      setError(message);
      setIsLoading(false);
      setResult(null);
    });

    const unsubscribeEvaluationStarted = on('EVALUATION_STARTED', () => {
      setIsLoading(true);
      setError('');
      setResult(null);
    });

    const unsubscribeEvaluationComplete = on('EVALUATION_COMPLETE', (result: EvaluationResult) => {
      setIsLoading(false);
      setError('');
      setResult(result);
    });

    return () => {
      unsubscribeError();
      unsubscribeEvaluationStarted();
      unsubscribeEvaluationComplete();
    };
  }, []);

  // issue クリックハンドラー
  const handleIssueClick = useCallback((issue: Issue, rootNodeId?: string) => {
    const targetNodeId = issue.nodeId || rootNodeId;
    
    if (targetNodeId) {
      emit('SELECT_NODE', {
        nodeId: targetNodeId,
        nodeHierarchy: issue.nodeHierarchy,
        rootNodeId: rootNodeId,
      });
    }
  }, []);

  // 外部クリックでポップオーバーを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (isSettingsOpen && !target.closest('.settings-popover') && !target.closest('.settings-btn')) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSettingsOpen]);

  const estimatedTime = selectedAgents.length * AGENT_TIME_ESTIMATE;

  return (
    <div className="font-inter text-xs p-4 text-gray-800 bg-white h-full">
      {/* ヘッダー */}
      <div className="mb-3">
        <p className="text-gray-600 text-[11px] leading-relaxed">
          フレームまたはコンポーネントを選択して、デザイン品質を評価します。
        </p>
      </div>

      {/* コントロール */}
      <div className="flex gap-2 mb-5 relative">
        <button
          onClick={handleEvaluate}
          disabled={selectedAgents.length === 0}
          className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white border-none rounded-md text-xs font-medium transition-colors duration-200"
        >
          評価を開始
        </button>
        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="w-10 px-2.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center justify-center settings-btn"
          title="評価項目を選択"
        >
          ⚙️
        </button>

        {/* 設定ポップオーバー */}
        {isSettingsOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80 max-h-96 overflow-y-auto settings-popover">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-[13px]">評価項目の選択</span>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="bg-none border-none w-auto p-1 cursor-pointer text-gray-400 hover:text-gray-700 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* エージェントオプション */}
            {agentOptions.map(agent => (
              <div key={agent.id} className="mb-3 p-3 bg-gray-50 rounded-md">
                <div className="flex items-start gap-2 mb-1.5">
                  <input
                    type="checkbox"
                    id={`agent-${agent.id}`}
                    checked={selectedAgents.includes(agent.id)}
                    onChange={(e) => handleAgentChange(agent.id, e.currentTarget.checked)}
                    className="mt-0.5 cursor-pointer"
                  />
                  <label
                    htmlFor={`agent-${agent.id}`}
                    className="flex-1 font-medium text-xs cursor-pointer"
                  >
                    {agent.label}
                  </label>
                </div>
                <div className="text-[10px] text-gray-500 leading-tight ml-6">
                  {agent.description}
                </div>
              </div>
            ))}

            {/* アクション */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={handleSelectAll}
                className="flex-1 px-3 py-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border-none"
              >
                全選択
              </button>
              <button
                onClick={handleDeselectAll}
                className="flex-1 px-3 py-2 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border-none"
              >
                全解除
              </button>
            </div>

            {/* 選択情報 */}
            <div className="mt-3 p-2 bg-blue-50 rounded text-[10px] text-blue-800 text-center">
              {selectedAgents.length}項目選択中 • 約{estimatedTime}秒
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-[11px] mb-4 max-h-48 overflow-y-auto">
          <div className="font-semibold mb-1">エラーが発生しました</div>
          <div>{error}</div>
        </div>
      )}

      {/* ローディング */}
      {isLoading && (
        <div className="text-center py-5 text-gray-600">
          <div className="border-4 border-gray-100 border-t-blue-500 rounded-full w-8 h-8 animate-spin mx-auto mb-3"></div>
          <div>AI評価中...</div>
          <div className="text-[10px] mt-2 text-gray-400">
            {selectedAgents.length}項目を評価中 • 約{estimatedTime}秒ほどお待ちください
          </div>
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div>
          {/* スコアカード */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-lg mb-5 text-center">
            <div className="text-5xl font-bold mb-1">{result.overallScore}</div>
            <div className="text-[11px] opacity-90">総合スコア</div>
          </div>

          {/* カテゴリ */}
          {Object.entries(result.categories).map(([key, category]: [string, Category]) => (
            <div key={key} className="bg-gray-50 rounded-md p-3 mb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-xs">{categoryLabels[key] || key}</span>
                <span className="font-semibold text-xs text-blue-500">{category.score}点</span>
              </div>

              {/* Issues */}
              {category.issues.map((issue: Issue, index: number) => {
                const isClickable = issue.nodeId || result.metadata.rootNodeId;
                const severityColors = {
                  high: 'border-l-red-500',
                  medium: 'border-l-yellow-500',
                  low: 'border-l-green-500'
                } as const;
                const severityBadgeColors = {
                  high: 'bg-red-100 text-red-600',
                  medium: 'bg-yellow-100 text-yellow-700',
                  low: 'bg-green-100 text-green-600'
                } as const;

                return (
                  <button
                    key={index}
                    onClick={() => isClickable && handleIssueClick(issue, result.metadata.rootNodeId)}
                    disabled={!isClickable}
                    className={`
                      w-full text-left border-l-4 ${severityColors[issue.severity]}
                      p-2 mb-1.5 text-[11px] rounded-r bg-white
                      ${isClickable ? 'cursor-pointer hover:bg-gray-50 transition-colors duration-200' : 'cursor-default'}
                      border-none font-inherit color-inherit leading-inherit
                    `}
                  >
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1.5 ${severityBadgeColors[issue.severity]}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                    {issue.message}
                    {issue.suggestion && (
                      <div className="text-gray-600 mt-1 text-[10px]">
                        💡 {issue.suggestion}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Positives */}
              {category.positives && category.positives.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  {category.positives.map((positive: string, index: number) => (
                    <div key={index} className="text-green-600 text-[11px] mb-1 pl-4 relative">
                      <span className="absolute left-0 font-bold">✓</span>
                      {positive}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* メタデータ */}
          <div className="mt-4 pt-4 border-t border-gray-200 text-[10px] text-gray-600 text-center">
            評価完了: {new Date(result.metadata.evaluatedAt).toLocaleString('ja-JP')}
            <br />
            処理時間: {(result.metadata.duration / 1000).toFixed(1)}秒
            {result.metadata.usage && (
              <div>
                <br />
                トークン使用量: {result.metadata.usage.totalInputTokens.toLocaleString()} 入力 / {result.metadata.usage.totalOutputTokens.toLocaleString()} 出力
                {result.metadata.usage.totalCachedTokens > 0 && ` / ${result.metadata.usage.totalCachedTokens.toLocaleString()} キャッシュ`}
                <br />
                推定コスト: ${result.metadata.usage.estimatedCost.toFixed(4)}
              </div>
            )}
          </div>

          {/* API ステータス */}
          <div className="text-[10px] text-green-600 text-center mt-2 p-2 bg-green-50 rounded">
            ✓ API接続成功
          </div>
        </div>
      )}
    </div>
  );
}

export default render(Plugin)
