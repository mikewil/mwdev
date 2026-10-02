export interface ProjectLike {
  id: string;
  data: { draft: boolean; featured: boolean; year: number };
}

export interface WritingLike {
  id: string;
  data: { draft: boolean; publishedAt: Date };
}

export function getPublishedProjects<T extends ProjectLike>(
  projects: T[],
): T[] {
  return projects
    .filter((project) => !project.data.draft)
    .sort(
      (a, b) =>
        Number(b.data.featured) - Number(a.data.featured) ||
        b.data.year - a.data.year,
    );
}

export function getRecentWriting<T extends WritingLike>(
  entries: T[],
  limit = 2,
): T[] {
  return entries
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf())
    .slice(0, limit);
}
