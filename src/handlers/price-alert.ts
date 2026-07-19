import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { updateWatchlistEntry, getWatchlistEntry } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^alert:price:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match[1];
  ctx.session.flowData = { ticker };
  ctx.session.step = "awaiting_price_direction";
  await ctx.reply(`${ticker} — should the alert trigger when the price goes:`, {
    reply_markup: inlineKeyboard([
      [inlineButton("📈 Above a price", `price_dir:above:${ticker}`)],
      [inlineButton("📉 Below a price", `price_dir:below:${ticker}`)],
      [inlineButton("Cancel", "menu:main")],
    ]),
  });
});

composer.callbackQuery(/^price_dir:(above|below):(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const direction = ctx.match[1] as "above" | "below";
  const ticker = ctx.match[2];
  ctx.session.flowData = { ticker, direction };
  ctx.session.step = "awaiting_price_value";
  await ctx.reply(`${ticker} — alert me when the price goes ${direction}:`, {
    reply_markup: { force_reply: true, input_field_placeholder: "Enter price in USD…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_price_value") return next();
  const value = parseFloat(ctx.message.text.trim().replace(/[$,]/g, ""));
  if (isNaN(value) || value <= 0) {
    await ctx.reply("Enter a valid price (e.g. 50000, 1.50).");
    return;
  }
  const { ticker, direction } = ctx.session.flowData as { ticker: string; direction: "above" | "below" };
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  updateWatchlistEntry(ctx.from.id, ticker, {
    alertTypes: [...new Set([...(getWatchlistEntry(ctx.from.id, ticker)?.alertTypes ?? []), "price"])],
    priceThresholdDirection: direction,
    priceThresholdValue: value,
  });
  await ctx.reply(
    `✅ Price alert set!\n\n${ticker} — alert when ${direction} $${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    }
  );
});

export default composer;
