import React from "react";
import Link from "next/link";
import { FileText, AlertTriangle, ShieldOff, Scale, Ban, RefreshCw, Mail, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — ComputeBestSpecs",
  description: "The terms governing use of ComputeBestSpecs' hardware compatibility and workload sizing tools.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-fade-in font-sans">
      {/* Header */}
      <div className="space-y-3 border-b border-border-subtle pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-brand-primary hover:underline mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase">
            Draft — Pending Legal Review
          </span>
          <span className="text-xs font-mono text-content-muted">v0.1 • Effective September 2026</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-content-strong tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm text-content-body max-w-3xl leading-relaxed">
          These terms govern your use of ComputeBestSpecs. By using the site, you agree to them. This
          is a standard baseline draft — placeholders below (entity name, jurisdiction) need to be filled
          in and the whole document reviewed by counsel before it should be treated as final.
        </p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm text-content-body leading-relaxed">
        {/* Section 1: Acceptance & Service Description */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <FileText className="h-5 w-5 text-brand-primary" />
            <h2>1. Acceptance & What This Service Is</h2>
          </div>
          <p>
            ComputeBestSpecs (&ldquo;we&rdquo;, &ldquo;us&rdquo;, operated by <strong>[LEGAL ENTITY NAME]</strong>) provides
            deterministic hardware compatibility diagnostics, workload sizing calculations, and hardware
            purchase recommendations (&ldquo;the Service&rdquo;). By accessing or using the Service, you agree to be
            bound by these Terms. If you do not agree, do not use the Service.
          </p>
          <p>
            The Service is informational tooling only. It does not constitute professional, engineering,
            or purchasing advice, and results are estimates derived from publicly available vendor
            specifications and benchmark data — not a guarantee of real-world performance.
          </p>
        </section>

        {/* Section 2: No Warranty */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <ShieldOff className="h-5 w-5 text-amber-500" />
            <h2>2. No Warranty</h2>
          </div>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, express
            or implied, including but not limited to accuracy, fitness for a particular purpose, or
            merchantability. Hardware and software requirement data may be outdated, incomplete, or
            estimated — always verify against the original vendor&apos;s official documentation before making
            purchasing decisions.
          </p>
        </section>

        {/* Section 3: Limitation of Liability */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2>3. Limitation of Liability</h2>
          </div>
          <p>
            To the maximum extent permitted by law, ComputeBestSpecs and its operators are not liable
            for any indirect, incidental, consequential, or special damages — including money spent on
            hardware purchased based on Service output — arising from use of, or inability to use, the
            Service. Our total liability for any claim is limited to the amount you paid us (if any) in
            the twelve months preceding the claim.
          </p>
        </section>

        {/* Section 4: Acceptable Use */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <Ban className="h-5 w-5 text-brand-cyan" />
            <h2>4. Acceptable Use</h2>
          </div>
          <ul className="space-y-2 list-disc pl-5">
            <li>No automated scraping, bulk data extraction, or high-volume API abuse outside documented rate limits.</li>
            <li>No attempting to bypass, disable, or probe security controls (authentication, rate limiting, or access restrictions).</li>
            <li>No reverse engineering the calculation engine for competing commercial use without written permission.</li>
            <li>No submitting malicious payloads, spam, or content violating applicable law through any input field.</li>
          </ul>
        </section>

        {/* Section 5: Intellectual Property */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <Scale className="h-5 w-5 text-brand-violet" />
            <h2>5. Intellectual Property</h2>
          </div>
          <p>
            The Service, including its compatibility engine, calibration data, design, and branding, is
            proprietary and owned by ComputeBestSpecs. No license is granted to copy, resell, or build a
            competing product from it. Third-party hardware and software names are trademarks of their
            respective owners and used for identification purposes only.
          </p>
        </section>

        {/* Section 6: Commercial Disclosures */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <FileText className="h-5 w-5 text-emerald-500" />
            <h2>6. Affiliate & Commercial Disclosures</h2>
          </div>
          <p>
            ComputeBestSpecs may earn an affiliate commission when you purchase hardware through links on
            the Service. This never alters diagnostic scores or recommendation order — see our{" "}
            <Link href="/privacy" className="text-brand-primary hover:underline font-semibold">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </section>

        {/* Section 7: Changes & Governing Law */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <RefreshCw className="h-5 w-5 text-brand-primary" />
            <h2>7. Changes to These Terms & Governing Law</h2>
          </div>
          <p>
            We may update these Terms from time to time; continued use after changes take effect
            constitutes acceptance. These Terms are governed by the laws of{" "}
            <strong>[JURISDICTION — STATE/COUNTRY]</strong>, without regard to conflict-of-law
            principles.
          </p>
        </section>

        {/* Section 8: Contact */}
        <section className="space-y-3 p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-content-strong">
            <Mail className="h-5 w-5 text-content-muted" />
            <h2>8. Contact</h2>
          </div>
          <p>
            Questions about these Terms can be sent to <strong>ktlint3@gmail.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
