import api from "@/lib/axios";

export const createParty = async (payload) => {
  const { data } = api.post("/", payload);
  return data;
};

export const joinParty = async (payload) => {
  const { data } = api.post("/", payload);
  return data;
};
