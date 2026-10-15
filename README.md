# Career & Fame 3.0 — SillyTavern extension / расширение для SillyTavern

Install / Установка: copy the `career-fame` folder to `SillyTavern/public/scripts/extensions/third-party/` (or `data/<user>/extensions/`) and restart ST.

The floating 📱 button opens the phone: Career, Tasks, Content, Events, Audience, Threats, Controversy, Settings.
Language (RU/EN) and opacity are right in the phone's status bar.

## Money, brands, PR parcels / Деньги, бренды, PR-посылки (3.1)
App 💰: inbox (brand offers & PR requests), parcels, wallet (salary, balance).

### Bridge for Phone-ST and other extensions / Мост для Phone-ST
Events (DOM `window` CustomEvent `career-fame:<type>`, ST event bus `career_fame_<type>`, `CareerFame.onEvent(cb)`):
`money` {who, amount, balance, memo, currency}, `offer` {who, brand, kind, pay, shady}, `offer_accepted`, `parcel` {who, brand, item, status}, `deal` {who, title, pay}.

```js
window.addEventListener('career-fame:money', (e) => {
  const { who, amount, balance, memo } = e.detail;
  // top up the Phone-ST bank here
});
window.CareerFame.getWallet('Alice'); // { balance, currency, transactions }
```
Use the 🔍 diagnostics button (💰 → Wallet) to see which Phone-ST globals/metadata are visible.

### 3.2: auto-connect to the Phone-ST bank / автоподключение к банку Phone-ST
The extension imports Phone-ST's already-loaded modules (`state.js`, `bank.js`, `social.js`, `shop.js`), looks for an object with a `balance` under a `bank/wallet/account` path, credits it and copies the shape of an existing transaction. Test: 💰 → Wallet → "🧪 Test". If it fails, press "🔍 Diagnostics" and send the text.
