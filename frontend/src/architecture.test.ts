/**
 * Architecture guardrails (CLAUDE.md §2):
 *  1. Modules are imported only through their public `index.ts`.
 *  2. No module imports another module in a cycle.
 *  3. The client never does Calgary time zone math (server-only; see common/time.ts).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = dirname(fileURLToPath(import.meta.url));
const MODULES = join(SRC, 'modules');

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const files = listFiles(SRC);

function moduleOf(path: string): string | null {
  const rel = relative(MODULES, path);
  return rel.startsWith('..') ? null : rel.split(sep)[0];
}

function relativeImports(source: string): string[] {
  const specs = [...source.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)['"](\.[^'"]*)['"]/g)];
  return specs.map((m) => m[1]);
}

interface Edge {
  from: string;
  spec: string;
  target: string;
}

const crossModuleEdges: Edge[] = files.flatMap((file) =>
  relativeImports(readFileSync(file, 'utf8')).flatMap((spec) => {
    const target = resolve(dirname(file), spec);
    const targetModule = moduleOf(target);
    return targetModule && targetModule !== moduleOf(file) ? [{ from: file, spec, target }] : [];
  }),
);

describe('module boundaries', () => {
  it('finds the modules (sanity check)', () => {
    expect(files.some((f) => moduleOf(f) === 'common')).toBe(true);
  });

  it('cross-module imports go through the public index only', () => {
    const violations = crossModuleEdges
      .filter(({ target }) => {
        const rel = relative(MODULES, target).split(sep);
        return !(rel.length === 1 || (rel.length === 2 && /^index(\.tsx?)?$/.test(rel[1])));
      })
      .map(({ from, spec }) => `${relative(SRC, from)} imports '${spec}'`);
    expect(violations).toEqual([]);
  });

  it('has no circular dependencies between modules', () => {
    const graph = new Map<string, Set<string>>();
    for (const { from, target } of crossModuleEdges) {
      const a = moduleOf(from);
      const b = moduleOf(target);
      if (a && b) graph.set(a, (graph.get(a) ?? new Set()).add(b));
    }
    const cycles: string[] = [];
    const visit = (node: string, path: string[]) => {
      if (path.includes(node)) {
        cycles.push([...path.slice(path.indexOf(node)), node].join(' → '));
        return;
      }
      for (const next of graph.get(node) ?? []) visit(next, [...path, node]);
    };
    for (const node of graph.keys()) visit(node, []);
    expect(cycles).toEqual([]);
  });

  it('common does not depend on feature modules', () => {
    const fromCommon = crossModuleEdges.filter(({ from }) => moduleOf(from) === 'common');
    expect(fromCommon.map(({ from, spec }) => `${relative(SRC, from)} imports '${spec}'`)).toEqual([]);
  });
});

describe('client time rules', () => {
  it('no client code computes Calgary time zones (server owns the day boundary)', () => {
    const offenders = files
      .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
      .filter((f) => /America\/Edmonton|timeZone\s*:/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f));
    expect(offenders).toEqual([]);
  });
});
