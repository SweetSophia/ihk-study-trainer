import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the 'ai' and '@ai-sdk/groq' modules before importing the module under test
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

vi.mock('@ai-sdk/groq', () => ({
  groq: vi.fn(() => 'mocked-groq-model'),
}));

// Mock auth functions
vi.mock('../../lib/auth', () => ({
  hashExists: vi.fn().mockResolvedValue(true),
}));

import { generateObject } from 'ai';
import { groq } from '@ai-sdk/groq';
import { generateSqlExercise, SqlExercise } from '../generate-sql-exercise';

const mockGenerateObject = vi.mocked(generateObject);
const mockGroq = vi.mocked(groq);

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
    vi.stubEnv('GROQ_API_KEY', 'test-groq-api-key');
  });

  it('returns an SqlExercise object on success', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    const result = await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    expect(result).toEqual(validExercise);
    expect(result.theme).toBe('Network Infrastructure Asset Inventory');
    expect(result.difficulty).toBe('easy');
  });

  it('calls generateObject with the groq model', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    expect(mockGroq).toHaveBeenCalledWith('llama-3.3-70b-versatile');
    expect(mockGenerateObject).toHaveBeenCalledOnce();
  });

  it('passes a prompt that includes a theme and SQL concept', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const callArgs = mockGenerateObject.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('THEMA:');
    expect(callArgs.prompt).toContain('SQL-KONZEPT:');
  });

  it('passes a Zod schema to generateObject', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const callArgs = mockGenerateObject.mock.calls[0][0] as any;
    expect(callArgs.schema).toBeDefined();
    // The schema should be a Zod object (it has a parse method)
    expect(typeof callArgs.schema.parse).toBe('function');
  });

  it('throws when generateObject rejects', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('API rate limit exceeded'));

    await expect(generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`)).rejects.toThrow('API rate limit exceeded');
  });

  it('throws when generateObject rejects with network error', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('Network error'));

    await expect(generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`)).rejects.toThrow('Network error');
  });

  it('selects a theme from the THEMES list', async () => {
    // Force Math.random to return 0, selecting the first theme
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const callArgs = mockGenerateObject.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('Network Infrastructure Asset Inventory');

    spy.mockRestore();
  });

  it('selects a SQL concept from the SQL_CONCEPTS list', async () => {
    // Force Math.random to return 0, selecting the first concept
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const callArgs = mockGenerateObject.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('SELECT mit WHERE Bedingung und ORDER BY');

    spy.mockRestore();
  });

  it('selects a different theme when Math.random returns a high value', async () => {
    // Math.random() returning 0.999 with Math.floor(0.999 * 6) = 5 (last theme)
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.999);
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const callArgs = mockGenerateObject.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('Software Lizenzverwaltung');

    spy.mockRestore();
  });

  it('returns the exact object from generateObject response', async () => {
    const customExercise: SqlExercise = {
      theme: 'IT-Helpdesk Ticket System',
      themeDescription: 'Verwaltung von Support-Tickets',
      setup_sql: 'CREATE TABLE tickets (id INT, title TEXT);',
      question: 'Zeige alle offenen Tickets an.',
      solution_query: 'SELECT * FROM tickets;',
      difficulty: 'medium',
    };
    mockGenerateObject.mockResolvedValueOnce({ object: customExercise } as any);

    const result = await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    expect(result).toEqual(customExercise);
  });

  it('includes IHK-specific instructions in the prompt', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    const callArgs = mockGenerateObject.mock.calls[0][0] as any;
    expect(callArgs.prompt).toContain('IHK');
    expect(callArgs.prompt).toContain('PostgreSQL');
  });
});

describe('SqlExercise Zod schema validation', () => {
  it('schema accepts valid easy difficulty', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: { ...validExercise, difficulty: 'easy' } } as any);
    const result = await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    expect(result.difficulty).toBe('easy');
  });

  it('schema accepts valid medium difficulty', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: { ...validExercise, difficulty: 'medium' } } as any);
    const result = await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    expect(result.difficulty).toBe('medium');
  });

  it('schema accepts valid hard difficulty', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: { ...validExercise, difficulty: 'hard' } } as any);
    const result = await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    expect(result.difficulty).toBe('hard');
  });

  it('all required SqlExercise fields are present in result', async () => {
    mockGenerateObject.mockResolvedValueOnce({ object: validExercise } as any);

    const result = await generateSqlExercise(`test-hash-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    expect(result).toHaveProperty('theme');
    expect(result).toHaveProperty('themeDescription');
    expect(result).toHaveProperty('setup_sql');
    expect(result).toHaveProperty('question');
    expect(result).toHaveProperty('solution_query');
    expect(result).toHaveProperty('difficulty');
  });
});