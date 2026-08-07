import { describe, it, expect } from "vitest";
import { parseDocument } from "@/lib/frontmatter";

const DOC = `---
title: "My Document"
author: "Jane Doe"
template: "editorial"
---

# Body`;

describe("parseDocument", () => {
  it("extracts metadata and returns the body without the frontmatter block", () => {
    const { frontmatter, body } = parseDocument(DOC);
    expect(frontmatter).toMatchObject({
      title: "My Document",
      author: "Jane Doe",
      template: "editorial",
    });
    expect(body.startsWith("# Body")).toBe(true);
    expect(body).not.toContain("title:");
  });

  it("frontmatter block does not leak into the rendered body", () => {
    const { body } = parseDocument(DOC);
    expect(body).not.toMatch(/^---/);
    expect(body).not.toContain("Jane Doe");
  });

  it("returns the whole document as body when no frontmatter is present", () => {
    const md = "# Just a document";
    expect(parseDocument(md)).toEqual({ frontmatter: {}, body: md });
  });

  it("handles CRLF line endings", () => {
    const { frontmatter, body } = parseDocument("---\r\ntitle: CRLF\r\n---\r\n\r\n# Body");
    expect(frontmatter.title).toBe("CRLF");
    expect(body).not.toContain("\r");
  });

  it("strips a leading UTF-8 BOM", () => {
    const { frontmatter } = parseDocument("\uFEFF---\ntitle: BOM\n---\n\n# Body");
    expect(frontmatter.title).toBe("BOM");
  });

  it("treats malformed frontmatter as body (still renders)", () => {
    const md = "---\nnot closed properly\n# Body";
    const { frontmatter, body } = parseDocument(md);
    expect(frontmatter).toEqual({});
    expect(body).toBe(md);
  });

  it("handles values with colons and strips surrounding quotes", () => {
    const { frontmatter } = parseDocument(
      `---\ntitle: "Title: with colon"\nauthor: 'Single'\n---\n\n# Body`,
    );
    expect(frontmatter.title).toBe("Title: with colon");
    expect(frontmatter.author).toBe("Single");
  });
});
