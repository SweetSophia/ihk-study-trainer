import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock the 'ai' and '@ai-sdk/groq' modules before importing the module under test
vi.mock('ai', () => ({
  generateText: vi.fn(),
}));

vi.mock('@ai-sdk/groq', () => ({
  groq: vi.fn(() => 'mocked-groq-model'),
}));

// Mock auth functions
const mockHashExists = vi.fn().mockResolvedValue(true);
vi.mock('../../lib/auth', () => ({
  hashExists: (...args: unknown[]) => mockHashExists(...args),
}));

import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { generateSqlExercise, SqlExercise } from '../generate-sql-exercise';

const mockGenerateText = vi.mocked(generateText);
const mockGroq = vi.mocked(groq);

// Deterministic test counter - avoids Date.now()/Math.random() in test hashes
// Do NOT reset between tests; each test gets a unique hash to avoid rate limiting
let testCounter = 0;
const nextHash = () => `test-hash-${testCounter++}`;

// Stub GROQ_API_KEY at file scope before any tests run
beforeAll(() => {
  vi.stubEnv('GROQ_API_KEY', 'test-groq-api-key');
});

const validExercise: SqlExercise = {
  theme: 'Network Infrastructure Asset Inventory',
  themeDescription: 'Verwaltung von Netzwerkgeräten im Unternehmen',
  setup_sql: `CREATE TABLE devices (id SERIAL PRIMARY KEY, name VARCHAR(50), type VARCHAR(20));
INSERT INTO devices VALUES (1, 'Router-01', 'router');
INSERT INTO devices VALUES (2, 'Switch-01', 'switch');`,
  question: 'Welche Geräte vom Typ "router" sind im System erfasst?',
  solution_query: "SELECT * FROM devices WHERE type = 'router';",
  difficulty: 'easy',
};

describe('generateSqlExercise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHashExists.mockResolvedValue(true); // Default: auth passes
  });

  it('returns an SqlExercise object on success', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validExercise) } as any);

    const result = await generateSqlExercise(nextHash());

    expect(result).toEqual(validExercise);
    expect(result.theme).toBe('Network Infrastructure Asset Inventory');
    expect(result.difficulty).toBe('easy');
  });

  it('calls generateText with the groq model', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validExercise) } as any);

    await generateSqlExercise(nextHash());

    expect(mockGroq).toHaveBeenCalledWith('llama-3.3-70b-versatile');
    expect(mockGenerateText).toHaveBeenCalledOnce();
  });

  it('passes a prompt that includes a theme and SQL concept', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validExercise) } as any);

    await generateSqlExercise(nextHash());

    const callArgs = mockGenerateText.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('THEMA:');
    expect(callArgs.prompt).toContain('SQL-KONZEPT:');
  });

  it('throws when generateText rejects', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('API rate limit exceeded'));

    await expect(generateSqlExercise(nextHash())).rejects.toThrow('rate limit: Bitte warte einen Moment.');
  });

  it('throws when generateText rejects with network error', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('Network error'));

    await expect(generateSqlExercise(nextHash())).rejects.toThrow('Fehler bei der Generierung: Network error');
  });

  it('selects a theme from the THEMES list', async () => {
    // Force Math.random to return 0, selecting the first theme
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validExercise) } as any);

    await generateSqlExercise(nextHash());

    const callArgs = mockGenerateText.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('Network Infrastructure Asset Inventory');

    spy.mockRestore();
  });

  it('selects a SQL concept from the SQL_CONCEPTS list', async () => {
    // Force Math.random to return 0, selecting the first concept
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validExercise) } as any);

    await generateSqlExercise(nextHash());

    const callArgs = mockGenerateText.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('SELECT mit WHERE Bedingung und ORDER BY');

    spy.mockRestore();
  });

  it('selects a different theme when Math.random returns a high value', async () => {
    // Math.random() returning 0.999 with Math.floor(0.999 * 6) = 5 (last theme)
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.999);
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validExercise) } as any);

    await generateSqlExercise(nextHash());

    const callArgs = mockGenerateText.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('Software Lizenzverwaltung');

    spy.mockRestore();
  });

  it('returns the exact object from generateText response', async () => {
    const customExercise: SqlExercise = {
      theme: 'IT-Helpdesk Ticket System',
      themeDescription: 'Verwaltung von Support-Tickets',
      setup_sql: 'CREATE TABLE tickets (id INT, title TEXT);',
      question: 'Zeige alle offenen Tickets an.',
      solution_query: 'SELECT * FROM tickets;',
      difficulty: 'medium',
    };
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(customExercise) } as any);

    const result = await generateSqlExercise(nextHash());

    expect(result).toEqual(customExercise);
  });

  it('includes IHK-specific instructions in the prompt', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validExercise) } as any);

    await generateSqlExercise(nextHash());

    const callArgs = mockGenerateText.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('IHK');
    expect(callArgs.prompt).toContain('PostgreSQL');
  });

  it('throws Unauthorized when hashExists returns false', async () => {
    mockHashExists.mockResolvedValueOnce(false);

    await expect(generateSqlExercise(nextHash())).rejects.toThrow('Unauthorized');
  });

  it('throws auth error when hashExists rejects', async () => {
    mockHashExists.mockRejectedValueOnce(new Error('auth failure'));

    await expect(generateSqlExercise(nextHash())).rejects.toThrow('auth failure');
  });
});

describe('SqlExercise Zod schema validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHashExists.mockResolvedValue(true);
  });

  it('schema accepts valid easy difficulty', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify({ ...validExercise, difficulty: 'easy' }) } as any);
    const result = await generateSqlExercise(nextHash());
    expect(result.difficulty).toBe('easy');
  });

  it('schema accepts valid medium difficulty', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify({ ...validExercise, difficulty: 'medium' }) } as any);
    const result = await generateSqlExercise(nextHash());
    expect(result.difficulty).toBe('medium');
  });

  it('schema accepts valid hard difficulty', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify({ ...validExercise, difficulty: 'hard' }) } as any);
    const result = await generateSqlExercise(nextHash());
    expect(result.difficulty).toBe('hard');
  });

  it('all required SqlExercise fields are present in result', async () => {
    mockGenerateText.mockResolvedValueOnce({ text: JSON.stringify(validExercise) } as any);

    const result = await generateSqlExercise(nextHash());

    expect(result).toHaveProperty('theme');
    expect(result).toHaveProperty('themeDescription');
    expect(result).toHaveProperty('setup_sql');
    expect(result).toHaveProperty('question');
    expect(result).toHaveProperty('solution_query');
    expect(result).toHaveProperty('difficulty');
  });
});
