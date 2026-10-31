import { Outlet } from "react-router";
import ParticlesBackground from "@/components/shared/particles-background";
import { cn } from "cn";

interface ParticlesLayoutProps {
  className?: string;
}

export default function ParticlesLayout({ className }: ParticlesLayoutProps) {
  return (
    <div
      className={cn("relative w-screen h-screen overflow-hidden", className)}
    >
      <ParticlesBackground
        className="absolute inset-0 z-0 pointer-events-none"
        options={{
          particles: {
            number: { value: 200, density: { enable: true } },
          },
        }}
      />
      <div className="relative z-10 w-full h-full">
        <Outlet />
      </div>
    </div>
  );
}
