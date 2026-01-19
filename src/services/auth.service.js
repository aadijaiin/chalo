import api from "@/lib/axios";

export const signup = async (payload) => {
  const { data } = await api.post("/auth/signup", payload);
  return data;
};
