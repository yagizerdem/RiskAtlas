import Particles, { ParticlesProvider } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import merge from "deepmerge";

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

export interface ParticlesBackgroundProps {
  className?: string;
  options?: Partial<ISourceOptions>;
}

export default function ParticlesBackground({
  className,
  options: userOptions,
}: ParticlesBackgroundProps) {
  return (
    <ParticlesProvider init={initEngine}>
      <Particles
        id="particles-background"
        options={merge(options, userOptions || {})}
        className={className}
      />
    </ParticlesProvider>
  );
}
