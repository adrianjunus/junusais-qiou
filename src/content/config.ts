import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tag: z.string(),
    excerpt: z.string(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    kicker: z.string(),
    tag: z.string(),
    body: z.string(),
    link: z.string().url().optional(),
  }),
});

export const collections = { posts, projects };
