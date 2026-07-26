import { RedirectNotice } from '@/components/system/redirect-notice';

export default function ScanPage() {
  return <RedirectNotice to="/?scan=1#scan" label="the fingerprint scan" />;
}
