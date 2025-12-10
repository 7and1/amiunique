import { describe, it, expect } from 'vitest';
import { formatHash, valueToDisplay, getRiskBadgeClass, getRiskColor } from '@/lib/utils';
import { estimateRarity } from '@/components/ui/rarity-badge';

describe('utility helpers', () => {
  it('formats hashes by keeping head and tail', () => {
    const hash = 'a'.repeat(32);
    expect(formatHash(hash, 16)).toBe('aaaaaaa...aaaaaaa');
  });

  it('renders friendly display values', () => {
    expect(valueToDisplay(true)).toBe('Yes');
    expect(valueToDisplay(['a', 'b'])).toBe('a, b');
    expect(valueToDisplay({ a: 1 })).toBe('{"a":1}');
  });

  it('maps risk to badge and color classes', () => {
    expect(getRiskBadgeClass('critical')).toContain('risk-badge-critical');
    expect(getRiskColor('low')).toBe('text-green-500');
  });
});

describe('rarity estimation', () => {
  it('treats hashes as unique', () => {
    expect(estimateRarity('hw_canvas_hash', '123')).toBe('unique');
  });

  it('classifies common screen resolutions', () => {
    expect(estimateRarity('hw_screen', '1920x1080')).toBe('common');
  });

  it('flags high memory as rare', () => {
    expect(estimateRarity('hw_memory', 32)).toBe('rare');
  });
});
