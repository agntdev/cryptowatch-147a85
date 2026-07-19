import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { updateWatchlistEntry, getWatchlistEntry } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery(/^alert:percent:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match[1];
  ctx.session.flowData = { ticker };
  ctx.session.step = "awaiting_percent_value";
  await ctx.reply(`${ticker} — alert me when the price moves more than:`, {
    reply_markup: { force_reply: true, input_field_placeholder: "Percent (e.g. 5, 10)…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_percent_value") return next();
  const pct = parseFloat(ctx.message.text.trim().replace(/%/g, ""));
  if (isNaN(pct) || pct <= 0 || pct > 100) {
    await ctx.reply("Enter a valid percent (1–100).");
    return;
  }
  const { ticker } = ctx.session.flowData as { ticker: string };
  ctx.session.flowData = { ticker, percentThreshold: pct };
  ctx.session.step = "awaiting_percent_window";
  await ctx.reply(`${ticker} — over what time window?`, {
    reply_markup: inlineKeyboard([
      [inlineButton("1 hour", `pct_window:${ticker}:1`)],
      [inlineButton("4 hours", `pct_window:${ticker}:4`)],
      [inlineButton("24 hours", `pct_window:${ticker}:24`)],
    ]),
  });
});

composer.callbackQuery(/^pct_window:(.+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match[1];
  const window = parseInt(ctx.match[2], 10);
  const { percentThreshold } = ctx.session.flowData as { percentThreshold: number };
  ctx.session.step = undefined;
  ctx.session.flowData = undefined;
  updateWatchlistEntry(ctx.from.id, ticker, {
    alertTypes: [...new Set([...(getWatchlistEntry(ctx.from.id, ticker)?.alertTypes ?? []), "percent"])],
    percentThreshold,
    percentTimeWindow: window,
  });
  await ctx.reply(
    `✅ Percent alert set!\n\n${ticker} — alert when price moves ${percentThreshold}% in ${window}h`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    }
  );
});

export default composer;
