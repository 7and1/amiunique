import { HomeContent } from './home-content';
import { FAQJsonLd, WebApplicationJsonLd, TechArticleJsonLd } from '@/components/seo/json-ld';
import { faqs } from '@/data/faqs';
import {
  ARTICLE_DATE_PUBLISHED,
  ARTICLE_DATE_MODIFIED,
} from '@/components/home/article-content';

export const metadata = {
  title: { absolute: 'Am I Unique? Free Browser Fingerprint Test — AmiUnique.io' },
  description:
    'Run a free browser fingerprint test across 80+ signals — canvas, WebGL, audio, fonts, network. See how identifiable you are and which layer exposes you.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <WebApplicationJsonLd />
      <FAQJsonLd questions={faqs} />
      <TechArticleJsonLd
        headline="How Browser Fingerprinting Works — and What It Reveals About You"
        description="What browser fingerprinting is, why fingerprints are unique, the Three-Lock hash model, and evidence-based ways to reduce your identifiability."
        url="https://amiunique.io/#learn"
        datePublished={ARTICLE_DATE_PUBLISHED}
        dateModified={ARTICLE_DATE_MODIFIED}
      />
      <HomeContent />
    </>
  );
}
