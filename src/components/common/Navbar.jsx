import React from "react";
import { Button } from "../ui/button";
const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-primary backdrop-blur-md border-b border-sage/10 px-6 lg:px-40 py-4">
      <div className="flex items-center justify-between max-w-300 mx-auto">
        <div className="flex items-center gap-3">
          {/* <div className="text-terracotta">
            <span className="material-symbols-outlined text-3xl font-bold">
              explore
            </span>
          </div> */}
          <h2 className="text-xl font-extrabold tracking-tight text-earth">
            Wayfind
          </h2>
        </div>
        <nav className="hidden md:flex items-center gap-10">
          <a
            className="text-sm font-semibold text-earth/70 hover:text-terracotta transition-colors"
            href="#features"
          >
            Features
          </a>
          <a
            className="text-sm font-semibold text-earth/70 hover:text-terracotta transition-colors"
            href="#how-it-works"
          >
            How it Works
          </a>
          <a
            className="text-sm font-semibold text-earth/70 hover:text-terracotta transition-colors"
            href="#privacy"
          >
            Privacy
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="lg">
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
