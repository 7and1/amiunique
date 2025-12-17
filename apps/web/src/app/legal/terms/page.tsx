import { FileText, AlertCircle, Scale } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service',
  description: 'AmiUnique.io terms of service - Rules and guidelines for using our service.',
};

export default function TermsPage() {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <FileText className="w-12 h-12 mx-auto text-primary-500 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last updated: November 2024
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using AmiUnique.io (&quot;the Service&quot;), you accept and agree to be
              bound by these Terms of Service. If you do not agree to these terms, please do
              not use the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              AmiUnique.io is a browser fingerprinting detection and education platform that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Analyzes your browser fingerprint to show how unique you are</li>
              <li>Provides educational information about browser fingerprinting</li>
              <li>Offers statistics about browser and device diversity</li>
              <li>Demonstrates how websites can track users without cookies</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              3. Acceptable Use
            </h2>
            <p className="text-muted-foreground mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to reverse engineer, hack, or compromise the Service</li>
              <li>Submit false, misleading, or manipulated fingerprint data</li>
              <li>Use automated tools to excessively access the Service</li>
              <li>Interfere with or disrupt the Service or its servers</li>
              <li>Collect data about other users without their consent</li>
              <li>Use the Service to develop competing fingerprinting products</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">4. Intellectual Property</h2>
            <p className="text-muted-foreground">
              The Service, including its original content, features, and functionality, is
              owned by AmiUnique.io and is protected by international copyright, trademark,
              and other intellectual property laws. You may not copy, modify, distribute, or
              create derivative works without our express written permission.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">5. Data and Privacy</h2>
            <p className="text-muted-foreground">
              Your use of the Service is also governed by our Privacy Policy, which is
              incorporated into these Terms by reference. By using the Service, you consent
              to the collection and use of information as described in our Privacy Policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary-500" />
              6. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY
              KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, SECURE, OR ERROR-FREE. FINGERPRINT ANALYSIS RESULTS ARE FOR
              EDUCATIONAL PURPOSES AND MAY NOT BE 100% ACCURATE.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              IN NO EVENT SHALL AMIUNIQUE.IO BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
              PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE
              SERVICE.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">8. API Usage</h2>
            <p className="text-muted-foreground mb-4">
              If you access the Service through our API:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>You must comply with all rate limits and usage guidelines</li>
              <li>You must not share or resell API access</li>
              <li>You must attribute AmiUnique.io when displaying fingerprint data</li>
              <li>We reserve the right to revoke API access at any time</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. We will notify users
              of any material changes by updating the &quot;Last updated&quot; date. Your continued use
              of the Service after such modifications constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">10. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your access to the Service immediately, without
              prior notice or liability, for any reason, including breach of these Terms.
              Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with applicable
              international law, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">12. Contact</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
              <p className="font-mono text-sm">legal@amiunique.io</p>
            </div>
          </section>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            By using AmiUnique.io, you acknowledge that you have read, understood, and agree
            to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
