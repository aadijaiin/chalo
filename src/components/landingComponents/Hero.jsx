import React from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import ShareLocationTwoToneIcon from "@mui/icons-material/ShareLocationTwoTone";
const Hero = () => {
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
              spontaneous adventures. No accounts required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
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
                Create Live Session
              </Button>

              <Button
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
                Join a Group
              </Button>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-125 aspect-4/5 bg-card rounded-3xl p-4 shadow-2xl border border-sage/10 overflow-hidden">
              <div
                className="w-full h-full rounded-2xl bg-cover bg-center relative"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBrJXurcIT8WxE4-8HtRcmQQ0SylbdYnHAuX1JDnXogUbOW85jaG4mq-zYg75_m5KqClhp5RBysJtzyPZhJuJTWb1s89kp0BDImIF0eHye5hiwhAtollxK67LmuXtTf3W15HYEqiefGa7vSFQfKvuhS4s5OLQkMnuOIda3NM7pRiuiENOheUOYFf7dKwv0EN6a0NCSyVJ2WMRDzbp6YKLIx0KzbTXy4BXq3Y0EnQCHuRdfVdYlnkJSPAKq1C1HCXzaSFRM439swCatw")',
                }}
              >
                <div className="absolute inset-0 bg-sage/10 mix-blend-multiply"></div>
                <div className="absolute top-1/4 left-1/3 group cursor-pointer">
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-terracotta shadow-xl flex items-center justify-center overflow-hidden relative">
                    <Image
                      alt="User 1"
                      fill
                      className="object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCo9sMWxOUUgZZZCtS3gwQqsts8McvwQwd8QRtfHYS68JfVlBxYNbEy2Jd97pRm3_UBS8Oa3kpr4rFdJV6Sa0qugNIVgNOEVCx2JaVI4BLv4byqfyd3V6sJL3f8wTVJergKIWoqb-vmMITe2dGZCMuo8S1qnkHXHvUUjD2CMOWfSnr2u1YIV1BwmSx1GakbBReVgAshy_pbBlTxuqXfSg_1ek-fbdz7qe9lRamczx5iWoZaIj1A71M_4CHlGKxUxiliNcBWdmX8gIpY"
                    />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card/70 px-3 py-1 rounded-lg shadow-md text-[10px] font-bold text-earth whitespace-nowrap">
                    Alex • 2m away
                  </div>
                </div>
                <div className="absolute bottom-1/3 right-1/4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-sage shadow-xl flex items-center justify-center overflow-hidden relative">
                    <Image
                      fill
                      alt="User 2"
                      className="object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaE4hk-2igT33u4uo-SefU7apuicvfONyy9H_zKDBSx56-FB0AxXvSQuaNXAOFRYLnko9yI7fFm80owtLQ34Fnu4XjpxkfYhbMaJhPepKFbKEfc3ZZUi7UCzb69TwAa62Mmast45nfTfctrMVx1KZcVwaEuz5jCyJG9s-Te84dKNA20GU1HG84htmmy9tmW9TFdoa3_SjyEriS7r1Ym8ypWiET8EcYgQQIq-XsLS6HeDow-66g9fFN5QdmaCi_QkdVBq6pRz437V1g"
                    />
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-card/70 px-3 py-1 rounded-lg shadow-md text-[10px] font-bold text-earth whitespace-nowrap">
                    Jamie • ETA 5m
                  </div>
                </div>
                <svg
                  className="absolute inset-0 pointer-events-none"
                  viewBox="0 0 400 500"
                >
                  <path
                    d="M150 150 Q 250 250 300 350"
                    fill="none"
                    opacity="0.6"
                    stroke="#E2725B"
                    strokeDasharray="8 8"
                    strokeLinecap="round"
                    strokeWidth="4"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
