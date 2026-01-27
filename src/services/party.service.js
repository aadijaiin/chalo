import api from "@/lib/axios";

export const createParty = async (payload) => {
  const { data } = await api.post("/parties/", payload);
  return data;
};

export const joinParty = async (payload) => {
  const { data } = await api.post("/parties/join", payload);
  return data;
};

export const leaveParty = async (id) => {
  const { data } = await api.post(`/parties/${id}/leave`);
  return data;
};

export const getPartyInfo = async (id) => {
  const { data } = await api.get(`/parties/${id}`);
  return data;
};

export const getMyParty = async () => {
  const { data } = await api.get("/parties/me");
  return data;
};

export const extendPartyDuration = async (id, payload) => {
  const { data } = await api.patch(`/parties/${id}/duration`, payload);
  return data;
};

export const kickMember = async (id, userId) => {
  const { data } = await api.delete(`/parties/${id}/members/${userId}`);
  return data;
};
