import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Three append-only collections. Anything a future session adds — a Letter II,
// a ninth drawer, fragment 031 — arrives as another file in one of these folders.

const essays = defineCollection({
  loader: glob({ base: './src/content/essays', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    number: z.string().regex(/^E\d{2}$/),
    title: z.string(),
    dek: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    /** Reading order on the site, low to high. */
    order: z.number().int(),
    /** Optional companion Cabinet piece, by slug. */
    companion: z.string().optional(),
  }),
});

const pieces = defineCollection({
  loader: glob({ base: './src/content/pieces', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    number: z.string().regex(/^C\d{2}$/),
    name: z.string(),
    /** One line for the cabinet index — why this drawer exists. */
    oneLineWhy: z.string(),
    /** Module name under src/islands, without extension. */
    island: z.string(),
    /** JS-off fallback image under /stills. */
    still: z.string(),
    stillAlt: z.string(),
    controls: z.string(),
    date: z.coerce.date(),
    author: z.string(),
    order: z.number().int(),
  }),
});

const marginalia = defineCollection({
  loader: glob({ base: './src/content/marginalia', pattern: '**/*.md' }),
  schema: z.object({
    number: z.number().int().positive(),
    date: z.coerce.date(),
    author: z.string(),
  }),
});

export const collections = { essays, pieces, marginalia };
