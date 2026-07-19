# CryptoWatch — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

CryptoWatch is a personal Telegram bot that lets users maintain private cryptocurrency watchlists, set price-threshold and percent-move alerts, request on-demand prices, and configure quiet hours and alert cooldowns. The owner receives aggregated usage metrics and alert statistics.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Individual crypto traders
- Crypto holders

## Success criteria

- Users can add and manage watchlist coins
- Price alerts are delivered accurately with cooldowns
- Daily morning summaries are sent at configured times
- Owner can view aggregated metrics and alert statistics

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu with options to add coins, view list, and access settings
- **/price** (command, actor: user, command: /price) — Request current price for a specific coin or summary of watchlist
- **Add coin** (button, actor: user, callback: add_coin:start) — Open the coin addition flow with inline buttons for common coins and input for custom tickers
- **View list** (button, actor: user, callback: view_list:show) — Display the user's current watchlist with per-coin actions
- **Settings** (button, actor: user, callback: settings:open) — Access quiet hours, alert cooldown, and morning summary configuration
- **Morning summary** (button, actor: user, callback: summary:configure) — Enable/disable and configure the daily morning summary

## Flows

### onboarding
_Trigger:_ /start

1. Display main menu with Add coin, View list, Settings, Morning summary buttons

_Data touched:_ User profile

### add_coin
_Trigger:_ add_coin:start

1. Show common coin buttons (BTC, ETH, TON) and input field for custom ticker
2. Validate ticker and add to watchlist
3. Confirm addition with alert configuration options

_Data touched:_ Watchlist entry

### view_list
_Trigger:_ view_list:show

1. List all coins in watchlist with per-coin buttons
2. Show alert status and last alerted price
3. Allow removal or alert configuration

_Data touched:_ Watchlist entry

### price_alert
_Trigger:_ price_threshold:configure

1. Prompt for direction (above/below)
2. Prompt for price value
3. Confirm alert with summary message

_Data touched:_ Watchlist entry

### percent_alert
_Trigger:_ percent_threshold:configure

1. Prompt for percent value
2. Prompt for time window (default 1h)
3. Confirm alert with summary message

_Data touched:_ Watchlist entry

### price_check
_Trigger:_ /price

1. Parse ticker argument if provided
2. Fetch current price and changes
3. Display price summary for specified coin or entire watchlist

_Data touched:_ Price feed data

### morning_summary
_Trigger:_ summary:configure

1. Prompt for enable/disable
2. Prompt for time selection
3. Confirm summary settings

_Data touched:_ User profile

### alert_delivery
_Trigger:_ price_change

1. Check if alert conditions are met
2. Check quiet hours and cooldown status
3. Deliver alert message if applicable
4. Update last alerted timestamp

_Data touched:_ Alert event, Watchlist entry

### owner_metrics
_Trigger:_ owner_view:access

1. Verify owner Telegram ID
2. Display aggregated metrics
3. Show top 20 triggered tickers and recent alerts

_Data touched:_ System metrics

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — User-specific settings and preferences
  - fields: Telegram user ID, Display name, Time zone, Quiet hours start/end, Morning summary time, Alert cooldown duration
- **Watchlist entry** _(retention: persistent)_ — Cryptocurrency being monitored by a user
  - fields: User ID, Ticker symbol, User-friendly name, Enabled alert types, Threshold direction and value, Percent threshold and time window, Last alert timestamp, Last alerted price
- **Alert event** _(retention: persistent)_ — Record of an alert being triggered and delivered
  - fields: User ID, Ticker, Alert type, Old price, New price, Percent change, Timestamp, Delivered status
- **System metrics** _(retention: persistent)_ — Aggregated usage statistics for the owner
  - fields: Total users, Active watchlists, Alerts by ticker, Alerts by type, Recent alerts

## Integrations

- **Telegram** (required) — Bot API messaging and user interface
- **Price feed** (required) — Market price data for cryptocurrency monitoring
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Access to owner view with aggregated metrics
- Configure owner Telegram ID during setup

## Notifications

- Price threshold alerts
- Percent move alerts
- Daily morning summaries
- Price feed failure notifications for user actions

## Permissions & privacy

- Private user watchlists and settings
- Aggregated metrics only for owner view
- No user API keys required
- No public sharing of user data

## Edge cases

- Price feed failures during alert checks
- User enters invalid ticker symbols
- Alerts triggered during quiet hours
- Multiple alerts for same coin within cooldown period
- Time zone conversion for morning summaries

## Required tests

- Verify price alerts trigger at threshold with cooldown
- Test morning summary delivery at configured time
- Validate quiet hours behavior for alert suppression
- Confirm owner view shows correct aggregated metrics
- Test ticker validation and suggestion logic

## Assumptions

- Default price currency is USD
- Percent-move window defaults to 1 hour
- Alert cooldown defaults to 30 minutes
- Quiet hours defer alerts by default
- Time zone inferred from Telegram profile or set to UTC
