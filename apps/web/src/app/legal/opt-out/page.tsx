import { OptOutForm } from '@/components/legal/opt-out-form';
import { Mail, Trash2 } from 'lucide-react';

export const metadata = {
  title: 'Delete My Browser Fingerprint Data | GDPR Data Removal',
  description: 'Request deletion of your browser fingerprint data from AmiUnique.io. Exercise your GDPR and CCPA rights to remove your digital identity information.',
};

export default function OptOutPage() {
  return (
    <div className="py-16">
      <div className="container mx-auto max-w-3xl px-4 space-y-12">
        {/* Header with H1 */}
        <header className="text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 mx-auto">
            <Trash2 className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Request Your Data Deletion
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Exercise your privacy rights under GDPR and CCPA. We&apos;ll permanently remove your browser fingerprint data within 30 days.
          </p>
        </header>

        <OptOutForm />
        <section className="rounded-3xl border border-white/30 bg-white/80 p-6 shadow-card dark:border-white/5 dark:bg-white/5">
          <h2 className="text-xl font-semibold mb-4">Manual request format</h2>
          <p className="text-sm text-muted-foreground">
            Prefer to write your own note? Email <a className="font-medium text-indigo-500" href="mailto:privacy@amiunique.io">privacy@amiunique.io</a> with the subject
            “Delete my AmiUnique fingerprint” and include the bronze hash plus any gold/silver hashes you have.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/60 px-4 py-2 text-sm text-muted-foreground dark:border-white/5 dark:bg-white/10">
            <Mail className="h-4 w-4" /> privacy@amiunique.io
          </div>
        </section>
      </div>
    </div>
  );
}
