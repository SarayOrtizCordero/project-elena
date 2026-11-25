import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { About, Gallery, Marquee, Method, Services, Testimonials, Why } from "@/components/sections";
import { Plans } from "@/components/plans";
import { Faq } from "@/components/faq";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main id="contenido" tabIndex={-1} className="overflow-x-clip outline-none">
        <Hero />
        <Marquee />
        <Why />
        <Services />
        <Method />
        <Plans />
        <Gallery />
        <About />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
