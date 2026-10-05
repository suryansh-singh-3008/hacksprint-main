export const WAKE_WORDS = ['veda', 'vedha', 'veeda', 'weda', 'beda', 'vedaa', 'vada', 'वेदा', 'वेद', 'ವೇದ'];

export function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0).map((_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

export function detectWakeWord(transcript: string): { found: boolean; commandAfter: string } {
  const lower = transcript.toLowerCase().trim();
  const tokens = lower.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].replace(/[,!?।]/g, '');
    const isWake = WAKE_WORDS.includes(token) || WAKE_WORDS.some(w => levenshtein(token, w) <= 1);
    if (isWake) {
      return { found: true, commandAfter: tokens.slice(i + 1).join(' ').trim() };
    }
  }
  return { found: false, commandAfter: '' };
}
