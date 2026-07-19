import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { addToWatchlist, getUserProfile } from "../storage.js";

const COMMON_COINS = [
  { ticker: "BTC", name: "Bitcoin", id: "bitcoin" },
  { ticker: "ETH", name: "Ethereum", id: "ethereum" },
  { ticker: "TON", name: "Toncoin", id: "the-open-network" },
];

const composer = new Composer<Ctx>();

composer.callbackQuery("add_coin:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  getUserProfile(ctx.from.id);
  const buttons = COMMON_COINS.map((c) => [
    inlineButton(`${c.ticker} (${c.name})`, `add_coin:pick:${c.ticker}`),
  ]);
  buttons.push([inlineButton("✏️ Custom ticker", "add_coin:custom")]);
  buttons.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  await ctx.reply("Choose a coin to add, or enter a custom ticker:", {
    reply_markup: inlineKeyboard(buttons),
  });
});

composer.callbackQuery(/^add_coin:pick:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match[1];
  const coin = COMMON_COINS.find((c) => c.ticker === ticker);
  if (!coin) {
    await ctx.reply("Coin not found. Try again.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back", "add_coin:start")]]),
    });
    return;
  }
  const entry = {
    userId: ctx.from.id,
    ticker: coin.ticker,
    name: coin.name,
    alertTypes: [],
  };
  addToWatchlist(entry);
  await ctx.reply(`${coin.name} (${coin.ticker}) added to your watchlist!`, {
    reply_markup: inlineKeyboard([
      [inlineButton("🔔 Set price alert", `alert:price:${coin.ticker}`)],
      [inlineButton("📈 Set % alert", `alert:percent:${coin.ticker}`)],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

composer.callbackQuery("add_coin:custom", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_custom_ticker";
  await ctx.reply("Type the ticker symbol (e.g. SOL, DOGE, ADA):", {
    reply_markup: { force_reply: true, input_field_placeholder: "Enter ticker symbol…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_custom_ticker") return next();
  const ticker = ctx.message.text.trim().toUpperCase();
  if (!/^[A-Z0-9]{1,10}$/.test(ticker)) {
    await ctx.reply("Invalid ticker. Use 1–10 letters or numbers (e.g. SOL, DOGE).");
    return;
  }
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  const entry = {
    userId: ctx.from.id,
    ticker,
    name: ticker,
    alertTypes: [],
  };
  addToWatchlist(entry);
  await ctx.reply(`${ticker} added to your watchlist!`, {
    reply_markup: inlineKeyboard([
      [inlineButton("🔔 Set price alert", `alert:price:${ticker}`)],
      [inlineButton("📈 Set % alert", `alert:percent:${ticker}`)],
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
