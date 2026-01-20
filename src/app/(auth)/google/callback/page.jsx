import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading…</p>}>
      <CallbackClient />
    </Suspense>
  );
}
