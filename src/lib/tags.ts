import type { TagRegistry } from "@/types/tag";

export interface ResolvedBadge {
  tag: string;
  value: string;
  label: string;
  accent: 1 | 2 | 3 | 4 | 5;
}

export function validateRegistry(registry: TagRegistry): string[] {
  const errors: string[] = [];
  const owners = new Map<string, string>();
  for (const def of Object.values(registry)) {
    if (!def.name) errors.push("tag definition missing name");
    for (const [value, v] of Object.entries(def.values)) {
      if (value !== value.toLowerCase()) {
        errors.push(`tag "${def.name}": value "${value}" must be registered lowercase`);
      }
      if (v.accent < 1 || v.accent > 5) {
        errors.push(`tag "${def.name}", value "${value}": accent must be 1–5`);
      }
      const owner = owners.get(value);
      if (owner !== undefined) {
        errors.push(
          `badge value collision: "${value}" is registered in both "${owner}" and "${def.name}" — values must be unique across the preset`,
        );
      } else {
        owners.set(value, def.name);
      }
    }
  }
  return errors;
}

export function loadRegistry(registry: TagRegistry): TagRegistry {
  const errors = validateRegistry(registry);
  if (errors.length > 0) {
    throw new Error(`Invalid tag registry:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
  return registry;
}

export function resolveBadge(registry: TagRegistry, raw: string): ResolvedBadge | null {
  const value = raw.trim().toLowerCase();
  if (value === "") return null;
  for (const def of Object.values(registry)) {
    const v = def.values[value];
    if (v) {
      return {
        tag: def.name,
        value,
        label: v.label ?? value.charAt(0).toUpperCase() + value.slice(1),
        accent: v.accent,
      };
    }
  }
  return null;
}
