import { describe, expect, it } from 'vitest';
import { getPublishedProjects, getRecentWriting } from '../src/lib/content';

describe('portfolio content selection', () => {
  it('hides drafts and places featured projects first, then newer projects', () => {
    const projects = [
      {
        id: 'old-featured',
        data: { draft: false, featured: true, year: 2021 },
      },
      {
        id: 'new-standard',
        data: { draft: false, featured: false, year: 2025 },
      },
      {
        id: 'new-featured',
        data: { draft: false, featured: true, year: 2025 },
      },
      { id: 'draft', data: { draft: true, featured: true, year: 2026 } },
    ];

    expect(getPublishedProjects(projects).map(({ id }) => id)).toEqual([
      'new-featured',
      'old-featured',
      'new-standard',
    ]);
  });

  it('shows the newest published notes within the requested limit', () => {
    const writing = [
      {
        id: 'older',
        data: { draft: false, publishedAt: new Date('2024-02-01') },
      },
      {
        id: 'newer',
        data: { draft: false, publishedAt: new Date('2025-07-01') },
      },
      {
        id: 'draft',
        data: { draft: true, publishedAt: new Date('2026-01-01') },
      },
    ];

    expect(getRecentWriting(writing, 1).map(({ id }) => id)).toEqual(['newer']);
  });
});
