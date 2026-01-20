"use client";
import React from "react";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import ShareIcon from "@mui/icons-material/Share";
import ExploreIcon from "@mui/icons-material/Explore";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-sage/10 px-6 lg:px-40 py-20">
      <div className="max-w-300 mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="flex flex-col gap-6 col-span-1 md:col-span-1">
          <div className="flex items-center gap-3">
            <ExploreIcon htmlColor="#e2725b" />
            <h2 className="text-xl font-extrabold tracking-tight text-earth">
              Chalo
            </h2>
          </div>
          <p className="text-earth/60 text-sm leading-relaxed">
            Bringing people together through simple, secure, and real-time
            location sharing.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-earth">Product</h4>
          <ul className="space-y-4 text-sm text-earth/60">
            <li>
              <a
                className="hover:text-primary-foreground transition-colors"
                href="#"
              >
                Features
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary-foreground transition-colors"
                href="#"
              >
                Adventure Stories
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary-foreground transition-colors"
                href="#"
              >
                Safety Guide
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-earth">Trust</h4>
          <ul className="space-y-4 text-sm text-earth/60">
            <li>
              <a
                className="hover:text-primary-foreground transition-colors"
                href="#"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary-foreground transition-colors"
                href="#"
              >
                Terms of Use
              </a>
            </li>
            <li>
              <a
                className="hover:text-primary-foreground transition-colors"
                href="#"
              >
                Security FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-earth">Community</h4>
          <div className="flex gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white dark:bg-background border border-sage/10 
               flex items-center justify-center 
               text-earth/70 
               hover:bg-primary-foreground hover:text-white hover:border-primary-foreground 
               transition-all"
            >
              <ShareIcon className="text-xl" />
            </a>

            <a
              href="#"
              className="w-10 h-10 rounded-full bg-white border dark:bg-background border-sage/10 
               flex items-center justify-center 
               text-earth/70 
               hover:bg-primary-foreground hover:text-white hover:border-primary-foreground 
               transition-all"
            >
              <AlternateEmailIcon className="text-xl" />
            </a>
          </div>

          <p className="mt-6 text-xs text-earth/50">
            © 2024 Chalo. Designed for the wanderers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
