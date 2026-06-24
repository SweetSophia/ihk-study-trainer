'use server';

import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import { hashExists, isValidAccessHash } from '../lib/auth';

// ---------------------------------------------------------------------------
// Type guard for error objects
// ---------------------------------------------------------------------------
function isErrorWithMessage(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (isErrorWithMessage(error)) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

// ---------------------------------------------------------------------------
// Rate limiting — in-memory store (per-instance, reset on cold start)
// For multi-instance production, replace with Redis/KV
// ---------------------------------------------------------------------------
const rateLimitWindowMs = 60 * 1000; // 1 minute
const rateLimitMaxCalls = 5; // max 5 calls per minute per accessHash

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(accessHash: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(accessHash);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(accessHash, { count: 1, resetAt: now + rateLimitWindowMs });
    return { allowed: true };
  }

  if (entry.count >= rateLimitMaxCalls) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Themes & Concepts
// ---------------------------------------------------------------------------
const THEMES = [
  'Network Infrastructure Asset Inventory',
  'Cyber Security Incident Logging',
  'Active Directory Benutzerverwaltung',
  'IT-Helpdesk Ticket System',
  'Server Monitoring & Auslastung',
  'Software Lizenzverwaltung',
];

const SQL_CONCEPTS = [
  'SELECT mit WHERE Bedingung und ORDER BY',
  'INNER JOIN zwischen zwei Tabellen',
  'GROUP BY mit HAVING Klausel',
  'INSERT INTO mit mehreren Werten',
  'UPDATE mit Bedingung',
  'DELETE mit WHERE Klausel',
  'COUNT, SUM, AVG Aggregation',
  'Subquery mit IN Operator',
  'LEFT JOIN mit IS NULL Prüfung',
  'DISTINCT und LIMIT',
];

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------
const schema = z.object({
  theme: z.string(),
  themeDescription: z.string().describe('Kurze Beschreibung des Szenarios auf Deutsch'),
  setup_sql: z.string().describe('CREATE TABLE und INSERT Statements (PostgreSQL Syntax)'),
  question: z.string().describe('Aufgabenstellung auf Deutsch, passend zum IHK Stil'),
  solution_query: z.string().describe('Die korrekte PostgreSQL Query als Lösung'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('Schwierigkeitsgrad'),
});

export type SqlExercise = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Helper to extract JSON from model response
// ---------------------------------------------------------------------------
function extractJSON(text: string): string {
  let jsonText = text.trim();

  // Try to match code blocks first
  const codeBlockMatch = jsonText.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  // If still has code block markers, try to find JSON between braces
  if (jsonText.startsWith('```') || jsonText.startsWith('{')) {
    const startIdx = jsonText.indexOf('{');
    const endIdx = jsonText.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      jsonText = jsonText.slice(startIdx, endIdx + 1);
    }
  }

  return jsonText.trim();
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------
export async function generateSqlExercise(accessHash: string): Promise<SqlExercise> {
  // 0. Check GROQ_API_KEY presence
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY ist nicht konfiguriert. Bitte wende dich an den Administrator.');
  }

  // 1. Validate the hash shape BEFORE hitting Supabase. The hash is the
  //    credential — accepting arbitrary strings would let attackers probe
  //    the auth path with arbitrary input. isValidAccessHash is a
  //    structural check (12 chars, [A-Za-z0-9]); existence in the DB
  //    is checked in step 2.
  if (!isValidAccessHash(accessHash)) {
    throw new Error('Unauthorized: Ungültiger Zugangscode.');
  }

  // 2. Validate accessHash exists in DB (throws on error with descriptive message)
  try {
    const valid = await hashExists(accessHash);
    if (!valid) {
      throw new Error('Unauthorized: Bitte melde dich an.');
    }
  } catch (error: unknown) {
    const message = getErrorMessage(error, 'Fehler bei der Anmeldung');
    throw new Error(message);
  }

  // 3. Check rate limit
  const { allowed, retryAfterMs } = checkRateLimit(accessHash);
  if (!allowed) {
    const retryAfterSec = Math.ceil((retryAfterMs ?? rateLimitWindowMs) / 1000);
    throw new Error(`rate limit: Bitte warte ${retryAfterSec}s.`);
  }

  // 4. Generate exercise with retry logic
  const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const randomConcept = SQL_CONCEPTS[Math.floor(Math.random() * SQL_CONCEPTS.length)];

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[generateSqlExercise] Attempt ${attempt}/${maxRetries}`);

      const { text } = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt: `Du bist ein erfahrener Datenbank-Dozent für die deutsche IHK-Prüfung zum Fachinformatiker für Systemintegration.
Erstelle EINE einzelne PostgreSQL-Übungsaufgabe im JSON-Format.

THEMA: ${randomTheme}
SQL-KONZEPT: ${randomConcept}

WICHTIG - Antworte NUR mit diesem exakten JSON-Format (keine andere textuelle Erklärung):
{"theme":"<THEMA>","themeDescription":"<beschreibung>","setup_sql":"<SQL>","question":"<frage>","solution_query":"<lösung>","difficulty":"<easy|medium|hard>"}

Regeln:
- theme: Eines der oberen Themen
- themeDescription: 1-2 Sätze auf Deutsch
- setup_sql: Gültige PostgreSQL CREATE TABLE + INSERT Statements, FORMATIERT mit Zeilenumbrüchen (jeder Befehl auf neuer Zeile)
- question: Aufgabe auf Deutsch, IHK-Stil
- solution_query: Vollständige PostgreSQL SELECT Query
- difficulty: "easy" ODER "medium" ODER "hard"
- Keine Markdown-Codeblöcke, keine Erklärung, NUR das JSON`,
      });

      const jsonText = extractJSON(text);
      console.log('[generateSqlExercise] Raw response:', jsonText.slice(0, 300));

      const parsed = schema.parse(JSON.parse(jsonText));
      return parsed;
    } catch (error: unknown) {
      lastError = error;
      const message = getErrorMessage(error, 'Unbekannter Fehler');
      console.error(`[generateSqlExercise] Attempt ${attempt} failed:`, message);

      // If it's a JSON parse error or Zod validation error, retry
      if (
        error instanceof SyntaxError ||
        error instanceof z.ZodError ||
        message.includes('Unexpected') ||
        message.includes('undefined') ||
        message.includes('Invalid')
      ) {
        if (attempt < maxRetries) {
          console.log('[generateSqlExercise] Retrying...');
          continue;
        }
      }

      // For other errors, throw immediately
      if (message.includes('rate limit') || message.includes('429')) {
        throw new Error(`rate limit: Bitte warte einen Moment.`);
      }
      if (message.includes('401') || message.includes('API key') || message.includes('authentication')) {
        throw new Error('GROQ_API_KEY ist ungültig oder abgelaufen. Bitte wende dich an den Administrator.');
      }
      if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNRESET')) {
        throw new Error('Zeitüberschreitung bei der Generierung. Bitte erneut versuchen.');
      }

      throw new Error(`Fehler bei der Generierung: ${message}`);
    }
  }

  // If we get here, all retries failed
  const finalMessage = getErrorMessage(lastError, 'Unbekannter Fehler');
  throw new Error(`Fehler bei der Generierung nach ${maxRetries} Versuchen: ${finalMessage}`);
}
