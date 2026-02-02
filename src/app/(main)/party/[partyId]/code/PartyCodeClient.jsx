"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import MapIcon from "@mui/icons-material/Map";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import FlagIcon from "@mui/icons-material/Flag";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getPartyInfo } from "@/services/party.service";

const PartyCodeClient = ({ partyId, code }) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not supported");
      return;
    }
    navigator.clipboard
      .writeText(code)
      .then(() => {
        toast.success("Code copied!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        toast.error("Failed to copy:", err);
      });
  };

  return (
    <main className="flex items-center justify-center min-h-screen w-full px-6">
      <div className="bg-card rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-sage/10 w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-sage/10 p-1 bg-card shadow-sm">
              <Image
                alt="Leader"
                width={96}
                height={96}
                className="w-full h-full object-cover rounded-full"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBB_aljcFtlDBOuG2HXqJsq8pq-jdkcV3DwEDnYRBDZJK40kMDCtMyXnfzATBA1g0F4Ps3piFjRb2EILB56SatdOBUwUSX2HUlsbjP-Im4MpMvkh_vQb5s3ch2WtDlBIWNJMQikYO8Pe-Z1xrAt0HhNoTUGITZIJz6d9v2wbRfCHDu1swIJNDS5BSm6tEQs51RaqPoneZJGh-EsG5pIJnq9_1v4peZPv2RWfu9fc23KzpTRfnWuSYPPJkddHEeD0b-TyKE7F-JL8ugG"
              />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-sage text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md whitespace-nowrap flex justify-center items-center">
              Alex <FlagIcon fontSize="small" />
            </div>
          </div>
          <p className="text-sage font-medium text-lg mb-2">
            Party Created Successfully!
          </p>
          <h2 className="text-4xl font-extrabold text-primary-foreground uppercase tracking-tight leading-tight text-center">
            Beach Trip 2024
          </h2>
        </div>
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="text-[10px] font-bold text-sage uppercase tracking-[0.2em]">
            Active Members
          </span>
          <div className="flex -space-x-3 items-center">
            <Image
              alt="Member 1"
              width={96}
              height={96}
              className="w-11 h-11 rounded-full border-2 border-card bg-card shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNTnPr0WxYyhLlrLYT-eE6wFjm0nCIy0_T9wCu28M81o0Eg40f4g4iAph1w4QOEVSqZCFgbalU0b-qlSYE7BzvV7kNSNfEHc0WR-HqG5joeg_AXz36StmX5Yz_dWxM9QHmHwLfIBJs4LMLKm1GgiQIfVUtY32RoESrFi0Vpzm5_6Uo8F5rN9Q2PzZi5UpIJRMBAF4AW8F8JcgWqxHkpaSKEkpY5bfOT2n0YCmC6WFpWtrDCdSdHY2g8VJeC5uQDfSRqYK900hkZQHc"
            />
            <Image
              alt="Member 2"
              width={96}
              height={96}
              className="w-11 h-11 rounded-full border-2 border-card bg-card shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7H1aDPWE2CcL8RZ3drE-lkSy9t4ZvV3qqfGt8w8-LvlrwiVFiidcmNnUTCNyHzleEN5LfzuQ1W3Fb2aghtDI4ppx5EK2Jdy9fQJqaS0gChHB7Q3a_--79lyHhF_rx5rpXUrAw3jwgi0zz365o23510TPxBRK1aeeFyx9iI2zmN7gslE7xWHcXcDWeFROnh7vzaIpgDfD-Y9I0qmzdoseCVFEVKZv6CpJbPtsQdO4aoCyDFrufy1VIU7S_ZBo-iKMbAGTbXfKMtusw"
            />
            <Image
              alt="Member 3"
              width={96}
              height={96}
              className="w-11 h-11 rounded-full border-2 border-card bg-card shadow-sm"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD81_b1pGy883UviOf5G-DazLJRkx3ORO0KOJpBrl8acC3PowoZ_tHTC_h7Ut6kpEFPLi9NnzPwZMR0qlQqRb1ZwcovXtBq5KbbvGK-cAvLuUdx3SVvBgQ3Yisj_7_Ipf0Ztqo5avU-at9GB_PxZW9C7NoOYGvLmuI983ZpBhZwOGYGERCZ5dwW21rYSbtdVBfbFs8bZ6qR7pmpv65YdOCfQDI3FDbA7ivGKxjzomC-hAAX_bLaL1ym4R9bfMBrKmWnwhvNOkot-3-n"
            />
            <div className="w-11 h-11 rounded-full border-2 border-card bg-sage flex items-center justify-center text-white text-xs font-bold shadow-sm">
              +1
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-10">
          {code &&
            code.split("").map((e, index) => {
              return (
                <div
                  key={index}
                  className="glass-box w-12 h-16 flex items-center justify-center rounded-xl"
                >
                  <span className="text-3xl font-extrabold text-primary-foreground">
                    {e}
                  </span>
                </div>
              );
            })}
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="h-14 rounded-xl border-2 border-primary-foreground
             text-primary-foreground font-semibold
             transition-transform active:scale-[0.96]"
            >
              <ContentCopyIcon />
              {copied ? "Copied!" : "Copy Code"}
            </Button>
            <Button
              variant="outline"
              className="h-14 rounded-xl border-2 border-primary-foreground
             text-primary-foreground font-semibold
             transition-transform active:scale-[0.96]"
            >
              <ShareIcon />
              Share Link
            </Button>
          </div>
          <Button
            onClick={() => router.push(`map`)}
            className="w-full h-16 bg-primary-foreground text-white rounded-xl font-bold text-lg shadow-xl shadow-primary-foreground/20 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-3"
          >
            Go to Live Map
            <MapIcon />
          </Button>
        </div>
        <div className="mt-8 py-5 px-6 bg-card rounded-2xl border border-sage/10">
          <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground">
              <TimerOutlinedIcon />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sage mb-0.5">
                Time Remaining
              </p>
              <p className="text-sm font-extrabold text-earth">
                Sharing expires in 4 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PartyCodeClient;
