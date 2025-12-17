'use client';

import { RedirectNotice } from '@/components/system/redirect-notice';

export default function ApiDocsRedirectPage() {
  // Keep old /developers/api-docs links alive; forward to the canonical developer hub
  return <RedirectNotice to="/developers" label="Developer Docs" />;
}
