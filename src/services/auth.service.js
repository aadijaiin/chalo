import api from "@/lib/axios";

export const signup = async (payload) => {
  const { data } = await api.post("/auth/register/", payload);
  return data;
};

export const signin = async (payload) => {
  const { data } = await api.post("/auth/login/", payload);
  return data;
};
