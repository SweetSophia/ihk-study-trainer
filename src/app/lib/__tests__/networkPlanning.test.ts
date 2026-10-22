import { describe, expect, it } from 'vitest';
import {
  NETWORK_GROUPS, NETWORK_EXAMPLE, validateNetworkPlan,
  type NetworkPlan, type AllocationField,
} from '../networkPlanning';

const plan = (): NetworkPlan => structuredClone(NETWORK_EXAMPLE);

function withOffice(field: AllocationField, value: string): NetworkPlan {
  const answers = plan();
  answers.office[field] = value;
  return answers;
}

describe('AP2 network allocation', () => {
  it('states host totals including gateways and validates the example', () => {
    expect(NETWORK_GROUPS.map(group => group.hosts)).toEqual([50, 25, 12]);
    expect(validateNetworkPlan(plan()).valid).toBe(true);
  });

  it('accepts an alternative allocation and arbitrary distinct permitted VLAN IDs', () => {
    expect(validateNetworkPlan({
      office: { network: '192.168.40.128', prefix: '26', vlan: '4094' },
      workshop: { network: '192.168.40.32', prefix: '27', vlan: '2' },
      guest: { network: '192.168.40.0', prefix: '28', vlan: '777' },
    }).valid).toBe(true);
  });

  it('accepts larger-than-minimum subnets', () => {
    expect(validateNetworkPlan({
      office: { network: '192.168.40.0', prefix: '25', vlan: '10' },
      workshop: { network: '192.168.40.128', prefix: '26', vlan: '20' },
      guest: { network: '192.168.40.192', prefix: '27', vlan: '30' },
    }).valid).toBe(true);
  });

  it('accepts adjacent blocks including the parent upper boundary', () => {
    expect(validateNetworkPlan({
      office: { network: '192.168.40.128', prefix: '26', vlan: '10' },
      workshop: { network: '192.168.40.192', prefix: '27', vlan: '20' },
      guest: { network: '192.168.40.240', prefix: '28', vlan: '30' },
    }).valid).toBe(true);
  });

  it.each(['', '192.168.40', '192.168.40.256', '192.168.40.-1', '192.168.40.0junk', '192.168.40.0/26', '192.168.040.0', '1.2.3.4.5', '0xc0.168.40.0', '192.168.40.0\nextra'])('rejects malformed IPv4 %j', value => {
    const result = validateNetworkPlan(withOffice('network', value));
    expect(result.valid).toBe(false);
    expect(result.rows.office.network.length).toBeGreaterThan(0);
  });

  it.each(['', '-1', '+26', '26.0', '26,0', '2.6e1', '26junk', '/26', '026', '33', 'Infinity', 'NaN'])('rejects malformed prefix %j', value => {
    const result = validateNetworkPlan(withOffice('prefix', value));
    expect(result.valid).toBe(false);
    expect(result.rows.office.prefix.length).toBeGreaterThan(0);
  });

  it.each(['', '0', '1', '-2', '+2', '4095', '20.0', '20,0', '2e1', '20junk', '020', 'Infinity', '9007199254740993'])('rejects invalid VLAN %j', value => {
    const result = validateNetworkPlan(withOffice('vlan', value));
    expect(result.valid).toBe(false);
    expect(result.rows.office.vlan.length).toBeGreaterThan(0);
  });

  it('allows surrounding whitespace without relaxing numeric syntax', () => {
    const answers = plan();
    answers.office = { network: ' 192.168.40.0 ', prefix: ' 26 ', vlan: ' 10 ' };
    expect(validateNetworkPlan(answers).valid).toBe(true);
  });

  it.each(['27', '30', '31', '32'])('rejects insufficient usable capacity /%s', prefix => {
    const result = validateNetworkPlan(withOffice('prefix', prefix));
    expect(result.rows.office.prefix.join(' ')).toMatch(/50/);
    expect(result.valid).toBe(false);
  });

  it('rejects a host address in place of an aligned network address', () => {
    const result = validateNetworkPlan(withOffice('network', '192.168.40.1'));
    expect(result.rows.office.network.join(' ')).toMatch(/Netzadresse/);
    expect(result.valid).toBe(false);
  });

  it.each(['192.168.39.0', '192.168.41.0', '10.0.0.0'])('rejects outside-parent network %s', network => {
    expect(validateNetworkPlan(withOffice('network', network)).rows.office.network.join(' ')).toMatch(/192\.168\.40\.0\/24/);
  });

  it('requires the entire subnet range inside the parent, not just its first address', () => {
    const result = validateNetworkPlan(withOffice('prefix', '23'));
    expect(result.valid).toBe(false);
    expect(result.rows.office.network.join(' ')).toMatch(/vollständig/);
  });

  it('handles /0 without signed shift overflow', () => {
    const answers = withOffice('prefix', '0');
    answers.office.network = '0.0.0.0';
    expect(validateNetworkPlan(answers).rows.office.network.join(' ')).toMatch(/vollständig/);
  });

  it('reports a nested overlap for the exact pair of groups', () => {
    const answers = plan();
    answers.workshop.network = '192.168.40.32';
    const result = validateNetworkPlan(answers);
    expect(result.valid).toBe(false);
    expect(result.conflicts).toEqual([expect.objectContaining({ groups: ['office', 'workshop'], kind: 'overlap' })]);
  });

  it('reports all three pairs for identical networks', () => {
    const answers = plan();
    for (const group of NETWORK_GROUPS) answers[group.id].network = '192.168.40.0';
    expect(validateNetworkPlan(answers).conflicts.filter(conflict => conflict.kind === 'overlap')).toHaveLength(3);
  });

  it('reports duplicate VLAN IDs separately from overlap', () => {
    const answers = plan();
    answers.workshop.vlan = answers.office.vlan;
    const result = validateNetworkPlan(answers);
    expect(result.valid).toBe(false);
    expect(result.conflicts).toEqual([expect.objectContaining({ groups: ['office', 'workshop'], kind: 'vlan' })]);
  });

  it('reports valid pairs even when the third row is malformed', () => {
    const answers = plan();
    answers.guest.network = 'bad';
    answers.workshop.network = '192.168.40.0';
    expect(validateNetworkPlan(answers).conflicts).toEqual([expect.objectContaining({ groups: ['office', 'workshop'], kind: 'overlap' })]);
  });
});
