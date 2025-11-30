import { Shield, Lock, Eye, Trash2, Mail } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Browser Fingerprint Data Protection',
  description: 'AmiUnique.io privacy policy explains how we collect, hash, and protect your browser fingerprint data. GDPR/CCPA compliant with 90-day retention and deletion rights.',
};

export default function PrivacyPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="w-12 h-12 mx-auto text-primary-500 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: November 2024
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-500" />
              What We Collect
            </h2>
            <p className="text-muted-foreground mb-4">
              When you use AmiUnique.io, we collect browser fingerprint data to demonstrate how
              websites can identify you. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Canvas, WebGL, and Audio fingerprints</li>
              <li>Screen resolution and color depth</li>
              <li>Browser and operating system information</li>
              <li>Installed fonts and plugins</li>
              <li>Hardware information (CPU cores, memory)</li>
              <li>Timezone and language settings</li>
              <li>Network information (IP hash, ASN, country)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-500" />
              How We Protect Your Data
            </h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>IP Address Hashing:</strong> We never store your raw IP address. All IP
                addresses are immediately hashed using SHA-256.
              </li>
              <li>
                <strong>No Personal Information:</strong> We do not collect your name, email, or
                any other personally identifiable information unless you voluntarily provide it.
              </li>
              <li>
                <strong>Secure Processing:</strong> Data is processed securely on our servers
                for maximum security and privacy.
              </li>
              <li>
                <strong>No Third-Party Tracking:</strong> We do not use any third-party analytics
                or advertising services.
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Why We Collect This Data</h2>
            <p className="text-muted-foreground mb-4">
              We collect fingerprint data for the following purposes:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Education:</strong> To show users how browser fingerprinting works and
                how they can be tracked online.
              </li>
              <li>
                <strong>Research:</strong> To understand the uniqueness of browser fingerprints
                and improve privacy tools.
              </li>
              <li>
                <strong>Statistics:</strong> To provide aggregate statistics about browser and
                device diversity.
              </li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground">
              Fingerprint data is retained for 90 days for statistical analysis. After this
              period, individual records are deleted, but aggregate statistics are preserved.
              You can request immediate deletion of your data at any time.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-primary-500" />
              Your Rights
            </h2>
            <p className="text-muted-foreground mb-4">
              Under GDPR and CCPA, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>Right to Access:</strong> Request a copy of your stored fingerprint data.
              </li>
              <li>
                <strong>Right to Deletion:</strong> Request complete deletion of your data.
              </li>
              <li>
                <strong>Right to Opt-Out:</strong> Decline to have your fingerprint stored
                (you can still view your fingerprint without storing it).
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us or use our self-service opt-out tool.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <p className="text-muted-foreground">
              We use minimal cookies solely for essential functionality. We do not use
              tracking cookies, advertising cookies, or any third-party cookies. Any cookies
              we set are strictly necessary for the service to function.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-500" />
              Contact Us
            </h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
              <p className="font-mono text-sm">privacy@amiunique.io</p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the
              &quot;Last updated&quot; date.
            </p>
          </section>
        </div>

        <div className="mt-12 p-6 rounded-xl border bg-primary-50 dark:bg-primary-900/20">
          <h3 className="font-semibold mb-2">Want to delete your data?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You can request deletion of your fingerprint data at any time.
          </p>
          <a
            href="/legal/opt-out"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            <Trash2 className="w-4 h-4" />
            Request Data Deletion
          </a>
        </div>
      </div>
    </div>
  );
}
