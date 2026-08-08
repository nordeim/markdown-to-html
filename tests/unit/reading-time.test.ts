import { describe, it, expect } from "vitest";
import { estimateReadingTime } from "@/lib/reading-time";

describe("estimateReadingTime", () => {
  it("returns '0 min read' for empty input", () => {
    expect(estimateReadingTime("")).toBe("0 min read");
  });

  it("returns '0 min read' for whitespace-only input", () => {
    expect(estimateReadingTime("   \n\n   ")).toBe("0 min read");
  });

  it("returns '1 min read' for a short paragraph (under 200 words)", () => {
    const text = "This is a short paragraph with only a few words in it.";
    expect(estimateReadingTime(text)).toBe("1 min read");
  });

  it("returns '1 min read' for exactly 200 words", () => {
    const words = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
    expect(estimateReadingTime(words)).toBe("1 min read");
  });

  it("returns '2 min read' for 400 words", () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    expect(estimateReadingTime(words)).toBe("2 min read");
  });

  it("counts each CJK character as a word (per WCAG/typical reading-speed convention)", () => {
    // 400 CJK characters should be 2 min at 200 wpm
    const text = "字".repeat(400);
    expect(estimateReadingTime(text)).toBe("2 min read");
  });

  it("uses a separate, slower CJK reading rate (300 cpm) — 900 CJK chars → 3 min read", () => {
    // CJK reading speed is ~250-300 chars/min for native readers; we use 300.
    // 900 / 300 = 3 min exactly. Under the old single-rate logic (200 wpm)
    // this would have been 5 min — an overestimate. The new logic takes the
    // max of (latinMinutes, cjkMinutes) so the larger of the two rates wins
    // when content is mixed.
    const text = "字".repeat(900);
    expect(estimateReadingTime(text)).toBe("3 min read");
  });

  it("mixed Latin + CJK content uses the slower of the two estimates", () => {
    // 1000 Latin words → 5 min at 200 wpm.
    // 300 CJK chars → 1 min at 300 cpm.
    // max(5, 1) = 5 min.
    const latin = Array.from({ length: 1000 }, (_, i) => `word${i}`).join(" ");
    const cjk = "字".repeat(300);
    expect(estimateReadingTime(`${latin}\n\n${cjk}`)).toBe("5 min read");
  });

  it("ignores markdown syntax characters when counting words", () => {
    // 100 words wrapped in markdown headers, bold, links — should still be ~1 min
    const text = `## ${"word ".repeat(50)}\n\n**${"word ".repeat(50)}**`;
    expect(estimateReadingTime(text)).toBe("1 min read");
  });

  it("strips fenced code blocks before counting (code is read slower, not as words)", () => {
    const text = `Intro paragraph here.\n\n\`\`\`\nconst x = "code";\nconsole.log(x);\n\`\`\`\n\nOutro paragraph here.`;
    const result = estimateReadingTime(text);
    // Should be 1 min read (very few prose words after stripping code)
    expect(result).toBe("1 min read");
  });
});
