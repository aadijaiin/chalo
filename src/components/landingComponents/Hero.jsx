import React from "react";
import Image from "next/image";
import LandingMap from "./LandingMap";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import ShareLocationTwoToneIcon from "@mui/icons-material/ShareLocationTwoTone";
const Hero = () => {
  const router = useRouter();
  return (
    <section className="px-6 lg:px-40 py-16 lg:py-24 dreamwave-bg">
      <div className="max-w-300 mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex flex-col gap-8 flex-1 text-left">
            <div
              className="
    inline-flex items-center gap-2 px-3 py-1 rounded-full
    bg-primary-foreground/15 text-sage
    text-xs font-bold uppercase tracking-widest w-fit

    transition-all
    hover:bg-primary-foreground/25

    active:bg-primary-foreground/30
    active:scale-[0.97]

    focus-visible:ring-2
    focus-visible:ring-primary-foreground/30
  "
            >
              <ShareLocationTwoToneIcon />
              Live Now
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-earth">
              Find your <br /> way, <br />
              <span className="text-primary-foreground">together.</span>
            </h1>
            <p className="text-lg lg:text-xl text-earth/70 leading-relaxed max-w-135">
              Real-time group location sharing designed for privacy, ease, and
              spontaneous adventures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => {
                  router.push("/party/create");
                }}
                className="
    flex min-w-50 items-center justify-center
    rounded-xl h-14 px-8
    bg-primary-foreground text-white 
    text-base font-bold

    shadow-xl shadow-primary-foreground/30
    transition-all

    hover:brightness-110
    hover:scale-[1.02]
    hover:bg-primary-foreground
    active:scale-[0.96]
    active:brightness-95

    focus-visible:ring-2
    focus-visible:ring-primary-foreground/40
  "
              >
                Create a Party
              </Button>

              <Button
                onClick={() => {
                  router.push("/party/join");
                }}
                className="
    flex min-w-50 items-center justify-center
    rounded-xl h-14 px-8
    bg-card border border-sage/20
    text-earth text-base font-bold

    shadow-sm transition-all

    hover:bg-card/70
    hover:scale-[1.02]

    active:scale-[0.97]
    active:bg-white/60

    focus-visible:ring-2
    focus-visible:ring-sage/30
  "
              >
                Join a Party
              </Button>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-125 aspect-4/5 bg-card rounded-3xl p-4 shadow-2xl border border-sage/10 overflow-hidden">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <LandingMap />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
