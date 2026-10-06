import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    role: z.string().optional(),
    year: z.number().int().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    screenshot: z
      .object({
        src: z.string().min(1),
        alt: z.string().min(1),
        caption: z.string().optional(),
      })
      .optional(),
  }),
});

const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    image: z
      .object({
        src: z.string().min(1),
        alt: z.string().min(1),
      })
      .optional(),
  }),
});

const profile = defineCollection({
  loader: glob({ pattern: 'index.md', base: './src/content/profile' }),
  schema: z.object({
    name: z.string(),
    headline: z.string(),
    location: z.string().optional(),
    email: z.email().optional(),
    github: z.url().optional(),
    linkedin: z.url().optional(),
  }),
});

export const collections = { profile, projects, writing };
