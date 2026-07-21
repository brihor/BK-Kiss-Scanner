import axios from "axios";

const baseURL =
  process.env.OANDA_ENV === "practice"
    ? "https://api-fxpractice.oanda.com/v3"
    : "https://api-fxtrade.oanda.com/v3";

export const oanda = axios.create({
  baseURL,
  headers: {
    Authorization: `Bearer ${process.env.OANDA_API_KEY}`,
    "Content-Type": "application/json",
  },
  timeout: 15000,
});