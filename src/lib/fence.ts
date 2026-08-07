export interface MarkdownRegion {
  line: string;
  lineNumber: number;   // 1-based
  insideFence: boolean;
}

/**
 * CommonMark-subset fence tracking: opening fence is ``` or ~~~ (up to 3
 * leading spaces); closing fence is the same character, at least as long,
 * with no other content. Unclosed fences extend to end of document.
 * Both delimiter lines are reported as insideFence: true.
 */
export function scanLines(markdown: string): MarkdownRegion[] {
  const regions: MarkdownRegion[] = [];
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;

  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const m = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (m) {
      const marker = m[1]!;
      const rest = m[2]!;
      if (!inFence) {
        inFence = true;
        fenceChar = marker.charAt(0);
        fenceLen = marker.length;
        regions.push({ line, lineNumber: i + 1, insideFence: true });
        continue;
      }
      if (marker.charAt(0) === fenceChar && marker.length >= fenceLen && rest.trim() === "") {
        inFence = false;
        fenceChar = "";
        fenceLen = 0;
        regions.push({ line, lineNumber: i + 1, insideFence: true });
        continue;
      }
    }
    regions.push({ line, lineNumber: i + 1, insideFence: inFence });
  }
  return regions;
}
