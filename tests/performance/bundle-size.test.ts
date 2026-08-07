import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { gzipSync } from "zlib";

describe("Bundle Size", () => {
  it("main bundle is under 250KB gzipped", () => {
    const distPath = join(process.cwd(), "dist", "index.html");
    if (!existsSync(distPath)) {
      throw new Error("dist/index.html not found. Run `npm run build` first.");
    }

    const content = readFileSync(distPath);
    const gzipped = gzipSync(content);

    expect(gzipped.length).toBeLessThan(250 * 1024);  // 250 KB
  });
});
