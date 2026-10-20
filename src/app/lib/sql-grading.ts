import { PGlite, type Results, type Transaction } from '@electric-sql/pglite';

export type SqlGrading =
  | { kind: 'select'; ordered: boolean }
  | { kind: 'mutation'; operation: 'Insert' | 'Update' | 'Delete' };

type GradedExercise = { setup_sql: string; solution_query: string; grading: SqlGrading };
type Plan = { Operation?: string; Plans?: Plan[] };

function canonical(value: unknown): string {
  return JSON.stringify(value, (_, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
}

function resultSignature(result: Results<unknown>, ordered: boolean): string {
  const rows = result.rows.map(canonical);
  if (!ordered) rows.sort();
  // Keep column names/types even when there are no rows; allow column reordering.
  const fields = result.fields.map(field => canonical(field)).sort();
  if (new Set(result.fields.map(field => field.name)).size !== result.fields.length) {
    throw new Error('Mehrdeutige Spaltennamen werden nicht unterstützt. Bitte eindeutige Aliase verwenden.');
  }
  return canonical({ rows, fields });
}

function hasMutation(plan: Plan): boolean {
  return !!plan.Operation || !!plan.Plans?.some(hasMutation);
}

async function execute(db: PGlite, sql: string, grading: SqlGrading): Promise<Results<unknown>> {
  return db.transaction(async tx => {
    if (grading.kind === 'select') await tx.exec('SET TRANSACTION READ ONLY');
    // PostgreSQL parses a single prepared statement. EXPLAIN without ANALYZE
    // does not execute it, and rejects unsupported DDL/transaction commands.
    const explained = await tx.query<{ 'QUERY PLAN': { Plan: Plan }[] }>(`EXPLAIN (FORMAT JSON) ${sql}`);
    const plan = explained.rows[0]?.['QUERY PLAN']?.[0]?.Plan;
    if (!plan || (grading.kind === 'select' ? hasMutation(plan) : plan.Operation !== grading.operation)) {
      throw new Error('Nicht unterstützte Query: erwartet wird ' + (grading.kind === 'select' ? 'SELECT.' : `${grading.operation.toUpperCase()}.`));
    }
    const result = await tx.query(sql);
    if (grading.kind === 'select' && result.fields.length === 0) throw new Error('Eine SELECT-Ergebnismenge wird erwartet.');
    return result;
  });
}

async function snapshot(db: PGlite | Transaction): Promise<string> {
  const tables = await db.query<{ schemaname: string; tablename: string }>(
    `SELECT schemaname, tablename FROM pg_catalog.pg_tables
     WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY schemaname, tablename`,
  );
  const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
  const states = [];
  for (const table of tables.rows) {
    const rows = await db.query(`SELECT * FROM ${quote(table.schemaname)}.${quote(table.tablename)}`);
    states.push([table, resultSignature(rows, false)]);
  }
  return canonical(states);
}

/** Compare one SELECT or INSERT/UPDATE/DELETE against the reference on fresh fixtures.
 * This checks equivalence on the generated data, not correctness for every possible database.
 */
export async function gradeSqlAnswer(exercise: GradedExercise, query: string): Promise<{ correct: boolean; message?: string }> {
  const grading = exercise.grading;
  if (!grading || (grading.kind !== 'select' && grading.kind !== 'mutation') ||
      (grading.kind === 'select' && typeof grading.ordered !== 'boolean') ||
      (grading.kind === 'mutation' && !['Insert', 'Update', 'Delete'].includes(grading.operation))) {
    throw new Error('Die Übung enthält keine unterstützte Bewertungsart. Bitte eine neue Übung laden.');
  }

  // Run sequentially so only one WASM database is resident at a time.
  async function evaluate(sql: string, reference: boolean): Promise<{ signature: string; initial: string }> {
    const db = new PGlite();
    try {
      await db.exec(exercise.setup_sql);
      const initial = await snapshot(db);
      try {
        const result = await execute(db, sql, grading);
        const signature = grading.kind === 'select' ? resultSignature(result, grading.ordered) : await snapshot(db);
        if (reference && grading.kind === 'mutation' && signature === initial) {
          throw new Error('Die Musterlösung ändert keine Daten. Bitte eine neue Übung laden.');
        }
        return { signature, initial };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(reference ? `Die generierte Musterlösung enthält einen Fehler: ${message}` : `SQL Fehler: ${message}`);
      }
    } finally {
      await db.close();
    }
  }

  const expected = await evaluate(exercise.solution_query, true);
  try {
    const actual = await evaluate(query, false);
    if (expected.initial !== actual.initial) throw new Error('Die generierten Testdaten sind nicht reproduzierbar. Bitte eine neue Übung laden.');
    return { correct: expected.signature === actual.signature };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('SQL Fehler:')) return { correct: false, message: error.message };
    throw error;
  }
}
