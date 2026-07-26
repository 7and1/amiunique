import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const DISALLOW = ['/api/', '/scan/history/'];

// AI/LLM crawlers explicitly welcomed: being cited by assistants is a goal,
// and the public pages contain no personal data.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...AI_CRAWLERS.map(userAgent => ({
        userAgent,
        allow: '/',
        disallow: DISALLOW,
      })),
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: 'https://amiunique.io/sitemap.xml',
  };
}
