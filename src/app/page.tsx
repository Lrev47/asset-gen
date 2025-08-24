import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import { PricingSection } from "@/components/sections/pricing-section";
import { AppShell } from "@/components/layout/app-shell";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function Home() {
  return (
    <AppShell
      header={<Header />}
      showBackgroundDecorations={true}
      className="relative"
    >
      <div className="space-y-0 -mx-6 -mt-6">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <Footer />
      </div>
    </AppShell>
  );
}