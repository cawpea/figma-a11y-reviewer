module.exports = {
  // 基本設定
  printWidth: 100, // 1行の最大文字数
  tabWidth: 2, // インデント幅
  useTabs: false, // スペースでインデント
  semi: true, // セミコロンを追加
  singleQuote: true, // シングルクォートを使用
  quoteProps: 'as-needed', // 必要な場合のみプロパティをクォート
  trailingComma: 'es5', // ES5互換のトレーリングカンマ
  bracketSpacing: true, // オブジェクトリテラルの括弧内にスペース
  arrowParens: 'always', // アロー関数の引数を常に括弧で囲む
  endOfLine: 'lf', // LF改行コード（Unix形式）

  // ファイル固有の設定
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always', // Markdownの折り返し
      },
    },
  ],
};
