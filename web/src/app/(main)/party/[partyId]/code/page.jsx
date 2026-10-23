// page.jsx — just a shell, no data fetching
import PartyCodeClient from "./PartyCodeClient";
import { notFound } from "next/navigation";

const page = async ({ params }) => {
  const { partyId } = await params;
  if (!partyId) notFound();
  return <PartyCodeClient partyId={partyId} />;
};

export default page;
