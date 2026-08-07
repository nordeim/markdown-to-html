import "@/templates/technical/theme.css";
import { technicalComponents } from "@/templates/technical/components";
import { TechnicalLayout } from "@/templates/technical/layout";
import type { TagRegistry } from "@/types/tag";
import type { TemplateLayoutProps } from "@/types/template";
import type { FC } from "react";

// Load the tag registry
import tagsJson from "@/templates/technical/tags.json";

export const TEMPLATE_NAME = "technical" as const;
export const TAGS: TagRegistry = tagsJson as TagRegistry;
export const TEMPLATE_COMPONENTS = technicalComponents;
export const TemplateLayout: FC<TemplateLayoutProps> = TechnicalLayout;
