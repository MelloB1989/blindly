import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { HowItWorks } from './components/sections/HowItWorks';
import { Features } from './components/sections/Features';
import { SocialDiscovery } from './components/sections/SocialDiscovery';
import { TrustSafety } from './components/sections/TrustSafety';
import { AppShowcase } from './components/sections/AppShowcase';
import { CTA } from './components/sections/CTA';
import { DownloadApp } from './components/sections/DownloadApp';

function App() {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-brand-purple selection:text-white">
      <Navbar />

      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <SocialDiscovery />
        <TrustSafety />
        <AppShowcase />
        <CTA />
        <DownloadApp />
        {/* Placeholder for other sections */}
      </main>

      <Footer />
    </div>
  );
}

export default App;
