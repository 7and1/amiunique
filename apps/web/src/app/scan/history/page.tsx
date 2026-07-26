import { RedirectNotice } from '@/components/system/redirect-notice';

export default function HistoryPage() {
  return <RedirectNotice to="/?history=1#scan" label="your scan history" />;
}
