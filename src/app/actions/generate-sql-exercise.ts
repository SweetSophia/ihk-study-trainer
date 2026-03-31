'use server';

import { generateObject } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';

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
  'UPDATE mit WHERE Bedingung',
  'DELETE mit WHERE Klausel',
  'COUNT, SUM, AVG Aggregation',
  'Subquery mit IN Operator',
  'LEFT JOIN mit IS NULL Prüfung',
  'DISTINCT und LIMIT',
];

const schema = z.object({
  theme: z.string(),
  themeDescription: z.string().describe('Kurze Beschreibung des Szenarios auf Deutsch'),
  setup_sql: z.string().describe('CREATE TABLE und INSERT Statements (PostgreSQL Syntax)'),
  question: z.string().describe('Aufgabenstellung auf Deutsch, passend zum IHK Stil'),
  solution_query: z.string().describe('Die korrekte PostgreSQL Query als Lösung'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('Schwierigkeitsgrad'),
});

export type SqlExercise = z.infer<typeof schema>;

export async function generateSqlExercise(): Promise<SqlExercise> {
  const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const randomConcept = SQL_CONCEPTS[Math.floor(Math.random() * SQL_CONCEPTS.length)];

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

  return object;
}
