import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'edge';

const chatSchema = z.object({
  prompt: z.string().min(1),
  fingerprintData: z.record(z.string(), z.any()).optional(),
  context: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = chatSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { prompt, fingerprintData, context } = parsed.data;
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

    // Always return a response, even if API key is missing
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        message: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: buildFallbackResponse(prompt, fingerprintData),
        },
        meta: { fallback: true },
      });
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://amiunique.io',
          'X-Title': 'AmiUnique Fingerprint Assistant',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: buildUserPrompt(prompt, fingerprintData, context),
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      return NextResponse.json({
        success: true,
        message: {
          id: data.id || crypto.randomUUID(),
          role: 'assistant',
          content,
        },
        usage: data.usage,
      });
    } catch (error) {
      console.error('[AI_CHAT_ERROR]', error);
      // Return fallback response on API error
      return NextResponse.json({
        success: true,
        message: {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: buildFallbackResponse(prompt, fingerprintData),
        },
        meta: { fallback: true },
      });
    }
  } catch (error) {
    console.error('[AI_CHAT_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

const SYSTEM_PROMPT = `You are a knowledgeable browser fingerprinting expert assistant for AmiUnique.io, a privacy-focused tool that helps users understand how unique and trackable their browser fingerprint is.

Your role:
- Explain browser fingerprinting concepts clearly and concisely
- Analyze fingerprint data when provided (canvas, WebGL, audio, fonts, etc.)
- Provide privacy recommendations based on the user's fingerprint
- Explain the Three-Lock system (Gold/Hardware, Silver/Software, Bronze/Full)
- Help users understand their tracking risk
- Answer questions about specific fingerprinting dimensions
- Suggest privacy tools and best practices

Guidelines:
- Be friendly, professional, and educational
- Keep responses concise (2-3 short paragraphs max)
- Use bullet points for lists
- Avoid technical jargon unless necessary
- Focus on actionable advice
- Never make up data - only analyze what's provided

Remember: The goal is to educate users about digital privacy and help them make informed decisions.`;

function buildUserPrompt(
  prompt: string,
  fingerprintData?: Record<string, any>,
  context?: string
): string {
  let fullPrompt = '';

  if (fingerprintData) {
    fullPrompt += `User's Fingerprint Data:\n${JSON.stringify(fingerprintData, null, 2)}\n\n`;
  }

  if (context) {
    fullPrompt += `Context: ${context}\n\n`;
  }

  fullPrompt += `User Question: ${prompt}`;

  return fullPrompt;
}

function buildFallbackResponse(
  prompt: string,
  fingerprintData?: Record<string, any>
): string {
  const lowerPrompt = prompt.toLowerCase();

  // Canvas fingerprinting
  if (lowerPrompt.includes('canvas')) {
    return `Canvas fingerprinting works by drawing invisible graphics on an HTML5 canvas element, then extracting the pixel data. Different hardware and software combinations produce unique rendering results, creating a stable identifier.

To reduce canvas tracking:
• Use privacy browsers like Brave or Firefox with privacy.resistFingerprinting enabled
• Install extensions that randomize canvas data
• Consider using a VPN to mask your network fingerprint

Canvas is part of our "Gold Lock" (hardware fingerprinting) because it's extremely stable across browsing sessions.`;
  }

  // WebGL fingerprinting
  if (lowerPrompt.includes('webgl') || lowerPrompt.includes('gpu')) {
    return `WebGL fingerprinting identifies your GPU and graphics driver by analyzing how they render 3D graphics. This creates a unique signature based on your hardware.

Your options:
• Disable WebGL in browser settings (may break some websites)
• Use browsers with built-in WebGL protection
• Update graphics drivers regularly to reduce uniqueness

WebGL is one of the most stable fingerprinting methods because hardware rarely changes.`;
  }

  // Audio fingerprinting
  if (lowerPrompt.includes('audio')) {
    return `Audio fingerprinting detects variations in how your hardware/software processes audio signals. Each combination produces a unique "audio fingerprint."

Protection methods:
• Use browsers with audio fingerprint randomization
• Disable Web Audio API access for untrusted sites
• Consider using noise injection extensions

Audio fingerprinting is part of our hardware-based "Gold Lock" system.`;
  }

  // Three-Lock system
  if (lowerPrompt.includes('three') || lowerPrompt.includes('lock') || lowerPrompt.includes('gold') || lowerPrompt.includes('silver') || lowerPrompt.includes('bronze')) {
    return `Our Three-Lock System:

**Gold Lock (Hardware):** Most stable - survives browser reinstalls. Uses canvas, WebGL, audio, GPU, screen specs, CPU cores, memory.

**Silver Lock (Software):** Medium stability - changes with browser/OS updates. Uses fonts, user agent, timezone, plugins, codecs.

**Bronze Lock (Full):** Session-specific - includes network data. Adds ASN, TLS cipher, datacenter, IP characteristics.

Each lock provides a different level of tracking persistence. Hardware-based tracking is the most concerning for privacy.`;
  }

  // Privacy advice
  if (lowerPrompt.includes('private') || lowerPrompt.includes('protect') || lowerPrompt.includes('hide') || lowerPrompt.includes('anonymous')) {
    return `To improve your privacy:

**Browser Level:**
• Use privacy-focused browsers (Brave, Firefox with privacy settings, Mullvad, Tor)
• Enable fingerprinting protection in settings
• Clear cookies and site data regularly

**Extensions:**
• uBlock Origin (blocks trackers)
• Privacy Badger (learns tracker behaviors)
• CanvasBlocker (randomizes fingerprints)

**Network:**
• Use a VPN to mask IP/location
• Use DNS-over-HTTPS
• Consider Tor for maximum anonymity

Remember: Being completely unique can be as trackable as being common. Balance privacy with usability!`;
  }

  // General fingerprinting
  if (lowerPrompt.includes('fingerprint') || lowerPrompt.includes('track') || lowerPrompt.includes('unique')) {
    return `Browser fingerprinting collects 80+ data points about your device to create a unique identifier without cookies. This includes hardware specs, software configuration, and network characteristics.

${fingerprintData ? 'Based on your scan, ' : ''}Common tracking methods include:
• Canvas & WebGL rendering
• Audio processing signatures
• Font enumeration
• Screen & hardware specs
• Timezone & language settings

The more unique your configuration, the easier you are to track. AmiUnique helps you understand and reduce this uniqueness.

Ask me about specific dimensions, privacy tools, or protection strategies!`;
  }

  // Default response
  return `I'm your fingerprint analysis assistant! I can help you understand:

• How browser fingerprinting works
• Your specific fingerprint characteristics
• The Three-Lock tracking system
• Privacy protection strategies
• Specific fingerprinting dimensions (canvas, WebGL, fonts, etc.)

What would you like to know about your digital fingerprint?`;
}
