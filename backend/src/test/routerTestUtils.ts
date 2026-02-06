import type { RequestHandler, Router } from 'express';
import { vi } from 'vitest';

type DbOperation = 'select' | 'insert' | 'update' | 'delete';

function makeThenableBuilder(result: unknown) {
  const builder = (result instanceof Error
    ? Promise.reject(result)
    : Promise.resolve(result)) as Promise<unknown> &
    Record<string, ReturnType<typeof vi.fn>>;

  const chainMethods = [
    'from',
    'innerJoin',
    'where',
    'orderBy',
    'limit',
    'offset',
    'values',
    'set',
    'returning',
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn(() => builder);
  }

  return builder;
}

export function createMockDb() {
  const queues: Record<DbOperation, unknown[]> = {
    select: [],
    insert: [],
    update: [],
    delete: [],
  };

  const nextResult = (operation: DbOperation) =>
    queues[operation].length > 0 ? queues[operation].shift() : [];

  return {
    db: {
      select: vi.fn(() => makeThenableBuilder(nextResult('select'))),
      insert: vi.fn(() => makeThenableBuilder(nextResult('insert'))),
      update: vi.fn(() => makeThenableBuilder(nextResult('update'))),
      delete: vi.fn(() => makeThenableBuilder(nextResult('delete'))),
    },
    pushResult: (operation: DbOperation, result: unknown) => {
      queues[operation].push(result);
    },
    reset: () => {
      queues.select.length = 0;
      queues.insert.length = 0;
      queues.update.length = 0;
      queues.delete.length = 0;
    },
  };
}

export function getRouteHandler(
  router: Router,
  method: 'get' | 'post' | 'patch' | 'delete',
  path: string,
): RequestHandler {
  const stack = (router as Router & { stack?: unknown[] }).stack ?? [];
  const routeLayer = stack.find((layer) => {
    const candidate = layer as {
      route?: { path?: string; methods?: Record<string, boolean> };
    };
    return (
      candidate.route?.path === path &&
      candidate.route?.methods?.[method] === true
    );
  }) as
    | {
        route?: {
          stack?: Array<{ handle: RequestHandler }>;
        };
      }
    | undefined;

  if (!routeLayer?.route?.stack?.length) {
    throw new Error(`Route handler not found for ${method.toUpperCase()} ${path}`);
  }

  return routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;
}

export function makeResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
  };
}
