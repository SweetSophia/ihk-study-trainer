import { PGlite, type Results, type Transaction } from '@electric-sql/pglite';

export type SqlGrading =
  | { kind: 'select'; ordered: boolean }
  | { kind: 'mutation'; operation: 'Insert' | 'Update' | 'Delete' };

type GradedExercise = { setup_sql: string; solution_query: string; grading: SqlGrading };
class SqlAnswerError extends Error {}

function isLearnerError(error: unknown): boolean {
  if (error instanceof SqlAnswerError) return true;
  // SQLSTATE classes for unsupported SQL, data/constraint errors, cardinality,
  // syntax/access rules and check-option violations. Engine/resource failures
  // (including errors without SQLSTATE) must not consume a learner attempt.
  const code = (error as { code?: unknown } | null)?.code;
  return code === '25006' || typeof code === 'string' && /^(0A|21|22|23|42|44)[A-Z0-9]{3}$/.test(code);
}

type Plan = { Operation?: string; Plans?: Plan[] };

function canonical(value: unknown): string {
  // Tag every value so nonfinite numbers survive JSON encoding without
  // colliding with NULL, text, or JSON arrays/objects that resemble a tag.
  function encode(item: unknown): unknown {
    if (item === null) return ['null'];
    if (typeof item === 'number') return ['number', Number.isFinite(item) ? item : String(item)];
    if (item instanceof Date) return encode(item.toJSON());
    if (Array.isArray(item)) return ['array', item.map(encode)];
    if (typeof item === 'object') {
      return ['object', Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, encode(entry)])];
    }
    return [typeof item, typeof item === 'bigint' ? String(item) : item];
  }
  return JSON.stringify(encode(value));
}

// Scalar numeric PostgreSQL types, including OID's integral representation.
// Text, JSON and arrays are deliberately not treated as numeric values.
const NUMERIC_OIDS = new Set([20, 21, 23, 26, 700, 701, 1700]);

function numericSignature(value: unknown): string {
  if (typeof value !== 'number' && typeof value !== 'bigint' && typeof value !== 'string') return canonical(value);
  const text = String(value);
  if (['NaN', 'Infinity', '-Infinity'].includes(text)) return JSON.stringify(['numeric', text]);
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text);
  if (!match) return canonical(value);
  const fraction = match[3] ?? '';
  const digits = (match[2] + fraction).replace(/^0+/, '');
  if (!digits) return JSON.stringify(['numeric', '0', '0']);
  const significant = digits.replace(/0+$/, '');
  const scale = BigInt(fraction.length) - BigInt(match[4] ?? '0') - BigInt(digits.length - significant.length);
  return JSON.stringify(['numeric', (match[1] === '-' ? '-' : '') + significant, String(scale)]);
}

function resultSignature(result: Results<unknown>, ordered: boolean, normalizeNumbers = true): string {
  const fields = result.fields.map(field => field.name).sort();
  if (new Set(fields).size !== fields.length) {
    throw new SqlAnswerError('Mehrdeutige Spaltennamen werden nicht unterstützt. Bitte eindeutige Aliase verwenden.');
  }
  const types = new Map(result.fields.map(field => [field.name, field.dataTypeID]));
  const rows = normalizeNumbers ? result.rows.map(row => JSON.stringify(
    Object.entries(row as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]) => [
      name,
      NUMERIC_OIDS.has(types.get(name) ?? 0) && value !== null ? numericSignature(value) : canonical(value),
    ]),
  )) : result.rows.map(canonical);
  if (!ordered) rows.sort();
  // Values are encoded into separate signature strings: a real JSON array/object
  // resembling our numeric tag cannot impersonate a scalar numeric result.
  // Keep column names even for empty results; permit column reordering.
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
      throw new SqlAnswerError('Nicht unterstützte Query: erwartet wird ' + (grading.kind === 'select' ? 'SELECT.' : `${grading.operation.toUpperCase()}.`));
    }
    const result = await tx.query(sql);
    if (grading.kind === 'select' && result.fields.length === 0) throw new SqlAnswerError('Eine SELECT-Ergebnismenge wird erwartet.');
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
    // Preserve the legacy stored-state contract (including numeric scale).
    // Numeric result equivalence applies to SELECT answers, not mutation snapshots.
    states.push([table, resultSignature(rows, false, false)]);
  }
  return canonical(states);
}

/** Compare one SELECT or INSERT/UPDATE/DELETE against the reference on fresh fixtures.
 * This checks equivalence on the generated data, not correctness for every possible database.
 */
export async function gradeSqlAnswer(exercise: GradedExercise, query: string, options: { rejectInfrastructureErrors?: boolean } = {}): Promise<{ correct: boolean; message?: string }> {
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
        if (!reference && options.rejectInfrastructureErrors && !isLearnerError(error)) throw error;
        const message = error instanceof Error ? error.message : String(error);
        if (reference) throw new Error(`Die generierte Musterlösung enthält einen Fehler: ${message}`);
        throw new SqlAnswerError(`SQL Fehler: ${message}`);
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
    if (error instanceof SqlAnswerError) return { correct: false, message: error.message };
    throw error;
  }
}
