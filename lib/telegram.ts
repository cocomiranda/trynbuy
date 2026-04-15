type TelegramConfig = {
  botToken: string;
  chatId: string;
};

function getTelegramConfig(): TelegramConfig {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error("Telegram is not configured.");
  }

  return { botToken, chatId };
}

export async function sendTelegramMessage(text: string) {
  const { botToken, chatId } = getTelegramConfig();

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram send failed: ${details}`);
  }

  return response.json();
}
