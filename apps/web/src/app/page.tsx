import { HomeContent } from './home-content';

export const metadata = {
  title: { absolute: 'Am I Unique? Free Browser Fingerprint Test — AmiUnique.io' },
  description:
    'Run a free browser fingerprint test across 80+ signals — canvas, WebGL, audio, fonts, network. See how identifiable you are and which layer exposes you.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return <HomeContent />;
}
