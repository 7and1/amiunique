import { ChevronDown } from 'lucide-react';
import { faqs } from '@/data/faqs';

/**
 * Homepage FAQ accordion (#faq section).
 * Native <details>/<summary> — server-renderable, zero JS.
 */
export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-24 container mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">FAQ</p>
      <h2 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
        Frequently asked questions
      </h2>
      <div className="mt-8 space-y-4">
        {faqs.map(faq => (
          <details
            key={faq.question}
            className="group rounded-2xl border border-white/40 bg-white/70 shadow-card backdrop-blur-xl transition-colors open:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:open:bg-white/10"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left font-medium text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDown
                className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </summary>
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
