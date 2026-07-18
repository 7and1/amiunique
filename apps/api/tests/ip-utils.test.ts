import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { getClientIP, getIPVersion, isValidIP, maskIPAddress } from '../src/lib/ip-utils.js';

describe('IP utilities', () => {
  it('validates canonical IPv4 addresses and masks the host octet', () => {
    expect(getIPVersion('203.0.113.42')).toBe(4);
    expect(isValidIP('203.0.113.42')).toBe(true);
    expect(maskIPAddress('203.0.113.42')).toBe('203.0.113.x');
  });

  it('validates IPv6 addresses and masks the host portion', () => {
    expect(getIPVersion('2001:db8:abcd:12::1')).toBe(6);
    expect(isValidIP('2001:db8:abcd:12::1')).toBe(true);
    expect(maskIPAddress('2001:db8:abcd:12::1')).toBe('2001:db8:abcd:…');
    expect(maskIPAddress('2001:db8::42')).toBe('2001:db8:…');
  });

  it.each(['', 'unknown', '999.0.0.1', '1.2.3', 'not-an-ip', 'fe80::1%en0'])(
    'rejects invalid or unsafe address %s',
    value => {
      expect(getIPVersion(value)).toBeNull();
      expect(isValidIP(value)).toBe(false);
      expect(maskIPAddress(value)).toBe('Unavailable');
    }
  );

  it('ignores caller-controlled proxy headers in production', async () => {
    const app = new Hono<{ Bindings: { ENVIRONMENT: string } }>();
    app.get('/', c => c.text(getClientIP(c)));

    const spoofed = await app.fetch(
      new Request('https://api.example.test/', {
        headers: { 'X-Forwarded-For': '8.8.8.8', 'X-Real-IP': '1.1.1.1' },
      }),
      { ENVIRONMENT: 'production' }
    );
    expect(await spoofed.text()).toBe('unknown');

    const cloudflare = await app.fetch(
      new Request('https://api.example.test/', {
        headers: { 'CF-Connecting-IP': '203.0.113.42', 'X-Forwarded-For': '8.8.8.8' },
      }),
      { ENVIRONMENT: 'production' }
    );
    expect(await cloudflare.text()).toBe('203.0.113.42');
  });
});
