function sendToTelegram(price1, price2, notional) {
  const BOT_TOKEN = "8468475389:AAEBb78TClelOWapmguSCQ-yYsdAEa36I80";
  const CHAT_ID = "77051776";
  const pnl = pnlEl.textContent; // PnL $
  const diffPct = priceDiffEl.textContent; // Різниця між цінами %
  const text =
    `${new Date().toLocaleString()}\n` +
    `💵 Вхід: ${price1}\n` +
    `💵 Вихід: ${price2}\n` +
    `%: ${diffPct}\n` +
    `💰 Сумма: ${notional}$\n` +
    `──────────────────\n` +
    `<b>PnL: ${pnl}</b>\n`;

  const url = `https://api.telegram.org/bot${"8468475389:AAEBb78TClelOWapmguSCQ-yYsdAEa36I80"}/sendMessage`;

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: text,
      parse_mode: "HTML",
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log("TG response:", data))
    .catch((err) => console.error("TG error:", err));
}
