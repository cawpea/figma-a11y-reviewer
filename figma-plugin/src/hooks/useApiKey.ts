import { emit, on } from '@create-figma-plugin/utilities';
import { LoadApiKeyHandler, ApiKeyLoadedHandler, SaveApiKeyHandler } from '@shared/types';
import { useEffect, useState } from 'preact/hooks';

/**
 * API Keyの状態管理フック
 * figma.clientStorageへの保存/読み込みを管理
 */
export function useApiKey() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // API Keyの読み込みを要求
    emit<LoadApiKeyHandler>('LOAD_API_KEY');

    // API Keyが読み込まれたら状態を更新
    const unsubscribe = on<ApiKeyLoadedHandler>('API_KEY_LOADED', (loadedKey: string | null) => {
      setApiKey(loadedKey || '');
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * API Keyを保存
   */
  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    emit<SaveApiKeyHandler>('SAVE_API_KEY', newKey);
  };

  /**
   * API Keyのバリデーション
   */
  const isValid = (key: string): boolean => {
    return key.startsWith('sk-ant-api03-') && key.length >= 200;
  };

  return {
    apiKey,
    isLoading,
    handleApiKeyChange,
    isValid,
  };
}
