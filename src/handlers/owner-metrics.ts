import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getSystemMetrics } from "../storage.js";

const OWNER_ID = process.env.OWNER_ID ? parseInt(process.env.OWNER_ID, 10) : undefined;

const composer = new Composer<Ctx>();

composer.callbackQuery("owner:access", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (OWNER_ID == null || ctx.from.id !== OWNER_ID) {
    await ctx.reply("Access denied.");
    return;
  }
  const m = getSystemMetrics();
  const topTickers = Object.entries(m.alertsByTicker)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  const lines = [
    `📊 CryptoWatch Metrics`,
    ``,
    `Total users: ${m.totalUsers}`,
    `Active watchlists: ${m.activeWatchlists}`,
    ``,
    `Alerts by type:`,
  ];
  for (const [type, count] of Object.entries(m.alertsByType)) {
    lines.push(`  ${type}: ${count}`);
  }
  if (topTickers.length > 0) {
    lines.push(``, `Top tickers:`);
    for (const [ticker, count] of topTickers) {
      lines.push(`  ${ticker}: ${count} alerts`);
    }
  }
  if (m.recentAlerts.length > 0) {
    lines.push(``, `Recent alerts:`);
    for (const alert of m.recentAlerts.slice(-5)) {
      const ts = new Date(alert.timestamp).toISOString().slice(0, 16);
      lines.push(`  ${ts} — ${alert.ticker} ${alert.alertType}`);
    }
  }
  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
