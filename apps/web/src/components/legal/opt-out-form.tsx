'use client';

import { useState } from 'react';
import { Trash2, ShieldCheck, Hash, Mail } from 'lucide-react';

export function OptOutForm() {
  const [email, setEmail] = useState('');
  const [hash, setHash] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const body = encodeURIComponent(
      `Please delete my fingerprint data.\nContact: ${email}\nBronze hash: ${hash}\nAdditional details: ${message}`
    );
    const subject = encodeURIComponent('AmiUnique Opt-Out Request');
    window.location.href = `mailto:privacy@amiunique.io?subject=${subject}&body=${body}`;
    setStatus('We opened your email client with a pre-filled request.');
  };

  return (
    <>
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/60 px-4 py-1 text-sm text-muted-foreground dark:bg-white/10">
          <ShieldCheck className="h-4 w-4" /> GDPR / CCPA compliant
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Opt-out & deletion</h1>
        <p className="text-muted-foreground">
          Your fingerprint is stored for 90 days unless you request its deletion sooner. Provide the hash from your scan result
          and we will erase it within 24 hours.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/30 bg-white/80 p-8 shadow-card dark:border-white/5 dark:bg-white/5 space-y-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Contact email</label>
          <div className="mt-2 flex items-center rounded-2xl border border-white/40 bg-white/70 px-4 py-3 dark:border-white/5 dark:bg-white/10">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="ml-3 w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Bronze hash</label>
          <div className="mt-2 flex items-center rounded-2xl border border-white/40 bg-white/70 px-4 py-3 dark:border-white/5 dark:bg-white/10">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              required
              value={hash}
              onChange={event => setHash(event.target.value)}
              placeholder="Paste from scan result"
              className="ml-3 w-full bg-transparent font-mono text-xs focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Additional context (optional)</label>
          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/40 bg-white/70 p-4 text-sm focus:outline-none dark:border-white/5 dark:bg-white/10"
            rows={3}
            placeholder="Example: I switched browsers, please delete previous device hash."
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-white shadow-lg"
        >
          <Trash2 className="h-4 w-4" /> Generate deletion email
        </button>
        {status && <p className="text-sm text-emerald-500">{status}</p>}
      </form>
    </>
  );
}
