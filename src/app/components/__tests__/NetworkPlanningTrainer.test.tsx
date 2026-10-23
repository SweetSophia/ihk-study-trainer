import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NetworkPlanningTrainer from '../NetworkPlanningTrainer';
import { NETWORK_EXAMPLE, NETWORK_GROUPS, type NetworkPlan } from '../../lib/networkPlanning';

function fill(plan: NetworkPlan = NETWORK_EXAMPLE) {
  for (const group of NETWORK_GROUPS) {
    const row = within(screen.getByRole('group', { name: new RegExp(`^${group.label}`) }));
    fireEvent.change(row.getByLabelText('Netzadresse'), { target: { value: plan[group.id].network } });
    fireEvent.change(row.getByLabelText('Präfixlänge'), { target: { value: plan[group.id].prefix } });
    fireEvent.change(row.getByLabelText('VLAN-ID'), { target: { value: plan[group.id].vlan } });
  }
}

const check = () => screen.getByRole('button', { name: 'Netzplan prüfen' });

describe('NetworkPlanningTrainer', () => {
  it('states the complete original scenario and objective scoring boundaries', () => {
    render(<NetworkPlanningTrainer onAttempt={vi.fn()} isAuthenticated />);
    expect(screen.getByRole('heading', { name: 'AP2 Netzwerkplanung' })).toBeInTheDocument();
    expect(screen.getByText(/192\.168\.40\.0\/24/)).toBeInTheDocument();
    expect(screen.getByText(/einschließlich.*Gateway/)).toBeInTheDocument();
    expect(screen.getByText(/Erlaubt sind.*2–4094/)).toBeInTheDocument();
    expect(screen.getByText(/erste.*Prüfung.*Durchlauf/)).toBeInTheDocument();
    expect(screen.getByText(/Internet.*erlaubt.*Büro.*Werkstatt.*verboten/)).toBeInTheDocument();
    expect(screen.getByText(/Plane DNS.*DHCP/)).toBeInTheDocument();
    expect(screen.getByText(/nicht automatisch bewertet/)).toBeInTheDocument();
  });

  it('shows accessible row errors for incomplete or malformed inputs', () => {
    const onAttempt = vi.fn();
    render(<NetworkPlanningTrainer onAttempt={onAttempt} isAuthenticated />);
    fireEvent.click(check());
    const office = within(screen.getByRole('group', { name: /^Büro/ }));
    expect(office.getByLabelText('Netzadresse')).toHaveAttribute('aria-invalid', 'true');
    expect(office.getByLabelText('Netzadresse')).toHaveAccessibleDescription(/IPv4/);
    expect(office.getByLabelText('Präfixlänge')).toHaveAccessibleDescription(/Präfixlänge/);
    expect(office.getByLabelText('VLAN-ID')).toHaveAccessibleDescription(/VLAN-ID/);
    expect(screen.getByRole('status')).toHaveTextContent(/korrigieren/);
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('shows pair conflicts and associates them with affected fields', () => {
    render(<NetworkPlanningTrainer onAttempt={vi.fn()} isAuthenticated />);
    const answers = structuredClone(NETWORK_EXAMPLE);
    answers.workshop.network = '192.168.40.32';
    answers.workshop.vlan = '10';
    fill(answers);
    fireEvent.click(check());
    const office = within(screen.getByRole('group', { name: /^Büro/ }));
    expect(screen.getByText('Büro und Werkstatt: Die Teilnetze überlappen sich.')).toBeInTheDocument();
    expect(office.getByLabelText('Netzadresse')).toHaveAccessibleDescription(/überlappen/);
    expect(office.getByLabelText('VLAN-ID')).toHaveAccessibleDescription(/Unterschiedliche VLAN/);
  });

  it('records one objective attempt despite repeated clicks and rechecks', () => {
    const onAttempt = vi.fn();
    render(<NetworkPlanningTrainer onAttempt={onAttempt} isAuthenticated />);
    fill();
    const button = check();
    act(() => {
      button.click();
      button.click();
    });
    expect(screen.getByRole('status')).toHaveTextContent(/erfüllt/);
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true);
    fireEvent.change(screen.getAllByLabelText('VLAN-ID')[0], { target: { value: '99' } });
    fireEvent.click(button);
    expect(onAttempt).toHaveBeenCalledTimes(1);
  });

  it('clears stale success and row/pair errors when allocation fields change', () => {
    render(<NetworkPlanningTrainer onAttempt={vi.fn()} isAuthenticated />);
    fill();
    fireEvent.click(check());
    fireEvent.change(screen.getAllByLabelText('Netzadresse')[0], { target: { value: 'bad' } });
    expect(screen.getByRole('status')).not.toHaveTextContent(/erfüllt/);
    fireEvent.click(check());
    expect(screen.getAllByLabelText('Netzadresse')[0]).toHaveAttribute('aria-invalid', 'true');
    fill();
    expect(screen.getAllByLabelText('Netzadresse')[0]).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(/Eine vollständige IPv4/)).not.toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText('VLAN-ID')[0], { target: { value: '20' } });
    fireEvent.click(check());
    expect(screen.getByText(/Unterschiedliche VLAN-IDs erforderlich/)).toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText('VLAN-ID')[0], { target: { value: '10' } });
    expect(screen.queryByText(/Unterschiedliche VLAN-IDs erforderlich/)).not.toBeInTheDocument();
  });

  it('does not turn a corrected first wrong attempt into additional progress', () => {
    const onAttempt = vi.fn();
    render(<NetworkPlanningTrainer onAttempt={onAttempt} isAuthenticated />);
    fireEvent.click(check());
    fill();
    fireEvent.click(check());
    expect(screen.getByRole('status')).toHaveTextContent(/erfüllt/);
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('never scores reasoning text or rubric ticks', async () => {
    const user = userEvent.setup();
    const onAttempt = vi.fn();
    render(<NetworkPlanningTrainer onAttempt={onAttempt} isAuthenticated />);
    await user.type(screen.getByRole('textbox', { name: 'Begründung der Verkehrsregeln' }), 'Meine Regeln');
    for (const checkbox of screen.getAllByRole('checkbox')) await user.click(checkbox);
    expect(onAttempt).not.toHaveBeenCalled();
    fill();
    await user.click(check());
    expect(onAttempt).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('reveals one possible example without scoring and keeps subsequent checks practice-only', async () => {
    const user = userEvent.setup();
    const onAttempt = vi.fn();
    render(<NetworkPlanningTrainer onAttempt={onAttempt} isAuthenticated />);
    await user.click(screen.getByRole('button', { name: /Beispiel anzeigen/ }));
    expect(screen.getByRole('heading', { name: 'Eine mögliche Lösung' })).toBeInTheDocument();
    expect(screen.getByText(/Andere gültige Aufteilungen/)).toBeInTheDocument();
    expect(screen.getByText(/Beispiel geöffnet:.*ohne Wertung/)).toBeInTheDocument();
    expect(onAttempt).not.toHaveBeenCalled();
    fill();
    await user.click(check());
    expect(onAttempt).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(/erfüllt/);
  });

  it('starts a fresh run explicitly, clearing reasoning, rubric, example and feedback', async () => {
    const user = userEvent.setup();
    const onAttempt = vi.fn();
    render(<NetworkPlanningTrainer onAttempt={onAttempt} isAuthenticated />);
    fill();
    await user.click(check());
    await user.type(screen.getByRole('textbox', { name: 'Begründung der Verkehrsregeln' }), 'Notizen');
    await user.click(screen.getAllByRole('checkbox')[0]);
    await user.click(screen.getByRole('button', { name: /Beispiel anzeigen/ }));
    await user.click(screen.getByRole('button', { name: 'Neuer Durchlauf' }));
    expect(screen.getByRole('textbox', { name: 'Begründung der Verkehrsregeln' })).toHaveValue('');
    expect(screen.getAllByRole('checkbox').every(input => !(input as HTMLInputElement).checked)).toBe(true);
    expect(screen.queryByRole('heading', { name: 'Eine mögliche Lösung' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).not.toHaveTextContent(/erfüllt/);
    expect(screen.getAllByLabelText('Netzadresse')[0]).toHaveValue('');
    fill();
    await user.click(check());
    expect(onAttempt).toHaveBeenCalledTimes(2);
  });

  it('allows guest use without recording progress', () => {
    const onAttempt = vi.fn();
    render(<NetworkPlanningTrainer onAttempt={onAttempt} isAuthenticated={false} />);
    fill();
    fireEvent.click(check());
    expect(screen.getByRole('status')).toHaveTextContent(/erfüllt/);
    expect(onAttempt).not.toHaveBeenCalled();
    expect(screen.getByText(/Gast.*Fortschritt/)).toBeInTheDocument();
  });

  it('does not persist reasoning or rubric between mounts', () => {
    const { unmount } = render(<NetworkPlanningTrainer onAttempt={vi.fn()} isAuthenticated />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Begründung der Verkehrsregeln' }), { target: { value: 'private reasoning' } });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    unmount();
    render(<NetworkPlanningTrainer onAttempt={vi.fn()} isAuthenticated />);
    expect(screen.getByRole('textbox', { name: 'Begründung der Verkehrsregeln' })).toHaveValue('');
    expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
  });
});
