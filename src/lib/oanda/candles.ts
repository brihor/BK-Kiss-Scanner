import { oanda } from "./client";

export async function getCandles(
  instrument: string,
  count = 100,
  granularity = "M15"
) {
  const response = await oanda.get(`/instruments/${instrument}/candles`, {
    params: {
      granularity,
      count,
      price: "M",
    },
  });

  return response.data.candles;
}