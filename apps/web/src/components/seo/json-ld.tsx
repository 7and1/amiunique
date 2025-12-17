/**
 * JSON-LD Structured Data Components for SEO
 * Helps search engines understand our content better
 */

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
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
    sameAs: ['https://github.com/amiunique', 'https://twitter.com/amiunique_io'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
}

export function WebApplicationJsonLd({
  name = 'AmiUnique.io Browser Fingerprint Scanner',
  url = 'https://amiunique.io',
  description = 'Free browser fingerprinting detection tool that analyzes 80+ dimensions to show how unique and trackable your browser is.',
  applicationCategory = 'SecurityApplication',
  operatingSystem = 'Web Browser',
  offers = { price: '0', priceCurrency: 'USD' },
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
    featureList: [
      'Canvas fingerprint detection',
      'WebGL fingerprint analysis',
      'Audio context fingerprinting',
      'Font enumeration detection',
      'Screen resolution tracking',
      'Timezone analysis',
      'Browser plugin detection',
      'Hardware fingerprinting',
    ],
    browserRequirements: 'Modern web browser with JavaScript enabled',
    softwareVersion: '2.0',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
    mainEntity: questions.map((q) => ({
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface TestResultJsonLdProps {
  name?: string;
  description?: string;
  dateCreated?: string;
  url?: string;
  result?: {
    uniqueness: string;
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
      description: 'A technique for identifying browsers based on device and software characteristics',
    },
    ...(result && {
      text: `Analysis Results: Uniqueness ${result.uniqueness}, Risk Level ${result.risk}, ${result.dimensionsAnalyzed}+ dimensions analyzed`,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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

export function StatsDatasetJsonLd({ name, description, url, lastUpdated, total }: StatsDatasetJsonLdProps) {
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
    variableMeasured: [
      'browser',
      'operatingSystem',
      'deviceType',
      'country',
      'screenResolution',
    ],
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Default FAQ items for the homepage
export const defaultFAQs = [
  {
    question: 'What is browser fingerprinting?',
    answer:
      'Browser fingerprinting is a technique that collects information about your browser and device to create a unique identifier. This includes your screen resolution, installed fonts, browser plugins, timezone, and many other attributes that, when combined, can uniquely identify you across websites.',
  },
  {
    question: 'How unique is my browser fingerprint?',
    answer:
      'Most browser fingerprints are surprisingly unique. Our database shows that over 90% of browsers have a unique combination of attributes. Factors like installed fonts, screen resolution, and graphics card information contribute most to uniqueness.',
  },
  {
    question: 'Can I prevent browser fingerprinting?',
    answer:
      'While difficult to completely prevent, you can reduce your fingerprint uniqueness by using privacy-focused browsers like Tor or Brave, disabling JavaScript, using standard screen resolutions, and minimizing installed fonts and plugins.',
  },
  {
    question: 'Is browser fingerprinting legal?',
    answer:
      'Browser fingerprinting legality varies by jurisdiction. Under GDPR in Europe, it may require user consent. Many websites use it for fraud prevention, security, and analytics. Our tool helps you understand what information is exposed.',
  },
  {
    question: 'What are the Three-Lock hashes?',
    answer:
      'AmiUnique.io uses a Three-Lock system: Gold Lock (hardware fingerprint surviving browser reinstalls), Silver Lock (software fingerprint tied to browser installation), and Bronze Lock (full session fingerprint including network factors).',
  },
];
