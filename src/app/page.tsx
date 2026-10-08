import Architecture from "@/components/Architecture";
import { Cta, Footer, FsmMarquee } from "@/components/Closing";
import Hero from "@/components/Hero";
import Highlights from "@/components/Highlights";
import Manifesto from "@/components/Manifesto";
import Nav from "@/components/Nav";
import Numbers from "@/components/Numbers";
import SceneLoader from "@/components/SceneLoader";
import ScrollDirector from "@/components/ScrollDirector";
import Story from "@/components/Story";

export default function Home() {
  return (
    <>
      <a
        href="#historia"
        className="sr-only z-[70] rounded-full bg-paper px-4 py-2 text-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <SceneLoader />
      <ScrollDirector />
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <Story />
        <Numbers />
        <Architecture />
        <FsmMarquee />
        <Highlights />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
