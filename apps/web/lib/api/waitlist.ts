import { JoinWaitlistDTO } from "@checkmate/shared-types";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const publicClient = axios.create({
  baseURL: API_URL,
});

export const joinWaitlist = async (data: JoinWaitlistDTO) => {
  const response = await publicClient.post("/v1/waitlist/join", data);
  return response.data;
};

export const checkWaitlistStatus = async (email: string) => {
  const response = await publicClient.get(`/v1/waitlist/status?email=${encodeURIComponent(email)}`);
  return response.data;
};

export const getWaitlistCount = async () => {
  const response = await publicClient.get("/v1/waitlist/count");
  return response.data;
};
