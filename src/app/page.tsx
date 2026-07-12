import { MarketingHeader } from "@/modules/marketing/components/MarketingHeader";
import { Hero } from "@/modules/marketing/components/Hero";
import { Features } from "@/modules/marketing/components/Features";
import { StudentBenefits } from "@/modules/marketing/components/StudentBenefits";
import { SchoolBenefits } from "@/modules/marketing/components/SchoolBenefits";
import { HowItWorks } from "@/modules/marketing/components/HowItWorks";
import { Testimonials } from "@/modules/marketing/components/Testimonials";
import { Faq } from "@/modules/marketing/components/Faq";
import { CtaSection } from "@/modules/marketing/components/CtaSection";
import { Footer } from "@/modules/marketing/components/Footer";

// Deliberately static (no auth() check here): reading the session would
// make this page dynamic on every request, trading CDN-cacheable prerendering
// for the minor convenience of auto-redirecting an already-signed-in visitor.
// That's the wrong trade for a marketing page — Sign in/Get started in the
// header already gets them where they need to go in one click.
export default function LandingPage() {
  return (
    <main>
      <MarketingHeader />
      <Hero />
      <Features />
      <StudentBenefits />
      <SchoolBenefits />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <CtaSection />
      <Footer />
    </main>
  );
}
