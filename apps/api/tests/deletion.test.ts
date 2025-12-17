import { describe, it, expect } from 'vitest';
import deletion from '../src/routes/deletion.js';
import type { Env } from '../src/types/env.js';

type MockRecord = {
  id: string;
  hash_type: string;
  hash_value: string;
  status: string;
  created_at: number;
  completed_at?: number | null;
  email?: string | null;
  reason?: string | null;
};

type MockStatement = {
  bind: (...args: unknown[]) => MockStatement;
  first: () => Promise<any>;
  all: () => Promise<{ results: any[] }>;
  run: () => Promise<{ success: boolean }>;
};

function createMockDB(initial: MockRecord[] = []) {
  const store: MockRecord[] = [...initial];

  const db = {
    prepare(query: string): MockStatement {
      let params: unknown[] = [];

      const stmt: MockStatement = {
        bind: (...args: unknown[]) => {
          params = args;
          return stmt;
        },
        async first() {
          if (query.includes('WHERE hash_type')) {
            const [hashType, hashValue] = params as [string, string];
            const found = store
              .filter(record => record.hash_type === hashType && record.hash_value === hashValue)
              .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
            return found[0] ?? null;
          }

          if (query.includes('WHERE id = ?')) {
            const [id] = params as [string];
            return store.find(record => record.id === id) ?? null;
          }

          return null;
        },
        async all() {
          return { results: [] };
        },
        async run() {
          if (query.startsWith('INSERT INTO deletion_requests')) {
            const [id, hashType, hashValue, email, reason, created_at] = params as [
              string,
              string,
              string,
              string | null,
              string | null,
              number,
            ];
            store.push({
              id,
              hash_type: hashType,
              hash_value: hashValue,
              email,
              reason,
              status: 'pending',
              created_at,
            });
          }
          return { success: true };
        },
      };

      return stmt;
    },
    _store: store,
  } as unknown as Env['DB'] & { _store: MockRecord[] };

  return db;
}

const HASH = 'a'.repeat(64);

describe('deletion routes', () => {
  it('queues a new deletion request', async () => {
    const env = { DB: createMockDB(), ENVIRONMENT: 'test' } as unknown as Env;

    const res = await deletion.fetch(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash_type: 'full', hash_value: HASH, email: 'a@example.com' }),
      }),
      env as never
    );

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('pending');
    expect(json.data.id).toBeTruthy();
  });

  it('deduplicates existing requests for the same hash', async () => {
    const existing: MockRecord = {
      id: 'req-1',
      hash_type: 'full',
      hash_value: HASH,
      status: 'pending',
      created_at: Date.now() - 1000,
    };
    const db = createMockDB([existing]);
    const env = { DB: db, ENVIRONMENT: 'test' } as unknown as Env;

    const res = await deletion.fetch(
      new Request('http://localhost/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash_type: 'full', hash_value: HASH }),
      }),
      env as never
    );

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.data.duplicate).toBe(true);
    expect(json.data.id).toBe('req-1');
    expect(db._store.length).toBe(1);
  });

  it('returns status for an existing request', async () => {
    const existing: MockRecord = {
      id: 'req-2',
      hash_type: 'hardware',
      hash_value: HASH,
      status: 'completed',
      created_at: Date.now() - 5000,
      completed_at: Date.now() - 1000,
    };
    const env = { DB: createMockDB([existing]), ENVIRONMENT: 'test' } as unknown as Env;

    const res = await deletion.fetch(new Request('http://localhost/req-2'), env as never);
    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.data.status).toBe('completed');
    expect(json.data.hash_type).toBe('hardware');
  });
});
