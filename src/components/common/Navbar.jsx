"use client";
import React from "react";
import { Button } from "../ui/button";
import ExploreIcon from "@mui/icons-material/Explore";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { useRouter } from "next/navigation";
import Link from "next/link";
const Navbar = () => {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-50 bg-card/70 backdrop-blur-md border-b border-primary-foreground/10 px-6 lg:px-40 py-4">
      <div className="flex items-center justify-between max-w-300 mx-auto">
        <Link href={"/"} className="flex items-center gap-2 text-terracotta">
          <ExploreIcon htmlColor="#e2725b" />
          <h2 className="text-xl font-extrabold tracking-tight text-earth leading-none">
            Chalo
          </h2>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          <a
            className="text-sm font-semibold text-earth/70 hover:text-primary-foreground transition-colors"
            href="#features"
          >
            Features
          </a>
          <a
            className="text-sm font-semibold text-earth/70 hover:text-primary-foreground transition-colors"
            href="#how-it-works"
          >
            How it Works
          </a>
          <a
            className="text-sm font-semibold text-earth/70 hover:text-primary-foreground transition-colors"
            href="#privacy"
          >
            Privacy
          </a>
        </nav>
        <div className="flex bg-primary-foreground rounded-full items-center gap-4">
          <Button
            onClick={() => {
              router.push("/dashboard");
            }}
            className="
                hidden sm:flex min-w-30 items-center justify-center
                rounded-full h-11 px-6
                bg-primary-foreground text-white
                text-sm font-bold
                shadow-lg shadow-primary-foreground/20

                transition-all

                hover:scale-[1.02]
                hover:bg-primary-foreground

                active:scale-[0.96]
                active:bg-primary-foreground/90
                active:translate-y-px

                focus-visible:ring-2
                focus-visible:ring-primary-foreground/40"
            variant="outline"
            size="lg"
          >
            Start Sharnig
          </Button>

          <button className="md:hidden p-2 text-earth">
            <MenuOutlinedIcon />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
