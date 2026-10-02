import { describe, expect, it } from 'vitest';
import { hasAcceptanceCriteria } from '../scripts/backlog-worker.mjs';

describe('backlog issue readiness', () => {
  it('accepts a non-empty acceptance criteria section with checklist items', () => {
    expect(
      hasAcceptanceCriteria(
        `## Summary\nAdd a project card.\n\n## Acceptance criteria\n- Shows the project title\n- Links to the case study`,
      ),
    ).toBe(true);
  });

  it('rejects missing, empty, and prose-only acceptance criteria', () => {
    expect(hasAcceptanceCriteria('## Summary\nUpdate the profile.')).toBe(
      false,
    );
    expect(
      hasAcceptanceCriteria('## Acceptance criteria\n\n## Notes\nMore detail.'),
    ).toBe(false);
    expect(
      hasAcceptanceCriteria(
        '## Acceptance criteria\nMake the site more interesting.',
      ),
    ).toBe(false);
  });

  it('stops reading criteria at the next section heading', () => {
    expect(
      hasAcceptanceCriteria(
        '## Acceptance criteria\nTBD\n\n## Notes\n- unrelated note',
      ),
    ).toBe(false);
  });
});
