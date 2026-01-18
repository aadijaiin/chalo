import React from "react";

const Footer = () => {
  return (
    <footer className="bg-cream border-t border-sage/10 px-6 lg:px-40 py-20">
      <div className="max-w-300 mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="flex flex-col gap-6 col-span-1 md:col-span-1">
          <div className="flex items-center gap-3">
            <div className="text-terracotta">
              <span className="material-symbols-outlined text-3xl font-bold">
                explore
              </span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-earth">
              Wayfind
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
              <a className="hover:text-terracotta transition-colors" href="#">
                Features
              </a>
            </li>
            <li>
              <a className="hover:text-terracotta transition-colors" href="#">
                Adventure Stories
              </a>
            </li>
            <li>
              <a className="hover:text-terracotta transition-colors" href="#">
                Safety Guide
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-earth">Trust</h4>
          <ul className="space-y-4 text-sm text-earth/60">
            <li>
              <a className="hover:text-terracotta transition-colors" href="#">
                Privacy Policy
              </a>
            </li>
            <li>
              <a className="hover:text-terracotta transition-colors" href="#">
                Terms of Use
              </a>
            </li>
            <li>
              <a className="hover:text-terracotta transition-colors" href="#">
                Security FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-earth">Community</h4>
          <div className="flex gap-4">
            <a
              className="w-10 h-10 rounded-full bg-white border border-sage/10 flex items-center justify-center text-sage hover:bg-terracotta hover:text-white hover:border-terracotta transition-all"
              href="#"
            >
              <span className="material-symbols-outlined text-xl">share</span>
            </a>
            <a
              className="w-10 h-10 rounded-full bg-white border border-sage/10 flex items-center justify-center text-sage hover:bg-terracotta hover:text-white hover:border-terracotta transition-all"
              href="#"
            >
              <span className="material-symbols-outlined text-xl">
                alternate_email
              </span>
            </a>
          </div>
          <p className="mt-6 text-xs text-earth/50">
            © 2024 Wayfind. Designed for the wanderers.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
