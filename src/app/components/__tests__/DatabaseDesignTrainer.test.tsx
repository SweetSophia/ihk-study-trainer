import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import DatabaseDesignTrainer from '../DatabaseDesignTrainer';
import { checkDatabaseTask } from '../../lib/databaseWorkerClient';
vi.mock('../../lib/databaseWorkerClient', () => ({ checkDatabaseTask: vi.fn() }));
const check = vi.mocked(checkDatabaseTask);
beforeEach(() => { check.mockReset(); check.mockResolvedValue({ correct: true }); });
const query = () => screen.getByLabelText('SQL für Aufgabe 1');
const button = () => screen.getByRole('button', { name: 'Aufgabe 1 prüfen' });
it('counts first check only; edits clear stale feedback; new run resets', async () => {
 const onAttempt = vi.fn(); render(<DatabaseDesignTrainer isAuthenticated onAttempt={onAttempt} />);
 fireEvent.change(query(), { target: { value: 'SELECT 1' } }); fireEvent.click(button()); fireEvent.click(button());
 await waitFor(() => expect(onAttempt).toHaveBeenCalledTimes(1));
 fireEvent.change(query(), { target: { value: 'SELECT 2' } });
 expect(screen.queryByText(/Beide Testdatensätze bestanden/)).not.toBeInTheDocument();
 fireEvent.click(button()); await waitFor(() => expect(check).toHaveBeenCalledTimes(2));
 expect(onAttempt).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('button', { name: 'Neuer Durchlauf' }));
 fireEvent.change(query(), { target: { value: 'SELECT 1' } }); fireEvent.click(button());
 await waitFor(() => expect(onAttempt).toHaveBeenCalledTimes(2));
});
it('never scores reasoning or a task whose solution was revealed', async () => {
 const onAttempt = vi.fn(); render(<DatabaseDesignTrainer isAuthenticated onAttempt={onAttempt} />);
 fireEvent.change(screen.getByLabelText('Dein relationales Modell und deine Begründung'), { target: { value: 'Alternative Schlüssel' } });
 fireEvent.click(screen.getAllByRole('checkbox')[0]);
 fireEvent.click(screen.getByRole('button', { name: /Lösung für Aufgabe 1/ }));
 fireEvent.change(query(), { target: { value: 'SELECT 1' } }); fireEvent.click(button());
 await screen.findByText(/Beide Testdatensätze bestanden/); expect(onAttempt).not.toHaveBeenCalled();
});
it('aborts on edits and ignores obsolete results', async () => {
 let resolve!: (value: { correct: boolean }) => void;
 check.mockImplementation(() => new Promise(r => { resolve = r; }));
 const onAttempt = vi.fn(); render(<DatabaseDesignTrainer isAuthenticated onAttempt={onAttempt} />);
 fireEvent.change(query(), { target: { value: 'SELECT 1' } }); fireEvent.click(button());
 const signal = check.mock.calls[0][2];
 fireEvent.change(query(), { target: { value: 'SELECT 2' } }); expect(signal.aborted).toBe(true);
 await act(async () => resolve({ correct: true })); expect(onAttempt).not.toHaveBeenCalled();
});
it('cancellation and infrastructure failure do not consume the attempt', async () => {
 check.mockRejectedValueOnce(new Error('Zeitlimit erreicht'));
 const onAttempt = vi.fn(); render(<DatabaseDesignTrainer isAuthenticated onAttempt={onAttempt} />);
 fireEvent.change(query(), { target: { value: 'SELECT 1' } }); fireEvent.click(button());
 await screen.findByText(/Zeitlimit erreicht/); expect(onAttempt).not.toHaveBeenCalled();
 fireEvent.click(button()); await waitFor(() => expect(onAttempt).toHaveBeenCalledTimes(1));
});
it('guest checks never persist progress and unmount aborts', () => {
 check.mockImplementation(() => new Promise(() => {}));
 const onAttempt = vi.fn(); const { unmount } = render(<DatabaseDesignTrainer isAuthenticated={false} onAttempt={onAttempt} />);
 fireEvent.change(query(), { target: { value: 'SELECT 1' } }); fireEvent.click(button());
 const signal = check.mock.calls[0][2]; unmount(); expect(signal.aborted).toBe(true); expect(onAttempt).not.toHaveBeenCalled();
});
it('explicit cancel and reset discard pending results', async () => {
 const resolvers: ((r: { correct: boolean }) => void)[] = [];
 check.mockImplementation(() => new Promise(r => resolvers.push(r)));
 const onAttempt = vi.fn(); render(<DatabaseDesignTrainer isAuthenticated onAttempt={onAttempt} />);
 fireEvent.change(query(), { target: { value: 'SELECT 1' } }); fireEvent.click(button());
 fireEvent.click(screen.getByRole('button', { name: 'Aufgabe 1 abbrechen' }));
 expect(check.mock.calls[0][2].aborted).toBe(true);
 fireEvent.click(button()); fireEvent.click(screen.getByRole('button', { name: 'Neuer Durchlauf' }));
 expect(check.mock.calls[1][2].aborted).toBe(true);
 await act(async () => resolvers.forEach(r => r({ correct: true })));
 expect(onAttempt).not.toHaveBeenCalled(); expect(query()).toHaveValue('');
});
it('revealing while running suppresses scoring and tasks score independently', async () => {
 let resolve!: (r: { correct: boolean }) => void;
 check.mockImplementationOnce(() => new Promise(r => { resolve = r; }));
 const onAttempt = vi.fn(); render(<DatabaseDesignTrainer isAuthenticated onAttempt={onAttempt} />);
 fireEvent.change(query(), { target: { value: 'SELECT 1' } }); fireEvent.click(button());
 fireEvent.click(screen.getByRole('button', { name: /Lösung für Aufgabe 1/ }));
 await act(async () => resolve({ correct: true })); expect(onAttempt).not.toHaveBeenCalled();
 check.mockResolvedValue({ correct: false });
 fireEvent.change(screen.getByLabelText('SQL für Aufgabe 2'), { target: { value: 'SELECT 2' } });
 fireEvent.click(screen.getByRole('button', { name: 'Aufgabe 2 prüfen' }));
 await waitFor(() => expect(onAttempt).toHaveBeenCalledWith(false));
 fireEvent.click(screen.getByRole('button', { name: 'Aufgabe 2 prüfen' }));
 await waitFor(() => expect(check).toHaveBeenCalledTimes(3)); expect(onAttempt).toHaveBeenCalledTimes(1);
});
