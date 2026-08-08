import { describe, it, expect } from "vitest";
import { extractDocumentTitle } from "@/lib/extract-title";

describe("extractDocumentTitle", () => {
  it("returns the frontmatter title when present", () => {
    const md = `---
title: "My Custom Title"
---

# Skills Catalog

Body.
`;
    expect(extractDocumentTitle(md)).toBe("My Custom Title");
  });

  it("falls back to the first H1 when no frontmatter", () => {
    const md = `# Hello World

Body.
`;
    expect(extractDocumentTitle(md)).toBe("Hello World");
  });

  it("strips markdown emphasis from the H1", () => {
    const md = `# **Bold** _Title_

Body.
`;
    expect(extractDocumentTitle(md)).toBe("Bold Title");
  });

  it("prefers frontmatter title over H1", () => {
    const md = `---
title: "Frontmatter Wins"
---

# Different H1
`;
    expect(extractDocumentTitle(md)).toBe("Frontmatter Wins");
  });

  it("returns null when neither frontmatter title nor H1 exists", () => {
    const md = `Just some body text, no title anywhere.`;
    expect(extractDocumentTitle(md)).toBeNull();
  });

  it("ignores code-fenced lines that look like headings", () => {
    const md = `\`\`\`
# Not a heading
\`\`\`

# Real Heading
`;
    expect(extractDocumentTitle(md)).toBe("Real Heading");
  });

  it("returns null for empty input", () => {
    expect(extractDocumentTitle("")).toBeNull();
  });
});
