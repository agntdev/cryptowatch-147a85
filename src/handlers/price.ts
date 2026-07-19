import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getWatchlist } from "../storage.js";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

async function fetchPrice(ticker: string): Promise<{ price: number; change24h: number } | null> {
  try {
    const id = ticker.toLowerCase();
    const res = await fetch(
      `${COINGECKO_API}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    const coin = data[id];
    if (!coin?.usd) return null;
    return { price: coin.usd, change24h: coin.usd_24h_change ?? 0 };
  } catch {
    return null;
  }
}

const composer = new Composer<Ctx>();

composer.command("price", async (ctx) => {
  const arg = (ctx.message?.text ?? "").replace(/^\/price\s*/, "").trim().toUpperCase();
  const userId = ctx.from?.id;
  if (userId == null) return;
  if (arg) {
    await ctx.replyWithChatAction("typing");
    const result = await fetchPrice(arg);
    if (!result) {
      await ctx.reply(`Couldn't find price for ${arg}. Check the ticker and try again.`);
      return;
    }
    const sign = result.change24h >= 0 ? "+" : "";
    await ctx.reply(
      `💰 ${arg}: $${result.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sign}${result.change24h.toFixed(2)}% 24h)`,
      { reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]) }
    );
    return;
  }
  const list = getWatchlist(userId);
  if (list.length === 0) {
    await ctx.reply("No coins in your watchlist — add some first.", {
      reply_markup: inlineKeyboard([[inlineButton("➕ Add coin", "add_coin:start")]]),
    });
    return;
  }
  await ctx.replyWithChatAction("typing");
  const tickers = list.map((e) => e.ticker.toLowerCase()).join(",");
  try {
    const res = await fetch(
      `${COINGECKO_API}/simple/price?ids=${tickers}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) {
      await ctx.reply("Price feed is temporarily unavailable. Try again in a moment.");
      return;
    }
    const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    const lines = list.map((entry) => {
      const coin = data[entry.ticker.toLowerCase()];
      if (!coin?.usd) return `${entry.ticker}: unavailable`;
      const sign = (coin.usd_24h_change ?? 0) >= 0 ? "+" : "";
      return `${entry.ticker}: $${coin.usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sign}${(coin.usd_24h_change ?? 0).toFixed(2)}%)`;
    });
    await ctx.reply(`📊 Watchlist prices:\n\n${lines.join("\n")}`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } catch {
    await ctx.reply("Couldn't reach the price feed. Try again later.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  }
});

composer.callbackQuery("price:check", async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = ctx.from?.id;
  if (userId == null) return;
  const list = getWatchlist(userId);
  if (list.length === 0) {
    await ctx.reply("No coins in your watchlist — add some first.", {
      reply_markup: inlineKeyboard([[inlineButton("➕ Add coin", "add_coin:start")]]),
    });
    return;
  }
  await ctx.replyWithChatAction("typing");
  const tickers = list.map((e) => e.ticker.toLowerCase()).join(",");
  try {
    const res = await fetch(
      `${COINGECKO_API}/simple/price?ids=${tickers}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) {
      await ctx.reply("Price feed is temporarily unavailable. Try again in a moment.");
      return;
    }
    const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    const lines = list.map((entry) => {
      const coin = data[entry.ticker.toLowerCase()];
      if (!coin?.usd) return `${entry.ticker}: unavailable`;
      const sign = (coin.usd_24h_change ?? 0) >= 0 ? "+" : "";
      return `${entry.ticker}: $${coin.usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${sign}${(coin.usd_24h_change ?? 0).toFixed(2)}%)`;
    });
    await ctx.reply(`📊 Watchlist prices:\n\n${lines.join("\n")}`, {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  } catch {
    await ctx.reply("Couldn't reach the price feed. Try again later.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
    });
  }
});

export default composer;
