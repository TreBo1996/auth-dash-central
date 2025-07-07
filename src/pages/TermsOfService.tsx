import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardContent className="p-8 prose prose-lg max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of These Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By creating an account, accessing, or using RezLit.com (the "Platform"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree, do not use the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">2. Eligibility & Account Registration</h2>
                <div className="text-muted-foreground leading-relaxed space-y-3">
                  <p>You must be at least 18 years old (or the age of majority in your jurisdiction) and legally able to enter a contract.</p>
                  <p>You agree to provide accurate, current, and complete information during registration and to update it promptly.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">3. Account Security & Your Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for (a) safeguarding login credentials, (b) all activity under your account, and (c) immediately notifying RezLit of any unauthorized use.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">4. Permitted Use & Prohibited Conduct</h2>
                <div className="text-muted-foreground leading-relaxed space-y-3">
                  <p>You agree not to, among other things:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Post false or misleading job listings, resumes, or profile information.</li>
                    <li>Scrape, harvest, or reverse-engineer the Platform.</li>
                    <li>Upload malicious code, infringe IP rights, or violate any applicable law.</li>
                  </ul>
                  <p>RezLit may suspend or terminate accounts that violate these Terms.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">5. User-Provided Content</h2>
                <div className="text-muted-foreground leading-relaxed space-y-3">
                  <p><strong>Ownership.</strong> You retain ownership of resumes, cover letters, job postings, or other materials you submit ("User Content").</p>
                  <p><strong>License to RezLit.</strong> You grant RezLit a worldwide, non-exclusive, royalty-free license to host, store, process, display, and transmit your User Content for the purpose of operating and improving the Platform.</p>
                  <p><strong>Representations.</strong> You represent you have all rights necessary to grant this license and that your User Content does not infringe any third-party rights.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">6. Job Application & Matching Services</h2>
                <p className="text-muted-foreground leading-relaxed">
                  RezLit provides tools that (a) parse your resume, (b) compare it against job descriptions, and (c) deliver AI-based insights. RezLit does not guarantee that you will secure interviews or employment.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">7. Email Communications & Marketing Consent</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By registering, you opt in to receive transactional emails (e.g., password resets, application updates) and marketing emails such as new-role alerts tailored to your profile. You may opt out of marketing emails at any time via the unsubscribe link without affecting transactional messages.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">8. Intellectual-Property Rights</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All Platform software, design, trademarks, and content (other than User Content) are owned by RezLit or its licensors. You are granted a limited, non-transferable, revocable license to use the Platform for its intended purpose.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">9. Third-Party Links & Integrations</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Platform may contain links or API integrations (e.g., Supabase, n8n, Apify, SerpAPI). RezLit is not responsible for third-party sites, services, or content.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">10. Privacy</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your use of the Platform is also governed by the <a href="/privacy-policy" className="text-primary hover:underline">RezLit Privacy Policy</a>, which explains how we collect, use, and safeguard personal data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">11. Disclaimers</h2>
                <p className="text-muted-foreground leading-relaxed">
                  THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." REZLIT MAKES NO WARRANTIES—EXPRESS OR IMPLIED—REGARDING ACCURACY, COMPLETENESS, OR FITNESS FOR A PARTICULAR PURPOSE.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">12. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, RezLit will not be liable for (a) indirect, consequential, or punitive damages, or (b) aggregate damages exceeding the greater of USD 100 or the total fees paid by you to RezLit during the 12 months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">13. Indemnification</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You agree to indemnify and hold harmless RezLit, its affiliates, and their officers, directors, employees, and agents from any claim arising out of your (a) breach of these Terms, (b) User Content, or (c) violation of any law or third-party right.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">14. Termination</h2>
                <p className="text-muted-foreground leading-relaxed">
                  RezLit may suspend or terminate access at any time for violating these Terms or for any reason in its sole discretion. Sections intended to survive (e.g., IP, disclaimers, indemnity, limitation of liability) shall continue after termination.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">15. Changes to Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  RezLit may update these Terms from time to time. Material changes will be notified via email or in-app notice. Continued use constitutes acceptance of revised Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">16. Governing Law & Dispute Resolution</h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms are governed by the laws of the State of Missouri, USA, without regard to conflict-of-law provisions. Any dispute shall be resolved exclusively in the state or federal courts located in St.Louis, Missouri.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">17. Contact</h2>
                <div className="text-muted-foreground leading-relaxed space-y-2">
                  <p>Questions? Contact support@rezlit.com or write to TC THREE LLC</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;