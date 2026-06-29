import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import SubnettingVisualizer, {
  parseIpAndCidr,
  countCidrFromMask,
} from '../SubnettingVisualizer';
import type { Question } from '../../types';

// ---------------------------------------------------------------------------
// Framer-motion: pass through so AnimatePresence / motion.* don't fight jsdom.
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
    section: ({
      children,
      className,
      ...rest
    }: {
      children?: ReactNode;
      className?: string;
    } & React.HTMLAttributes<HTMLElement>) => (
      <section className={className} {...rest}>
        {children}
      </section>
    ),
    div: ({
      children,
      className,
      ...rest
    }: {
      children?: ReactNode;
      className?: string;
    } & React.HTMLAttributes<HTMLDivElement>) => (
      <div className={className} {...rest}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// ---------------------------------------------------------------------------
// Lucide-react: tiny stand-ins.
// ---------------------------------------------------------------------------
vi.mock('lucide-react', () => ({
  Network: () => <svg data-testid="icon-network" />,
  Eye: () => <svg data-testid="icon-eye" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSubnettingQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'subnetting-viz-1',
    theme: 'Netzwerkarchitektur & Overhead',
    module: 'subnetting',
    questionText: 'Gegeben: IP-Adresse 10.5.3.4/24\nBerechne: Network ID, Broadcast, ...',
    expectedAnswers: {
      networkId: '10.5.3.0',
      broadcast: '10.5.3.255',
      hostMin: '10.5.3.1',
      hostMax: '10.5.3.254',
      subnetMask: '255.255.255.0',
      usableHosts: 254,
    },
    solutionSteps: ['Schritt 1: ...'],
    difficulty: 'easy',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// Pure helpers
// ===========================================================================

describe('parseIpAndCidr', () => {
  it('parses an IPv4/CIDR pair embedded in the question template', () => {
    expect(parseIpAndCidr('Gegeben: IP-Adresse 10.5.3.4/24\nBerechne: ...')).toEqual({
      ip: '10.5.3.4',
      cidr: 24,
    });
  });

  it('tolerates whitespace around the slash', () => {
    expect(parseIpAndCidr('IP 10.0.0.1 / 8 irgendwo')).toEqual({
      ip: '10.0.0.1',
      cidr: 8,
    });
  });

  it('handles /17 (smallest supported) and /32', () => {
    expect(parseIpAndCidr('10.0.0.0/17')?.cidr).toBe(17);
    expect(parseIpAndCidr('10.0.0.0/32')?.cidr).toBe(32);
  });

  it('returns null when no IPv4/CIDR token is present', () => {
    expect(parseIpAndCidr('Berechne Network ID')).toBeNull();
    expect(parseIpAndCidr('')).toBeNull();
  });

  it('returns null when an octet is out of range', () => {
    expect(parseIpAndCidr('999.1.1.1/24')).toBeNull();
    expect(parseIpAndCidr('10.256.0.1/24')).toBeNull();
  });

  it('returns null when the CIDR is out of range', () => {
    expect(parseIpAndCidr('10.0.0.1/33')).toBeNull();
    expect(parseIpAndCidr('10.0.0.1/-1')).toBeNull();
    expect(parseIpAndCidr('10.0.0.1/abc')).toBeNull();
  });

  it('does not greedily consume extra digits past the CIDR', () => {
    // The lookahead `(?!\d)` prevents matching /245 when the slash is
    // followed by more digits; we want the two-digit prefix only.
    const result = parseIpAndCidr('10.0.0.1/24foo');
    expect(result?.cidr).toBe(24);
  });

  it('returns null for non-string input', () => {
    // @ts-expect-error - exercising runtime guard
    expect(parseIpAndCidr(undefined)).toBeNull();
    // @ts-expect-error - exercising runtime guard
    expect(parseIpAndCidr(null)).toBeNull();
  });
});

describe('countCidrFromMask', () => {
  it('counts 1-bits across dotted-decimal masks', () => {
    expect(countCidrFromMask('255.255.255.0')).toBe(24);
    expect(countCidrFromMask('255.255.0.0')).toBe(16);
    expect(countCidrFromMask('255.255.255.128')).toBe(25);
    expect(countCidrFromMask('255.255.255.252')).toBe(30);
    expect(countCidrFromMask('128.0.0.0')).toBe(1);
  });

  it('returns 0 for /0 mask', () => {
    expect(countCidrFromMask('0.0.0.0')).toBe(0);
  });

  it('returns null for malformed input', () => {
    expect(countCidrFromMask('')).toBeNull();
    expect(countCidrFromMask('not-a-mask')).toBeNull();
    expect(countCidrFromMask('255.255.255')).toBeNull();
    expect(countCidrFromMask('255.255.300.0')).toBeNull();
    expect(countCidrFromMask('-1.0.0.0')).toBeNull();
  });
});

// ===========================================================================
// Component rendering
// ===========================================================================

describe('SubnettingVisualizer — rendering', () => {
  it('renders a clearly-labelled section with the subnetting data', () => {
    const question = makeSubnettingQuestion();
    render(<SubnettingVisualizer question={question} />);

    expect(screen.getByTestId('subnetting-visualizer')).toBeInTheDocument();
    expect(screen.getByText('Visuelle Aufschlüsselung')).toBeInTheDocument();
  });

  it('shows the IP and CIDR parsed from questionText', () => {
    const question = makeSubnettingQuestion();
    render(<SubnettingVisualizer question={question} />);

    expect(screen.getByTestId('viz-given-ip')).toHaveTextContent('10.5.3.4');
    expect(screen.getByTestId('viz-cidr')).toHaveTextContent('/24');
  });

  it('falls back to CIDR derived from the subnet mask when no IP/CIDR is in the text', () => {
    const question = makeSubnettingQuestion({
      questionText: 'Berechne die Subnetz-Werte für diese Aufgabe.',
    });
    render(<SubnettingVisualizer question={question} />);

    // No IP parsed → IP node should not appear.
    expect(screen.queryByTestId('viz-given-ip')).toBeNull();
    // But CIDR is still recoverable from the mask.
    expect(screen.getByTestId('viz-cidr')).toHaveTextContent('/24');
  });

  it('shows the expected subnet mask, network, broadcast, host range, and usable hosts', () => {
    const question = makeSubnettingQuestion();
    render(<SubnettingVisualizer question={question} />);

    expect(screen.getByTestId('viz-mask')).toHaveTextContent('255.255.255.0');
    expect(screen.getByTestId('viz-network-id')).toHaveTextContent('10.5.3.0');
    expect(screen.getByTestId('viz-broadcast')).toHaveTextContent('10.5.3.255');
    expect(screen.getByTestId('viz-host-min')).toHaveTextContent('10.5.3.1');
    expect(screen.getByTestId('viz-host-max')).toHaveTextContent('10.5.3.254');
    // German locale formatting
    expect(screen.getByTestId('viz-usable-hosts')).toHaveTextContent('254');
  });

  it('renders two SVGs (bit bar + range bar) with descriptive aria-labels', () => {
    const question = makeSubnettingQuestion();
    render(<SubnettingVisualizer question={question} />);

    const bitBar = screen.getByRole('img', {
      name: /32-Bit-Aufteilung: 24 Netzwerk-Bits, 8 Host-Bits/,
    });
    expect(bitBar).toBeInTheDocument();

    const rangeBar = screen.getByRole('img', {
      name: /Adressbereich: 10\.5\.3\.0 \(Network\) bis 10\.5\.3\.255 \(Broadcast\)/,
    });
    expect(rangeBar).toBeInTheDocument();
  });

  it('uses exponentiation for /0 address counts instead of bit-shift overflow', () => {
    const question = makeSubnettingQuestion({
      questionText: 'Gegeben: IP-Adresse 0.0.0.0/0\nBerechne: ...',
      expectedAnswers: {
        networkId: '0.0.0.0',
        broadcast: '255.255.255.255',
        hostMin: '0.0.0.1',
        hostMax: '255.255.255.254',
        subnetMask: '0.0.0.0',
        usableHosts: 4294967294,
      },
    });

    render(<SubnettingVisualizer question={question} />);

    expect(screen.getByText(/4\.294\.967\.296 Adressen/)).toBeInTheDocument();
    expect(screen.getByText(/4\.294\.967\.294 nutzbar/)).toBeInTheDocument();
  });

  it('shows the same detail values regardless of IP/CIDR parsing outcome', () => {
    const withText = makeSubnettingQuestion();
    const withoutText = makeSubnettingQuestion({
      questionText: 'Komplett anderer Text ohne IP.',
    });
    const { rerender } = render(<SubnettingVisualizer question={withText} />);
    const networkIdA = screen.getByTestId('viz-network-id').textContent;
    const usableHostsA = screen.getByTestId('viz-usable-hosts').textContent;

    rerender(<SubnettingVisualizer question={withoutText} />);
    expect(screen.getByTestId('viz-network-id').textContent).toBe(networkIdA);
    expect(screen.getByTestId('viz-usable-hosts').textContent).toBe(usableHostsA);
  });
});

// ===========================================================================
// Subnetting-only gating (handled by the parent in StudyCard.tsx).
// The component itself still renders a usable visual for any subnetting-like
// payload it receives, so we test the gating behaviour at the integration
// level via the StudyCard test (see StudyCard.test.tsx).
// ===========================================================================

describe('SubnettingVisualizer — non-subnetting payloads still render visual fields', () => {
  // The component is gated by the parent, so we don't expect it to refuse
  // a non-subnetting module here. Instead we assert that it gracefully shows
  // whatever values exist in `expectedAnswers` — degradation, not crash.
  it('renders gracefully with an unexpected module id', () => {
    const question = makeSubnettingQuestion({ module: 'something-else' });
    render(<SubnettingVisualizer question={question} />);

    expect(screen.getByTestId('viz-network-id')).toHaveTextContent('10.5.3.0');
  });
});

// ===========================================================================
// Detail row "Tone" sanity (catches regressions in the visible labels).
// ===========================================================================

describe('SubnettingVisualizer — German labels and accessibility', () => {
  it('uses German section labels', () => {
    render(<SubnettingVisualizer question={makeSubnettingQuestion()} />);

    // Section labels
    expect(screen.getByText('32-Bit-Aufteilung')).toBeInTheDocument();
    expect(screen.getByText('Adressbereich im Subnetz')).toBeInTheDocument();

    // Detail labels
    const dl = screen.getByLabelText('Erwartete Subnetz-Werte');
    expect(within(dl).getByText('Network ID')).toBeInTheDocument();
    expect(within(dl).getByText('Broadcast')).toBeInTheDocument();
    expect(within(dl).getByText('Subnetzmaske')).toBeInTheDocument();
    expect(within(dl).getByText('Erster Host')).toBeInTheDocument();
    expect(within(dl).getByText('Letzter Host')).toBeInTheDocument();
    expect(within(dl).getByText('Nutzbare Hosts')).toBeInTheDocument();
  });

  it('marks the wrapper section with a meaningful aria-label', () => {
    render(<SubnettingVisualizer question={makeSubnettingQuestion()} />);

    const section = screen.getByLabelText('Subnetting Visualisierung');
    expect(section.tagName.toLowerCase()).toBe('section');
  });
});
