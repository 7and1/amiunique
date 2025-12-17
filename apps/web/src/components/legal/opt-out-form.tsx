'use client';

import { useState } from 'react';
import { Trash2, ShieldCheck, Hash, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';
import { submitDeletionRequest } from '@/lib/api';

type HashType = 'full' | 'software' | 'hardware';

const hashOptions: { value: HashType; label: string; helper: string }[] = [
  { value: 'full', label: 'Bronze (Session hash)', helper: 'Exact browser session you scanned' },
  { value: 'software', label: 'Silver (Browser hash)', helper: 'Same browser profile across sessions' },
  { value: 'hardware', label: 'Gold (Device hash)', helper: 'Device-level identifier across browsers' },
];

function isValidHash(value: string) {
  return /^[a-fA-F0-9]{64}$/.test(value.trim());
}

export function OptOutForm() {
  const [email, setEmail] = useState('');
  const [hash, setHash] = useState('');
  const [hashType, setHashType] = useState<HashType>('full');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (!isValidHash(hash)) {
      setError('Paste the 64-character hash from your scan results (Gold/Silver/Bronze).');
      return;
    }

    setLoading(true);
    try {
      const response = await submitDeletionRequest({
        hash_type: hashType,
        hash_value: hash.trim().toLowerCase(),
        email: email || undefined,
        reason: message || undefined,
      });

      setStatus(
        response.duplicate
          ? 'We already have a pending request for this hash. It will be processed soon.'
          : 'Deletion request queued. We typically complete removals within 24 hours.'
      );
      setRequestId(response.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request right now.');
    } finally {
      setLoading(false);
    }
  };

  const launchMailto = () => {
    const body = encodeURIComponent(
      `Please delete my fingerprint data.\nContact: ${email}\nHash type: ${hashType}\nHash: ${hash}\nAdditional details: ${message}`
    );
    const subject = encodeURIComponent('AmiUnique Opt-Out Request');
    window.location.href = `mailto:privacy@amiunique.io?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/60 px-4 py-1 text-sm text-muted-foreground dark:bg-white/10">
          <ShieldCheck className="h-4 w-4" /> GDPR / CCPA compliant
        </div>
        <h1 className="text-4xl font-semibold tracking-tight">Opt-out & deletion</h1>
        <p className="text-muted-foreground">
          Provide the hash from your scan result and we will purge it from the database. API submission keeps a receipt
          and skips the email dance.
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
          <label className="text-sm font-medium text-muted-foreground">Hash value</label>
          <div className="mt-2 flex items-center rounded-2xl border border-white/40 bg-white/70 px-4 py-3 dark:border-white/5 dark:bg-white/10">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              required
              value={hash}
              onChange={event => setHash(event.target.value)}
              placeholder="Paste the 64-char Gold/Silver/Bronze hash"
              className="ml-3 w-full bg-transparent font-mono text-xs focus:outline-none"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Hashes are SHA-256 and never stored alongside your email.</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Which hash are you deleting?</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {hashOptions.map(option => (
              <label key={option.value} className={`cursor-pointer rounded-2xl border bg-white/70 p-3 text-sm shadow-sm transition hover:border-indigo-300 dark:bg-white/5 ${hashType === option.value ? 'border-indigo-400 dark:border-indigo-500' : 'border-white/30 dark:border-white/10'}`}>
                <input
                  type="radio"
                  name="hash-type"
                  value={option.value}
                  checked={hashType === option.value}
                  onChange={() => setHashType(option.value)}
                  className="sr-only"
                />
                <p className="font-semibold text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{option.helper}</p>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Additional context (optional)</label>
          <textarea
            value={message}
            onChange={event => setMessage(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/40 bg-white/70 p-4 text-sm focus:outline-none dark:border-white/5 dark:bg-white/10"
            rows={3}
            placeholder="Example: I changed devices; please remove the previous Gold hash."
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-white shadow-lg disabled:opacity-70"
          >
            <Trash2 className="h-4 w-4" /> {loading ? 'Submitting…' : 'Submit deletion request'}
          </button>
          <button
            type="button"
            onClick={launchMailto}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-muted-foreground transition hover:border-white/50 dark:border-white/10"
          >
            <Mail className="h-4 w-4" /> Send via email instead
          </button>
        </div>

        {status && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            <span>{status}{requestId ? ` (Request ID: ${requestId})` : ''}</span>
          </div>
        )}

        {error && (
          <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </>
  );
}
