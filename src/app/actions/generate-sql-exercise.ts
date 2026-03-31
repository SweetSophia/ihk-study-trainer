'use server';

import { generateObject } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import { hashExists } from '../lib/auth';

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
// Server Action
// ---------------------------------------------------------------------------
export async function generateSqlExercise(accessHash: string): Promise<SqlExercise> {
  console.log('[generateSqlExercise] Called with hash:', accessHash ? `${accessHash.slice(0, 8)}...` : 'MISSING');
  console.log('[generateSqlExercise] GROQ_API_KEY set:', !!process.env.GROQ_API_KEY);
  
  // 0. Check GROQ_API_KEY presence
  if (!process.env.GROQ_API_KEY) {
    console.error('[generateSqlExercise] GROQ_API_KEY missing!');
    throw new Error('GROQ_API_KEY ist nicht konfiguriert. Bitte wende dich an den Administrator.');
  }

  // 1. Validate accessHash exists in DB (throws on error with descriptive message)
  console.log('[generateSqlExercise] Calling hashExists...');
  try {
    const valid = await hashExists(accessHash);
    console.log('[generateSqlExercise] hashExists returned:', valid);
    if (!valid) {
      throw new Error('Unauthorized: Bitte melde dich an.');
    }
  } catch (error: unknown) {
    // Re-throw descriptive errors from hashExists
    const message = getErrorMessage(error, 'Fehler bei der Anmeldung');
    console.error('[generateSqlExercise] hashExists error:', message);
    throw new Error(message);
  }
  console.log('[generateSqlExercise] hash validated OK');

  // 2. Check rate limit
  console.log('[generateSqlExercise] Checking rate limit...');
  const { allowed, retryAfterMs } = checkRateLimit(accessHash);
  if (!allowed) {
    const retryAfterSec = Math.ceil((retryAfterMs ?? rateLimitWindowMs) / 1000);
    console.error('[generateSqlExercise] Rate limit exceeded');
    throw new Error(`rate limit: Bitte warte ${retryAfterSec}s.`);
  }
  console.log('[generateSqlExercise] Rate limit OK');

  // 3. Generate exercise
  console.log('[generateSqlExercise] Generating exercise with Groq...');
  const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const randomConcept = SQL_CONCEPTS[Math.floor(Math.random() * SQL_CONCEPTS.length)];

  try {
    console.log('[generateSqlExercise] Calling generateObject with theme:', randomTheme);
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema,
      prompt: `Du bist ein erfahrener Datenbank-Dozent für die deutsche IHK-Prüfung zum Fachinformatiker für Systemintegration.
Erstelle eine einzelne PostgreSQL-Übungsaufgabe basierend auf folgendem Thema und Konzept.

THEMA: ${randomTheme}
SQL-KONZEPT: ${randomConcept}

Anforderungen:
- Die setup_sql muss gültige PostgreSQL CREATE TABLE und INSERT Statements enthalten
- Es sollen 2 Tabellen mit je 3-5 Zeilen Dummy-Daten erstellt werden
- Die Frage muss auf Deutsch sein und zum IHK-Stil passen (praxisnah, technisch präzise)
- Die solution_query muss die Aufgabe korrekt lösen
- Alles muss in einem einzigen JSON-Objekt zurückgegeben werden

Gib NUR das JSON-Objekt zurück, ohne Markdown-Formatierung oder zusätzlichen Text.`,
    });
    console.log('[generateSqlExercise] generateObject succeeded');

    return object;
  } catch (error: unknown) {
    console.error('[generateSqlExercise] generateObject failed:', error);
    // Handle known error patterns
    const message = getErrorMessage(error, 'Unbekannter Fehler');

    if (message.includes('rate limit') || message.includes('429')) {
      throw new Error(`rate limit: Bitte warte einen Moment.`);
    }
    if (message.includes('401') || message.includes('API key') || message.includes('authentication')) {
      throw new Error('GROQ_API_KEY ist ungültig oder abgelaufen. Bitte wende dich an den Administrator.');
    }
    if (message.includes('timeout') || message.includes('ETIMEDOUT') || message.includes('ECONNRESET')) {
      throw new Error('Zeitüberschreitung bei der Generierung. Bitte erneut versuchen.');
    }

    console.error('generateObject error:', error);
    throw new Error(`Fehler bei der Generierung: ${message}`);
  }
}
