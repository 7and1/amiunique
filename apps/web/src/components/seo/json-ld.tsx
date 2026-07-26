/**
 * JSON-LD Structured Data Components for SEO
 * Helps search engines understand our content better
 */

import { faqs } from '@/data/faqs';

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function OrganizationJsonLd({
  name = 'AmiUnique.io',
  url = 'https://amiunique.io',
  logo = 'https://amiunique.io/logo.png',
  description = 'Browser fingerprinting detection platform with 80+ dimensions',
}: OrganizationJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: ['https://github.com/7and1/amiunique'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

interface WebApplicationJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
  featureList?: string[];
}

export function WebApplicationJsonLd({
  name = 'AmiUnique.io Browser Fingerprint Scanner',
  url = 'https://amiunique.io',
  description = 'Free browser fingerprinting detection tool that analyzes 80+ dimensions to show how unique and trackable your browser is.',
  applicationCategory = 'SecurityApplication',
  operatingSystem = 'Web Browser',
  offers = { price: '0', priceCurrency: 'USD' },
  featureList = [
    'Canvas fingerprint detection',
    'WebGL fingerprint analysis',
    'Audio context fingerprinting',
    'Font enumeration detection',
    'Screen resolution tracking',
    'Timezone analysis',
    'Browser plugin detection',
    'Hardware fingerprinting',
  ],
}: WebApplicationJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    description,
    applicationCategory,
    operatingSystem,
    offers: {
      '@type': 'Offer',
      price: offers.price,
      priceCurrency: offers.priceCurrency,
    },
    featureList,
    browserRequirements: 'Modern web browser with JavaScript enabled',
    softwareVersion: '2.0',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

interface FAQJsonLdProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

interface HowToJsonLdProps {
  name: string;
  description: string;
  steps: Array<{
    name: string;
    text: string;
  }>;
}

export function HowToJsonLd({ name, description, steps }: HowToJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

interface TestResultJsonLdProps {
  name?: string;
  description?: string;
  dateCreated?: string;
  url?: string;
  result?: {
    exactMatches: string;
    risk: string;
    dimensionsAnalyzed: number;
  };
}

export function TestResultJsonLd({
  name = 'Browser Fingerprint Analysis',
  description = 'Comprehensive browser fingerprint test analyzing 80+ dimensions including canvas, WebGL, audio, fonts, and hardware signals.',
  dateCreated,
  url = 'https://amiunique.io/scan/result',
  result,
}: TestResultJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: name,
    description,
    url,
    datePublished: dateCreated || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'AmiUnique.io',
      url: 'https://amiunique.io',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AmiUnique.io',
      url: 'https://amiunique.io',
      logo: {
        '@type': 'ImageObject',
        url: 'https://amiunique.io/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    about: {
      '@type': 'Thing',
      name: 'Browser Fingerprinting',
      description:
        'A technique for identifying browsers based on device and software characteristics',
    },
    ...(result && {
      text: `Analysis Results: Exact fingerprint observations ${result.exactMatches}, Risk Level ${result.risk}, ${result.dimensionsAnalyzed}+ dimensions analyzed`,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

interface StatsDatasetJsonLdProps {
  name: string;
  description: string;
  url: string;
  lastUpdated: string;
  total: number;
}

export function StatsDatasetJsonLd({
  name,
  description,
  url,
  lastUpdated,
  total,
}: StatsDatasetJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url,
    dateModified: lastUpdated,
    license: 'https://opensource.org/licenses/MIT',
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'application/json',
        contentUrl: `${url}#live-api`,
      },
    ],
    variableMeasured: ['browser', 'operatingSystem', 'deviceType', 'country', 'screenResolution'],
    datasetTimeInterval: 'P30D',
    includedInDataCatalog: {
      '@type': 'DataCatalog',
      name: 'AmiUnique.io Fingerprint Statistics',
      url: 'https://amiunique.io/stats',
    },
    measurementTechnique: 'Browser fingerprint collection with client + edge metadata',
    size: total,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

interface TechArticleJsonLdProps {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
}

export function TechArticleJsonLd({
  headline,
  description,
  url,
  datePublished,
  dateModified,
}: TechArticleJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    url,
    datePublished,
    dateModified,
    author: {
      '@type': 'Organization',
      name: 'AmiUnique.io',
      url: 'https://amiunique.io',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AmiUnique.io',
      logo: {
        '@type': 'ImageObject',
        url: 'https://amiunique.io/logo.png',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

// Default FAQ items for the homepage — sourced from src/data/faqs.ts
export const defaultFAQs = faqs;
