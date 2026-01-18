"use client";
import React from "react";
import { Button } from "../ui/button";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-primary/50 backdrop-blur-md border-b border-primary-foreground/10 px-6 lg:px-40 py-4">
      <div className="flex items-center justify-between max-w-300 mx-auto">
        <div className="flex items-center gap-2 text-terracotta">
          <ExploreOutlinedIcon htmlColor="#e2725b" />
          <h2 className="text-xl font-extrabold tracking-tight text-earth leading-none">
            Chalo
          </h2>
        </div>

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
        <div className="flex items-center gap-4">
          <Button
            className={
              "hidden sm:flex min-w-30 items-center justify-center rounded-full h-11 px-6 bg-primary-foreground text-white text-sm font-bold shadow-lg shadow-primary-foreground/20 hover:scale-[1.02] hover:bg-primary-foreground hover:text-white active:scale-[0.98] transition-all"
            }
            variant="outline"
            size="lg"
          >
            Start Sharing
          </Button>
          <button className="md:hidden p-2 text-earth">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
