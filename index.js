(() => {
  const MODULE = 'career_fame';
  const ctx = () => SillyTavern.getContext();

  /* =====================  ЯЗЫК / LANGUAGE  ===================== */
  // Статичные данные хранятся строками «ru|en». Динамические тексты — через tr(ru, en).
  const DEFAULTS = {
    lang: 'ru', enabled: true, inject: true, auto: true, demandActions: true,
    showFab: true, opacity: 0.95, fabX: null, fabY: null,
    mode: 'current', profileId: '',
    endpointUrl: 'http://localhost:4000/v1', endpointKey: '', endpointModel: '',
    haters: true, doxx: true, stalkers: true, stalkerPlate: true, stalkerFreq: 'normal',
    cuckTag: true, cuckTarget: 'self', cancelChance: {}, exposeScale: 100,
    currency: '₽', salaryEvery: 25, brandOffers: true, offerFreq: 'normal', bridgeEvents: true, bridgePrompt: true, phoneSms: true, phoneBank: true, banners: true, theme: 'midnight',
  };
  function S() {
    const { extensionSettings } = ctx();
    if (!extensionSettings[MODULE]) extensionSettings[MODULE] = {};
    const st = extensionSettings[MODULE];
    for (const k of Object.keys(DEFAULTS)) if (st[k] === undefined) st[k] = typeof DEFAULTS[k] === 'object' && DEFAULTS[k] ? JSON.parse(JSON.stringify(DEFAULTS[k])) : DEFAULTS[k];
    return st;
  }
  const saveSettings = () => ctx().saveSettingsDebounced();
  const LANG = () => (S().lang === 'en' ? 'en' : 'ru');
  const tr = (ru, en) => (LANG() === 'en' ? en : ru);
  const bi = (s, l = LANG()) => { const i = String(s).indexOf('|'); return i < 0 ? s : (l === 'en' ? s.slice(i + 1) : s.slice(0, i)); };

  /* =====================  ДАННЫЕ  ===================== */
  const CAREERS = {
    blogger:  { icon: '📱', name: 'Блогер|Blogger', ladder: ['Начинающий блогер|Beginner blogger', 'Автор с аудиторией|Creator with an audience', 'Известный блогер|Known blogger', 'Инфлюенсер|Influencer', 'Топ-блогер|Top blogger', 'Икона интернета|Internet icon'] },
    streamer: { icon: '🎮', name: 'Стример|Streamer', ladder: ['Стример-новичок|Newbie streamer', 'Постоянный стример|Regular streamer', 'Партнёр платформы|Platform partner', 'Звезда стримов|Streaming star', 'Топ-стример|Top streamer', 'Легенда стриминга|Streaming legend'] },
    actor:    { icon: '🎬', name: 'Актёр|Actor', ladder: ['Актёр массовки|Extra', 'Эпизодический актёр|Bit-part actor', 'Актёр второго плана|Supporting actor', 'Ведущий актёр|Lead actor', 'Звезда кино|Movie star', 'Икона Голливуда|Hollywood icon'] },
    musician: { icon: '🎤', name: 'Музыкант|Musician', ladder: ['Уличный музыкант|Street musician', 'Игрок клубов|Club performer', 'Локальный артист|Local artist', 'Артист лейбла|Label artist', 'Хедлайнер|Headliner', 'Легенда сцены|Stage legend'] },
    athlete:  { icon: '🏅', name: 'Спортсмен|Athlete', ladder: ['Любитель|Amateur', 'Подающий надежды|Rising prospect', 'Профессионал|Professional', 'Чемпион региона|Regional champion', 'Звезда лиги|League star', 'Живая легенда спорта|Living sports legend'] },
  };
  const LEVEL_ICONS = ['🌱', '🌿', '🌳', '⭐', '🌟', '👑'];
  const FAME_TIERS = [
    [0, '⚪', 'Никому не известен|Unknown'], [50, '🌱', 'Узнают друзья|Known to friends'], [150, '📍', 'Местная известность|Locally known'],
    [350, '⭐', 'Растущая звезда|Rising star'], [600, '🌟', 'Знаменитость|Celebrity'], [850, '🔥', 'Мега-звезда|Megastar'], [980, '👑', 'Легенда|Legend'],
  ];
  const CANCEL = {
    1: { icon: '⚠️', turns: 10, fame: -60,  label: 'Скандал|Scandal' },
    2: { icon: '🚫', turns: 25, fame: -150, label: 'Отмена|Cancelled' },
    3: { icon: '☠️', turns: 50, fame: -350, label: 'Тотальная отмена|Total cancellation' },
  };
  const SEG = { loyal: ['👥', 'Фанаты|Fans'], brands: ['💼', 'Бренды и спонсоры|Brands & sponsors'], public: ['📰', 'Публика и СМИ|Public & media'] };
  const MOODS = [[20, 'враждебны|hostile'], [40, 'недовольны|displeased'], [60, 'нейтральны|neutral'], [80, 'довольны|pleased'], [101, 'в восторге|thrilled']];
  const mood = (v, l) => bi(MOODS.find(([m]) => v < m)[1], l);

  const MOVES = {
    adult: { icon: '🔞', name: 'уход на платформу 18+ (OnlyFans и т.п.)|moving to an 18+ platform (OnlyFans etc.)', hate: 10,
      base: { fame: 30, loyal: -5, brands: -25, public: -10, heat: 0, p: 0.2, sev: 1 },
      career: { blogger: { fame: 40, brands: -20 }, streamer: { loyal: -10, brands: -30 }, actor: { fame: 20, brands: -30, public: -15, p: 0.3 },
        musician: { fame: 35, loyal: 5, brands: -15, public: -5, p: 0.1 }, athlete: { fame: 25, loyal: -15, brands: -45, public: -20, p: 0.4, sev: 2 } },
      r: { loyalPos: 'часть фанатов поддерживает выбор и донатит|some fans support the choice and donate', loyalNeg: 'фанаты спорят: «продался», кто-то отписывается|fans argue “sold out”, some unsubscribe',
           brandsPos: 'нишевые бренды и агентства сами пишут с предложениями|niche brands and agencies reach out with offers', brandsNeg: 'спонсоры тихо замораживают контракты|sponsors quietly freeze contracts',
           publicPos: 'интернет шутит и обсуждает, охваты растут|the internet jokes and talks, reach grows', publicNeg: 'СМИ и комментаторы осуждают, звучат упрёки в «падении»|media and commentators condemn it' } },
    casino: { icon: '🎰', name: 'реклама казино / лутбоксов / ставок|casino / lootbox / betting ads', hate: 15,
      base: { fame: 20, loyal: -20, brands: 10, public: -25, heat: 35, p: 0.35, sev: 2 },
      career: { streamer: { loyal: -25, public: -30, heat: 45, p: 0.45 }, blogger: { loyal: -22 }, actor: { brands: -10, p: 0.3 }, musician: { loyal: -10, public: -15, p: 0.25 }, athlete: { brands: -40, p: 0.5 } },
      r: { loyalPos: 'часть аудитории в азарте и просит промокоды|part of the audience is excited and asks for promo codes', loyalNeg: 'фанаты разочарованы: «зачем ты это пиаришь»|fans are disappointed: “why are you promoting this”',
           brandsPos: 'букмекеры и гемблинг-партнёры предлагают крупные контракты|betting and gambling partners offer big contracts', brandsNeg: 'приличные бренды разрывают сотрудничество|respectable brands cut ties',
           publicPos: 'публика равнодушно пожимает плечами|the public shrugs', publicNeg: 'пресса и родители поднимают тему игровой зависимости|press and parents raise gambling addiction' } },
    scam: { icon: '🕳️', name: 'реклама скамеров / мошеннических проектов|advertising scammers / fraudulent projects', hate: 30,
      base: { fame: 15, loyal: -35, brands: -30, public: -40, heat: 60, p: 0.5, sev: 3 },
      career: { blogger: { loyal: -40 }, streamer: { loyal: -40 }, athlete: { brands: -40 } },
      r: { loyalPos: 'самые преданные пока защищают: «может, он не знал»|the most loyal defend: “maybe they didn’t know”', loyalNeg: 'подписчики злятся, что их втянули, и требуют вернуть деньги|followers are angry about being dragged in and demand refunds',
           brandsPos: 'сомнительные «партнёры» предлагают новые сделки|shady “partners” offer new deals', brandsNeg: 'честные бренды мгновенно дистанцируются|honest brands distance themselves instantly',
           publicPos: 'шум привлёк внимание|the noise drew attention', publicNeg: 'расследователи и СМИ копают, в сети разбирают схему|investigators and media dig in, the scheme gets dissected online' } },
    crypto: { icon: '🪙', name: 'реклама крипто-пирамид / памп-схем|crypto pyramid / pump-scheme ads', hate: 25,
      base: { fame: 20, loyal: -25, brands: -15, public: -30, heat: 50, p: 0.45, sev: 2 },
      career: { streamer: { loyal: -20 }, musician: { loyal: -15 } },
      r: { loyalPos: 'часть фанатов ждёт быстрой прибыли и хайпит|some fans expect quick profit and hype it', loyalNeg: 'подписчики боятся потерять вложения и обвиняют в памп-схеме|followers fear losing money and accuse a pump scheme',
           brandsPos: 'крипто-проекты предлагают контракты|crypto projects offer contracts', brandsNeg: 'банки и серьёзные спонсоры отходят|banks and serious sponsors back off',
           publicPos: 'тема взлетает в трендах|the topic trends', publicNeg: 'аналитики и СМИ называют это пирамидой|analysts and media call it a pyramid' } },
    fake: { icon: '🎁', name: 'фейковые розыгрыши / накрутка|fake giveaways / botting', hate: 20,
      base: { fame: 25, loyal: -15, brands: -10, public: -20, heat: 40, p: 0.3, sev: 1 },
      career: { streamer: { fame: 30 }, blogger: { fame: 30 } },
      r: { loyalPos: 'фанаты радуются «розыгрышу» и ставят лайки|fans enjoy the “giveaway” and like it', loyalNeg: 'участники подозревают обман и пишут жалобы|participants suspect a fraud and complain',
           brandsPos: 'рекламодатели довольны цифрами охвата|advertisers are happy with the reach numbers', brandsNeg: 'бренды замечают накрутку и пересматривают договор|brands notice the botting and review the deal',
           publicPos: 'охваты растут, обсуждают призы|reach grows, people discuss the prizes', publicNeg: 'блогеры-разоблачители выкладывают разбор|debunker bloggers post an exposé' } },
    guru: { icon: '🎓', name: 'инфоцыганство (дорогие курсы и марафоны «как разбогатеть»)|info-gypsy scams (overpriced “get rich” courses and marathons)', hate: 25,
      base: { fame: 25, loyal: -20, brands: -15, public: -35, heat: 45, p: 0.4, sev: 2 },
      career: { blogger: { fame: 30, loyal: -25 }, streamer: { fame: 28, loyal: -25 }, athlete: { brands: -25 }, musician: { public: -40 } },
      r: { loyalPos: 'часть подписчиков верит в «систему» и покупает курс|some followers believe in the “system” and buy the course', loyalNeg: 'подписчики требуют вернуть деньги за курс, который не работает|followers demand refunds for a course that doesn’t work',
           brandsPos: 'партнёрские программы и инфобизнес-площадки предлагают проценты|affiliate programs and info-business platforms offer commissions', brandsNeg: 'нормальные бренды не хотят ассоциироваться с «гуру»|decent brands refuse to be associated with a “guru”',
           publicPos: 'громкие обещания разлетаются по ленте|the loud promises spread through feeds', publicNeg: 'разоблачители и СМИ разбирают курс и обещания дохода|debunkers and media dissect the course and its income promises' } },
  };
  const MOVE_KEYS = Object.keys(MOVES);

  const PLACES = {
    home:   { icon: '🏠', name: 'Дома|At home', mult: 1 },
    street: { icon: '🌆', name: 'На улице|Outdoors', mult: 1.2 },
    event:  { icon: '🎪', name: 'На мероприятии|At an event', mult: 1.4 },
  };
  const FORMATS = {
    video:   { icon: '🎥', n: 'Видео/влог|Video / vlog' },
    stories: { icon: '📸', n: 'Сторис|Stories' },
    post:    { icon: '🖼️', n: 'Пост/фото|Post / photo' },
    stream:  { icon: '🔴', n: 'Стрим|Stream' },
  };
  const pName = (k) => bi(PLACES[k].name);
  const fLabel = (k) => `${FORMATS[k].icon} ${bi(FORMATS[k].n)}`;
  const REQS = {
    home: {
      video:   ['Свет и аккуратный фон|Good light and a tidy background', 'Чистый звук без шума|Clean sound without noise', 'Заряженная камера|A charged camera'],
      stories: ['Хороший свет|Good light', 'Интересная идея кадра|An interesting shot idea', 'Заряженный телефон|A charged phone'],
      post:    ['Оформленный кадр и фон|A styled shot and background', 'Подпись и хэштеги|Caption and hashtags'],
      stream:  ['Стабильный интернет|Stable internet', 'Настроенные камера, микрофон и OBS|Camera, mic and OBS set up', 'Тишина — предупредить домашних|Quiet — warn the household'],
    },
    street: {
      video:   ['Выбрать локацию и проверить погоду|Pick a location and check the weather', 'Защита микрофона от ветра и шума|Wind and noise protection for the mic', 'Не снимать людей без согласия|Do not film people without consent'],
      stories: ['Живая локация и дневной свет|A lively location and daylight', 'Осторожность с прохожими в кадре|Care with passers-by in frame', 'Заряд и мобильный интернет|Battery and mobile data'],
      post:    ['Красивая локация и свет|A nice location and light', 'Не мешать прохожим|Do not obstruct passers-by'],
      stream:  ['Мобильный интернет и пауэрбанк|Mobile data and a power bank', 'IRL-экипировка (телефон, стабилизатор)|IRL gear (phone, gimbal)', 'Приватность: без лиц и номеров без согласия|Privacy: no faces or plates without consent', 'Безопасность места|Safety of the location'],
    },
    event: {
      video:   ['Разрешение организаторов на съёмку|Organizers’ permission to film', 'Шум вокруг — продумать звук|Noisy surroundings — plan the sound', 'Соблюдать правила мероприятия|Follow the event rules'],
      stories: ['Согласие организаторов|Organizers’ consent', 'Отметить мероприятие и участников|Tag the event and participants', 'Не мешать другим гостям|Do not disturb other guests'],
      post:    ['Согласие организаторов|Organizers’ consent', 'Отметки и хэштеги мероприятия|Event tags and hashtags'],
      stream:  ['Согласовать трансляцию с организаторами|Agree the broadcast with the organizers', 'Проверить связь в толпе|Check the connection in a crowd', 'Права на музыку и контент мероприятия|Rights to the event’s music and content', 'Модерация чата|Chat moderation'],
    },
  };
  const hasPlaces = (e) => e.career === 'blogger' || e.career === 'streamer';
  const reqsFor = (place, format) => ((REQS[place] && REQS[place][format]) || []).map((x) => bi(x));
  const rewardOf = (t) => { const m = (PLACES[t.place] && PLACES[t.place].mult) || 1; return { xp: Math.round((t.xp || 0) * m), fame: Math.round((t.fame || 0) * m) }; };
  const placeInfo = (t) => (t.place && PLACES[t.place] ? `; PLACE: ${bi(PLACES[t.place].name, 'en')}; format: ${t.format ? bi(FORMATS[t.format].n, 'en') : 'any'}; conditions: ${(REQS[t.place]?.[t.format] || []).map((x) => bi(x, 'en')).join(', ')}` : '');
  const pickRnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const rollPlace = () => { const r = Math.random(); return r < 0.4 ? 'home' : r < 0.8 ? 'street' : 'event'; };
  const STALK_P = { rare: 0.004, normal: 0.01, often: 0.025 };

  // Бренды (вымышленные), PR-посылки, зарплата
  const BRANDS = {
    beauty:  ['Lumea Beauty', 'GlowLab', 'Velvet Skin'],
    tech:    ['Voltix', 'Nexa Devices', 'PixelForge'],
    food:    ['FreshBox', 'Crunchy Bite', 'Green Spoon'],
    fashion: ['Urban Thread', 'Velvet Row', 'Northwind Wear'],
    gaming:  ['Arcadia Games', 'RiftPlay', 'Neon Arena'],
    fitness: ['FitPulse', 'IronLeaf', 'Aqua Motion'],
  };
  const SHADY = { casino: ['LuckySpin Casino', 'RoyalBet'], crypto: ['MoonCoin Pro', 'BlockRocket'], scam: ['QuickProfit Club', 'EasyWin Network'], guru: ['Millionaire Academy', 'Rich Mindset School'] };
  const ITEMS = {
    beauty:  ['набор косметики|a cosmetics set', 'парфюм|a perfume'], tech: ['наушники|headphones', 'умная колонка|a smart speaker'],
    food:    ['бокс снеков|a snack box', 'набор специй|a spice set'], fashion: ['худи из новой коллекции|a hoodie from the new collection', 'кроссовки|sneakers'],
    gaming:  ['игровая мышь|a gaming mouse', 'коллекционное издание игры|a collector’s edition of a game'], fitness: ['бутылка и эспандеры|a bottle and resistance bands', 'фитнес-браслет|a fitness band'],
  };
  const SALARY_BASE = [60, 140, 320, 700, 1500, 3200];
  const SALARY_LABEL = { blogger: 'доход с платформ и рекламы|platform & ad income', streamer: 'доход со стримов (подписки, донаты)|stream income (subs, donations)', actor: 'гонорар|acting fee', musician: 'роялти и выступления|royalties and gigs', athlete: 'контракт и призовые|contract and prize money' };
  const OFFER_P = { rare: 0.01, normal: 0.03, often: 0.07 };
  const money = (n) => `${Math.round(n).toLocaleString(LANG() === 'en' ? 'en-US' : 'ru-RU')} ${S().currency}`;

  const xpNeeded = (lvl) => Math.round(100 * Math.pow(lvl, 1.4));
  const fameRow = (f) => [...FAME_TIERS].reverse().find(([min]) => f >= min);
  const fameTier = (f, l) => bi(fameRow(f)[2], l);
  const fameIcon = (f) => fameRow(f)[1];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function chatState() {
    const md = ctx().chatMetadata;
    if (!md[MODULE]) md[MODULE] = { entities: {} };
    return md[MODULE];
  }
  const saveChat = () => ctx().saveMetadata();
  function names() {
    const c = ctx(); const list = [];
    if (c.name1) list.push(c.name1);
    if (c.name2 && c.name2 !== c.name1) list.push(c.name2);
    return list;
  }

  const END_STEP = () => tr('Завершить задание: закончить дело и покинуть место действия', 'Finish the task: wrap up and leave the place');
  const progressOf = (t) => (t.done ? 100 : Math.min(99, Math.round((t.steps.filter((x) => x.done).length / (t.steps.length || 1)) * 100)));
  function normTask(t) {
    if (!Array.isArray(t.steps)) t.steps = [];
    t.steps = t.steps.map((x) => (typeof x === 'string' ? { text: x, done: false } : { text: String(x?.text ?? ''), done: !!x?.done })).filter((x) => x.text);
    if (!t.steps.length) {
      t.steps = [{ text: tr(`Выполнить: ${t.title}`, `Do: ${t.title}`), done: false }, { text: END_STEP(), done: false }];
      if (t.place && PLACES[t.place]) t.steps.unshift({ text: tr(`Подготовиться (${pName(t.place).toLowerCase()}): техника, условия, место`, `Prepare (${pName(t.place).toLowerCase()}): gear, conditions, place`), done: false });
    }
    if (t.place && PLACES[t.place] && !Array.isArray(t.reqs)) t.reqs = reqsFor(t.place, t.format);
    t.progress = progressOf(t);
    return t;
  }
  const stepsLine = (t) => t.steps.map((x) => `${x.done ? '☑' : '☐'} ${x.text}`).join(' → ');

  function ent(name) {
    const st = chatState();
    if (!st.entities[name]) st.entities[name] = { career: null, level: 1, xp: 0, fame: 0, cancel: null, tasks: [], log: [] };
    const e = st.entities[name];
    if (e.career && !CAREERS[e.career]) { e.career = null; e.level = 1; e.xp = 0; }
    if (!e.audience) e.audience = { loyal: 50, brands: 50, public: 50 };
    const defs = { heat: 0, moves: [], reaction: null, live: null, contentAt: {}, progress: {}, haters: 0, privacy: 30, doxxLeft: 0, stalker: null, stalkerHidden: false, stalkerCool: 0, tags: {}, money: 0, tickCount: 0, offers: [], parcels: [], wallet: [], notices: [] };
    for (const [k, v] of Object.entries(defs)) if (e[k] === undefined) e[k] = typeof v === 'object' && v ? JSON.parse(JSON.stringify(v)) : v;
    if (!e.stats) e.stats = { stream: 0, stories: 0, video: 0, post: 0 };
    e.tasks.forEach(normTask);
    return e;
  }
  const careerOf = (e) => (e.career && CAREERS[e.career]) || null;
  const careerName = (k) => bi(CAREERS[k].name);
  const ladderOf = (k) => CAREERS[k].ladder.map((x) => bi(x));
  const maxLevel = (e) => (careerOf(e) ? 6 : 1);
  const titleOf = (e) => (careerOf(e) ? ladderOf(e.career)[clamp(e.level, 1, 6) - 1] : tr('Без карьеры', 'No career'));
  const iconOf = (e) => (careerOf(e) ? careerOf(e).icon : '💼');
  const addLog = (e, text) => { e.log.unshift(text); e.log = e.log.slice(0, 40); };
  const lvlOf = (e, k) => (e.career === k ? e.level : (e.progress[k] && e.progress[k].level) || 0);

  /* =====================  ЛОГИКА  ===================== */
  function switchCareer(name, e, k) {
    if (!CAREERS[k] || e.career === k) return;
    if (e.career) e.progress[e.career] = { level: e.level, xp: e.xp };   // прогресс прежней профессии сохраняется
    e.career = k;
    const p = e.progress[k] || { level: 1, xp: 0 };
    e.level = p.level; e.xp = p.xp;
    addLog(e, tr(`${CAREERS[k].icon} Профессия: ${careerName(k)} (ур. ${e.level}). Остальные карьеры и аудитория сохранены`, `${CAREERS[k].icon} Career: ${careerName(k)} (lvl ${e.level}). Other careers and audience are kept`));
  }
  function gainXp(name, e, amount) {
    if (!e.career) return;
    if (e.cancel && amount > 0) amount = Math.floor(amount / 2);
    e.xp += amount;
    while (e.level < maxLevel(e) && e.xp >= xpNeeded(e.level)) {
      e.xp -= xpNeeded(e.level); e.level++;
      addLog(e, tr(`⬆️ Уровень ${e.level}: ${titleOf(e)}`, `⬆️ Level ${e.level}: ${titleOf(e)}`));
      toastr.success(`${iconOf(e)} ${name}: ${titleOf(e)} (${tr('ур.', 'lvl')} ${e.level})`, 'Career & Fame');
    }
    while (e.xp < 0) {
      if (e.level > 1) { e.level--; e.xp += xpNeeded(e.level); addLog(e, tr(`⬇️ Понижение до уровня ${e.level}`, `⬇️ Demoted to level ${e.level}`)); toastr.warning(tr(`${name} понижен(а): ${titleOf(e)}`, `${name} demoted: ${titleOf(e)}`), 'Career & Fame'); }
      else e.xp = 0;
    }
    if (e.level >= maxLevel(e)) e.xp = Math.min(e.xp, xpNeeded(e.level) - 1);
  }
  function gainFame(e, amount) {
    if (e.cancel && amount > 0) amount = 0;
    if (e.audience && e.audience.loyal < 20 && amount > 0) amount = Math.floor(amount / 2);
    e.fame = clamp(e.fame + amount, 0, 1000);
  }
  const addHate = (e, n) => { if (S().haters) e.haters = clamp(e.haters + n, 0, 100); };
  const doxxChance = (e) => clamp(Math.round(e.haters * 0.45 + (e.fame / 1000) * 25 + (e.cancel ? 15 : 0) + (e.stalker ? e.stalker.level * 0.15 : 0) - e.privacy * 0.25), 0, 95);
  const stalkerVisible = (e) => S().stalkers && S().stalkerPlate && e.stalker && !e.stalkerHidden;

  function applyCancel(name, e, severity, reason) {
    const sev = clamp(parseInt(severity) || 1, 1, 3); const cfg = CANCEL[sev];
    e.cancel = { severity: sev, reason: reason || tr('неизвестно', 'unknown'), left: cfg.turns };
    e.fame = clamp(e.fame + cfg.fame, 0, 1000);
    addHate(e, sev * 15);
    if (sev === 3 && e.level > 1) gainXp(name, e, -Math.round(xpNeeded(e.level - 1) * 0.5));
    if (!e.tasks.some((t) => t.type === 'apology' && !t.done)) {
      e.tasks.push({ id: uid(), type: 'apology', src: 'system', title: tr('Публичные извинения', 'Public apology'), desc: tr('Загладить вину перед публикой', 'Make amends to the public'),
        steps: [tr('Признать ошибку', 'Admit the mistake'), tr('Публично извиниться', 'Apologize publicly'), tr('Показать, что выводы сделаны', 'Show that lessons were learned')], xp: 20 * sev, fame: 0, done: false, active: true, progress: 0 });
    }
    addLog(e, `${cfg.icon} ${bi(cfg.label)} (${tr('ст.', 'lvl')} ${sev}): ${e.cancel.reason}`);
    toastr.error(`${cfg.icon} ${name}: ${bi(cfg.label)} — ${e.cancel.reason}`, 'Career & Fame');
  }
  function liftCancel(name, e, why) {
    if (!e.cancel) return;
    e.cancel = null; e.fame = clamp(e.fame + 20, 0, 1000);
    addLog(e, tr(`✅ Отмена снята ${why || ''}`, `✅ Cancellation lifted ${why || ''}`));
    toastr.info(tr(`${name}: отмена снята`, `${name}: cancellation lifted`), 'Career & Fame');
  }

  /* ---- Хейтеры, доксинг, сталкеры ---- */
  function addSafetyTask(e, type) {
    if (e.tasks.some((t) => t.type === type && !t.done)) return;
    const defs = {
      safety:  { title: tr('Защита после утечки данных', 'Protect yourself after the data leak'), desc: tr('Ограничить ущерб и вернуть контроль над личной информацией', 'Limit the damage and regain control of your personal information'),
        steps: [tr('Сообщить платформам и в поддержку', 'Report to the platforms and support'), tr('Сменить доступы, скрыть личные данные', 'Change access, hide personal data'), tr('При угрозах обратиться в полицию или к юристу', 'If threatened, contact the police or a lawyer')], xp: 30 },
      stalker: { title: tr('Разобраться со сталкером', 'Deal with the stalker'), desc: tr('Обезопасить себя и прекратить навязчивое внимание', 'Make yourself safe and stop the obsessive attention'),
        steps: [tr('Заблокировать и пожаловаться', 'Block and report'), tr('Усилить безопасность: охрана, не раскрывать геолокацию', 'Tighten security: guards, no live location'), tr('При угрозах обратиться в полицию', 'If threatened, contact the police')], xp: 30 },
    }[type];
    e.tasks.push({ id: uid(), type, src: 'system', title: defs.title, desc: defs.desc, steps: defs.steps, xp: defs.xp, fame: 0, done: false, active: false, progress: 0 });
  }
  function startDoxx(name, e) {
    if (!S().doxx || e.doxxLeft > 0) return;
    e.doxxLeft = 12; e.privacy = clamp(e.privacy - 10, 0, 100);
    e.audience.public = clamp(e.audience.public - 5, 0, 100); e.audience.loyal = clamp(e.audience.loyal + 3, 0, 100);
    addHate(e, 5);
    addSafetyTask(e, 'safety');
    e.reaction = { type: 'doxx', text: tr('Личные данные утекли в сеть: фанаты возмущены, платформы получают жалобы, герою нужно срочно защищаться', 'Personal data leaked online: fans are outraged, platforms receive reports, the hero must protect themselves fast'), left: 6 };
    addLog(e, tr('🕵️ Доксинг: личные данные утекли в сеть', '🕵️ Doxxing: personal data leaked online'));
    toastr.error(tr(`🕵️ ${name}: личные данные утекли в сеть!`, `🕵️ ${name}: personal data leaked online!`), 'Career & Fame');
  }
  function spawnStalker(name, e) {
    e.stalker = { level: 15 }; e.stalkerHidden = false;
    addSafetyTask(e, 'stalker');
    addLog(e, tr('👁️ Появился навязчивый поклонник (сталкер)', '👁️ An obsessive fan (stalker) appeared'));
    if (stalkerVisible(e)) toastr.warning(tr(`👁️ ${name}: замечены признаки слежки`, `👁️ ${name}: signs of being followed`), 'Career & Fame');
  }

  function acceptTask(name, e, id) {
    const t = e.tasks.find((x) => x.id === id && !x.done);
    if (!t) return false;
    t.active = true; t.progress = t.progress || 0;
    addLog(e, tr(`▶️ Взято задание: ${t.title}`, `▶️ Task taken: ${t.title}`));
    toastr.info(tr(`${name}: взято «${t.title}». Выполняйте его в ролевой!`, `${name}: “${t.title}” taken. Play it out in the roleplay!`), 'Career & Fame');
    return true;
  }
  function dropTask(name, e, id) {
    const t = e.tasks.find((x) => x.id === id && !x.done);
    if (!t) return;
    t.active = false; t.progress = 0;
    addLog(e, tr(`⏸ Отказ от задания: ${t.title}`, `⏸ Task dropped: ${t.title}`));
  }
  function completeTask(name, e, id) {
    const t = e.tasks.find((x) => x.id === id && !x.done);
    if (!t) return;
    t.done = true; t.active = false; t.progress = 100;
    const rw = rewardOf(t);
    gainXp(name, e, rw.xp); gainFame(e, rw.fame);
    addLog(e, tr(`🏆 Задание выполнено: ${t.title} (+${rw.xp} XP, +${rw.fame} славы)`, `🏆 Task done: ${t.title} (+${rw.xp} XP, +${rw.fame} fame)`));
    toastr.success(tr(`🏆 ${name}: «${t.title}» выполнено! +${rw.xp} XP`, `🏆 ${name}: “${t.title}” done! +${rw.xp} XP`), 'Career & Fame');
    if (t.type === 'apology') liftCancel(name, e, tr('(извинения приняты)', '(apology accepted)'));
    if (t.type === 'deal') {
      if (t.pay) deposit(name, e, t.pay, tr(`Реклама: ${t.title}`, `Ad payment: ${t.title}`), 'deal');
      bridgeEmit('deal', { who: name, title: t.title, pay: t.pay || 0, text: tr(`🤝 Сделка выполнена: ${t.title}`, `🤝 Deal completed: ${t.title}`) });
      if (!t.shady) e.audience.brands = clamp(e.audience.brands + 3, 0, 100);
      if (t.shady && MOVES[t.shady]) applyMove(name, e, t.shady, t.title);
    }
    if (t.type === 'safety') { e.privacy = clamp(e.privacy + 25, 0, 100); e.haters = clamp(e.haters - 15, 0, 100); e.doxxLeft = 0; }
    if (t.type === 'stalker') { e.stalker = null; e.stalkerCool = 60; addLog(e, tr('🛡️ Сталкер больше не беспокоит', '🛡️ The stalker no longer bothers you')); }
  }

  /* ---- Самостоятельный контент ---- */
  function computeViewers(e, place) {
    const v = (15 + e.fame * 0.6) * PLACES[place].mult * (0.7 + Math.random() * 0.6) * (e.audience.loyal / 50) * (e.cancel ? 0.5 : 1);
    return Math.max(3, Math.round(v));
  }
  function contentReward(e, format, place, q, ticks) {
    const base = format === 'stream' ? { xp: 6 + Math.min(ticks, 10) * 3, fame: 6 + Math.min(ticks, 10) * 3 } : format === 'video' ? { xp: 12, fame: 12 } : { xp: 6, fame: 6 };
    const qm = [0.5, 0.75, 1, 1.25, 1.5][clamp(q, 1, 5) - 1];
    const career = hasPlaces(e) ? 1 : 0.6;
    const lvl = 1 / (1 + (e.level - 1) * 0.1);
    const fm = 1 / (1 + e.fame / 800);
    return { xp: Math.round(base.xp * PLACES[place].mult * qm * career * lvl), fame: Math.round(base.fame * PLACES[place].mult * qm * career * fm) };
  }
  function finishContent(name, e, format, place, q, ticks, note, viewers) {
    const rw = contentReward(e, format, place, q, ticks);
    gainXp(name, e, rw.xp); gainFame(e, rw.fame);
    e.stats[format] = (e.stats[format] || 0) + 1;
    e.audience.loyal = clamp(e.audience.loyal + (q >= 4 ? 2 : q <= 1 ? -3 : 0), 0, 100);
    if (format === 'stream' && place === 'street' && e.stalker) e.stalker.level = Math.min(100, e.stalker.level + 5);
    addLog(e, `${fLabel(format)} (${PLACES[place].icon} ${pName(place).toLowerCase()})${note ? `: ${note}` : ''} — ${viewers ? `~${viewers} ${tr('зрителей', 'viewers')}, ` : ''}+${rw.xp} XP, +${rw.fame} ${tr('славы', 'fame')}`);
    toastr.success(`${fLabel(format)} — ${name}: +${rw.xp} XP, +${rw.fame} ⭐`, 'Career & Fame');
  }
  function startLive(name, e, place, note) {
    e.live = { place, ticks: 0, viewers: computeViewers(e, place), note: note || '' };
    addLog(e, tr(`🔴 В эфире (${PLACES[place].icon} ${pName(place).toLowerCase()}), ~${e.live.viewers} зрителей${note ? `: ${note}` : ''}`, `🔴 Live (${PLACES[place].icon} ${pName(place).toLowerCase()}), ~${e.live.viewers} viewers${note ? `: ${note}` : ''}`));
    toastr.info(tr(`🔴 ${name} начал(а) стрим`, `🔴 ${name} went live`), 'Career & Fame');
  }
  function endLive(name, e, q, auto) {
    const l = e.live; if (!l) return;
    e.live = null;
    finishContent(name, e, 'stream', l.place, q || 3, l.ticks, l.note, l.viewers);
    if (auto) addLog(e, tr('⏹ Стрим завершён автоматически (слишком долго без обновлений)', '⏹ Stream ended automatically (too long without updates)'));
  }
  function applyContent(name, e, ct) {
    const format = ct && ct.format;
    if (!FORMATS[format] || !e.career) return;
    const place = PLACES[ct.place] ? ct.place : 'home';
    const q = clamp(parseInt(ct.quality) || 3, 1, 5);
    const act = ct.action || 'single';
    if (format === 'stream') {
      if (act === 'start') { if (!e.live) startLive(name, e, place, ct.note); return; }
      if (act === 'end') { if (e.live) endLive(name, e, q); else finishContent(name, e, 'stream', place, q, 2, ct.note); return; }
      if (!e.live) finishContent(name, e, 'stream', place, q, 2, ct.note);
      return;
    }
    const at = ctx().chat?.length || 0;
    if (!ct.force && at - (e.contentAt[format] ?? -99) < 4) return;
    e.contentAt[format] = at;
    finishContent(name, e, format, place, q, 0, ct.note);
  }

  /* ---- Спорные ходы ---- */
  function buildReaction(m, d) {
    const parts = [];
    for (const [k, [ic, lb]] of Object.entries(SEG)) {
      const pos = bi(m.r[k + 'Pos']), neg = bi(m.r[k + 'Neg']), v = d[k];
      if (v >= 8) parts.push(`${ic} ${bi(lb)}: ${pos}`);
      else if (v <= -8) parts.push(`${ic} ${bi(lb)}: ${neg}`);
      else parts.push(`${ic} ${bi(lb)}: ${tr('мнения разделились — ', 'opinions are split — ')}${pos}${tr('; но ', '; but ')}${neg}`);
    }
    return parts.join(' | ');
  }
  const effOf = (e, type) => ({ ...MOVES[type].base, ...(MOVES[type].career[e.career] || {}) });
  // шанс отмены: ручная правка из настроек имеет приоритет над автоматическим расчётом
  const chanceOverride = (type) => { const v = S().cancelChance[type]; return typeof v === 'number' && !isNaN(v) ? clamp(v, 0, 100) / 100 : null; };
  const chanceOf = (e, type) => { const o = chanceOverride(type); return o !== null ? o : effOf(e, type).p; };

  function applyMove(name, e, type, note) {
    const m = MOVES[type];
    if (!m || !e.career) return;
    const s = S(); const eff = effOf(e, type);
    const mult = 0.7 + Math.random() * 0.6;
    const blast = 1 + e.fame / 1000;
    const d = {};
    for (const k of ['loyal', 'brands', 'public']) { d[k] = Math.round(eff[k] * mult * blast); e.audience[k] = clamp(e.audience[k] + d[k], 0, 100); }
    const fameGain = Math.round(eff.fame * mult * blast);
    gainFame(e, fameGain);
    e.heat = clamp(e.heat + eff.heat, 0, 100);
    addHate(e, Math.round((m.hate || 10) * mult));
    e.reaction = { type, text: buildReaction(m, d), left: 6 };
    e.moves.unshift({ type, note: note || '', at: ctx().chat?.length || 0 }); e.moves = e.moves.slice(0, 8);
    const sg = (n) => (n >= 0 ? '+' : '') + n;
    addLog(e, `${m.icon} ${bi(m.name)}${note ? ` (${note})` : ''}: ${tr('слава', 'fame')} ${sg(fameGain)}; 👥${sg(d.loyal)} 💼${sg(d.brands)} 📰${sg(d.public)}`);
    addLog(e, `📣 ${e.reaction.text}`);
    toastr.info(`${m.icon} ${name}: ${tr('реакция аудитории', 'audience reaction')} — ${e.reaction.text}`, 'Career & Fame', { timeOut: 9000 });
    // ярлык «куколд» при уходе на платформу 18+
    if (type === 'adult' && s.cuckTag) {
      const others = names().filter((n) => n !== name);
      const target = s.cuckTarget === 'partner' && others.length ? others[0] : name;
      const te = ent(target);
      if (!te.tags.cuck) {
        te.tags.cuck = { from: name };
        addLog(te, tr(`🏷️ Ярлык «куколд»${target !== name ? ` (из-за ухода ${name})` : ''}: мемы и подколки в сети`, `🏷️ “Cuck” label${target !== name ? ` (because ${name} went 18+)` : ''}: memes and jokes online`));
        toastr.info(tr(`🏷️ ${target}: ярлык «куколд»`, `🏷️ ${target}: “cuck” label`), 'Career & Fame');
      }
    }
    const ov = chanceOverride(type);
    const p = ov !== null ? ov : clamp(eff.p + (e.audience.loyal < 30 ? 0.15 : 0) + (e.heat >= 60 ? 0.15 : 0), 0, 0.95);
    if (!e.cancel && Math.random() < p) applyCancel(name, e, eff.sev, bi(m.name));
  }

  /* ---- Деньги, бренды, PR-посылки и мост к Phone-ST ---- */
  const bridgeLog = [], bridgeListeners = [];
  /* ---- Phone-ST (glassphone): доставка через скрытые теги в чате ----
     Телефон читает СМС из тегов <!--tel:sms:{...}--> в сообщениях чата, а баланс банка — из тегов tel:bank. */
  const PS = { base: null, mods: {}, errors: {}, last: '', bank: null, queue: Promise.resolve() };
  const importer = (u) => (globalThis.__CF_IMPORT__ ? globalThis.__CF_IMPORT__(u) : import(u));
  async function findPhoneBase() {
    if (PS.base) return PS.base;
    try {
      const hit = Array.from(document.querySelectorAll('script[src]')).map((x) => x.src).find((u) => /third-party\/[^/]*phone[^/]*\/index\.js/i.test(u) && !/career/i.test(u));
      if (hit) return (PS.base = hit.slice(0, hit.lastIndexOf('/') + 1));
    } catch (_) { /* ignore */ }
    try {
      const r = await fetch('/api/extensions/discover', { headers: (ctx().getRequestHeaders && ctx().getRequestHeaders()) || {} });
      if (r.ok) { const x = (await r.json()).find((i) => /phone/i.test(i.name) && !/career/i.test(i.name)); if (x) return (PS.base = `${location.origin}/scripts/extensions/${String(x.name).replace(/^\//, '')}/`); }
    } catch (_) { /* ignore */ }
    return null;
  }
  async function loadPhoneMods() {
    const base = await findPhoneBase(); if (!base) return null;
    for (const f of ['state', 'bank', 'ui']) {   // модули, которые Phone-ST уже загрузил сам (повторный импорт даёт тот же экземпляр)
      if (PS.mods[f] !== undefined) continue;
      try { PS.mods[f] = await importer(base + f + '.js'); } catch (err) { PS.mods[f] = null; PS.errors[f] = String(err.message || err).slice(0, 100); }
    }
    return PS.mods;
  }
  const phoneInstalled = () => !!(ctx().extensionSettings && ctx().extensionSettings.glassphone);
  const phoneEnabled = () => phoneInstalled() && ctx().extensionSettings.glassphone.isEnabled !== false;
  function numberFor(name) {
    let h = 7; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const dg = String(h).padStart(9, '0').slice(-9);
    return `+7 9${dg.slice(0, 2)} ${dg.slice(2, 5)}-${dg.slice(5, 7)}-${dg.slice(7, 9)}`;
  }
  const safeTxt = (t) => String(t).replace(/-->/g, '—>').replace(/<!--/g, '');
  const smsTag = (from, text, extra) => `<!--tel:sms:${JSON.stringify({ from, to: ctx().name1, text: safeTxt(text), number: numberFor(from), ...(extra || {}) })}-->`;

  // Формат тега tel:bank берём у самого Phone-ST: bankInjectRule() содержит пример тега для модели
  function parseBankRule(rule) {
    const m = String(rule || '').match(/<!--\s*tel:bank:(\{[\s\S]*?\})\s*-->/);
    if (!m) return null;
    let ex; try { ex = JSON.parse(m[1]); } catch (_) { return { ok: false, raw: m[1], reason: 'example is not valid JSON' }; }
    const keys = Object.keys(ex);
    const aKey = keys.find((k) => /^(amount|sum|value|total)$/i.test(k)) || keys.find((k) => typeof ex[k] === 'number');
    if (!aKey) return { ok: false, raw: m[1], reason: 'amount key not found' };
    const tKey = keys.find((k) => /^(type|kind|dir|direction|op)$/i.test(k) && typeof ex[k] === 'string');
    const mKey = keys.find((k) => k !== aKey && k !== tKey && typeof ex[k] === 'string' && /title|desc|memo|note|text|merchant|name|label|purpose|comment|reason|what|source|from/i.test(k));
    const signed = typeof ex[aKey] === 'number' && ex[aKey] < 0;
    const INCOME = /^(in|income|incoming|deposit|credit|receive|received|plus|доход|приход|пополнение)$/i;
    let inVal = null;
    if (tKey) {
      const q = String(rule).match(new RegExp('"' + tKey + '"\\s*:\\s*"([^"]*)"'));
      inVal = [ex[tKey], ...(q ? q[1].split(/[|/,]/).map((x) => x.trim()) : [])].find((v) => INCOME.test(v))
        || ([...String(rule).matchAll(/["«'](income|incoming|in|deposit|credit|доход|приход|пополнение)["»']/gi)][0] || [])[1] || null;
      if (!inVal) return { ok: false, raw: m[1], reason: 'income value of the type field is unknown' };
    } else if (!signed) return { ok: false, raw: m[1], reason: 'direction of the amount is unclear' };
    return { ok: true, raw: m[1], build: (amount, memo) => {
      if (tKey && amount < 0) return null;       // списания не пишем, пока не знаем их значение type
      const o = { [aKey]: tKey ? Math.abs(amount) : amount };
      if (tKey) o[tKey] = inVal;
      if (mKey) o[mKey] = safeTxt(memo);
      return `<!--tel:bank:${JSON.stringify(o)}-->`;
    } };
  }
  async function learnBankTag() {
    const mods = await loadPhoneMods();
    const fn = mods && mods.bank && mods.bank.bankInjectRule;
    let rule = ''; try { rule = typeof fn === 'function' ? String(fn() || '') : ''; } catch (_) { /* ignore */ }
    const parsed = parseBankRule(rule);
    PS.bank = { rule, parsed };
    return parsed && parsed.ok ? parsed : null;
  }
  async function pushPhoneMessage(mes) {
    const c = ctx(); if (!Array.isArray(c.chat)) return false;
    const msg = { name: 'GlassPhone', is_user: false, is_system: true, send_date: new Date().toISOString(), mes, extra: { type: 'comment', model: 'GlassPhone' } };
    c.chat.push(msg);
    try { if (typeof c.addOneMessage === 'function') c.addOneMessage(msg); } catch (_) { /* ignore */ }
    try { const sv = c.saveChat || c.saveChatConditional; if (typeof sv === 'function') await sv.call(c); } catch (_) { /* ignore */ }
    return true;
  }
  async function phoneRefresh() {
    try {
      const m = await loadPhoneMods();
      if (m && m.state && m.state.invalidateChatCache) m.state.invalidateChatCache();
      if (m && m.ui) { if (m.ui.checkNewIncoming) m.ui.checkNewIncoming(); if (m.ui.updateFabBadge) m.ui.updateFabBadge(); if (m.ui.isPhoneOpen && m.ui.isPhoneOpen() && m.ui.render) m.ui.render(); }
    } catch (err) { console.warn('[Career&Fame] Phone-ST refresh:', err); }
  }
  async function phoneDeliver(type, d) {
    const s = S();
    if (!s.phoneSms || !d.who || d.who !== ctx().name1) return;               // телефон принадлежит {{user}}
    if (!phoneEnabled()) { PS.last = tr('⚠️ Phone-ST не найден или выключен — СМС не отправлены', '⚠️ Phone-ST not found or disabled — no SMS sent'); return; }
    const tags = []; let bankNote = '';
    if (type === 'money') {
      const sg = `${d.amount > 0 ? '+' : ''}${money(d.amount)}`;
      tags.push(smsTag(tr('Банк', 'Bank'), `💰 ${d.amount > 0 ? tr('Зачислено', 'Credited') : tr('Списано', 'Debited')} ${sg} — ${d.memo}. ${tr('Баланс', 'Balance')}: ${money(d.balance)}`));
      if (s.phoneBank) {
        const b = await learnBankTag();
        const t = b && b.build(d.amount, d.memo);
        if (t) { tags.push(t); bankNote = tr(' + запись в банк', ' + bank entry'); }
        else bankNote = tr(' (формат банка не распознан — баланс Phone-ST не менялся)', ' (bank format not recognized — the Phone-ST balance was not changed)');
      }
    } else if (type === 'offer') {
      tags.push(smsTag(d.brand, d.kind === 'pr'
        ? tr(`Здравствуйте! Это PR-отдел ${d.brand}. Можно отправить вам посылку (${d.item}) в подарок? Будем рады обзору.`, `Hello! This is the ${d.brand} PR team. May we send you a package (${d.item}) as a gift? We would love a review.`)
        : tr(`Здравствуйте! Это ${d.brand}. Хотим предложить рекламу (${d.format}) — оплата ${money(d.pay)}. Сможем договориться?${d.shady ? ' Решение нужно быстро, условия выгодные.' : ''}`, `Hi! This is ${d.brand}. We would like to offer an ad deal (${d.format}) — pay ${money(d.pay)}. Can we work together?${d.shady ? ' We need an answer fast; the terms are great.' : ''}`)));
    } else if (type === 'offer_accepted') {
      tags.push(smsTag(d.brand, d.kind === 'pr' ? tr('Спасибо! Отправляем посылку, ждите курьера.', 'Thank you! We are shipping the package, expect the courier.') : tr('Отлично, договорились! Бриф отправим следом.', 'Great, we have a deal! The brief will follow.')));
    } else if (type === 'parcel') {
      tags.push(smsTag(d.brand, tr(`📦 Ваша посылка доставлена (${d.item}). Будем рады обзору!`, `📦 Your package was delivered (${d.item}). We would love a review!`)));
    } else if (type === 'deal') {
      tags.push(smsTag(d.brand || tr('Бренд', 'Brand'), tr(`Спасибо за публикацию! Оплата ${money(d.pay)} отправлена.`, `Thanks for the post! Payment of ${money(d.pay)} has been sent.`)));
    } else return;
    await pushPhoneMessage(tags.join('\n'));
    await phoneRefresh();
    PS.last = tr(`✅ Отправлено в Phone-ST: ${type}${bankNote}`, `✅ Sent to Phone-ST: ${type}${bankNote}`);
  }
  function showBanner(d) {
    try {
      let box = document.getElementById('cf_banners');
      if (!box) { box = document.createElement('div'); box.id = 'cf_banners'; document.body.appendChild(box); }
      const el = document.createElement('div'); el.className = 'cf-banner'; el.textContent = d.text; box.appendChild(el);
      setTimeout(() => el.remove(), 6500);
    } catch (_) { /* ignore */ }
  }
  async function diagnoseFull() {
    const out = [diagnose()];
    try {
      const mods = await loadPhoneMods();
      out.push(`Phone-ST: base=${PS.base || 'NOT FOUND'}; installed=${phoneInstalled()}; enabled=${phoneEnabled()}`);
      for (const [f, m] of Object.entries(mods || {})) out.push(m ? `-- ${f}.js loaded: ${Object.keys(m).slice(0, 40).join(', ')}` : `-- ${f}.js not loaded (${PS.errors[f] || ''})`);
      const b = await learnBankTag();
      const rule = (PS.bank && PS.bank.rule) || '';
      const i = rule.search(/tel:bank/i);
      out.push('bankInjectRule: ' + (rule ? rule.slice(Math.max(0, i - 80), Math.max(0, i - 80) + 700).replace(/\s+/g, ' ') : '(empty or unavailable)'));
      out.push('bank tag format: ' + (b ? `recognized, example ${PS.bank.parsed.raw}` : `NOT recognized${PS.bank && PS.bank.parsed ? ' — ' + PS.bank.parsed.reason + ': ' + PS.bank.parsed.raw : ''}`));
      out.push('last delivery: ' + (PS.last || '-'));
    } catch (err) { out.push('error: ' + err.message); }
    return out.join('\n').slice(0, 9000);
  }

  function bridgeEmit(type, detail) {
    const s = S(); const d = { type, ts: Date.now(), ...detail };
    bridgeLog.unshift(d); if (bridgeLog.length > 30) bridgeLog.length = 30;
    if (d.who && s.bridgePrompt) { const e = ent(d.who); e.notices.unshift({ text: d.text || type, left: 5 }); e.notices = e.notices.slice(0, 5); }
    if (s.banners && d.text && ['money', 'offer', 'offer_accepted', 'parcel', 'deal'].includes(type)) showBanner(d);
    if (['money', 'offer', 'offer_accepted', 'parcel', 'deal'].includes(type)) {
      PS.queue = PS.queue.then(() => phoneDeliver(type, d)).catch((err) => { PS.last = '⚠️ ' + err.message; console.warn('[Career&Fame] Phone-ST:', err); });
    }
    if (!s.bridgeEvents) return;
    try { if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') window.dispatchEvent(new CustomEvent('career-fame:' + type, { detail: d })); } catch (_) { /* ignore */ }
    try { ctx().eventSource.emit('career_fame_' + type, d); } catch (_) { /* ignore */ }
    for (const cb of bridgeListeners) { try { cb(d); } catch (err) { console.warn('[Career&Fame] bridge listener', err); } }
    try { const h = window.CareerFameBridge; if (h && typeof h.onEvent === 'function') h.onEvent(d); } catch (_) { /* ignore */ }
  }
  function deposit(name, e, amount, memo, kind) {
    amount = Math.round(amount); if (!amount) return;
    e.money += amount;
    e.wallet.unshift({ kind: kind || (amount > 0 ? 'income' : 'expense'), amount, memo: memo || '', at: ctx().chat?.length || 0 }); e.wallet = e.wallet.slice(0, 40);
    const sg = `${amount > 0 ? '+' : ''}${money(amount)}`;
    addLog(e, `💰 ${sg} — ${memo || ''}`);
    toastr.success(`💰 ${name}: ${sg} (${memo || ''})`, 'Career & Fame');
    bridgeEmit('money', { who: name, amount, balance: e.money, memo: memo || '', currency: S().currency, text: tr(`💰 Банк: ${sg} — ${memo || ''}`, `💰 Bank: ${sg} — ${memo || ''}`) });
  }
  function paySalary(name, e) {
    if (!e.career) return;
    const amount = Math.round(SALARY_BASE[clamp(e.level, 1, 6) - 1] * (1 + e.fame / 1500) * (e.cancel ? 0.4 : 1) * (0.9 + Math.random() * 0.2));
    deposit(name, e, amount, bi(SALARY_LABEL[e.career]), 'salary');
  }
  const offersLine = (e) => e.offers.filter((o) => o.status === 'new').map((o) => `[${o.id}] ${o.brand} (${o.kind === 'pr' ? 'PR package' : `ad ${bi(FORMATS[o.format].n, 'en')}, pay ${o.pay}`}${o.shady ? ', SHADY' : ''})`).join('; ') || 'none';
  function genOffer(name, e) {
    const shady = Math.random() < 0.12 + (e.audience.brands < 35 ? 0.25 : 0) + (e.cancel ? 0.2 : 0) ? pickRnd(Object.keys(SHADY)) : null;
    const cat = shady || pickRnd(Object.keys(BRANDS));
    const brand = shady ? pickRnd(SHADY[shady]) : pickRnd(BRANDS[cat]);
    const kind = !shady && Math.random() < 0.45 ? 'pr' : 'ad';
    const format = pickRnd(Object.keys(FORMATS));
    const lvl = 1 + (e.level - 1) * 0.6;
    const o = { id: uid(), brand, cat, kind, shady, format, place: kind === 'ad' && hasPlaces(e) ? pickRnd(Object.keys(PLACES)) : undefined,
      pay: kind === 'pr' ? 0 : Math.round((80 + Math.random() * 170) * lvl * (1 + e.fame / 300) * (shady ? 2.5 : 1)), item: shady ? null : pickRnd(ITEMS[cat]), left: 25, status: 'new' };
    e.offers.unshift(o); e.offers = e.offers.slice(0, 14);
    const txt = kind === 'pr'
      ? tr(`📦 ${brand} просит разрешения отправить вам PR-посылку (${bi(o.item)})`, `📦 ${brand} asks to send you a PR package (${bi(o.item)})`)
      : tr(`🤝 ${brand} предлагает рекламу: ${fLabel(format)}, оплата ${money(o.pay)}`, `🤝 ${brand} offers an ad deal: ${fLabel(format)}, pay ${money(o.pay)}`);
    addLog(e, txt); toastr.info(`${name}: ${txt}`, 'Career & Fame');
    bridgeEmit('offer', { who: name, offerId: o.id, brand, kind, pay: o.pay, shady, format: fLabel(format), item: o.item ? bi(o.item) : '', text: txt });
  }
  function acceptOffer(name, e, id) {
    const o = e.offers.find((x) => x.id === id && x.status === 'new'); if (!o) return false;
    o.status = 'accepted';
    if (o.kind === 'pr') {
      e.parcels.unshift({ id: uid(), brand: o.brand, cat: o.cat, item: o.item, value: 40 + Math.round(Math.random() * 160), left: 2 + Math.floor(Math.random() * 3), status: 'transit' });
      addLog(e, tr(`📦 Согласие: ${o.brand} отправляет посылку`, `📦 Agreed: ${o.brand} is shipping a package`));
    } else {
      const f = o.format, t = { id: uid(), type: 'deal', src: 'brand', career: e.career, offerId: o.id, shady: o.shady, pay: o.pay,
        title: tr(`Реклама: ${o.brand}`, `Ad deal: ${o.brand}`), desc: tr(`Сделать рекламу для ${o.brand} (${fLabel(f)}) и опубликовать`, `Make an ad for ${o.brand} (${fLabel(f)}) and publish it`),
        steps: [tr('Изучить бриф бренда', 'Read the brand brief'), tr(`Снять контент: ${bi(FORMATS[f].n)}`, `Create the content: ${bi(FORMATS[f].n)}`), tr('Опубликовать с упоминанием бренда', 'Publish with a brand mention'), tr('Отправить отчёт бренду', 'Send the report to the brand')],
        xp: 20, fame: 10, done: false, active: false, progress: 0 };
      if (o.place) { t.place = o.place; t.format = f; t.reqs = reqsFor(o.place, f); }
      e.tasks.push(t);
      addLog(e, tr(`🤝 Принято предложение: ${o.brand} (${money(o.pay)}). Задание добавлено`, `🤝 Offer accepted: ${o.brand} (${money(o.pay)}). Task added`));
    }
    bridgeEmit('offer_accepted', { who: name, offerId: o.id, brand: o.brand, kind: o.kind, text: tr(`✅ Вы приняли предложение ${o.brand}`, `✅ You accepted ${o.brand}'s offer`) });
    return true;
  }
  function declineOffer(name, e, id) {
    const o = e.offers.find((x) => x.id === id && x.status === 'new'); if (!o) return;
    o.status = 'declined';
    if (o.shady) e.audience.loyal = clamp(e.audience.loyal + 1, 0, 100);
    addLog(e, tr(`✖ Отказ: ${o.brand}`, `✖ Declined: ${o.brand}`));
  }
  function parcelAct(name, e, id, act) {
    const p = e.parcels.find((x) => x.id === id); if (!p) return;
    if (act === 'unbox' && p.status === 'arrived') { p.status = 'opened'; e.audience.brands = clamp(e.audience.brands + 1, 0, 100); addLog(e, tr(`📦 Распаковано: ${bi(p.item)} от ${p.brand}`, `📦 Unboxed: ${bi(p.item)} from ${p.brand}`)); }
    else if (act === 'review' && (p.status === 'arrived' || p.status === 'opened')) {
      p.status = 'reviewed'; e.audience.brands = clamp(e.audience.brands + 3, 0, 100); gainFame(e, 5);
      applyContent(name, e, { format: 'video', place: 'home', action: 'single', quality: 4, note: tr(`распаковка и обзор ${p.brand}`, `${p.brand} unboxing & review`), force: true });
    } else if (act === 'sell' && (p.status === 'arrived' || p.status === 'opened')) { p.status = 'sold'; deposit(name, e, Math.round(p.value * 0.4), tr(`Продажа подарка ${p.brand}`, `Sold the ${p.brand} gift`), 'sale'); }
  }
  function tickMoney(n, e) {
    const s = S(); let changed = false;
    e.tickCount++;
    if (s.salaryEvery > 0 && e.career && e.tickCount % s.salaryEvery === 0) { paySalary(n, e); changed = true; }
    for (const o of e.offers) if (o.status === 'new') { o.left--; if (o.left <= 0) { o.status = 'expired'; changed = true; } }
    for (const p of e.parcels) if (p.status === 'transit') {
      p.left--; changed = true;
      if (p.left <= 0) {
        p.status = 'arrived';
        const txt = tr(`📦 Посылка от ${p.brand} прибыла (${bi(p.item)})`, `📦 A package from ${p.brand} arrived (${bi(p.item)})`);
        addLog(e, txt); toastr.info(`${n}: ${txt}`, 'Career & Fame'); bridgeEmit('parcel', { who: n, parcelId: p.id, brand: p.brand, item: bi(p.item), status: 'arrived', text: txt });
      }
    }
    if (e.notices.length) { e.notices.forEach((x) => x.left--); e.notices = e.notices.filter((x) => x.left > 0); }
    const fresh = e.offers.filter((o) => o.status === 'new').length;
    if (s.brandOffers && e.career && e.fame >= 40 && fresh < 4 &&
      Math.random() < OFFER_P[s.offerFreq || 'normal'] * (0.5 + e.fame / 500) * (0.5 + e.audience.brands / 100) * (e.cancel ? 0.3 : 1)) { genOffer(n, e); changed = true; }
    return changed;
  }
  // Диагностика: показывает, что видно из окружения (для подключения к Phone-ST)
  function diagnose() {
    const out = ['Career & Fame bridge diagnostics'];
    try { out.push('extensionSettings keys (phone/bank/money): ' + (Object.keys(ctx().extensionSettings || {}).filter((k) => /phone|bank|money|tel/i.test(k)).join(', ') || '-')); } catch (_) {}
    try {
      for (const k of Object.keys(window).filter((x) => /phone|bank|pst/i.test(x) && x !== 'CareerFame').slice(0, 12)) {
        let d = typeof window[k]; try { if (window[k] && d === 'object') d += ` keys: ${Object.keys(window[k]).slice(0, 30).join(',')}`; } catch (_) {}
        out.push(`window.${k}: ${d}`);
      }
    } catch (_) {}
    try { out.push('chatMetadata keys: ' + Object.keys(ctx().chatMetadata || {}).join(', ')); } catch (_) {}
    try { out.push('DOM (phone): ' + Array.from(document.querySelectorAll('[id*="phone" i]')).slice(0, 8).map((x) => '#' + x.id).join(' ')); } catch (_) {}
    try { out.push('scripts (phone): ' + Array.from(document.scripts).map((x) => x.src).filter((u) => /phone/i.test(u)).join(' | ')); } catch (_) {}
    out.push(`events sent by Career&Fame: ${bridgeLog.length}${bridgeLog[0] ? ` (last: ${bridgeLog[0].type})` : ''}`);
    return out.join('\n');
  }

  function tickTurn() {
    const s = S(); let changed = false;
    for (const n of names()) {
      const e = ent(n);
      if (e.cancel) { e.cancel.left--; changed = true; if (e.cancel.left <= 0) liftCancel(n, e, tr('(публика забыла)', '(the public moved on)')); }
      if (tickMoney(n, e)) changed = true;
      if (e.live) { e.live.ticks++; e.live.viewers = computeViewers(e, e.live.place); changed = true; if (e.live.ticks >= 30) endLive(n, e, 3, true); }
      if (e.reaction) { e.reaction.left--; changed = true; if (e.reaction.left <= 0) e.reaction = null; }
      for (const k of Object.keys(SEG)) { const v = e.audience[k]; if (v < 50) { e.audience[k]++; changed = true; } else if (v > 50) { e.audience[k]--; changed = true; } }
      if (e.heat > 0) {
        if (!e.cancel && e.heat >= 20 && Math.random() < (e.heat / 500) * (s.exposeScale / 100)) {
          e.reaction = { type: 'exposed', text: tr('Сомнительные рекламные интеграции вскрылись: расследования, разборы, гнев подписчиков', 'Shady ad deals came to light: investigations, exposés, angry followers'), left: 6 };
          e.audience.public = clamp(e.audience.public - 15, 0, 100); e.audience.loyal = clamp(e.audience.loyal - 10, 0, 100);
          applyCancel(n, e, e.heat >= 60 ? 3 : 2, tr('разоблачение рекламы сомнительных проектов', 'exposure of shady ad deals'));
          e.heat = Math.max(0, e.heat - 30);
        }
        e.heat = Math.max(0, e.heat - 2); changed = true;
      }
      // хейтеры и доксинг
      if (s.haters) {
        const floor = Math.round(e.fame / 80);
        if (e.haters > floor) { e.haters = Math.max(floor, e.haters - 1); changed = true; } else if (e.haters < floor) { e.haters = floor; changed = true; }
        if (s.doxx && e.doxxLeft <= 0 && e.haters >= 30 && Math.random() < (doxxChance(e) / 100) * 0.05) { startDoxx(n, e); changed = true; }
      } else e.haters = 0;
      if (e.doxxLeft > 0) { e.doxxLeft--; changed = true; }
      // сталкеры
      if (e.stalkerCool > 0) e.stalkerCool--;
      if (s.stalkers) {
        if (!e.stalker && !e.stalkerCool && e.fame >= 120 && Math.random() < STALK_P[s.stalkerFreq || 'normal'] * (1 + e.fame / 1000)) { spawnStalker(n, e); changed = true; }
        else if (e.stalker) { e.stalker.level = Math.min(100, e.stalker.level + 0.4); changed = true; }
      }
    }
    return changed;
  }

  /* =====================  МОДЕЛЬ  ===================== */
  async function callLLM(system, user, maxTokens = 500) {
    const s = S(); const c = ctx();
    if (s.mode === 'profile') {
      if (!s.profileId) throw new Error(tr('Не выбран Connection Profile', 'No Connection Profile selected'));
      const r = await c.ConnectionManagerRequestService.sendRequest(
        s.profileId, [{ role: 'system', content: system }, { role: 'user', content: user }],
        maxTokens, { stream: false, extractData: true, includePreset: false, includeInstruct: false });
      return r?.content ?? '';
    }
    if (s.mode === 'endpoint') {
      const headers = { 'Content-Type': 'application/json' };
      if (s.endpointKey) headers.Authorization = `Bearer ${s.endpointKey}`;
      const res = await fetch(s.endpointUrl.replace(/\/$/, '') + '/chat/completions', {
        method: 'POST', headers,
        body: JSON.stringify({ model: s.endpointModel, max_tokens: maxTokens, temperature: 0.7, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
      });
      if (!res.ok) throw new Error(`Endpoint: ${res.status}`);
      return (await res.json()).choices?.[0]?.message?.content ?? '';
    }
    let out = '';
    try { out = await c.generateRaw({ prompt: user, systemPrompt: system, responseLength: maxTokens }); } catch (e) { console.warn('[Career&Fame] generateRaw(object)', e); }
    if (!out || !String(out).trim()) {
      try { out = await c.generateRaw(user, null, false, false, system, maxTokens); } catch (e) { console.warn('[Career&Fame] generateRaw(legacy)', e); }
    }
    return out || '';
  }

  function extractJson(text) {
    let t = String(text ?? '')
      .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '')
      .replace(/<think(?:ing)?>[\s\S]*$/gi, '')
      .replace(/```(?:json|JSON)?/g, '');
    const start = t.indexOf('{');
    if (start < 0) return null;
    const stack = []; let inStr = false, esc = false, end = -1;
    for (let i = start; i < t.length; i++) {
      const ch = t[i];
      if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === '{' || ch === '[') stack.push(ch);
      else if (ch === '}' || ch === ']') { stack.pop(); if (!stack.length) { end = i; break; } }
    }
    if (end >= 0) return t.slice(start, end + 1);
    let r = t.slice(start);
    if (inStr) r += '"';
    r = r.replace(/[,:\s]+$/, '');
    while (stack.length) r += stack.pop() === '{' ? '}' : ']';
    return r;
  }
  function parseJson(text) {
    const raw = extractJson(text);
    const snippet = String(text ?? '').trim().replace(/\s+/g, ' ').slice(0, 160);
    if (!raw) throw new Error(snippet ? tr(`Модель не вернула JSON. Её ответ: «${snippet}»`, `The model did not return JSON. Its answer: “${snippet}”`) : tr('Модель вернула пустой ответ (проверьте модель/лимит токенов в настройках)', 'The model returned an empty answer (check the model / token limit)'));
    const attempts = [raw, raw.replace(/,\s*([}\]])/g, '$1'), raw.replace(/,\s*([}\]])/g, '$1').replace(/'/g, '"')];
    for (const a of attempts) { try { return JSON.parse(a); } catch (_) { /* next */ } }
    throw new Error(tr(`Не удалось разобрать JSON. Ответ модели: «${snippet}»`, `Could not parse JSON. Model answer: “${snippet}”`));
  }
  async function askJson(system, user, maxTokens, fallback) {
    const first = await callLLM(system, user, maxTokens);
    try { return parseJson(first); } catch (err1) {
      console.warn('[Career&Fame] no JSON, retrying:', first);
      const second = await callLLM(system + ' Reply with EXACTLY ONE JSON object: no explanations, no markdown, no reasoning.', user + '\n\nReturn ONLY the JSON object.', maxTokens + 400);
      try { return parseJson(second); } catch (err2) {
        console.warn('[Career&Fame] retry has no JSON either:', second);
        const f = fallback && (fallback(second) || fallback(first));
        if (f) return f;
        throw err2;
      }
    }
  }
  function textToTask(text) {
    const lines = String(text ?? '').replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return null;
    const clean = (l) => l.replace(/^[#>*\-\s"«]+|[*"»\s]+$/g, '').replace(/^(название|задание|title|task)\s*[:\-—]\s*/i, '');
    const steps = lines.map((l) => l.match(/^(?:\d+[.)]|[-•*])\s+(.+)/)?.[1]).filter(Boolean).map(clean).slice(0, 5);
    const plain = lines.filter((l) => !/^(?:\d+[.)]|[-•*])\s+/.test(l));
    const hasTitleKey = lines.some((l) => /^[#*\s]*(название|title)\s*[:\-—]/i.test(l));
    if (!plain.length || (!steps.length && !hasTitleKey)) return null;
    return { title: clean(plain[0]).slice(0, 80) || tr('Задание', 'Task'), desc: plain[1] ? clean(plain[1]) : '', steps, xp: 20, fame: 10 };
  }
  const outLang = () => `Write all human-readable text fields in ${LANG() === 'en' ? 'English' : 'Russian'}.`;

  function stateSummary() {
    return names().map((n) => {
      const e = ent(n);
      const open = e.tasks.filter((t) => !t.done)
        .map((t) => `[${t.id}] "${t.title}" (${t.active ? 'TAKEN' : 'not taken'}${placeInfo(t)}; steps: ${t.steps.map((x, i) => `${i + 1}.${x.done ? '[x]' : '[ ]'} ${x.text}`).join(' ')})`).join('; ') || 'none';
      return `- ${n}: ${titleOf(e)}, lvl ${e.level}, fame ${e.fame} (${fameTier(e.fame, 'en')}), ${e.cancel ? 'CANCELLED (' + e.cancel.reason + ')' : 'fine'}; audience: fans ${mood(e.audience.loyal, 'en')}, brands ${mood(e.audience.brands, 'en')}, public ${mood(e.audience.public, 'en')}; haters ${e.haters}/100${e.doxxLeft > 0 ? ', DOXXED NOW' : ''}${e.stalker ? ', has a stalker' : ''}; recent controversial moves: ${e.moves.slice(0, 3).map((x) => bi(MOVES[x.type]?.name || x.type, 'en')).join(', ') || 'none'}; ${e.live ? `LIVE STREAM NOW (${bi(PLACES[e.live.place].name, 'en')}, ${e.live.ticks} msgs); ` : ''}tasks: ${open}; pending brand offers: ${offersLine(e)}`;
    }).join('\n');
  }

  async function analyze(manual = false) {
    const c = ctx();
    if (!c.chat?.length) return;
    const active = names().filter((n) => ent(n).career);
    if (!active.length) return;
    const recent = c.chat.slice(-6).map((m) => `${m.name}: ${m.mes}`).join('\n\n');
    const system = 'You are the career & fame engine of a roleplay. Reply with VALID JSON only, no commentary.';
    const user = `State:\n${stateSummary()}\n\nRecent messages:\n${recent}\n\n` +
      `Evaluate what happened to the career/reputation of ${active.join(', ')} only. Return JSON:\n` +
      `{"events":[{"who":"name","xp":-30..40,"fame":-50..80,"summary":"short",` +
      `"tasks":[{"id":"task id from the list","steps_done":[numbers of steps FINISHED in the text]}],` +
      `"cancel":null or {"severity":1-3,"reason":"why"},` +
      `"controversy":null or {"type":"adult|casino|scam|crypto|fake|guru","note":"short"},` +
      `"content":null or {"format":"stream|stories|video|post","place":"home|street|event","action":"start|end|single","quality":1-5,"note":"short"},` +
      `"haters":null or {"delta":-20..30,"doxx":false,"note":"short"},` +
      `"stalker":null or {"action":"appear|escalate|resolve","note":"short"},"brand":null or {"id":"offer id from the list","action":"accept|decline"},"lift_cancel":false}]}\n` +
      `RULES. TASKS: in steps_done list only steps the character/user has ALREADY ACTUALLY COMPLETED in the messages (not "going to", not planning); do not repeat steps marked [x]; this also works for "not taken" tasks if the hero started them on their own. ` +
      `Mark the last step only when the hero really finished and left the place/scene (e.g. arrived at the shoot -> filmed -> finished and left). The task completes automatically when all steps are marked and the reward is given automatically, so xp/fame in the event are only for OTHER things. ` +
      `If a task has a PLACE (home / outdoors / event), steps count only when the actions happen there and the conditions are respected; violating the conditions (filming people without consent, streaming at an event without permission) is a reason for a severity-1 cancel. ` +
      `CANCEL only for truly scandalous acts. If nothing relevant happened return {"events":[]}. ` +
      `CONTROVERSY only when the character REALLY did or announced it: adult = moving to an 18+ platform like OnlyFans; casino = advertising casinos/lootboxes/betting; scam = advertising scammers/fraudulent projects; crypto = advertising crypto pyramids/pump schemes; fake = fake giveaways/botting; guru = selling overpriced courses/marathons with unrealistic income promises (info-gypsy). Not talk, threats or refusals; do not repeat recent moves. ` +
      `CONTENT = SELF-INITIATED content outside tasks: stream -> action "start" when they go live and "end" when they finish (while it continues -> null); stories/video/post -> action "single", once per publication; place = where it happens; quality 1-5 = how well it is shown in the text. Not plans or talk; if the actions are steps of an active task use tasks, not content. Place conditions apply here too. ` +
      `HATERS only when the text shows harassment/hate campaigns (delta > 0) or calming down (delta < 0); set doxx true ONLY if personal data was actually leaked in the story. STALKER: appear = an obsessive follower shows up; escalate = gets worse; resolve = dealt with. ` +
      `BRAND only if the story shows the hero actually answering one of the pending brand offers. If a character is a minor, always return null for controversy, content, haters and stalker. ${outLang()}`;
    let data;
    try { data = await askJson(system, user, 1000); }
    catch (err) { if (manual) throw err; console.warn('[Career&Fame] auto-analysis skipped:', err.message); return; }
    const s = S();
    for (const ev of data.events || []) {
      if (!active.includes(ev.who)) continue;
      const e = ent(ev.who);
      for (const tk of Array.isArray(ev.tasks) ? ev.tasks : []) {
        const t = e.tasks.find((x) => x.id === tk?.id && !x.done);
        if (!t) continue;
        const idx = (Array.isArray(tk.steps_done) ? tk.steps_done : []).map((n) => parseInt(n) - 1).filter((i) => i >= 0 && i < t.steps.length);
        if (!idx.length) continue;
        const before = t.steps.filter((x) => x.done).length;
        const upto = Math.max(...idx);
        for (let i = 0; i <= upto; i++) t.steps[i].done = true;
        const after = t.steps.filter((x) => x.done).length;
        if (after === before) continue;
        if (!t.active) { t.active = true; addLog(e, tr(`▶️ Герой сам взялся за задание: ${t.title}`, `▶️ The hero started the task on their own: ${t.title}`)); }
        t.progress = progressOf(t);
        addLog(e, tr(`☑ «${t.title}»: шагов ${after}/${t.steps.length}`, `☑ “${t.title}”: steps ${after}/${t.steps.length}`));
        if (t.steps.every((x) => x.done)) completeTask(ev.who, e, t.id);
      }
      gainXp(ev.who, e, clamp(parseInt(ev.xp) || 0, -30, 40));
      gainFame(e, clamp(parseInt(ev.fame) || 0, -50, 80));
      if (ev.content) applyContent(ev.who, e, ev.content);
      if (ev.brand?.id) { if (ev.brand.action === 'accept') acceptOffer(ev.who, e, ev.brand.id); else if (ev.brand.action === 'decline') declineOffer(ev.who, e, ev.brand.id); }
      const cv = ev.controversy;
      if (cv?.type && MOVES[cv.type] && !e.moves.some((x) => x.type === cv.type && c.chat.length - x.at < 6)) applyMove(ev.who, e, cv.type, cv.note);
      if (ev.haters && s.haters) { addHate(e, clamp(parseInt(ev.haters.delta) || 0, -20, 30)); if (ev.haters.doxx) startDoxx(ev.who, e); if (ev.haters.note) addLog(e, `😡 ${ev.haters.note}`); }
      if (ev.stalker && s.stalkers) {
        const a = ev.stalker.action;
        if (a === 'appear' && !e.stalker) spawnStalker(ev.who, e);
        else if (a === 'escalate' && e.stalker) e.stalker.level = Math.min(100, e.stalker.level + 15);
        else if (a === 'resolve' && e.stalker) { e.stalker = null; e.stalkerCool = 60; addLog(e, tr('🛡️ Сталкер больше не беспокоит', '🛡️ The stalker no longer bothers you')); }
        if (ev.stalker.note && stalkerVisible(e)) addLog(e, `👁️ ${ev.stalker.note}`);
      }
      if (ev.cancel) applyCancel(ev.who, e, ev.cancel.severity, ev.cancel.reason);
      else if (ev.lift_cancel) liftCancel(ev.who, e);
      if (ev.summary) addLog(e, `• ${ev.summary}`);
    }
    commit();
  }

  async function genTask(name, opts = {}) {
    const e = ent(name);
    if (!careerOf(e)) { toastr.warning(tr('Сначала выберите карьеру', 'Choose a career first'), 'Career & Fame'); return; }
    let place, format, reqs = [];
    if (hasPlaces(e)) {
      place = PLACES[opts.place] ? opts.place : rollPlace();
      format = FORMATS[opts.format] ? opts.format : pickRnd(Object.keys(FORMATS));
      reqs = reqsFor(place, format);
    }
    const where = place ? `Format: ${bi(FORMATS[format].n, 'en')}. Place: ${bi(PLACES[place].name, 'en')}. Conditions of this place: ${(REQS[place][format] || []).map((x) => bi(x, 'en')).join('; ')}. ` +
      `The task MUST take place there, and the steps must respect these conditions (preparation, shooting/streaming, wrap-up). ` : '';
    const system = 'You invent tasks for a career in a roleplay game. Reply with VALID JSON only.';
    const user = `Profession: ${bi(CAREERS[e.career].name, 'en')}, rank: ${bi(CAREERS[e.career].ladder[clamp(e.level, 1, 6) - 1], 'en')}, level ${e.level}, fame ${e.fame}.\n` +
      `Existing tasks: ${e.tasks.filter((t) => !t.done).map((t) => t.title).join(', ') || 'none'}.\n` + where +
      `Invent ONE new task that can be played out IN THE STORY (concrete actions). A task is a complete episode from start to finish (e.g. arrive at the shoot -> film the clip -> finish and leave). 3-5 steps, the LAST step is the wrap-up (the hero finished and left the place/scene). ${outLang()} ` +
      `JSON: {"title":"...","desc":"...","steps":["step 1","step 2","step 3"],"xp":10-60,"fame":0-60}`;
    const d = await askJson(system, user, 900, textToTask);
    const t = { id: uid(), type: 'task', src: 'ai', career: e.career, title: String(d.title || tr('Задание', 'Task')), desc: String(d.desc || ''),
      steps: Array.isArray(d.steps) ? d.steps.slice(0, 6).map(String) : [],
      xp: clamp(parseInt(d.xp) || 20, 5, 80), fame: clamp(parseInt(d.fame) || 10, 0, 80), done: false, active: false, progress: 0 };
    if (place) { t.place = place; t.format = format; t.reqs = reqs; }
    e.tasks.push(t);
    toastr.success(place ? tr(`Новое задание: ${PLACES[place].icon} ${pName(place)}, ${fLabel(format)}`, `New task: ${PLACES[place].icon} ${pName(place)}, ${fLabel(format)}`) : tr('Новое задание добавлено в «Доступные»', 'New task added to “Available”'), 'Career & Fame');
  }

  async function genStepsFor(name, id) {
    const e = ent(name); const t = e.tasks.find((x) => x.id === id);
    if (!t) return;
    const where = t.place ? `Place: ${bi(PLACES[t.place].name, 'en')}; format: ${t.format ? bi(FORMATS[t.format].n, 'en') : 'any'}; conditions: ${(REQS[t.place]?.[t.format] || []).map((x) => bi(x, 'en')).join('; ')}. The steps must respect the place and conditions. ` : '';
    const system = 'You split roleplay game tasks into steps. Reply with VALID JSON only.';
    const user = `Task: "${t.title}". ${t.desc || ''}\n${where}Split it into 2-5 sequential steps that can be played out in the story. The LAST step is the wrap-up: the hero finished and left the place/scene. ${outLang()} JSON: {"steps":["step 1","step 2"]}`;
    const d = await askJson(system, user, 700, (txt) => { const x = textToTask(txt); return x && x.steps.length ? { steps: x.steps } : null; });
    const fresh = ent(name).tasks.find((x) => x.id === id);
    if (fresh && Array.isArray(d.steps) && d.steps.length >= 2 && !fresh.steps.some((x) => x.done)) {
      fresh.steps = d.steps.slice(0, 6).map((x) => ({ text: String(x), done: false })); fresh.progress = 0;
    }
  }

  /* =====================  ПРОМПТ  ===================== */
  function updatePrompt() {
    const c = ctx(); const s = S();
    if (!s.enabled || !s.inject) return c.setExtensionPrompt(MODULE, '', 1, 1);
    const lines = names().map((n) => {
      const e = ent(n);
      if (!e.career) return null;
      const isUser = n === c.name1;
      let l = tr(`${n}: ${titleOf(e)} (ур. ${e.level}), известность — ${fameTier(e.fame)} (${e.fame}/1000).`, `${n}: ${titleOf(e)} (lvl ${e.level}), fame — ${fameTier(e.fame)} (${e.fame}/1000).`);
      const others = Object.keys(e.progress).filter((k) => k !== e.career && e.progress[k].level > 0);
      if (others.length) l += tr(` Прошлые карьеры: ${others.map((k) => `${careerName(k)} (ур. ${e.progress[k].level})`).join(', ')}.`, ` Past careers: ${others.map((k) => `${careerName(k)} (lvl ${e.progress[k].level})`).join(', ')}.`);
      if (e.cancel) l += tr(` СЕЙЧАС ПОД ОТМЕНОЙ из-за «${e.cancel.reason}»: публика, бренды и коллеги реагируют враждебно или дистанцируются.`, ` CURRENTLY CANCELLED over “${e.cancel.reason}”: the public, brands and colleagues react with hostility or distance themselves.`);
      l += tr(`\n  Аудитория: фанаты ${mood(e.audience.loyal)}, бренды и спонсоры ${mood(e.audience.brands)}, публика и СМИ ${mood(e.audience.public)}.`, `\n  Audience: fans ${mood(e.audience.loyal)}, brands & sponsors ${mood(e.audience.brands)}, public & media ${mood(e.audience.public)}.`);
      if (e.reaction) l += tr(`\n  Недавняя реакция аудитории (${e.reaction.text}). Покажи эти РАЗНЫЕ реакции в сюжете: комментарии, отписки/донаты, письма от агентов и спонсоров, новости. Фокус — социальные последствия.`, `\n  Recent audience reaction (${e.reaction.text}). Show these DIFFERENT reactions in the story: comments, unsubscribes/donations, messages from agents and sponsors, news. Focus on social consequences.`);
      if (e.heat >= 50) l += tr(' Есть риск разоблачения: ходят слухи, журналисты и разоблачители присматриваются.', ' There is a risk of exposure: rumors circulate, journalists and debunkers are watching.');
      if (s.haters && e.haters >= 40) l += tr(`\n  Хейтеры активны (${e.haters}/100): травля в комментариях, анонимные сообщения, фейки; на это реагируют фанаты и модераторы.`, `\n  Haters are active (${e.haters}/100): harassment in comments, anonymous messages, fakes; fans and moderators react.`);
      if (s.doxx && e.doxxLeft > 0) l += tr(`\n  Личные данные ${n} утекли в сеть (доксинг): тревога, навязчивые сообщения, поддержка фанатов и платформ. Показывай последствия и пути защиты, без подробностей о том, как именно данные раскрывают.`, `\n  ${n}'s personal data leaked online (doxxing): anxiety, intrusive messages, support from fans and platforms. Show the consequences and ways to protect oneself, without details on how data gets exposed.`);
      else if (s.doxx && s.haters && doxxChance(e) >= 50) l += tr(` Риск доксинга высокий (${doxxChance(e)}%).`, ` Doxxing risk is high (${doxxChance(e)}%).`);
      if (stalkerVisible(e)) l += tr(`\n  За ${n} присматривает навязчивый поклонник (уровень ${Math.round(e.stalker.level)}/100): странные сообщения, «случайные» встречи. Упоминай это редко и ненавязчиво — не чаще раза в несколько постов.`, `\n  An obsessive fan watches ${n} (level ${Math.round(e.stalker.level)}/100): odd messages, “random” encounters. Mention it rarely and subtly — no more than once every few posts.`);
      if (s.bridgePrompt && e.notices.length) l += tr(`\n  Недавние уведомления на телефоне ${n}: ${e.notices.map((x) => x.text).join(' | ')}. Если уместно, покажи их как уведомления или сообщения на экране телефона.`, `\n  Recent phone notifications for ${n}: ${e.notices.map((x) => x.text).join(' | ')}. If appropriate, show them as notifications or messages on the phone screen.`);
      if (e.tags.cuck) {
        const from = e.tags.cuck.from;
        l += from !== n
          ? tr(`\n  На ${n} в сети навесили ярлык «куколд» из-за ухода ${from} на платформу 18+: мемы и подколки. Показывай как социальную реакцию окружающих, без откровенных деталей.`, `\n  ${n} got a “cuck” label online because ${from} went to an 18+ platform: memes and jokes. Show it as a social reaction of others, without explicit details.`)
          : tr(`\n  На ${n} в сети навесили ярлык «куколд» после ухода на платформу 18+: мемы и подколки. Показывай как социальную реакцию окружающих, без откровенных деталей.`, `\n  ${n} got a “cuck” label online after going to an 18+ platform: memes and jokes. Show it as a social reaction of others, without explicit details.`);
      }
      if (e.live) l += tr(`\n  СЕЙЧАС ИДЁТ СТРИМ (${PLACES[e.live.place].icon} ${pName(e.live.place)}), зрителей ~${e.live.viewers}. ${isUser ? `Не описывай действия ${n} за него: показывай чат, донаты, реакции зрителей и окружение.` : 'Показывай ход стрима: чат, донаты, реакции зрителей, помехи.'} Условия места: ${reqsFor(e.live.place, 'stream').join(', ')}.`,
        `\n  A STREAM IS LIVE (${PLACES[e.live.place].icon} ${pName(e.live.place)}), ~${e.live.viewers} viewers. ${isUser ? `Do not narrate ${n}'s actions for them: show chat, donations, viewer reactions and the surroundings.` : 'Show the stream: chat, donations, viewer reactions, glitches.'} Place conditions: ${reqsFor(e.live.place, 'stream').join(', ')}.`);
      const act = e.tasks.filter((t) => t.active && !t.done);
      if (act.length) {
        l += tr('\n  Задания в работе: ', '\n  Tasks in progress: ') + act.map((t) => { const nx = t.steps.find((x) => !x.done);
          return tr(`«${t.title}» — ${t.desc || ''}${t.place && PLACES[t.place] ? ` Место: ${pName(t.place)}; условия: ${(t.reqs || []).join(', ')}.` : ''} Шаги: ${stepsLine(t)}.${nx ? ` Сейчас нужно: ${nx.text}.` : ''}`,
            `“${t.title}” — ${t.desc || ''}${t.place && PLACES[t.place] ? ` Place: ${pName(t.place)}; conditions: ${(t.reqs || []).join(', ')}.` : ''} Steps: ${stepsLine(t)}.${nx ? ` Next: ${nx.text}.` : ''}`); }).join(' ');
        l += tr(' Задание завершается, только когда пройден последний шаг (герой закончил дело и покинул место/сцену); не пропускай шаги и доводи задание до логичного завершения. Если у задания указано место — действия происходят именно там, с учётом условий (показывай подготовку и соблюдение или нарушение условий).',
          ' A task ends only when its last step is done (the hero finished and left the place/scene); do not skip steps and bring the task to a logical end. If a place is given, the actions happen there with the conditions in mind (show preparation and the conditions being respected or violated).');
        if (s.demandActions) {
          l += isUser
            ? tr(` ${n} выполняет это сам в своих постах: не описывай его действия за него, а показывай мир, реакции, помехи и последствия; успех не засчитывай, пока он сам не отыграл нужные действия.`, ` ${n} does this on their own in their posts: do not narrate their actions for them, show the world, reactions, obstacles and consequences; do not count success until they act it out.`)
            : tr(` Показывай в постах конкретные действия ${n} по этим заданиям (подготовка, процесс, препятствия, результат); не объявляй успех без описанных действий и не завершай сложное задание за один пост.`, ` Show ${n}'s concrete actions for these tasks in the posts (preparation, process, obstacles, result); do not declare success without described actions and do not finish a complex task in one post.`);
        }
      }
      const avail = e.tasks.filter((t) => !t.done && !t.active && t.type !== 'safety' && t.type !== 'stalker').slice(0, 3);
      if (avail.length) l += tr(`\n  Доступные задания (ещё не взяты): ${avail.map((t) => `«${t.title}»`).join(', ')}. Если в сюжете герой сам берётся за такое задание — покажи его действия.`, `\n  Available tasks (not taken yet): ${avail.map((t) => `“${t.title}”`).join(', ')}. If the hero takes one up on their own in the story, show their actions.`);
      return l;
    }).filter(Boolean);
    c.setExtensionPrompt(MODULE, lines.length ? tr(`[Карьера и слава. Учитывай в повествовании:\n${lines.join('\n')}]`, `[Career & fame. Take into account in the narration:\n${lines.join('\n')}]`) : '', 1, 1, false, 0);
  }

  /* =====================  ТЕЛЕФОН (UI)  ===================== */
  const ui = { open: false, screen: 'home', who: null, tab: 'avail', form: false, busy: false, models: [], pickPlace: 'rand', pickFormat: 'rand', cPlace: 'home', cFormat: 'stream', mtab: 'inbox', diag: '' };
  const APPS = [
    { id: 'career',   icon: '💼', name: 'Карьера|Career',       bg: 'linear-gradient(135deg,#4facfe,#2563eb)' },
    { id: 'tasks',    icon: '🎯', name: 'Задания|Tasks',        bg: 'linear-gradient(135deg,#43e97b,#0d9f6e)' },
    { id: 'content',  icon: '📡', name: 'Контент|Content',      bg: 'linear-gradient(135deg,#f472b6,#db2777)' },
    { id: 'feed',     icon: '📰', name: 'События|Events',       bg: 'linear-gradient(135deg,#fbbf24,#f97316)' },
    { id: 'aud',      icon: '👥', name: 'Аудитория|Audience',   bg: 'linear-gradient(135deg,#c084fc,#7c3aed)' },
    { id: 'threats',  icon: '🛡️', name: 'Угрозы|Threats',       bg: 'linear-gradient(135deg,#f87171,#b91c1c)' },
    { id: 'moves',    icon: '🎭', name: 'Спорное|Controversy',  bg: 'linear-gradient(135deg,#fb7185,#e11d48)' },
    { id: 'money',    icon: '💰', name: 'Деньги и бренды|Money & brands', bg: 'linear-gradient(135deg,#34d399,#059669)' },
    { id: 'settings', icon: '⚙️', name: 'Настройки|Settings',   bg: 'linear-gradient(135deg,#94a3b8,#475569)' },
  ];
  const TITLES = { home: 'Career & Fame', career: '💼 Карьера|💼 Career', tasks: '🎯 Задания|🎯 Tasks', content: '📡 Контент|📡 Content', feed: '📰 События|📰 Events', aud: '👥 Аудитория|👥 Audience',
    threats: '🛡️ Угрозы и ярлыки|🛡️ Threats & labels', moves: '🎭 Спорные ходы|🎭 Controversial moves', money: '💰 Деньги и бренды|💰 Money & brands', settings: '⚙️ Настройки|⚙️ Settings' };
  const THEMES = [['midnight', 'Полночь|Midnight', '#7f5af0', '#2cb67d'], ['aurora', 'Аврора|Aurora', '#22d3ee', '#a78bfa'], ['rose', 'Роза|Rose', '#fb7185', '#f59e0b'],
    ['gold', 'Оскар|Oscar', '#f5c542', '#b8860b'], ['light', 'Светлая|Light', '#e9ecf8', '#6d5ae6'], ['amoled', 'AMOLED|AMOLED', '#000000', '#34d399']];
  const E = esc;
  const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  function curWho() { const ns = names(); if (!ns.includes(ui.who)) ui.who = ns[0] || null; return ui.who; }
  const btn = (act, label, id, cls = '', v = '') => `<button class="cfp-btn ${cls}" data-act="${act}"${id ? ` data-id="${E(id)}"` : ''}${v !== '' ? ` data-v="${E(v)}"` : ''}>${label}</button>`;
  const bar = (pct, color) => `<div class="cfp-bar"><i style="width:${clamp(pct, 0, 100)}%;background:${color}"></i></div>`;
  const empty = (txt, extra = '') => `<div class="cfp-empty">${txt}${extra}</div>`;
  const needCareer = () => empty(tr('Сначала выберите карьеру', 'Choose a career first'), `<div>${btn('open', tr('💼 Выбрать карьеру', '💼 Choose a career'), '', 'pri', 'career')}</div>`);
  const chipsHtml = (items, cur, act) => `<div class="cfp-chips">${items.map(([k, l]) => `<span class="cfp-chip ${cur === k ? 'on' : ''}" data-act="${act}" data-v="${k}">${l}</span>`).join('')}</div>`;
  const statsLine = (e) => `🔴 ${tr('Стримов', 'Streams')}: ${e.stats.stream} · 📸 ${tr('Сторис', 'Stories')}: ${e.stats.stories} · 🎥 ${tr('Видео', 'Videos')}: ${e.stats.video} · 🖼️ ${tr('Постов', 'Posts')}: ${e.stats.post}`;

  function screenHome(e, who) {
    const plates = [];
    if (e.live) plates.push(tr('🔴 В эфире', '🔴 Live'));
    if (e.tags.cuck) plates.push(tr('🏷️ Куколд', '🏷️ Cuck'));
    if (stalkerVisible(e)) plates.push(tr('👁️ Сталкер', '👁️ Stalker'));
    if (e.doxxLeft > 0) plates.push(tr('🕵️ Доксинг', '🕵️ Doxxed'));
    const prof = `<div class="cfp-card cfp-prof"><div class="cfp-ava">${iconOf(e)}</div><div style="flex:1;min-width:0">
      <b>${E(who)}</b><div class="cfp-sub">${e.career ? LEVEL_ICONS[clamp(e.level, 1, 6) - 1] + ' ' + E(titleOf(e)) + ' · ' + tr('ур.', 'lvl') + ' ' + e.level : tr('Без карьеры — откройте 💼', 'No career — open 💼')}</div>
      ${e.career ? `<div class="cfp-sub">${fameIcon(e.fame)} ${fameTier(e.fame)} · ${e.fame}/1000</div>${bar(e.fame / 10, '#fbbf24')}` : ''}
      ${plates.length ? `<div class="cfp-tags">${plates.map((p) => `<span>${p}</span>`).join('')}</div>` : ''}</div></div>`;
    const cancel = e.cancel ? `<div class="cfp-card cfp-alert">${CANCEL[e.cancel.severity].icon} <b>${bi(CANCEL[e.cancel.severity].label)}</b>: ${E(e.cancel.reason)}<div class="cfp-sub">${tr('Осталось', 'Left')} ~${e.cancel.left} ${tr('сообщ.', 'msgs')}</div></div>` : '';
    const act = e.tasks.filter((t) => t.active && !t.done).length;
    const badge = { content: e.live ? '🔴' : '', tasks: act ? act : '', aud: e.cancel ? '!' : '', feed: e.reaction ? '•' : '', threats: e.doxxLeft > 0 ? '!' : stalkerVisible(e) ? '👁' : '', money: e.offers.filter((o) => o.status === 'new').length + e.parcels.filter((p) => p.status === 'arrived').length || '' };
    const grid = APPS.map((a) => `<div class="cfp-app" data-act="open" data-v="${a.id}"><div class="cfp-ico" style="background:${a.bg}">${a.icon}${badge[a.id] ? `<span class="cfp-bdg">${badge[a.id]}</span>` : ''}</div><span>${bi(a.name)}</span></div>`).join('');
    return prof + cancel + `<div class="cfp-grid">${grid}</div>`;
  }

  function screenCareer(e, who) {
    const picker = `<div class="cfp-card"><div class="cfp-h">${tr('Профессия', 'Profession')}</div><div class="cfp-picks">${Object.entries(CAREERS).map(([k, c]) => {
      const lv = lvlOf(e, k);
      return `<div class="cfp-pick ${e.career === k ? 'on' : ''}" data-act="career" data-v="${k}"><span>${c.icon}</span>${careerName(k)}${lv ? `<small>${tr('ур.', 'lvl')} ${lv}</small>` : ''}</div>`;
    }).join('')}</div><div class="cfp-sub" style="margin-top:6px">${tr('Смена профессии ничего не сбрасывает: прогресс других карьер, слава и аудитория сохраняются.', 'Switching careers resets nothing: other careers’ progress, fame and audience are kept.')}</div></div>`;
    if (!e.career) return picker + empty(tr('Выберите профессию, чтобы начать карьеру', 'Pick a profession to start a career'));
    const c = careerOf(e); const need = xpNeeded(e.level);
    const xpPct = e.level >= maxLevel(e) ? 100 : Math.round((e.xp / need) * 100);
    const ladder = ladderOf(e.career).map((r, i) => `<div class="cfp-step ${i + 1 === e.level ? 'now' : i + 1 < e.level ? 'past' : ''}">${LEVEL_ICONS[i]} <b>${i + 1}</b> ${E(r)}</div>`).join('');
    return picker + `<div class="cfp-card"><div class="cfp-h">${c.icon} ${E(titleOf(e))}</div>
      <div class="cfp-sub">${tr('Уровень', 'Level')} ${e.level}/${maxLevel(e)} · ${tr('опыт', 'XP')} ${e.xp}/${e.level >= maxLevel(e) ? 'MAX' : need}</div>${bar(xpPct, '#34d399')}
      <div class="cfp-sub" style="margin-top:6px">${fameIcon(e.fame)} ${tr('Слава', 'Fame')}: ${e.fame}/1000 — ${fameTier(e.fame)}</div>${bar(e.fame / 10, '#fbbf24')}
      <div style="margin-top:8px">${btn('xp', tr('🎁 ± XP / слава', '🎁 ± XP / fame'))}</div></div>
      <div class="cfp-card"><div class="cfp-h">📊 ${tr('Контент', 'Content')}</div><div class="cfp-sub">${statsLine(e)}</div></div>
      <div class="cfp-card"><div class="cfp-h">${tr('Карьерная лестница', 'Career ladder')}</div>${ladder}</div>`;
  }

  function taskCard(t) {
    const st = t.done ? '✅' : t.active ? '▶️' : '📋';
    const rw = rewardOf(t);
    const pl = t.place && PLACES[t.place];
    const tags = pl ? `<div class="cfp-tags"><span>${pl.icon} ${pName(t.place)}</span>${t.format ? `<span>${fLabel(t.format)}</span>` : ''}${pl.mult > 1 ? `<span>×${pl.mult} ${tr('награда', 'reward')}</span>` : ''}</div>` +
      (t.reqs && t.reqs.length ? `<div class="cfp-reqs">📋 ${t.reqs.map(E).join(' · ')}</div>` : '') : '';
    const steps = t.steps?.length ? `<div class="cfp-steps">${t.steps.map((x) => `<span class="${x.done ? 'sdone' : ''}">${x.done ? '☑' : '☐'} ${E(x.text)}</span>`).join('')}</div>` : '';
    const prog = t.active && !t.done ? `<div class="cfp-sub">${tr('Прогресс', 'Progress')}: ${t.progress || 0}% (${t.steps.filter((x) => x.done).length}/${t.steps.length})</div>${bar(t.progress || 0, '#4facfe')}` : '';
    const b = [];
    if (!t.done) {
      b.push(t.active ? btn('drop', tr('⏸ Отказаться', '⏸ Drop'), t.id) : btn('take', tr('▶️ Взять', '▶️ Take'), t.id, 'pri'));
      if (t.src !== 'manual') b.push(btn('done', tr('✔ Зачесть', '✔ Complete'), t.id));
    }
    b.push(btn('del', '🗑', t.id, 'ghost'));
    return `<div class="cfp-card cfp-task ${t.active && !t.done ? 'active' : ''} ${t.done ? 'done' : ''}">
      <div class="cfp-th"><b>${st} ${E(t.title)}</b><span class="cfp-rew">+${rw.xp} XP · +${rw.fame} ⭐</span></div>
      ${t.desc ? `<div class="cfp-sub">${E(t.desc)}</div>` : ''}${tags}${steps}${prog}<div class="cfp-tb">${b.join('')}</div></div>`;
  }
  function screenTasks(e, who) {
    if (!e.career) return needCareer();
    const mine = (t) => !t.career || t.career === e.career;
    const avail = e.tasks.filter((t) => !t.done && !t.active && mine(t)), work = e.tasks.filter((t) => t.active && !t.done), done = e.tasks.filter((t) => t.done);
    const list = { avail, work, done }[ui.tab] || avail;
    const seg = `<div class="cfp-seg">${[['avail', tr('📋 Доступные', '📋 Available'), avail.length], ['work', tr('▶️ В работе', '▶️ Active'), work.length], ['done', tr('✅ Готово', '✅ Done'), done.length]]
      .map(([k, l, n]) => `<div class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${l} ${n}</div>`).join('')}</div>`;
    const picker = hasPlaces(e) ? `<div class="cfp-card"><div class="cfp-h">${tr('Параметры задания', 'Task options')}</div>
      <div class="cfp-sub">${tr('Место', 'Place')}</div>${chipsHtml([['rand', tr('🎲 Любое', '🎲 Any')], ...Object.keys(PLACES).map((k) => [k, `${PLACES[k].icon} ${pName(k)}`])], ui.pickPlace, 'pickplace')}
      <div class="cfp-sub">${tr('Формат', 'Format')}</div>${chipsHtml([['rand', tr('🎲 Любой', '🎲 Any')], ...Object.keys(FORMATS).map((k) => [k, fLabel(k)])], ui.pickFormat, 'pickformat')}
      <div class="cfp-sub" style="margin-top:4px">${tr('Требования зависят от места и формата. Награда: дома ×1, на улице ×1.2, на мероприятии ×1.4.', 'Requirements depend on place and format. Reward: home ×1, outdoors ×1.2, event ×1.4.')}</div></div>` : '';
    const placeSel = hasPlaces(e) ? `<div class="cfp-row"><select class="cfp-in" id="cff_place">${Object.keys(PLACES).map((k) => `<option value="${k}" ${ui.pickPlace === k ? 'selected' : ''}>${PLACES[k].icon} ${pName(k)}</option>`).join('')}</select>
      <select class="cfp-in" id="cff_format">${Object.keys(FORMATS).map((k) => `<option value="${k}" ${ui.pickFormat === k ? 'selected' : ''}>${fLabel(k)}</option>`).join('')}</select></div>` : '';
    const top = `<div class="cfp-row">${btn('newtask', ui.busy ? tr('⏳ Генерация…', '⏳ Generating…') : tr('🎯 Задание от ИИ', '🎯 AI task'), '', 'pri')}${btn('addform', ui.form ? tr('✖ Закрыть', '✖ Close') : tr('✍️ Вручную', '✍️ Manual'))}</div>`;
    const form = ui.form ? `<div class="cfp-card"><div class="cfp-h">${tr('Новое задание', 'New task')}</div>
      <input class="cfp-in" id="cff_title" placeholder="${tr('Название', 'Title')}"><input class="cfp-in" id="cff_desc" placeholder="${tr('Что нужно сделать', 'What needs to be done')}">${placeSel}
      <div class="cfp-row"><input class="cfp-in" id="cff_xp" type="number" value="25" placeholder="XP"><input class="cfp-in" id="cff_fame" type="number" value="10" placeholder="${tr('Слава', 'Fame')}"></div>
      ${btn('submitform', tr('＋ Добавить', '＋ Add'), '', 'pri')}</div>` : '';
    const hint = ui.tab === 'work' && work.length ? `<div class="cfp-sub" style="margin-bottom:6px">${tr('Выполняйте задания в ролевой: награда придёт за действия, показанные в постах.', 'Play the tasks out in the roleplay: the reward comes for actions shown in the posts.')}</div>` : '';
    const emptyTxt = { avail: tr('Нет доступных заданий', 'No available tasks'), work: tr('Нет заданий в работе — возьмите одно из «Доступных»', 'No active tasks — take one from “Available”'), done: tr('Пока ничего не выполнено', 'Nothing completed yet') }[ui.tab];
    return picker + top + form + seg + hint + (list.length ? list.map(taskCard).join('') : empty(emptyTxt));
  }

  function screenContent(e, who) {
    if (!e.career) return needCareer();
    const stats = `<div class="cfp-card"><div class="cfp-h">📊 ${tr('Ваш контент', 'Your content')}</div><div class="cfp-sub">${statsLine(e)}</div></div>`;
    if (e.live) {
      const l = e.live;
      return `<div class="cfp-card cfp-alert"><div class="cfp-h">${tr('🔴 В ЭФИРЕ', '🔴 LIVE')}</div><div class="cfp-sub">${PLACES[l.place].icon} ${pName(l.place)} · ~${l.viewers} ${tr('зрителей', 'viewers')} · ${tr('сообщений в эфире', 'messages on air')}: ${l.ticks}</div>
        <div class="cfp-reqs">📋 ${reqsFor(l.place, 'stream').map(E).join(' · ')}</div>
        <div style="margin-top:8px">${btn('contentstop', tr('⏹ Завершить стрим', '⏹ End the stream'), '', 'danger')}</div></div>
        <div class="cfp-sub">${tr('Чем дольше и удачнее стрим, тем больше награда после завершения.', 'The longer and better the stream, the bigger the reward after it ends.')}</div>${stats}`;
    }
    const go = ui.cFormat === 'stream' ? btn('contentgo', tr('▶️ Начать стрим', '▶️ Go live'), '', 'pri') : btn('contentgo', tr('📤 Опубликовать', '📤 Publish'), '', 'pri');
    return `<div class="cfp-card"><div class="cfp-h">${tr('Выйти в эфир или опубликовать', 'Go live or publish')}</div>
      <div class="cfp-sub">${tr('Место', 'Place')}</div>${chipsHtml(Object.keys(PLACES).map((k) => [k, `${PLACES[k].icon} ${pName(k)}`]), ui.cPlace, 'cplace')}
      <div class="cfp-sub">${tr('Формат', 'Format')}</div>${chipsHtml(Object.keys(FORMATS).map((k) => [k, fLabel(k)]), ui.cFormat, 'cformat')}
      <div class="cfp-reqs">📋 ${reqsFor(ui.cPlace, ui.cFormat).map(E).join(' · ')}</div>
      <div style="margin-top:8px">${go}</div></div>
      <div class="cfp-sub" style="margin-bottom:8px">${tr('Можно и не нажимать: если вы или персонаж сами включите стрим или снимете сторис в сюжете, расширение заметит это и начислит награду.', 'You do not have to press anything: if you or the character start a stream or film stories in the story, the extension notices it and gives the reward.')}</div>${stats}`;
  }

  function screenFeed(e, who) {
    const react = e.reaction ? `<div class="cfp-card cfp-react">📣 <b>${tr('Реакция аудитории', 'Audience reaction')}</b><div class="cfp-sub">${E(e.reaction.text)}</div></div>` : '';
    const log = e.log.length ? e.log.map((l) => `<div class="cfp-note">${E(l)}</div>`).join('') : empty(tr('Событий пока нет', 'No events yet'));
    return react + log;
  }

  function screenAud(e, who) {
    if (!e.career) return needCareer();
    const meters = Object.entries(SEG).map(([k, [ic, lb]]) => `<div class="cfp-sub">${ic} ${bi(lb)}: ${e.audience[k]} — ${mood(e.audience[k])}</div>${bar(e.audience[k], '#a78bfa')}`).join('<div style="height:6px"></div>');
    const cancel = e.cancel
      ? `<div class="cfp-card cfp-alert">${CANCEL[e.cancel.severity].icon} <b>${bi(CANCEL[e.cancel.severity].label)}</b>: ${E(e.cancel.reason)}<div class="cfp-sub">${tr('Осталось', 'Left')} ~${e.cancel.left} ${tr('сообщ.', 'msgs')}</div><div style="margin-top:6px">${btn('lift', tr('Снять отмену', 'Lift cancellation'))}</div></div>`
      : `<div class="cfp-card"><div class="cfp-sub">${tr('Статус: ✅ в порядке', 'Status: ✅ fine')}</div><div style="margin-top:6px">${btn('cancelbtn', tr('🚫 Отменить вручную', '🚫 Cancel manually'), '', 'danger')}</div></div>`;
    return `<div class="cfp-card"><div class="cfp-h">${tr('Настроение аудитории', 'Audience mood')}</div>${meters}</div>
      <div class="cfp-card"><div class="cfp-sub">${tr('🔥 Риск разоблачения', '🔥 Exposure risk')}: ${e.heat}%</div>${bar(e.heat, '#ef4565')}</div>
      ${e.reaction ? `<div class="cfp-card cfp-react">📣 ${E(e.reaction.text)}</div>` : ''}${cancel}`;
  }

  function screenThreats(e, who) {
    const s = S();
    if (!e.career) return needCareer();
    const hat = s.haters
      ? `<div class="cfp-card"><div class="cfp-h">😡 ${tr('Хейтеры', 'Haters')}</div><div class="cfp-sub">${tr('Уровень травли', 'Harassment level')}: ${e.haters}/100</div>${bar(e.haters, '#ef4565')}
         ${s.doxx ? `<div class="cfp-sub" style="margin-top:6px">🕵️ ${tr('Вероятность доксинга', 'Doxxing probability')}: <b>${doxxChance(e)}%</b></div>${bar(doxxChance(e), '#f97316')}
         <div class="cfp-sub" style="margin-top:6px">🔒 ${tr('Приватность', 'Privacy')}: ${e.privacy}/100</div>${bar(e.privacy, '#38bdf8')}` : `<div class="cfp-sub">${tr('Доксинг отключён в настройках', 'Doxxing is disabled in settings')}</div>`}
         <div class="cfp-sub" style="margin-top:6px">${tr('Растёт от скандалов, отмен и спорных ходов; приватность повышают задания по защите.', 'Grows with scandals, cancellations and controversial moves; privacy goes up with protection tasks.')}</div></div>`
      : `<div class="cfp-card"><div class="cfp-sub">${tr('Хейтеры отключены в настройках', 'Haters are disabled in settings')}</div></div>`;
    const crisis = s.doxx && e.doxxLeft > 0 ? `<div class="cfp-card cfp-alert">🕵️ <b>${tr('Утечка личных данных', 'Personal data leak')}</b><div class="cfp-sub">${tr('Возьмите задание по защите во вкладке «Задания».', 'Take the protection task in the “Tasks” tab.')}</div></div>` : '';
    let stalk;
    if (!s.stalkers) stalk = `<div class="cfp-card"><div class="cfp-sub">${tr('Сталкеры отключены в настройках', 'Stalkers are disabled in settings')}</div></div>`;
    else if (!s.stalkerPlate) stalk = `<div class="cfp-card"><div class="cfp-sub">${tr('Плашка сталкера выключена в настройках — он не показывается и не попадает в сюжет.', 'The stalker plate is off in settings — it is hidden and kept out of the story.')}</div></div>`;
    else if (!e.stalker) stalk = `<div class="cfp-card"><div class="cfp-h">👁️ ${tr('Сталкер', 'Stalker')}</div><div class="cfp-sub">${tr('Пока не замечен', 'None noticed so far')}</div></div>`;
    else if (e.stalkerHidden) stalk = `<div class="cfp-card"><div class="cfp-h">👁️ ${tr('Сталкер', 'Stalker')}</div><div class="cfp-sub">${tr('Плашка скрыта — сюжет его не упоминает.', 'Plate hidden — the story does not mention it.')}</div><div style="margin-top:6px">${btn('stalkshow', tr('👁️ Показать плашку', '👁️ Show plate'))}</div></div>`;
    else stalk = `<div class="cfp-card"><div class="cfp-h">👁️ ${tr('Сталкер', 'Stalker')}</div><div class="cfp-sub">${tr('Навязчивость', 'Obsession')}: ${Math.round(e.stalker.level)}/100</div>${bar(e.stalker.level, '#a855f7')}
      <div class="cfp-tb">${btn('stalkhide', tr('🙈 Скрыть плашку', '🙈 Hide plate'))}${btn('stalkresolve', tr('🛡️ Проблема решена', '🛡️ Resolved'), '', 'pri')}</div></div>`;
    const tags = e.tags.cuck
      ? `<div class="cfp-card"><div class="cfp-h">🏷️ ${tr('Ярлыки', 'Labels')}</div><div class="cfp-tags"><span>🏷️ ${tr('Куколд', 'Cuck')}${e.tags.cuck.from !== who ? ` (${E(e.tags.cuck.from)})` : ''}</span></div><div style="margin-top:6px">${btn('tagoff', tr('Убрать ярлык', 'Remove label'))}</div></div>`
      : `<div class="cfp-card"><div class="cfp-h">🏷️ ${tr('Ярлыки', 'Labels')}</div><div class="cfp-sub">${tr('Нет. Ярлык «куколд» ставится автоматически при уходе на платформу 18+.', 'None. The “cuck” label is applied automatically when going to an 18+ platform.')}</div><div style="margin-top:6px">${btn('tagon', tr('＋ Добавить вручную', '＋ Add manually'))}</div></div>`;
    return hat + crisis + stalk + tags + `<div>${btn('editthreat', tr('🛠 Изменить значения', '🛠 Edit values'))}</div>`;
  }

  function offerCard(o) {
    const tag = o.shady ? `<div class="cfp-tags"><span>⚠️ ${tr('сомнительный бренд', 'shady brand')}: ${MOVES[o.shady].icon} ${E(bi(MOVES[o.shady].name))}</span></div>` : '';
    return `<div class="cfp-card"><div class="cfp-th"><b>${o.kind === 'pr' ? '📦' : '🤝'} ${E(o.brand)}</b><span class="cfp-rew">${o.kind === 'pr' ? tr('PR-посылка', 'PR package') : money(o.pay)}</span></div>
      <div class="cfp-sub">${o.kind === 'pr' ? tr(`Хотят отправить: ${bi(o.item)}`, `They want to send: ${bi(o.item)}`) : `${fLabel(o.format)}${o.place ? ` · ${PLACES[o.place].icon} ${pName(o.place)}` : ''}`}</div>${tag}
      <div class="cfp-sub">${tr('Ответить в течение', 'Reply within')} ${o.left} ${tr('сообщ.', 'msgs')}</div>
      <div class="cfp-tb">${btn('accept', tr('✅ Принять', '✅ Accept'), o.id, 'pri')}${btn('decline', tr('✖ Отклонить', '✖ Decline'), o.id)}</div></div>`;
  }
  function screenMoney(e, who) {
    if (!e.career) return needCareer();
    const s = S();
    const inbox = e.offers.filter((o) => o.status === 'new'), parcels = e.parcels.filter((p) => p.status !== 'sold');
    const seg = `<div class="cfp-seg">${[['inbox', tr('📥 Входящие', '📥 Inbox'), inbox.length || ''], ['parcels', tr('📦 Посылки', '📦 Parcels'), parcels.length || ''], ['wallet', tr('💳 Кошелёк', '💳 Wallet'), '']]
      .map(([k, l, n]) => `<div class="${ui.mtab === k ? 'on' : ''}" data-act="mtab" data-v="${k}">${l} ${n}</div>`).join('')}</div>`;
    if (ui.mtab === 'inbox') return seg + (inbox.length ? inbox.map(offerCard).join('') : empty(tr('Новых предложений нет. Чем выше слава и репутация у брендов, тем чаще они пишут.', 'No new offers. The higher your fame and brand reputation, the more often they write.')));
    if (ui.mtab === 'parcels') {
      const st = { transit: tr('🚚 в пути', '🚚 in transit'), arrived: tr('📬 прибыла', '📬 arrived'), opened: tr('📦 распакована', '📦 unboxed'), reviewed: tr('🎬 обзор снят', '🎬 reviewed') };
      return seg + (parcels.length ? parcels.map((p) => `<div class="cfp-card"><div class="cfp-th"><b>📦 ${E(p.brand)}</b><span class="cfp-rew">${st[p.status] || p.status}</span></div>
        <div class="cfp-sub">${E(bi(p.item))} · ${tr('примерно', 'worth about')} ${money(p.value)}${p.status === 'transit' ? ` · ${tr('ещё', 'in')} ~${p.left} ${tr('сообщ.', 'msgs')}` : ''}</div>
        <div class="cfp-tb">${p.status === 'arrived' ? btn('unbox', tr('📦 Распаковать', '📦 Unbox'), p.id, 'pri') : ''}${p.status === 'arrived' || p.status === 'opened' ? btn('review', tr('🎬 Снять обзор', '🎬 Film a review'), p.id) + btn('sell', tr('💸 Продать', '💸 Sell'), p.id) : ''}</div></div>`).join('')
        : empty(tr('Посылок пока нет. Примите PR-запрос от бренда во «Входящих».', 'No parcels yet. Accept a PR request from a brand in the Inbox.')));
    }
    const nextPay = s.salaryEvery > 0 ? s.salaryEvery - (e.tickCount % s.salaryEvery) : null;
    const tx = e.wallet.length ? e.wallet.slice(0, 12).map((w) => `<div class="cfp-note">${w.amount > 0 ? '+' : ''}${money(w.amount)} — ${E(w.memo)}</div>`).join('') : `<div class="cfp-sub">${tr('Операций пока нет', 'No transactions yet')}</div>`;
    return seg + `<div class="cfp-card"><div class="cfp-h">💳 ${tr('Баланс', 'Balance')}: ${money(e.money)}</div>
      <div class="cfp-sub">${nextPay ? tr(`Следующая выплата (${bi(SALARY_LABEL[e.career])}) через ~${nextPay} сообщ.`, `Next payout (${bi(SALARY_LABEL[e.career])}) in ~${nextPay} msgs`) : tr('Автовыплаты выключены в настройках', 'Auto payouts are off in settings')}</div>
      <div class="cfp-tb">${btn('salary', tr('💵 Получить выплату сейчас', '💵 Get a payout now'), '', 'pri')}${btn('balance', tr('± Баланс', '± Balance'))}</div></div>
      <div class="cfp-card"><div class="cfp-h">${tr('Операции', 'Transactions')}</div>${tx}</div>
      <div class="cfp-card"><div class="cfp-h">🔌 Phone-ST</div>
        <div class="cfp-sub">${tr('Предложения брендов, PR-посылки и банковские уведомления приходят в Phone-ST как СМС (приложение «Сообщения»), а баланс банка обновляется тегом tel:bank, если формат распознан. Кнопка теста покажет, что именно получилось.', 'Brand offers, PR parcels and bank notices arrive in Phone-ST as SMS (the Messages app), and the bank balance is updated with a tel:bank tag when its format is recognized. The test button shows what exactly happened.')}</div>
        <div class="cfp-sub">${tr('Отправлено событий', 'Events sent')}: ${bridgeLog.length}</div>
        ${PS.last ? `<div class="cfp-sub">${E(PS.last)}</div>` : ''}
        <div class="cfp-tb">${btn('phonetest', tr('🧪 Тест: СМС и +1 в банк', '🧪 Test: SMS and +1 to the bank'), '', 'pri')}${btn('diag', tr('🔍 Диагностика', '🔍 Diagnostics'))}</div>
        ${ui.diag ? `<textarea class="cfp-in" readonly rows="9" style="font-size:10.5px">${E(ui.diag)}</textarea>` : ''}</div>`;
  }

  function screenMoves(e, who) {
    if (!e.career) return needCareer();
    const s = S(); const sg = (n) => (n >= 0 ? '+' : '') + n;
    const cards = MOVE_KEYS.map((k) => {
      const m = MOVES[k], f = effOf(e, k), ov = s.cancelChance[k];
      return `<div class="cfp-card"><div class="cfp-th"><b>${m.icon} ${E(bi(m.name))}</b></div>
        <div class="cfp-sub">⭐${sg(f.fame)} · 👥${sg(f.loyal)} · 💼${sg(f.brands)} · 📰${sg(f.public)} · 🔥+${f.heat}</div>
        <div class="cfp-row" style="margin-top:6px"><span class="cfp-sub">${tr('Шанс отмены', 'Cancel chance')}, %:</span>
          <input class="cfp-in cfp-num" type="number" min="0" max="100" data-chance="${k}" placeholder="${tr('авто', 'auto')} ${Math.round(f.p * 100)}" value="${typeof ov === 'number' ? ov : ''}">
          ${btn('move', tr('Совершить', 'Do it'), '', '', k)}</div></div>`;
    }).join('');
    const recent = e.moves.length ? `<div class="cfp-card"><div class="cfp-h">${tr('Недавние ходы', 'Recent moves')}</div>${e.moves.slice(0, 4).map((x) => `<div class="cfp-sub">${MOVES[x.type]?.icon} ${E(bi(MOVES[x.type]?.name || x.type))}${x.note ? ` — ${E(x.note)}` : ''}</div>`).join('')}</div>` : '';
    return `<div class="cfp-sub" style="margin-bottom:6px">${tr('Оценки — ориентир для вашей профессии. Поле «Шанс отмены» можно править: пусто = автоматически, число = ваш шанс (0 — никогда, 100 — всегда).', 'Estimates are a guide for your profession. The “Cancel chance” field is editable: empty = automatic, a number = your chance (0 = never, 100 = always).')}</div>` + cards +
      `<div class="cfp-card"><div class="cfp-sub">${tr('Множитель риска разоблачения (скрытая реклама, скам), %', 'Exposure risk multiplier (shady ads, scams), %')}</div><input class="cfp-in cfp-num" type="number" min="0" max="300" data-set="exposeScale" value="${s.exposeScale}"></div>` + recent;
  }

  function screenSettings() {
    const s = S();
    const chk = (k, label) => `<label class="cfp-chk"><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}><span>${label}</span></label>`;
    const sel = (k, opts) => `<select class="cfp-in" data-set="${k}">${opts.map(([v, l]) => `<option value="${v}" ${s[k] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
    const profiles = ctx().extensionSettings?.connectionManager?.profiles || [];
    const themes = `<div class="cfp-card"><div class="cfp-h">🎨 ${tr('Тема оформления', 'Theme')}</div><div class="cfp-themes">${THEMES.map(([k, n, c1, c2]) =>
      `<div class="cfp-theme ${s.theme === k ? 'on' : ''}" data-act="theme" data-v="${k}"><i style="background:linear-gradient(135deg,${c1},${c2})"></i>${bi(n)}</div>`).join('')}</div></div>`;
    return themes + `<div class="cfp-card"><div class="cfp-h">${tr('Общее', 'General')}</div>
        <div class="cfp-sub">🌐 ${tr('Язык', 'Language')}</div>${sel('lang', [['ru', 'Русский'], ['en', 'English']])}
        ${chk('enabled', tr('Расширение включено', 'Extension enabled'))}${chk('showFab', tr('Плавающая кнопка 📱', 'Floating button 📱'))}${chk('inject', tr('Передавать состояние в промпт', 'Send state to the prompt'))}
        ${chk('demandActions', tr('Награда только за действия в постах', 'Reward only for actions shown in posts'))}${chk('auto', tr('Авто-анализ после каждого ответа', 'Auto-analysis after every reply'))}
        <div class="cfp-sub" style="margin-top:8px">🔆 ${tr('Прозрачность фона: убирает цвет, текст остаётся', 'Background opacity: removes the color, text stays')}: <b id="cfp_opv">${Math.round(s.opacity * 100)}%</b></div>
        <input type="range" min="0" max="100" step="5" value="${Math.round(s.opacity * 100)}" data-set="opacity" class="cfp-range"></div>
      <div class="cfp-card"><div class="cfp-h">🛡️ ${tr('Угрозы и ярлыки', 'Threats & labels')}</div>
        ${chk('haters', tr('Хейтеры', 'Haters'))}${chk('doxx', tr('Доксинг (вероятность и последствия)', 'Doxxing (probability and consequences)'))}
        ${chk('stalkers', tr('Сталкеры', 'Stalkers'))}${chk('stalkerPlate', tr('Показывать плашку сталкера и упоминать его в сюжете', 'Show the stalker plate and mention it in the story'))}
        <div class="cfp-sub">${tr('Как часто появляются сталкеры', 'How often stalkers appear')}</div>${sel('stalkerFreq', [['rare', tr('Редко', 'Rarely')], ['normal', tr('Обычно', 'Normal')], ['often', tr('Часто', 'Often')]])}
        ${chk('cuckTag', tr('Ярлык «куколд» при уходе на платформу 18+', '“Cuck” label when going to an 18+ platform'))}
        <div class="cfp-sub">${tr('Кому ставить ярлык', 'Who gets the label')}</div>${sel('cuckTarget', [['self', tr('Тому, кто ушёл', 'The one who went')], ['partner', tr('Партнёру (второму участнику)', 'The partner (the other participant)')]])}</div>
      <div class="cfp-card"><div class="cfp-h">💰 ${tr('Деньги и бренды', 'Money & brands')}</div>
        <div class="cfp-sub">${tr('Валюта (символ)', 'Currency symbol')}</div><input class="cfp-in" data-set="currency" value="${E(s.currency)}">
        <div class="cfp-sub">${tr('Выплата каждые N сообщений (0 — выключено)', 'Payout every N messages (0 = off)')}</div><input class="cfp-in cfp-num" type="number" min="0" max="500" data-set="salaryEvery" value="${s.salaryEvery}">
        ${chk('brandOffers', tr('Предложения и PR-запросы от брендов', 'Brand offers and PR requests'))}
        <div class="cfp-sub">${tr('Как часто бренды пишут', 'How often brands write')}</div>${sel('offerFreq', [['rare', tr('Редко', 'Rarely')], ['normal', tr('Обычно', 'Normal')], ['often', tr('Часто', 'Often')]])}
        ${chk('phoneSms', tr('Присылать в Phone-ST СМС (бренды, банк, посылки) для {{user}}', 'Send SMS to Phone-ST (brands, bank, parcels) for {{user}}'))}
        ${chk('phoneBank', tr('Обновлять баланс банка Phone-ST (тег tel:bank)', 'Update the Phone-ST bank balance (tel:bank tag)'))}
        ${chk('banners', tr('Баннеры-уведомления о деньгах и брендах', 'Banner notifications about money and brands'))}
        ${chk('bridgeEvents', tr('Отправлять события в Phone-ST и другие расширения', 'Send events to Phone-ST and other extensions'))}
        ${chk('bridgePrompt', tr('Упоминать уведомления телефона в сюжете', 'Mention phone notifications in the story'))}</div>
      <div class="cfp-card"><div class="cfp-h">${tr('Модель для анализа и заданий', 'Model for analysis and tasks')}</div>
        <select class="cfp-in" data-set="mode">
          <option value="current" ${s.mode === 'current' ? 'selected' : ''}>${tr('Текущее подключение (без настройки)', 'Current connection (no setup)')}</option>
          <option value="profile" ${s.mode === 'profile' ? 'selected' : ''}>${tr('Connection Profile (ключ в профиле)', 'Connection Profile (key is in the profile)')}</option>
          <option value="endpoint" ${s.mode === 'endpoint' ? 'selected' : ''}>${tr('Свой endpoint / роутер (ключ необязателен)', 'Custom endpoint / router (key optional)')}</option>
        </select>
        ${s.mode === 'profile' ? `<select class="cfp-in" data-set="profileId"><option value="">${tr('— выбрать профиль —', '— choose a profile —')}</option>${profiles.map((p) => `<option value="${E(p.id)}" ${p.id === s.profileId ? 'selected' : ''}>${E(p.name)}</option>`).join('')}</select>` : ''}
        ${s.mode === 'endpoint' ? `<input class="cfp-in" data-set="endpointUrl" placeholder="URL, e.g. http://localhost:4000/v1" value="${E(s.endpointUrl)}">
          <input class="cfp-in" type="password" data-set="endpointKey" placeholder="${tr('API-ключ (необязательно)', 'API key (optional)')}" value="${E(s.endpointKey)}">
          <input class="cfp-in" data-set="endpointModel" list="cfp_models" placeholder="${tr('ID модели', 'Model ID')}" value="${E(s.endpointModel)}">
          <datalist id="cfp_models">${ui.models.map((m) => `<option value="${E(m)}"></option>`).join('')}</datalist>
          ${btn('loadmodels', tr('⟳ Загрузить список моделей', '⟳ Load the model list'))}` : ''}</div>
      <div class="cfp-card"><div class="cfp-row">${btn('analyze', ui.busy ? tr('⏳ Анализ…', '⏳ Analyzing…') : tr('🔍 Проанализировать сейчас', '🔍 Analyze now'), '', 'pri')}${btn('reset', tr('🗑 Сбросить чат', '🗑 Reset chat'), '', 'danger')}</div></div>`;
  }

  function renderPhone() {
    const root = document.getElementById('cf_phone');
    if (!root) return;
    const prevBody = root.querySelector ? root.querySelector('.cfp-body') : null;
    const prevScroll = prevBody && prevBody.dataset?.screen === ui.screen ? prevBody.scrollTop : 0;
    const who = curWho(); const e = who ? ent(who) : null;
    let body;
    if (!S().enabled) body = empty(tr('Расширение выключено', 'Extension is off'), `<div>${btn('open', tr('⚙️ Настройки', '⚙️ Settings'), '', '', 'settings')}</div>`);
    else if (ui.screen === 'settings') body = screenSettings();
    else if (!e) body = empty(tr('Откройте чат с персонажем', 'Open a chat with a character'));
    else body = ({ home: screenHome, content: screenContent, career: screenCareer, tasks: screenTasks, feed: screenFeed, aud: screenAud, threats: screenThreats, moves: screenMoves, money: screenMoney }[ui.screen] || screenHome)(e, who);
    const whoBar = e && ui.screen !== 'settings' && S().enabled
      ? `<div class="cfp-who">${names().map((n) => `<div class="cfp-pill ${n === who ? 'on' : ''}" data-act="who" data-v="${E(n)}">${iconOf(ent(n))} ${E(n)}</div>`).join('')}</div>` : '';
    const pct = Math.round(S().opacity * 100);
    root.innerHTML = `<div class="cfp-notch"></div>
      <div class="cfp-status"><span class="cfp-time">${clock()}</span>
        <span class="cfp-opw" title="${tr('Прозрачность фона', 'Background opacity')}">🔆<input class="cfp-op" type="range" min="0" max="100" step="5" value="${pct}" data-set="opacity"><small id="cfp_opb">${pct}%</small></span>
        <span class="cfp-sig">📶 🔋</span></div>
      <div class="cfp-title">${ui.screen !== 'home' ? '<span class="cfp-back" data-act="home">‹</span>' : '<span class="cfp-back"></span>'}<b>${bi(TITLES[ui.screen] || '')}</b><span class="cfp-x" data-act="close">✕</span></div>
      ${whoBar}<div class="cfp-body" data-screen="${ui.screen}">${body}</div><div class="cfp-homebar" data-act="home"><i></i></div>`;
    if (root.setAttribute) root.setAttribute('data-theme', S().theme || 'midnight');
    const nb = root.querySelector ? root.querySelector('.cfp-body') : null;
    if (nb && prevScroll) nb.scrollTop = prevScroll;
  }

  function updateFab() {
    const fab = document.getElementById('cf_fab');
    if (!fab) return;
    const s = S();
    fab.style.display = s.enabled && s.showFab ? 'flex' : 'none';
    let n = 0, cancelled = false, live = false;
    for (const nm of names()) { const e = ent(nm); n += e.tasks.filter((t) => t.active && !t.done).length; if (e.cancel) cancelled = true; if (e.live) live = true; }
    const b = fab.querySelector('.cf-badge');
    if (b) { b.textContent = cancelled ? '🚫' : live ? '🔴' : (n || ''); b.style.display = cancelled || live || n ? 'flex' : 'none'; }
  }
  function applyOpacity() { document.documentElement.style.setProperty('--cfp-a', String(S().opacity)); }
  function placePhone() {
    const phone = document.getElementById('cf_phone'), fab = document.getElementById('cf_fab');
    if (!phone) return;
    const pw = Math.min(350, window.innerWidth * 0.96), ph = Math.min(640, window.innerHeight - 16);
    const f = fab && fab.getBoundingClientRect().width ? fab.getBoundingClientRect() : { left: window.innerWidth - 70, right: window.innerWidth - 16, top: window.innerHeight - 140, bottom: window.innerHeight - 86 };
    const left = clamp(f.right - pw, 8, window.innerWidth - pw - 8);
    let top = f.top - ph - 10;
    if (top < 8) top = Math.min(f.bottom + 10, window.innerHeight - ph - 8);
    top = clamp(top, 8, window.innerHeight - ph - 8);
    Object.assign(phone.style, { left: left + 'px', top: top + 'px', width: pw + 'px', height: ph + 'px' });
  }
  function setOpen(v) {
    ui.open = v;
    const phone = document.getElementById('cf_phone');
    if (!phone) return;
    phone.classList.toggle('open', v);
    if (v) { placePhone(); renderPhone(); }
  }
  function commit() {
    try { saveChat(); } catch (err) { console.error('[Career&Fame] save', err); }
    renderPhone(); updatePrompt(); updateFab();
  }
  async function safe(fn) {
    try { await fn(); } catch (err) { console.error('[Career&Fame]', err); toastr.error(String(err.message || err), 'Career & Fame'); }
  }
  async function busy(fn) {
    ui.busy = true; renderPhone();
    try { await fn(); } catch (err) { console.error('[Career&Fame]', err); toastr.error(String(err.message || err), 'Career & Fame'); }
    finally { ui.busy = false; commit(); }
  }
  function setLang(l) {
    S().lang = l === 'en' ? 'en' : 'ru'; saveSettings();
    renderPhone(); updatePrompt(); buildDrawer();
  }

  async function onClick(ev) {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.getAttribute('data-act'), v = el.getAttribute('data-v'), id = el.getAttribute('data-id');
    if (act === 'close') return setOpen(false);
    if (act === 'home') { ui.screen = 'home'; ui.form = false; return renderPhone(); }
    if (act === 'lang') return setLang(LANG() === 'ru' ? 'en' : 'ru');
    if (ui.busy) return;
    const who = curWho(); const e = who ? ent(who) : null;
    switch (act) {
      case 'open': ui.screen = v; ui.form = false; renderPhone(); break;
      case 'who': ui.who = v; renderPhone(); break;
      case 'tab': ui.tab = v; renderPhone(); break;
      case 'career': if (e) { switchCareer(who, e, v); commit(); } break;
      case 'take': if (e && acceptTask(who, e, id)) ui.tab = 'work'; commit(); break;
      case 'drop': if (e) dropTask(who, e, id); commit(); break;
      case 'done': if (e) completeTask(who, e, id); commit(); break;
      case 'del': if (e) e.tasks = e.tasks.filter((t) => t.id !== id); commit(); break;
      case 'cplace': ui.cPlace = v; renderPhone(); break;
      case 'cformat': ui.cFormat = v; renderPhone(); break;
      case 'contentgo': if (e) { applyContent(who, e, { format: ui.cFormat, place: ui.cPlace, action: ui.cFormat === 'stream' ? 'start' : 'single', quality: 3, force: true }); commit(); } break;
      case 'contentstop': if (e && e.live) { endLive(who, e, 3); commit(); } break;
      case 'pickplace': ui.pickPlace = v; renderPhone(); break;
      case 'pickformat': ui.pickFormat = v; renderPhone(); break;
      case 'newtask': if (e) await busy(() => genTask(who, { place: ui.pickPlace, format: ui.pickFormat })); break;
      case 'addform': ui.form = !ui.form; renderPhone(); break;
      case 'submitform': {
        const q = (i) => document.getElementById(i)?.value ?? '';
        const title = q('cff_title').trim();
        if (!title) { toastr.warning(tr('Введите название задания', 'Enter a task title'), 'Career & Fame'); break; }
        const nt = { id: uid(), type: 'task', src: 'manual', career: e.career, title, desc: q('cff_desc').trim(), steps: [],
          xp: clamp(parseInt(q('cff_xp')) || 25, 0, 200), fame: clamp(parseInt(q('cff_fame')) || 0, 0, 200), done: false, active: false, progress: 0 };
        if (hasPlaces(e)) { nt.place = PLACES[q('cff_place')] ? q('cff_place') : 'home'; nt.format = FORMATS[q('cff_format')] ? q('cff_format') : 'video'; nt.reqs = reqsFor(nt.place, nt.format); }
        e.tasks.push(nt);
        ui.form = false; ui.tab = 'avail'; commit();
        genStepsFor(who, nt.id).catch((err) => console.warn('[Career&Fame] default steps:', err.message)).finally(commit);
        break;
      }
      case 'lift': if (e) liftCancel(who, e); commit(); break;
      case 'cancelbtn': {
        const reason = prompt(tr('За что отмена?', 'Why is the cancellation?')); if (!reason) break;
        applyCancel(who, e, prompt(tr('Степень 1–3 (1 скандал, 2 отмена, 3 тотальная):', 'Severity 1–3 (1 scandal, 2 cancelled, 3 total):'), '2'), reason); commit(); break;
      }
      case 'xp':
        gainXp(who, e, parseInt(prompt(tr('Изменить опыт на (±):', 'Change XP by (±):'), '20')) || 0);
        gainFame(e, parseInt(prompt(tr('Изменить славу на (±):', 'Change fame by (±):'), '10')) || 0); commit(); break;
      case 'move':
        if (e && MOVES[v] && confirm(tr(`Совершить: ${bi(MOVES[v].name)}?`, `Do: ${bi(MOVES[v].name)}?`))) { applyMove(who, e, v, tr('вручную', 'manual')); ui.screen = 'feed'; commit(); }
        break;
      case 'theme': S().theme = v; saveSettings(); renderPhone(); break;
      case 'mtab': ui.mtab = v; renderPhone(); break;
      case 'accept': if (e && acceptOffer(who, e, id)) { ui.mtab = 'inbox'; } commit(); break;
      case 'decline': if (e) declineOffer(who, e, id); commit(); break;
      case 'unbox': case 'review': case 'sell': if (e) parcelAct(who, e, id, act); commit(); break;
      case 'salary': if (e) { paySalary(who, e); commit(); } break;
      case 'balance': { const a = parseInt(prompt(tr('Изменить баланс на (±):', 'Change balance by (±):'), '100')); if (a && e) { deposit(who, e, a, tr('Ручная корректировка', 'Manual adjustment'), 'adjust'); commit(); } break; }
      case 'diag': ui.diag = tr('Собираю данные…', 'Collecting…'); renderPhone(); ui.diag = await diagnoseFull(); console.log('[Career&Fame]\n' + ui.diag); renderPhone(); break;
      case 'phonetest': {
        ui.diag = tr('Отправляю тестовое СМС и запись в банк…', 'Sending a test SMS and bank entry…'); renderPhone(); PS.last = '';
        await phoneDeliver('money', { who: ctx().name1, amount: 1, balance: ent(ctx().name1).money, memo: 'Career & Fame test' });
        ui.diag = (PS.last || '—') + '\n\n' + await diagnoseFull(); renderPhone(); break;
      }
      case 'stalkhide': if (e) { e.stalkerHidden = true; commit(); } break;
      case 'stalkshow': if (e) { e.stalkerHidden = false; commit(); } break;
      case 'stalkresolve': if (e) { e.stalker = null; e.stalkerCool = 60; e.stalkerHidden = false; e.tasks.forEach((t) => { if (t.type === 'stalker') t.done = true; }); addLog(e, tr('🛡️ Сталкер больше не беспокоит', '🛡️ The stalker no longer bothers you')); commit(); } break;
      case 'tagoff': if (e) { delete e.tags.cuck; commit(); } break;
      case 'tagon': if (e) { e.tags.cuck = { from: who }; commit(); } break;
      case 'editthreat': {
        const h = prompt(tr('Уровень хейтеров 0–100:', 'Haters level 0–100:'), String(e.haters)); if (h === null) break;
        const p = prompt(tr('Приватность 0–100:', 'Privacy 0–100:'), String(e.privacy)); if (p === null) break;
        e.haters = clamp(parseInt(h) || 0, 0, 100); e.privacy = clamp(parseInt(p) || 0, 0, 100); commit(); break;
      }
      case 'analyze': await busy(() => analyze(true)); break;
      case 'reset':
        if (confirm(tr('Сбросить всю карьеру в этом чате?', 'Reset all career data in this chat?'))) { ctx().chatMetadata[MODULE] = { entities: {} }; commit(); }
        break;
      case 'loadmodels': await safe(async () => {
        const s = S();
        const res = await fetch(s.endpointUrl.replace(/\/$/, '') + '/models', { headers: s.endpointKey ? { Authorization: `Bearer ${s.endpointKey}` } : {} });
        if (!res.ok) throw new Error(tr(`Не удалось получить модели: ${res.status}`, `Could not get models: ${res.status}`));
        const j = await res.json();
        ui.models = (j.data || j.models || []).map((m) => m.id || m.name || m);
        toastr.success(tr(`Моделей: ${ui.models.length}`, `Models: ${ui.models.length}`), 'Career & Fame'); renderPhone();
      }); break;
    }
  }
  function syncOpacityUI() {
    const pct = Math.round(S().opacity * 100);
    const a = document.getElementById('cfp_opv'); if (a) a.textContent = pct + '%';
    const b = document.getElementById('cfp_opb'); if (b) b.textContent = pct + '%';
    document.querySelectorAll && document.querySelectorAll('[data-set="opacity"], #cf_d_op').forEach((i) => { if (i.value != pct) i.value = pct; });
  }
  function onInput(ev) {
    const el = ev.target, k = el.getAttribute && el.getAttribute('data-set');
    if (!k || el.type === 'checkbox' || el.tagName === 'SELECT') return;
    const s = S();
    if (k === 'opacity') { s.opacity = clamp(parseInt(el.value) / 100, 0, 1); applyOpacity(); syncOpacityUI(); }
    else if (k === 'exposeScale') s[k] = clamp(parseInt(el.value) || 0, 0, 300);
    else if (k === 'salaryEvery') s[k] = clamp(parseInt(el.value) || 0, 0, 500);
    else s[k] = el.value;
    saveSettings();
  }
  function onChange(ev) {
    const el = ev.target; if (!el.getAttribute) return;
    const ck = el.getAttribute('data-chance');
    if (ck) {
      const s = S();
      if (el.value === '') delete s.cancelChance[ck]; else s.cancelChance[ck] = clamp(parseInt(el.value) || 0, 0, 100);
      saveSettings(); renderPhone(); return;
    }
    const k = el.getAttribute('data-set');
    if (!k || k === 'opacity' || k === 'exposeScale' || k === 'salaryEvery' || k === 'currency') return;
    const s = S();
    if (el.type === 'checkbox') s[k] = el.checked; else s[k] = el.value;
    saveSettings();
    if (k === 'lang') return setLang(s.lang);
    syncDrawer();
    updateFab(); updatePrompt(); renderPhone();
  }

  function initFab() {
    const fab = document.getElementById('cf_fab'), s = S();
    if (s.fabX !== null && s.fabY !== null) Object.assign(fab.style, { left: clamp(s.fabX, 0, window.innerWidth - 40) + 'px', top: clamp(s.fabY, 0, window.innerHeight - 52) + 'px', right: 'auto', bottom: 'auto' });
    let drag = null;
    fab.addEventListener('pointerdown', (ev) => { drag = { x: ev.clientX, y: ev.clientY, l: fab.offsetLeft, t: fab.offsetTop, moved: false }; try { fab.setPointerCapture(ev.pointerId); } catch (_) {} });
    fab.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      Object.assign(fab.style, { left: clamp(drag.l + dx, 0, window.innerWidth - fab.offsetWidth) + 'px', top: clamp(drag.t + dy, 0, window.innerHeight - fab.offsetHeight) + 'px', right: 'auto', bottom: 'auto' });
      if (ui.open) placePhone();
    });
    fab.addEventListener('pointerup', () => {
      if (!drag) return;
      if (drag.moved) { const s2 = S(); s2.fabX = fab.offsetLeft; s2.fabY = fab.offsetTop; saveSettings(); } else setOpen(!ui.open);
      drag = null;
    });
    window.addEventListener('resize', () => { if (ui.open) placePhone(); });
  }

  function syncDrawer() {
    const s = S();
    if (typeof $ === 'undefined') return;
    $('#cf_d_enabled').prop('checked', s.enabled); $('#cf_d_fab').prop('checked', s.showFab); $('#cf_d_op').val(Math.round(s.opacity * 100)); $('#cf_d_lang').val(s.lang);
  }
  function buildDrawer() {
    if (typeof $ === 'undefined' || !$('#cf_drawer_body').length) return;
    $('#cf_drawer_body').html(`
      <label class="checkbox_label"><input type="checkbox" id="cf_d_enabled"><span>${tr('Включено', 'Enabled')}</span></label>
      <label class="checkbox_label"><input type="checkbox" id="cf_d_fab"><span>${tr('Плавающая кнопка 📱', 'Floating button 📱')}</span></label>
      <label>🌐 ${tr('Язык', 'Language')}</label><select id="cf_d_lang" class="text_pole"><option value="ru">Русский</option><option value="en">English</option></select>
      <label>${tr('Прозрачность фона телефона (текст остаётся)', 'Phone background opacity (text stays)')}</label><input type="range" id="cf_d_op" min="0" max="100" step="5" style="width:100%">
      <div class="menu_button" id="cf_d_open">📱 ${tr('Открыть телефон', 'Open the phone')}</div>
      <small>${tr('Остальные настройки (модель, угрозы, ярлыки, шанс отмены) — в приложениях внутри телефона.', 'Other settings (model, threats, labels, cancel chance) are inside the phone apps.')}</small>`);
    syncDrawer();
    const s = S();
    $('#cf_d_enabled').on('change', function () { s.enabled = this.checked; saveSettings(); updateFab(); updatePrompt(); renderPhone(); });
    $('#cf_d_fab').on('change', function () { s.showFab = this.checked; saveSettings(); updateFab(); });
    $('#cf_d_lang').on('change', function () { setLang(this.value); });
    $('#cf_d_op').on('input', function () { s.opacity = clamp(parseInt(this.value) / 100, 0, 1); applyOpacity(); saveSettings(); syncOpacityUI(); });
    $('#cf_d_open').on('click', () => setOpen(true));
  }
  function mountUI() {
    document.body.insertAdjacentHTML('beforeend', `<div id="cf_fab" title="Career & Fame"><svg viewBox="0 0 24 40" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5.2" r="3.1"/><path d="M8.3 9.6c0-.9 1.1-1.4 3.7-1.4s3.7.5 3.7 1.4l-.5 9.6c-.1 1.2-.7 2.3-1.6 3.2l.7 5.2H9.7l.7-5.2c-.9-.9-1.5-2-1.6-3.2z"/><path d="M6.6 28.6h10.8l1.1 3.4H5.5z"/><rect x="4" y="32.6" width="16" height="4.6" rx="1.3"/><path d="M12 10.6v11" stroke="rgba(255,255,255,.5)" stroke-width=".9" stroke-linecap="round" fill="none"/></svg><span class="cf-badge"></span></div><div id="cf_phone" class="cf-phone" data-theme="${S().theme || 'midnight'}"></div>`);
    const phone = document.getElementById('cf_phone');
    phone.addEventListener('click', (ev) => safe(() => onClick(ev)));
    phone.addEventListener('input', onInput);
    phone.addEventListener('change', onChange);
    initFab(); applyOpacity(); updateFab();
    setInterval(() => { const t = document.querySelector('#cf_phone .cfp-time'); if (t) t.textContent = clock(); }, 30000);
    $('#extensions_settings2').append(`<div class="extension_container"><div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header"><b>🌟 Career &amp; Fame</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
      <div class="inline-drawer-content" id="cf_drawer_body"></div></div></div>`);
    buildDrawer();
  }

  /* =====================  СОБЫТИЯ  ===================== */
  // Публичный API для других расширений (например, Phone-ST)
  try {
    window.CareerFame = {
      version: '3.4.0',
      onEvent(cb) { if (typeof cb === 'function') { bridgeListeners.push(cb); return () => { const i = bridgeListeners.indexOf(cb); if (i >= 0) bridgeListeners.splice(i, 1); }; } },
      getState(name) { return JSON.parse(JSON.stringify(ent(name || ctx().name1))); },
      getWallet(name) { const e = ent(name || ctx().name1); return { balance: e.money, currency: S().currency, transactions: JSON.parse(JSON.stringify(e.wallet)) }; },
      getOffers(name) { return JSON.parse(JSON.stringify(ent(name || ctx().name1).offers)); },
      getParcels(name) { return JSON.parse(JSON.stringify(ent(name || ctx().name1).parcels)); },
      events: ['money', 'offer', 'offer_accepted', 'parcel', 'deal'],
    };
  } catch (_) { /* ignore */ }
  if (globalThis.__CF_TEST__) globalThis.__CF_TEST__.api = { ent, genTask, acceptTask, dropTask, completeTask, analyze, applyMove, applyContent, endLive, applyCancel, tickTurn, renderPhone, onClick, onChange, ui, S, updatePrompt, uid, switchCareer, startDoxx, spawnStalker, doxxChance, setLang, chanceOf, MOVES, genOffer, acceptOffer, declineOffer, parcelAct, paySalary, deposit, diagnose, bridgeLog, phoneDeliver, diagnoseFull, PS, parseBankRule, learnBankTag };
  jQuery(() => {
    const c = ctx();
    mountUI(); updatePrompt(); renderPhone();
    c.eventSource.on(c.event_types.CHAT_CHANGED, () => { renderPhone(); updatePrompt(); updateFab(); });
    c.eventSource.on(c.event_types.MESSAGE_RECEIVED, () => {
      if (!S().enabled) return;
      if (tickTurn()) { try { saveChat(); } catch (_) {} renderPhone(); updateFab(); }
      updatePrompt();
      if (S().auto) safe(() => analyze(false));
    });
  });
})();
