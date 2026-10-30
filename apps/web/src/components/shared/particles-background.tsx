import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

// must be stable across renders, ParticlesProvider throws otherwise
const initEngine = async (engine: Engine) => {
  await loadSlim(engine);
};

const options: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  detectRetina: true,
  background: { color: { value: "transparent" } },
  particles: {
    number: { value: 40, density: { enable: true } },
    shape: { type: "square" },
    paint: { fill: { enable: true, color: { value: "#64748b" } } },
    opacity: { value: { min: 0.1, max: 0.4 } },
    size: { value: { min: 4, max: 14 } },
    rotate: {
      value: { min: 0, max: 360 },
      direction: "random",
      animation: { enable: true, speed: 5 },
    },
    move: {
      enable: true,
      speed: { min: 0.3, max: 1.2 },
      direction: "none",
      random: true,
      straight: false,
      outModes: { default: "out" },
    },
  },
};

export default function ParticlesBackground({
  className,
}: {
  className?: string;
}) {
  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id="particles-background"
        options={options}
        className={className}
      />
    </ParticlesProvider>
  );
}
