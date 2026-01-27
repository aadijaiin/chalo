import PartyCodeClient from "./PartyCodeClient";
import { notFound } from "next/navigation";

const page = async ({ params }) => {
  const { partyId } = await params;
  if (!partyId) notFound();

  const code = "123456"; // or fetch from backend
  return <PartyCodeClient code={code} partyId={partyId} />;
};
export default page;
