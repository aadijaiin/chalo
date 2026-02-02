import PartyCodeClient from "./PartyCodeClient";
import { notFound } from "next/navigation";
import axios from "axios";

const page = async ({ params }) => {
  const { partyId } = await params;
  if (!partyId) notFound();

  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL}/parties/${partyId}`,
    {
      withCredentials: true,
    },
  );
  console.log(data);

  //   const res = axios.getgetPartyInfo(partyId);
  //   console.log(res);

  const code = "123456"; // or fetch from backend
  return <PartyCodeClient code={code} partyId={partyId} />;
};
export default page;
