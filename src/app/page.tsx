import type { Metadata } from "next";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { MarketingHeader } from "@/modules/marketing/components/MarketingHeader";
import { Hero } from "@/modules/marketing/components/Hero";
import { Features } from "@/modules/marketing/components/Features";
import { StudentBenefits } from "@/modules/marketing/components/StudentBenefits";
import { TeacherBenefits } from "@/modules/marketing/components/TeacherBenefits";
import { SchoolBenefits } from "@/modules/marketing/components/SchoolBenefits";
import { HowItWorks } from "@/modules/marketing/components/HowItWorks";
import { Testimonials } from "@/modules/marketing/components/Testimonials";
import { Faq } from "@/modules/marketing/components/Faq";
import { CtaSection } from "@/modules/marketing/components/CtaSection";
import { Footer } from "@/modules/marketing/components/Footer";

// Explicit (rather than relying on the root layout's default title) so
// the homepage's title/description are tuned for its actual primary
// keyword — "student platform" — instead of just inheriting the generic
// brand default. Root layout keeps its own default as the fallback for
// any future page that doesn't set one.
export const metadata: Metadata = buildMetadata({
  title: "Locker — Student Platform for Homework, Groups & Achievements",
  description:
    "Locker is the all-in-one student platform for homework, project groups, a school marketplace, and real achievements — built for students, not IT departments.",
  path: "/",
});

const SOFTWARE_APPLICATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Locker",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Locker is the collaboration layer for students, teachers, and school admins — homework, groups, a school marketplace, achievements, and parent-teacher meetings in one place.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

// Deliberately static (no auth() check here): reading the session would
// make this page dynamic on every request, trading CDN-cacheable prerendering
// for the minor convenience of auto-redirecting an already-signed-in visitor.
// That's the wrong trade for a marketing page — Sign in/Get started in the
// header already gets them where they need to go in one click.
export default function LandingPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_APPLICATION_JSON_LD) }}
      />
      <MarketingHeader />
      <Hero />
      <Features />
      <StudentBenefits />
      <TeacherBenefits />
      <SchoolBenefits />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <CtaSection />
      <Footer />
    </main>
  );
}
