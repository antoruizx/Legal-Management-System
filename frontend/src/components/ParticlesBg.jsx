import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticlesBg() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    return {
      fullScreen: false,
      fpsLimit: 60,
      detectRetina: true,
      background: { color: "transparent" },
      particles: {
        number: { value: 65, density: { enable: true } },
        color: { value: ["#7c6ff0", "#4fd8ea", "#34d399"] }, // accent, cyan, success
        opacity: { value: { min: 0.25, max: 0.8 } },
        size: { value: { min: 1, max: 3 } },
        move: {
          enable: !reduceMotion,
          speed: 0.7,
          direction: "none",
          outModes: { default: "out" },
        },
        links: {
          enable: true,
          distance: 140,
          color: "#7c6ff0",
          opacity: 0.22,
          width: 1,
        },
      },
      interactivity: {
        detectsOn: "window", // detecta el mouse aunque el texto esté encima
        events: { onHover: { enable: true, mode: "grab" } },
        modes: { grab: { distance: 170, links: { opacity: 0.55 } } },
      },
    };
  }, []);

  if (!ready) return null;

  return <Particles id="login-particles" className="login-particles" options={options} />;
}