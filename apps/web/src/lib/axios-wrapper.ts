import axios from "axios";
import { app as firebaseApp } from "@lib/firebase";
import { getAuth } from "firebase/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_BASE_URL,
});

API.interceptors.request.use(async (config) => {
  const auth = getAuth(firebaseApp);
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;
