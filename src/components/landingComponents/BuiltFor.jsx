import React from "react";
import OfflineBoltOutlinedIcon from "@mui/icons-material/OfflineBoltOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import { useTheme } from "next-themes";
const BuiltFor = () => {
  const {theme } = useTheme()
  console.log(theme)
  return (
    <section id="how-it-works" className="px-6 lg:px-40 py-24 dreamwave-bg" >
      <div className="max-w-300 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col gap-8">
            <h2 className="text-4xl font-extrabold tracking-tight text-earth">
              Built for the Journey
            </h2>
            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="mt-1 text-sage">
                  <OfflineBoltOutlinedIcon />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1 text-earth">
                    Real-time Precision
                  </h4>
                  <p className="text-earth/60">
                    Fluid movement updates that keep you perfectly synced with
                    your travel companions.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="mt-1 text-sage">
                  <ScheduleIcon />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1 text-earth">
                    Intuitive ETA
                  </h4>
                  <p className="text-earth/60">
                    Arrival predictions that account for local pace, ensuring no
                    one is left waiting.
                  </p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="mt-1 text-sage">
                  <LockOutlinedIcon />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1 text-earth">
                    Ephemeral Security
                  </h4>
                  <p className="text-earth/60">
                    Privacy by design. Sharing links expire as soon as the
                    session ends.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-card p-6 rounded-3xl shadow-xl shadow-sage/5 border border-sage/10">
              <div className="aspect-square bg-green-300/10 rounded-2xl flex items-center justify-center mb-4">
                <GroupsOutlinedIcon htmlColor='green' fontSize="large"/>
              </div>
              <p className="font-bold text-center text-earth">Group Friendly</p>
            </div>
            <div className="bg-white p-6 dark:bg-card rounded-3xl shadow-xl shadow-sage/5 border border-sage/10 mt-10">
              <div className="aspect-square bg-primary-foreground/10 rounded-2xl flex items-center justify-center mb-4">
                <SecurityIcon htmlColor="#e2725b" fontSize="large"/>
              </div>
              <p className="font-bold text-center text-earth">Private</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BuiltFor;
