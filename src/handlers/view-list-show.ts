import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getWatchlist } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("view_list:show", async (ctx) => {
  await ctx.answerCallbackQuery();
  const list = getWatchlist(ctx.from.id);
  if (list.length === 0) {
    await ctx.reply("No coins in your watchlist yet — tap ➕ Add coin to add one.", {
      reply_markup: inlineKeyboard([
        [inlineButton("➕ Add coin", "add_coin:start")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }
  const rows = list.map((entry) => {
    const alertInfo = entry.alertTypes.length > 0
      ? ` [${entry.alertTypes.join(", ")}]`
      : "";
    return [inlineButton(`${entry.ticker}${alertInfo}`, `coin:detail:${entry.ticker}`)];
  });
  rows.push([inlineButton("⬅️ Back to menu", "menu:main")]);
  await ctx.reply(`Your watchlist (${list.length} coin${list.length === 1 ? "" : "s"}):`, {
    reply_markup: inlineKeyboard(rows),
  });
});

composer.callbackQuery(/^coin:detail:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match[1];
  const list = getWatchlist(ctx.from.id);
  const entry = list.find((e) => e.ticker === ticker);
  if (!entry) {
    await ctx.reply("Coin not found in your watchlist.", {
      reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to list", "view_list:show")]]),
    });
    return;
  }
  const lines = [`📊 ${entry.name} (${entry.ticker})`];
  if (entry.alertTypes.length > 0) {
    lines.push(`Alerts: ${entry.alertTypes.join(", ")}`);
  }
  if (entry.priceThresholdValue != null) {
    lines.push(`Price: ${entry.priceThresholdDirection} $${entry.priceThresholdValue}`);
  }
  if (entry.percentThreshold != null) {
    lines.push(`Move: ${entry.percentThreshold}% in ${entry.percentTimeWindow ?? 1}h`);
  }
  if (entry.lastAlertedPrice != null) {
    lines.push(`Last alerted at: $${entry.lastAlertedPrice}`);
  }
  await ctx.reply(lines.join("\n"), {
    reply_markup: inlineKeyboard([
      [inlineButton("🔔 Set price alert", `alert:price:${ticker}`)],
      [inlineButton("📈 Set % alert", `alert:percent:${ticker}`)],
      [inlineButton("🗑 Remove", `coin:remove:${ticker}`)],
      [inlineButton("⬅️ Back to list", "view_list:show")],
    ]),
  });
});

composer.callbackQuery(/^coin:remove:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const ticker = ctx.match[1];
  const { removeFromWatchlist } = await import("../storage.js");
  const removed = removeFromWatchlist(ctx.from.id, ticker);
  if (removed) {
    await ctx.reply(`${ticker} removed from your watchlist.`, {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to list", "view_list:show")],
      ]),
    });
  } else {
    await ctx.reply("Coin not found.", {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to list", "view_list:show")],
      ]),
    });
  }
});

export default composer;
