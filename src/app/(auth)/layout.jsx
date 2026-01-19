"use client";
import Link from "next/link";
import ExploreIcon from "@mui/icons-material/Explore";

export default function AuthLayout({ children }) {
  return (
    <>
      <header className="w-full px-6 lg:px-40 py-6">
        <div className="max-w-300 mx-auto">
          <Link className="flex items-center gap-3 w-fit" href="/">
            <div className="text-terracotta">
              <ExploreIcon htmlColor="#e2725b" />
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-earth">
              Chalo
            </h2>
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </>
  );
}
