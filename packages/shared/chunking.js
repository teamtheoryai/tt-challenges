// Paragraph-preserving chunker: split on blank lines, pack paragraphs into
// chunks of ~TARGET chars, never splitting mid-paragraph unless a single
// paragraph exceeds HARD_MAX.

const TARGET = 1100;
const HARD_MAX = 2200;

export function chunkText(text) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';

  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  for (const para of paragraphs) {
    if (para.length > HARD_MAX) {
      push();
      for (let i = 0; i < para.length; i += TARGET) {
        chunks.push(para.slice(i, i + TARGET).trim());
      }
      continue;
    }
    if (current.length + para.length + 2 > TARGET && current) push();
    current = current ? `${current}\n\n${para}` : para;
  }
  push();

  return chunks;
}
