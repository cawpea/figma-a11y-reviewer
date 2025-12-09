import type { TextboxMultilineProps } from '@create-figma-plugin/ui';
import { TextboxMultiline } from '@create-figma-plugin/ui';
import { h } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

interface TextboxMultilineWithLimitProps extends Omit<TextboxMultilineProps, 'onValueInput'> {
  /**
   * Maximum character limit for the input.
   * If not provided, the component behaves as a standard TextboxMultiline.
   */
  limit?: number;

  /**
   * Extended callback with isOverLimit flag.
   * Called whenever the input value changes.
   */
  onValueInput?: (value: string, options: { isOverLimit: boolean }) => void;

  /**
   * HTML id attribute for the textarea element
   */
  id?: string;

  /**
   * Additional HTML attributes for the textarea
   */
  [key: string]: unknown;
}

export default function TextboxMultilineWithLimit({
  limit,
  value,
  onValueInput,
  ...restProps
}: TextboxMultilineWithLimitProps) {
  // Calculate character count and over-limit status using trimmed length
  const trimmedLength = value.trim().length;
  const isOverLimit = limit !== undefined && trimmedLength > limit;

  // Memoize character count display (show trimmed length)
  const characterCountText = useMemo(() => {
    if (limit === undefined) return null;
    return `${trimmedLength}/${limit}`;
  }, [trimmedLength, limit]);

  // Handle value input with isOverLimit flag (check trimmed length)
  const handleValueInput = useCallback(
    (newValue: string) => {
      if (!onValueInput) return;

      const newTrimmedLength = newValue.trim().length;
      const newIsOverLimit = limit !== undefined && newTrimmedLength > limit;
      onValueInput(newValue, { isOverLimit: newIsOverLimit });
    },
    [onValueInput, limit]
  );

  // Don't render character count or error if no limit is set
  if (limit === undefined) {
    return (
      <TextboxMultiline
        value={value}
        onValueInput={onValueInput as ((value: string) => void) | undefined}
        {...restProps}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Textbox with conditional error styling */}
      <div className={isOverLimit ? 'border border-red-600 rounded' : ''}>
        <TextboxMultiline value={value} onValueInput={handleValueInput} {...restProps} />
      </div>

      {/* Character count and error message container */}
      <div className="flex justify-between items-start mt-1 gap-2">
        {/* Error message (left side) */}
        {isOverLimit && (
          <p className="text-[10px] text-red-600 flex-1">{limit}文字以内で入力してください</p>
        )}

        {/* Spacer when no error */}
        {!isOverLimit && <div className="flex-1" />}

        {/* Character count (right side) */}
        <p
          className={`text-[10px] whitespace-nowrap ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}
        >
          {characterCountText}
        </p>
      </div>
    </div>
  );
}
