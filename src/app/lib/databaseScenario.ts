import { gradeSqlAnswer, type SqlGrading } from './sql-grading';

export const DATABASE_SCHEMA = `CREATE TABLE standort (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE geraet (
  id INTEGER PRIMARY KEY, inventarnummer TEXT NOT NULL UNIQUE,
  standort_id INTEGER NOT NULL REFERENCES standort(id),
  status TEXT NOT NULL CHECK (status IN ('aktiv', 'defekt', 'ausgemustert')),
  angeschafft_am DATE NOT NULL
);
CREATE TABLE wartung (
  id INTEGER PRIMARY KEY, geraet_id INTEGER NOT NULL REFERENCES geraet(id),
  datum DATE NOT NULL, notiz TEXT NOT NULL
);`;

export const DATABASE_FIXTURES = [
  `${DATABASE_SCHEMA}
INSERT INTO standort VALUES (1,'Büro'),(2,'Werkstatt'),(3,'Lager');
INSERT INTO geraet VALUES
(1,'PC-01',1,'aktiv','2018-01-01'),(2,'PC-02',1,'aktiv','2022-01-01'),
(3,'WS-01',2,'aktiv','2023-01-01'),(4,'ALT-01',2,'defekt','2019-12-31'),
(5,'NEU-01',1,'defekt','2020-01-01'),(6,'ALT-02',2,'ausgemustert','2017-01-01');
INSERT INTO wartung VALUES (1,1,'2026-01-01','Kontrolle'),(2,1,'2026-02-01','Reinigung'),(3,4,'2026-03-01','Diagnose');`,
  `${DATABASE_SCHEMA}
INSERT INTO standort VALUES (8,'Werkstatt'),(9,'Büro'),(10,'Büro');
INSERT INTO geraet VALUES
(20,'B-20',8,'aktiv','2019-01-01'),(22,'B-22',9,'aktiv','2024-01-01'),
(21,'B-21',10,'aktiv','2021-01-01'),(23,'B-23',8,'defekt','2010-01-01'),
(24,'B-24',9,'defekt','2019-12-31'),(25,'B-25',8,'defekt','2020-01-01'),
(26,'B-26',9,'ausgemustert','2010-01-01');
INSERT INTO wartung VALUES (8,22,'2026-01-01','Prüfung'),(9,22,'2026-01-01','Prüfung'),(10,23,'2026-02-01','Diagnose');`,
] as const;

export const DATABASE_TASKS: readonly { title: string; question: string; solution: string; grading: SqlGrading }[] = [
  {
    title: 'Aktive Geräte nach Standort',
    question: 'Liste alle Geräte mit status = aktiv mit den Ausgabespalten geraet_id, inventarnummer und standort. Sortiere aufsteigend nach Standortname, danach nach der eindeutigen Geräte-ID. Gleiche Standortnamen bleiben getrennte Standorte.',
    solution: "SELECT g.id AS geraet_id, g.inventarnummer, s.name AS standort FROM geraet g JOIN standort s ON s.id=g.standort_id WHERE g.status='aktiv' ORDER BY s.name, g.id",
    grading: { kind: 'select', ordered: true },
  },
  {
    title: 'Wartungen zählen – auch null',
    question: 'Gib für jedes Gerät geraet_id und anzahl der Wartungsdatensätze aus, auch 0. Jede Wartung zählt, auch bei gleichem Datum und gleicher Notiz. Die Reihenfolge ist beliebig.',
    solution: 'SELECT g.id AS geraet_id, COUNT(w.id) AS anzahl FROM geraet g LEFT JOIN wartung w ON w.geraet_id=g.id GROUP BY g.id',
    grading: { kind: 'select', ordered: false },
  },
  {
    title: 'Defekte Altgeräte ausmustern',
    question: "Setze ausschließlich bei Geräten mit status = defekt und angeschafft_am vor dem 01.01.2020 den Status auf ausgemustert. Der Stichtag selbst ist ausgeschlossen. Alle übrigen Werte und Tabellen bleiben unverändert. Verwende ein UPDATE.",
    solution: "UPDATE geraet SET status='ausgemustert' WHERE status='defekt' AND angeschafft_am < DATE '2020-01-01'",
    grading: { kind: 'mutation', operation: 'Update' },
  },
];

export async function gradeDatabaseTask(taskId: number, query: string): Promise<{ correct: boolean; message?: string }> {
  const task = DATABASE_TASKS[taskId];
  if (!Number.isInteger(taskId) || !task) throw new Error('Unbekannte Aufgabe.');
  for (const setup_sql of DATABASE_FIXTURES) {
    const result = await gradeSqlAnswer({ setup_sql, solution_query: task.solution, grading: task.grading }, query, { rejectInfrastructureErrors: true });
    if (!result.correct) return result;
  }
  return { correct: true };
}
