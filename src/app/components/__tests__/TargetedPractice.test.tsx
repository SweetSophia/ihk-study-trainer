import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import TargetedPractice from '../TargetedPractice';

const progress = [
  { module: 'linux', questions_attempted: 100, questions_correct: 70 },
  { module: 'sql', questions_attempted: 10, questions_correct: 2 },
  { module: 'binary', questions_attempted: 1, questions_correct: 0 },
];

it('waits for explicit topic choice and displays ratio, sample size and counting limits', async () => {
  const select = vi.fn();
  render(<TargetedPractice progress={progress} onSelectModule={select} />);
  const opener = screen.getByRole('button', { name: 'Gezielt üben' });
  expect(opener).toHaveAttribute('aria-expanded', 'false');
  expect(opener).not.toHaveAttribute('aria-controls');
  await userEvent.click(opener);
  const panel = screen.getByRole('region', { name: 'Thema zum Üben auswählen' });
  expect(opener).toHaveAttribute('aria-controls', panel.id);
  expect(opener).toHaveAttribute('aria-expanded', 'true');
  expect(within(panel).getByRole('heading', { name: 'Thema zum Üben auswählen' })).toHaveFocus();
  const topics = within(panel).getAllByRole('button', { name: / üben$/ });
  expect(topics.map(button => button.getAttribute('aria-label'))).toEqual(['SQL üben', 'Linux üben', 'Binär üben']);
  expect(topics[0]).toHaveTextContent('20%');
  expect(topics[0]).toHaveTextContent('2 von 10 richtig');
  expect(topics[0]).toHaveTextContent('10 gewertete Versuche');
  expect(topics[2]).toHaveTextContent('Wenige Versuche');
  expect(topics[2]).toHaveTextContent('1 gewerteter Versuch');
  const largerGroup = within(panel).getByRole('heading', { name: 'Ab 5 gewerteten Versuchen' });
  const smallerGroup = within(panel).getByRole('heading', { name: 'Wenige Versuche (1–4)' });
  expect(largerGroup.compareDocumentPosition(topics[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(topics[1].compareDocumentPosition(smallerGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(smallerGroup.compareDocumentPosition(topics[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(panel).getAllByText('Niedrigere Erfolgsquoten zuerst.')).toHaveLength(2);
  expect(within(panel).getByText(/gesamten gespeicherten Verlauf/)).toBeInTheDocument();
  expect(within(panel).getByText(/Prüfungsreife/)).toBeInTheDocument();
  await userEvent.click(within(panel).getByText('Wie werden Versuche gezählt?'));
  expect(within(panel).getByText(/jede gewertete falsche Prüfung/)).toBeVisible();
  expect(within(panel).getByText(/erste gewertete objektive Prüfung/)).toBeVisible();
  expect(select).not.toHaveBeenCalled();
  await userEvent.click(topics[1]);
  expect(select).toHaveBeenCalledExactlyOnceWith('linux');
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
});

it('closes with Escape or the close button and restores focus across repeated openings', async () => {
  const select = vi.fn();
  render(<TargetedPractice progress={progress} onSelectModule={select} />);
  const opener = screen.getByRole('button', { name: 'Gezielt üben' });
  await userEvent.click(opener);
  await userEvent.keyboard('{Escape}');
  expect(opener).toHaveFocus();
  expect(opener).toHaveAttribute('aria-expanded', 'false');
  await userEvent.keyboard('{Enter}');
  await userEvent.tab();
  expect(screen.getByRole('button', { name: 'Themenauswahl schließen' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(opener).toHaveFocus();
  expect(select).not.toHaveBeenCalled();
});

it('closes with Escape after Shift+Tab returns focus to the opener', async () => {
  render(<TargetedPractice progress={progress} onSelectModule={vi.fn()} />);
  const opener = screen.getByRole('button', { name: 'Gezielt üben' });
  await userEvent.click(opener);
  await userEvent.tab({ shift: true });
  expect(opener).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  expect(opener).toHaveAttribute('aria-expanded', 'false');
  expect(opener).not.toHaveAttribute('aria-controls');
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});

it('provides an empty state instead of suggesting a topic without scored history', async () => {
  render(<TargetedPractice progress={[
    {module:'handelskalkulation',questions_attempted:80,questions_correct:0},
    {module:'unknown',questions_attempted:40,questions_correct:0},
    {module:'sql',questions_attempted:0,questions_correct:0},
  ]} onSelectModule={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Gezielt üben' }));
  const panel=screen.getByRole('region');
  expect(within(panel).getByText(/Noch keine gewerteten Versuche für auswählbare Themen/)).toBeInTheDocument();
  expect(within(panel).queryAllByRole('button', { name: / üben$/ })).toHaveLength(0);
  expect(within(panel).getByText(/normalen Modulauswahl/)).toBeInTheDocument();
  expect(within(panel).queryByText('0%')).not.toBeInTheDocument();
});

it('keeps perfect topics selectable and refreshes statistics without selecting or closing', () => {
  const select=vi.fn();
  const {rerender}=render(<TargetedPractice progress={[{module:'linux',questions_attempted:4,questions_correct:4}]} onSelectModule={select} />);
  fireEvent.click(screen.getByRole('button',{name:'Gezielt üben'}));
  expect(screen.getByRole('button',{name:'Linux üben'})).toHaveTextContent('100%');
  expect(screen.getByRole('button',{name:'Linux üben'})).toHaveTextContent('Wenige Versuche');
  const focusedTopic = screen.getByRole('button',{name:'Linux üben'});
  focusedTopic.focus();
  rerender(<TargetedPractice progress={[{module:'linux',questions_attempted:5,questions_correct:5}]} onSelectModule={select} />);
  expect(screen.getByRole('button',{name:'Linux üben'})).toHaveFocus();
  expect(screen.getByRole('button',{name:'Linux üben'})).toBe(focusedTopic);
  expect(screen.getByRole('button',{name:'Linux üben'})).toHaveTextContent('5 gewertete Versuche');
  expect(screen.getByRole('button',{name:'Linux üben'})).not.toHaveTextContent('Wenige Versuche');
  expect(select).not.toHaveBeenCalled();
});
