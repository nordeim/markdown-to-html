import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorialLayout } from "@/templates/editorial/layout";
import { editorialComponents } from "@/templates/editorial/components";
import editorialTags from "@/templates/editorial/tags.json";
import type { TocItem } from "@/types/toc";
import type { TagRegistry } from "@/types/tag";

const toc: TocItem[] = [{ level: 2, text: "Introduction", slug: "introduction", children: [] }];
const registry = editorialTags as TagRegistry;

describe("editorial template", () => {
  it("exports the four required template pieces", () => {
    expect(EditorialLayout).toBeTypeOf("function");
    expect(editorialComponents).toBeTypeOf("object");
    expect(editorialComponents.h2).toBeTypeOf("function");
    expect(editorialComponents.h3).toBeTypeOf("function");
    expect(editorialComponents.h4).toBeTypeOf("function");
    expect(editorialComponents.a).toBeTypeOf("function");
    expect(registry.Severity).toBeDefined();
    expect(registry.Confidence).toBeDefined();
  });

  it("renders title and meta line in the hero", () => {
    render(
      <EditorialLayout
        title="An Editorial Essay"
        subtitle="A long-form reading register"
        author="Jane Doe"
        date="2026-08-07"
        readingTime="8 min read"
        toc={toc}
      >
        <p>Body content</p>
      </EditorialLayout>,
    );

    // Title appears twice — in header and hero. Find the hero one (h1).
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("An Editorial Essay");
    expect(screen.getByText("By Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("2026-08-07")).toBeInTheDocument();
    expect(screen.getByText("8 min read")).toBeInTheDocument();
  });

  it("renders content children in the main article", () => {
    render(
      <EditorialLayout title="Test" toc={toc}>
        <p data-testid="body">Body content</p>
      </EditorialLayout>,
    );
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });

  it("has a main element with id=content (skip-link target)", () => {
    const { container } = render(
      <EditorialLayout title="Test" toc={toc}>
        <p>Body</p>
      </EditorialLayout>,
    );
    const main = container.querySelector("main#content");
    expect(main).not.toBeNull();
  });

  it("editorial tags.json has no value collisions (passes validateRegistry)", async () => {
    const { validateRegistry } = await import("@/lib/tags");
    const errors = validateRegistry(registry);
    expect(errors).toEqual([]);
  });
});
