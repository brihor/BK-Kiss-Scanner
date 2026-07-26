import { prisma } from "@/lib/prisma";
import type { Signal } from "@/types/signal";

export async function sendSignalPushNotification(
  signal: Signal
) {
  try {
    const pushTokens = await prisma.pushToken.findMany();

    if (pushTokens.length === 0) {
      return;
    }

    const messages = pushTokens.map(({ token }) => ({
      to: token,
      title: `BK KiSS Scanner • ${signal.direction}`,
      body: `${signal.pair} ${signal.direction} signal`,
      sound: null,
      priority: "high",
      data: {
        type: "BK_NEW_SIGNAL",
        signalId: signal.id,
        pair: signal.pair,
        direction: signal.direction,
      },
    }));

    const response = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      }
    );

    if (!response.ok) {
      console.error(
        "Expo push notification failed:",
        await response.text()
      );
    }
  } catch (error) {
    console.error(
      "Unable to send BK push notification:",
      error
    );
  }
}