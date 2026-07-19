import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getUserProfile, updateUserProfile } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("summary:configure", async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = getUserProfile(ctx.from.id);
  const enabled = profile.morningSummaryEnabled ?? false;
  const time = profile.morningSummaryTime ?? "08:00";
  await ctx.reply(
    `🌅 Morning summary\n\n` +
    `Status: ${enabled ? "Enabled" : "Disabled"}\n` +
    `Time: ${time}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton(enabled ? "🔕 Disable" : "🔔 Enable", "summary:toggle")],
        [inlineButton("🕐 Change time", "summary:time")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    }
  );
});

composer.callbackQuery("summary:toggle", async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = getUserProfile(ctx.from.id);
  const newState = !(profile.morningSummaryEnabled ?? false);
  updateUserProfile(ctx.from.id, { morningSummaryEnabled: newState });
  const time = profile.morningSummaryTime ?? "08:00";
  await ctx.reply(
    `🌅 Morning summary ${newState ? "enabled" : "disabled"}.\n` +
    `${newState ? `You'll get a daily update at ${time}.` : "No more daily summaries."}`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton(newState ? "🔕 Disable" : "🔔 Enable", "summary:toggle")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    }
  );
});

composer.callbackQuery("summary:time", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_summary_time";
  await ctx.reply("Type the summary time (e.g. 08:00, 07:30):", {
    reply_markup: { force_reply: true, input_field_placeholder: "HH:MM format…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_summary_time") return next();
  const time = ctx.message.text.trim();
  if (!/^\d{1,2}:\d{2}$/.test(time)) {
    await ctx.reply("Use HH:MM format (e.g. 08:00, 14:30).");
    return;
  }
  const [h, m] = time.split(":").map(Number);
  if (h == null || m == null || h < 0 || h > 23 || m < 0 || m > 59) {
    await ctx.reply("Invalid time. Use HH:MM with hours 0–23 and minutes 0–59.");
    return;
  }
  ctx.session.step = undefined;
  updateUserProfile(ctx.from.id, { morningSummaryTime: time, morningSummaryEnabled: true });
  await ctx.reply(`Morning summary set to ${time}. You'll get a daily update at this time.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to menu", "menu:main")]]),
  });
});

export default composer;
