import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/v1", // your FastAPI backend
  headers: {
    "Content-Type": "application/json",
  },
});
