import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://collabo-backend-x796.onrender.com/api" : "/api",
  withCredentials: true,
});
