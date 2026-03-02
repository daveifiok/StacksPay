import HeroSection from "@/components/landing/hero/HeroSection";
import ModularSolutionsSection from "@/components/landing/modular-solutions/ModularSolutionsSection";
import EnterpriseUseCasesSection from "@/components/landing/enterprise-use-cases/EnterpriseUseCasesSection";
import DeveloperExperienceSection from "@/components/landing/developer-experience/DeveloperExperienceSection";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ModularSolutionsSection />
      <EnterpriseUseCasesSection />
      <DeveloperExperienceSection />
      <Footer />
    </>
  );
}
