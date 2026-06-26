import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — Skyrovix" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3" /> Back</Link>
        <h1 className="mt-6 text-3xl sm:text-4xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <Section title="1. Acceptance of Terms">
            By applying for an internship through Skyrovix, you agree to these Terms of Service. If you do not agree, please do not use our platform.
          </Section>
          <Section title="2. Internship Program">
            The internship is a task-based virtual program. You are required to complete 5 tasks in your chosen domain. Each task is reviewed by our mentors. The internship is self-paced and does not guarantee employment.
          </Section>
          <Section title="3. Offer Letter & ID Card">
            Upon successful application, you will receive an instant offer letter and a digital ID card. These documents are for identification purposes only and do not constitute an employment contract.
          </Section>
          <Section title="4. Certification">
            A verified certificate with a unique ID and QR code is issued upon completion of all 5 tasks and payment of the ₹100 certification fee. The certificate can be verified by third parties through our verification page.
          </Section>
          <Section title="5. Payment">
            The certification fee of ₹100 is non-refundable once paid. Payment is processed through UPI. You must provide the correct UTR number and payment screenshot for verification.
          </Section>
          <Section title="6. User Conduct">
            You agree to submit original work for all tasks. Plagiarism or submission of AI-generated content without modification may result in rejection of your submission or termination of your internship.
          </Section>
          <Section title="7. Intellectual Property">
            The project code and content you create during the internship belong to you. Skyrovix may use anonymized project data for internal quality improvement.
          </Section>
          <Section title="8. Limitation of Liability">
            Skyrovix is not liable for any indirect, incidental, or consequential damages arising from your use of the platform or participation in the internship program.
          </Section>
          <Section title="9. Changes to Terms">
            We reserve the right to update these terms at any time. Users will be notified of material changes via email.
          </Section>
          <Section title="10. Contact">
            For questions about these terms, contact us at skyrovix@gmail.com.
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 font-semibold text-foreground">{title}</h2>
      <p>{children}</p>
    </div>
  );
}
