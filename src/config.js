/* config.js */
const isDev = import.meta.env.MODE === "development";

export const VITE_API_URL = isDev
    ? "http://localhost:4000/api"
    : "https://stockOiga.onrender.com/api";

export const VITE_SOCKET_URL = isDev
    ? "http://localhost:4000"
    : "https://stockOiga.onrender.com";
