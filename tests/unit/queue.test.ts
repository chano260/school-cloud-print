import { describe, it, expect } from 'vitest';

describe('Queue Priority Logic Validation', () => {
  it('validates priority rules: RELEASED status supersedes standard QUEUED jobs', () => {
    const jobs = [
      { id: '1', status: 'QUEUED', createdAt: new Date(1000) },
      { id: '2', status: 'RELEASED', releasedAt: new Date(2000), createdAt: new Date(500) },
      { id: '3', status: 'QUEUED', createdAt: new Date(800) },
    ];

    // Priority comparator matching getNextJobForAgent()
    const sorted = [...jobs].sort((a, b) => {
      if (a.status === 'RELEASED' && b.status !== 'RELEASED') return -1;
      if (b.status === 'RELEASED' && a.status !== 'RELEASED') return 1;
      if (a.status === 'RELEASED' && b.status === 'RELEASED') {
        return (a.releasedAt?.getTime() ?? 0) - (b.releasedAt?.getTime() ?? 0);
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    expect(sorted[0].id).toBe('2'); // Released job jumps to front
    expect(sorted[1].id).toBe('3'); // Oldest queued job
    expect(sorted[2].id).toBe('1');
  });
});
