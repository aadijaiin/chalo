import React from "react";

const forgotPasswordEmail = () => {
  return (
    <main class="flex-1 flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-3xl shadow-xl shadow-earth/5 border border-sage/10 p-8 md:p-12">
          <div class="text-center mb-10">
            <div class="w-16 h-16 bg-sage/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span class="material-symbols-outlined text-3xl text-sage">
                lock_reset
              </span>
            </div>
            <h1 class="text-3xl font-extrabold text-earth mb-3">
              Forgot your password?
            </h1>
            <p class="text-earth/60 text-sm leading-relaxed">
              Enter your email address and we will send you a link to reset your
              password.
            </p>
          </div>
          <form class="space-y-6">
            <div>
              <label
                class="block text-sm font-semibold text-earth/80 mb-2"
                for="email"
              >
                Email Address
              </label>
              <input
                class="w-full px-4 py-3 rounded-xl border border-sage/40 bg-white text-earth placeholder:text-earth/40 focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all"
                id="email"
                placeholder="alex@example.com"
                required=""
                type="email"
              />
            </div>
            <div class="pt-2">
              <button class="w-full h-14 bg-terracotta text-white font-bold rounded-xl shadow-lg shadow-terracotta/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Send Reset Link
              </button>
            </div>
            <div class="text-center pt-4">
              <a
                class="inline-flex items-center gap-2 text-sage font-bold hover:text-earth transition-colors text-sm"
                href="#"
              >
                <span class="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                Back to Login
              </a>
            </div>
          </form>
        </div>
        <div class="mt-8 flex flex-wrap justify-center gap-8 text-xs text-earth/40 uppercase tracking-widest font-bold">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">shield</span>
            Secure Encryption
          </div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">verified_user</span>
            Trusted Service
          </div>
        </div>
      </div>
    </main>
  );
};

export default forgotPasswordEmail;
