const BASE_URL = process.env.OANDA_BASE_URL!;
const API_KEY = process.env.OANDA_API_KEY!;
const ACCOUNT_ID = process.env.OANDA_ACCOUNT_ID!;
export async function getCandles(
  instrument: string,
  granularity = "M15",
  count = 100
) {
  const url =
    `${BASE_URL}/v3/instruments/${instrument}/candles` +
    `?price=M&granularity=${granularity}&count=${count}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `OANDA Error ${response.status}: ${await response.text()}`
    );
  }

  return response.json();
}