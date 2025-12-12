import { Textbox, IconButton } from '@create-figma-plugin/ui';
import { IconPassword16, IconVisible16 } from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useState } from 'preact/hooks';

import Heading from './Heading';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  isValid: (value: string) => boolean;
}

export function ApiKeyInput({ value, onChange, isValid }: ApiKeyInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggleVisibility = () => {
    setShowPassword(!showPassword);
  };

  const showValidationError = value.length > 0 && !isValid(value);

  return (
    <section>
      <div className="flex justify-between items-center">
        <Heading
          rightContent={
            <a
              className="text-[11px] text-blue-600 underline"
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              API Keyを取得
            </a>
          }
        >
          API Key (Claude)
        </Heading>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center w-full gap-1 [&>*:first-child]:flex-1">
          <Textbox
            value={value}
            onValueInput={onChange}
            placeholder="sk-ant-api03-..."
            password={!showPassword}
          />
          <IconButton onClick={handleToggleVisibility}>
            {showPassword ? <IconVisible16 /> : <IconPassword16 />}
          </IconButton>
        </div>
        {showValidationError && (
          <p className="text-red-600 text-[10px]">
            API Keyは "sk-ant-api03-" で始まる必要があります
          </p>
        )}
        {!showValidationError && (
          <p className="text-gray-600 text-[10px]">このAPI Keyはデバイスにローカルに保存されます</p>
        )}
      </div>
    </section>
  );
}
