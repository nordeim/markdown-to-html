import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import type { TagRegistry } from "@/types/tag";

const registry: TagRegistry = {};

describe("MarkdownRenderer GFM task lists", () => {
  it("renders an unchecked task list item as a disabled checkbox", () => {
    const md = "- [ ] Todo item";
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(checkbox.disabled).toBe(true);
  });

  it("renders a checked task list item as a disabled, checked checkbox", () => {
    const md = "- [x] Done item";
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    expect(checkbox.disabled).toBe(true);
  });

  it("task list checkbox has an aria-label for screen readers", () => {
    const md = "- [ ] Todo item";
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-label");
  });

  it("renders multiple task list items", () => {
    const md = "- [ ] A\n- [x] B\n- [ ] C";
    render(<MarkdownRenderer markdown={md} registry={registry} />);
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[2] as HTMLInputElement).checked).toBe(false);
  });
});
