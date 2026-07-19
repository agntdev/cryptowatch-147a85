import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "➕ Add coin", data: "add_coin:start", order: 10 });
registerMainMenuItem({ label: "📋 View list", data: "view_list:show", order: 20 });
registerMainMenuItem({ label: "💰 Price", data: "price:check", order: 30 });
registerMainMenuItem({ label: "⚙️ Settings", data: "settings:open", order: 40 });
registerMainMenuItem({ label: "🌅 Summary", data: "summary:configure", order: 50 });

const WELCOME = "👋 Welcome to CryptoWatch! Tap a button below to get started.";

const composer = new Composer<Ctx>();

composer.command("start", async (ctx) => {
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
