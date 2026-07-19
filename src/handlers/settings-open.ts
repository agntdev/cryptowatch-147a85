import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { getUserProfile, updateUserProfile } from "../storage.js";

const composer = new Composer<Ctx>();

composer.callbackQuery("settings:open", async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = getUserProfile(ctx.from.id);
  const quietStart = profile.quietHoursStart ?? 22;
  const quietEnd = profile.quietHoursEnd ?? 7;
  const cooldown = profile.alertCooldownMinutes ?? 30;
  const tz = profile.timeZone ?? "UTC";
  await ctx.reply(
    `⚙️ Settings\n\n` +
    `Time zone: ${tz}\n` +
    `Quiet hours: ${quietStart}:00 – ${quietEnd}:00\n` +
    `Alert cooldown: ${cooldown} min`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("🌍 Time zone", "settings:timezone")],
        [inlineButton("🔕 Quiet hours", "settings:quiet")],
        [inlineButton("⏱ Cooldown", "settings:cooldown")],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    }
  );
});

composer.callbackQuery("settings:timezone", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_timezone";
  await ctx.reply("Type your time zone (e.g. UTC, US/Eastern, Europe/London):", {
    reply_markup: { force_reply: true, input_field_placeholder: "Enter time zone…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_timezone") return next();
  const tz = ctx.message.text.trim();
  if (tz.length < 2 || tz.length > 50) {
    await ctx.reply("Invalid time zone. Try again (e.g. UTC, US/Eastern).");
    return;
  }
  ctx.session.step = undefined;
  updateUserProfile(ctx.from.id, { timeZone: tz });
  await ctx.reply(`Time zone set to ${tz}.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:open")]]),
  });
});

composer.callbackQuery("settings:quiet", async (ctx) => {
  await ctx.answerCallbackQuery();
  const profile = getUserProfile(ctx.from.id);
  const start = profile.quietHoursStart ?? 22;
  const end = profile.quietHoursEnd ?? 7;
  await ctx.reply(
    `Quiet hours: ${start}:00 – ${end}:00\n\nAlerts during quiet hours are deferred until morning.`,
    {
      reply_markup: inlineKeyboard([
        [inlineButton("Change start", "settings:quiet_start")],
        [inlineButton("Change end", "settings:quiet_end")],
        [inlineButton("⬅️ Back to settings", "settings:open")],
      ]),
    }
  );
});

composer.callbackQuery("settings:quiet_start", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_quiet_start";
  await ctx.reply("Type the quiet hours start (0–23, e.g. 22 for 10 PM):", {
    reply_markup: { force_reply: true, input_field_placeholder: "Hour (0–23)…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_quiet_start") return next();
  const hour = parseInt(ctx.message.text.trim(), 10);
  if (isNaN(hour) || hour < 0 || hour > 23) {
    await ctx.reply("Enter a number between 0 and 23.");
    return;
  }
  ctx.session.step = undefined;
  updateUserProfile(ctx.from.id, { quietHoursStart: hour });
  await ctx.reply(`Quiet hours start set to ${hour}:00.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:open")]]),
  });
});

composer.callbackQuery("settings:quiet_end", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_quiet_end";
  await ctx.reply("Type the quiet hours end (0–23, e.g. 7 for 7 AM):", {
    reply_markup: { force_reply: true, input_field_placeholder: "Hour (0–23)…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_quiet_end") return next();
  const hour = parseInt(ctx.message.text.trim(), 10);
  if (isNaN(hour) || hour < 0 || hour > 23) {
    await ctx.reply("Enter a number between 0 and 23.");
    return;
  }
  ctx.session.step = undefined;
  updateUserProfile(ctx.from.id, { quietHoursEnd: hour });
  await ctx.reply(`Quiet hours end set to ${hour}:00.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:open")]]),
  });
});

composer.callbackQuery("settings:cooldown", async (ctx) => {
  await ctx.answerCallbackQuery();
  ctx.session.step = "awaiting_cooldown";
  await ctx.reply("Type the alert cooldown in minutes (e.g. 30):", {
    reply_markup: { force_reply: true, input_field_placeholder: "Minutes…" },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_cooldown") return next();
  const mins = parseInt(ctx.message.text.trim(), 10);
  if (isNaN(mins) || mins < 1 || mins > 1440) {
    await ctx.reply("Enter a number between 1 and 1440 (24 hours).");
    return;
  }
  ctx.session.step = undefined;
  updateUserProfile(ctx.from.id, { alertCooldownMinutes: mins });
  await ctx.reply(`Alert cooldown set to ${mins} minutes.`, {
    reply_markup: inlineKeyboard([[inlineButton("⬅️ Back to settings", "settings:open")]]),
  });
});

export default composer;
