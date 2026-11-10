'use client';

import { useId, useRef, useState } from 'react';
import StudyCard from './StudyCard';
import { createReplayQuestion, validateSubnettingReplayAnswers, type SubnettingReplayRecord } from '../lib/subnettingReplay';

interface Props {
  records: SubnettingReplayRecord[];
  status: 'guest' | 'loading' | 'ready' | 'unavailable';
  message: string | null;
  onRefresh: () => void;
  onClear: () => void;
  onResolve: (id: string) => void;
  onStart: (start: () => void) => void;
  onReturn: () => void;
}

export default function SubnettingReplay({ records, status, message, onRefresh, onClear, onResolve, onStart, onReturn }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const instance = useId();
  const [session, setSession] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const revealed = useRef(false);
  const record = records.find(item => item.id === selected);
  const start = (id: string) => onStart(() => {
    revealed.current = false; setFeedback(null); setSession(value => value + 1); setSelected(id);
  });
  const retry = () => { revealed.current = false; setFeedback(null); setSession(value => value + 1); };

  return <section className="space-y-4 rounded-xl border border-line bg-surface p-5">
    <h2 className="text-lg font-semibold">Gespeicherte Subnetting-Fehler</h2>
    <p>Nur künftig falsch geprüfte Subnetting-Aufgaben werden mit deinem Konto synchronisiert. Maximal 100 Aufgaben bleiben 90 Tage für die Wiederholung verfügbar. Dein ursprünglicher Fortschritt bleibt unverändert.</p>
    <p>Aufgabendetails, der erste Fehler und die erste erfolgreiche Wiederholung ohne Lösungshilfe werden beim bestehenden Anbieter gespeichert. Wer den Zugangscode kennt, kann sie lesen.</p>
    {status === 'guest' && <p>Melde dich an, um Fehler geräteübergreifend zu speichern.</p>}
    {status === 'loading' && <p role="status">Gespeicherte Fehler werden geladen …</p>}
    {status === 'unavailable' && <p role="status">Synchronisierte Fehlerliste ist derzeit nicht verfügbar.</p>}
    {message && <p role="status">{message}</p>}
    {selected && !record && <p role="status">Diese Aufgabe ist nicht mehr verfügbar. Bitte die Fehlerliste aktualisieren.</p>}
    {selected && record && (status === 'ready' || status === 'loading') ? <>
      <p className="font-semibold">Wiederholung · ohne Wertung</p>
      <div hidden={status !== 'ready'} inert={status !== 'ready'}>
      <StudyCard key={session} shortcutsActive={status === 'ready'} autoFocusAnswers={status === 'ready'} question={createReplayQuestion(record.snapshot, `${instance}-${session}`)} onSolutionReveal={() => { revealed.current = true; }}
        nextLabel="Erneut versuchen" showSkip={false} onNextQuestion={retry}
        onCheckAnswer={answers => {
          const correct = validateSubnettingReplayAnswers(record.snapshot, answers);
          setFeedback(correct ? (revealed.current ? 'Richtig mit Lösungshilfe. Der Marker für selbstständiges Lösen bleibt unverändert.' : 'Richtig ohne Lösungshilfe.') : 'Noch nicht richtig. Versuche dieselbe Aufgabe erneut.');
          if (correct && !revealed.current) onResolve(record.id);
          return correct;
        }} />
      </div>
      {feedback && <p role="status">{feedback}</p>}
      <button type="button" onClick={() => { setSelected(null); setFeedback(null); }}>Zurück zur Fehlerliste</button>
    </> : <>
      {status === 'ready' && records.length === 0 && <p>Noch keine gespeicherten Fehler. Bisherige Fortschrittsdaten enthalten keine wiederholbaren Aufgaben.</p>}
      {status === 'ready' && records.length > 0 && <div className="space-y-3">
        {[false, true].map(solved => {
          const group = records.filter(item => !!item.resolvedAt === solved);
          return group.length > 0 && <section key={String(solved)}><h3 className="font-semibold">{solved ? 'In einer Wiederholung gelöst' : 'Noch nicht selbstständig gelöst'}</h3>
            <ul>{group.map((item, index) => <li key={item.id} className="my-2"><button type="button" className="rounded border border-control px-3 py-2" onClick={() => start(item.id)}>Aufgabe wiederholen {index + 1}: {item.snapshot.ip}/{item.snapshot.cidr}</button></li>)}</ul>
          </section>;
        })}
      </div>}
      <div className="flex flex-wrap gap-3">
        {status !== 'guest' && <button type="button" onClick={onRefresh}>Fehlerliste aktualisieren</button>}
        {status === 'ready' && <button type="button" onClick={() => setConfirmClear(true)}>Gespeicherte Fehler löschen</button>}
        <button type="button" onClick={onReturn}>Zurück zur normalen Übung</button>
      </div>
      {confirmClear && <div role="group" aria-label="Gespeicherte Fehler löschen bestätigen" className="space-y-2 rounded border border-warning p-3">
        <p>Alle gespeicherten Fehler dieses Kontos auf allen Geräten löschen? Dein Fortschritt bleibt erhalten.</p>
        <button autoFocus type="button" onClick={() => setConfirmClear(false)}>Abbrechen</button>{' '}
        <button type="button" onClick={() => { setConfirmClear(false); onClear(); }}>Endgültig löschen</button>
      </div>}
    </>}
  </section>;
}
