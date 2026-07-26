/**
 * Homepage FAQ content — single source of truth.
 * Rendered by components/home/faq-section.tsx and reused for the
 * FAQPage JSON-LD schema in components/seo/json-ld.tsx.
 */

export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: 'What is browser fingerprinting?',
    answer:
      'Browser fingerprinting is a technique that collects information about your browser and device to create a unique identifier. This includes your screen resolution, installed fonts, browser plugins, timezone, and many other attributes that, when combined, can identify you across websites — without cookies.',
  },
  {
    question: 'How unique is my browser fingerprint?',
    answer:
      'It depends on your device. A large-scale INRIA study of around 2 million fingerprints found 35.7% of desktop browsers and 18.5% of mobile browsers were unique, and Slido research measured about 33% for iPhones. Installed fonts, screen configuration, and graphics hardware contribute the most. Run the scan to see how your browser compares against our live dataset.',
  },
  {
    question: 'Can I prevent browser fingerprinting?',
    answer:
      'While difficult to completely prevent, you can reduce your fingerprint uniqueness by using privacy-focused browsers like Tor or Brave, enabling Firefox strict tracking protection, using standard screen resolutions, and minimizing installed fonts and extensions.',
  },
  {
    question: 'Is browser fingerprinting legal?',
    answer:
      'Browser fingerprinting legality varies by jurisdiction. Under GDPR in Europe, it may require user consent. Many websites use it for fraud prevention, security, and analytics. Our tool helps you understand what information is exposed.',
  },
  {
    question: 'What are the Three-Lock hashes?',
    answer:
      'AmiUnique.io summarizes your fingerprint into three hashes of increasing scope: Gold Lock (hardware signals that survive browser reinstalls), Silver Lock (software signals tied to your browser installation), and Bronze Lock (the full session fingerprint including network context like ASN and TLS).',
  },
  {
    question: 'Do you store my IP address?',
    answer:
      'No. Your raw IP address is never stored — not even in hashed form. We keep only derived summaries such as network risk context. Fingerprints are retained for a maximum of 90 days, and you can request deletion at any time at /legal/opt-out.',
  },
  {
    question: 'Is this test free?',
    answer:
      'Yes. The scan is free and the code is open source under the MIT license. No account or signup is needed.',
  },
];
