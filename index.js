(() => {
  const MODULE = 'career_fame';
  const ctx = () => SillyTavern.getContext();

  /* =====================  ДАННЫЕ  ===================== */
  const CAREERS = {
    blogger:  { icon: '📱', name: 'Блогер',    ladder: ['Начинающий блогер', 'Автор с аудиторией', 'Известный блогер', 'Инфлюенсер', 'Топ-блогер', 'Икона интернета'] },
    streamer: { icon: '🎮', name: 'Стример',   ladder: ['Стример-новичок', 'Постоянный стример', 'Партнёр платформы', 'Звезда стримов', 'Топ-стример', 'Легенда стриминга'] },
    actor:    { icon: '🎬', name: 'Актёр',     ladder: ['Актёр массовки', 'Эпизодический актёр', 'Актёр второго плана', 'Ведущий актёр', 'Звезда кино', 'Икона Голливуда'] },
    musician: { icon: '🎤', name: 'Музыкант',  ladder: ['Уличный музыкант', 'Игрок клубов', 'Локальный артист', 'Артист лейбла', 'Хедлайнер', 'Легенда сцены'] },
    athlete:  { icon: '🏅', name: 'Спортсмен', ladder: ['Любитель', 'Подающий надежды', 'Профессионал', 'Чемпион региона', 'Звезда лиги', 'Живая легенда спорта'] },
  };
  const LEVEL_ICONS = ['🌱', '🌿', '🌳', '⭐', '🌟', '👑'];
  const FAME_TIERS = [
    [0, '⚪', 'Никому не известен'], [50, '🌱', 'Узнают друзья'], [150, '📍', 'Местная известность'],
    [350, '⭐', 'Растущая звезда'], [600, '🌟', 'Знаменитость'], [850, '🔥', 'Мега-звезда'], [980, '👑', 'Легенда'],
  ];
  const CANCEL = {
    1: { icon: '⚠️', turns: 10, fame: -60,  label: 'Скандал' },
    2: { icon: '🚫', turns: 25, fame: -150, label: 'Отмена' },
    3: { icon: '☠️', turns: 50, fame: -350, label: 'Тотальная отмена' },
  };
  const SEG = { loyal: ['👥', 'Фанаты'], brands: ['💼', 'Бренды и спонсоры'], public: ['📰', 'Публика и СМИ'] };
  const MOODS = [[20, 'враждебны'], [40, 'недовольны'], [60, 'нейтральны'], [80, 'довольны'], [101, 'в восторге']];
  const mood = (v) => MOODS.find(([m]) => v < m)[1];

  const MOVES = {
    adult: { icon: '🔞', name: 'уход на платформу 18+ (OnlyFans и т.п.)',
      base: { fame: 30, loyal: -5, brands: -25, public: -10, heat: 0, p: 0.2, sev: 1 },
      career: {
        blogger:  { fame: 40, brands: -20 },
        streamer: { loyal: -10, brands: -30 },
        actor:    { fame: 20, brands: -30, public: -15, p: 0.3 },
        musician: { fame: 35, loyal: 5, brands: -15, public: -5, p: 0.1 },
        athlete:  { fame: 25, loyal: -15, brands: -45, public: -20, p: 0.4, sev: 2 },
      },
      r: { loyalPos: 'часть фанатов поддерживает выбор и донатит', loyalNeg: 'фанаты спорят: «продался», кто-то отписывается',
           brandsPos: 'нишевые бренды и агентства сами пишут с предложениями', brandsNeg: 'спонсоры тихо замораживают контракты',
           publicPos: 'интернет шутит и обсуждает, охваты растут', publicNeg: 'СМИ и комментаторы осуждают, звучат упрёки в «падении»' } },
    casino: { icon: '🎰', name: 'реклама казино / лутбоксов / ставок',
      base: { fame: 20, loyal: -20, brands: 10, public: -25, heat: 35, p: 0.35, sev: 2 },
      career: {
        streamer: { loyal: -25, public: -30, heat: 45, p: 0.45 },
        blogger:  { loyal: -22 },
        actor:    { brands: -10, p: 0.3 },
        musician: { loyal: -10, public: -15, p: 0.25 },
        athlete:  { brands: -40, p: 0.5 },
      },
      r: { loyalPos: 'часть аудитории в азарте и просит промокоды', loyalNeg: 'фанаты разочарованы рекламой казино: «зачем ты это пиаришь»',
           brandsPos: 'букмекеры и гемблинг-партнёры предлагают крупные контракты', brandsNeg: 'приличные бренды разрывают сотрудничество',
           publicPos: 'публика равнодушно пожимает плечами', publicNeg: 'пресса и родители поднимают тему игровой зависимости' } },
    scam: { icon: '🕳️', name: 'реклама скамеров / мошеннических проектов',
      base: { fame: 15, loyal: -35, brands: -30, public: -40, heat: 60, p: 0.5, sev: 3 },
      career: { blogger: { loyal: -40 }, streamer: { loyal: -40 }, athlete: { brands: -40 } },
      r: { loyalPos: 'самые преданные пока защищают: «может, он не знал»', loyalNeg: 'подписчики злятся, что их втянули, и требуют вернуть деньги',
           brandsPos: 'сомнительные «партнёры» радостно предлагают новые сделки', brandsNeg: 'честные бренды мгновенно дистанцируются',
           publicPos: 'шум привлёк внимание', publicNeg: 'расследователи и СМИ копают, в сети разбирают схему' } },
    crypto: { icon: '🪙', name: 'реклама крипто-пирамид / памп-схем',
      base: { fame: 20, loyal: -25, brands: -15, public: -30, heat: 50, p: 0.45, sev: 2 },
      career: { streamer: { loyal: -20 }, musician: { loyal: -15 } },
      r: { loyalPos: 'часть фанатов ждёт быстрой прибыли и хайпит', loyalNeg: 'подписчики боятся потерять вложения и обвиняют в памп-схеме',
           brandsPos: 'крипто-проекты предлагают контракты', brandsNeg: 'банки и серьёзные спонсоры отходят',
           publicPos: 'тема взлетает в трендах', publicNeg: 'аналитики и СМИ называют это пирамидой' } },
    fake: { icon: '🎁', name: 'фейковые розыгрыши / накрутка',
      base: { fame: 25, loyal: -15, brands: -10, public: -20, heat: 40, p: 0.3, sev: 1 },
      career: { streamer: { fame: 30 }, blogger: { fame: 30 } },
      r: { loyalPos: 'фанаты радуются «розыгрышу» и ставят лайки', loyalNeg: 'участники подозревают обман и пишут жалобы',
           brandsPos: 'рекламодатели довольны цифрами охвата', brandsNeg: 'бренды замечают накрутку и пересматривают договор',
           publicPos: 'охваты растут, обсуждают призы', publicNeg: 'блогеры-разоблачители выкладывают разбор' } },
  };
  const MOVE_KEYS = Object.keys(MOVES);

  const DEFAULTS = {
    enabled: true, inject: true, auto: true, demandActions: true,
    showFab: true, opacity: 0.95, fabX: null, fabY: null,
    mode: 'current', profileId: '',
    endpointUrl: 'http://localhost:4000/v1', endpointKey: '', endpointModel: '',
  };

  const xpNeeded = (lvl) => Math.round(100 * Math.pow(lvl, 1.4));
  const fameRow = (f) => [...FAME_TIERS].reverse().find(([min]) => f >= min);
  const fameTier = (f) => fameRow(f)[2];
  const fameIcon = (f) => fameRow(f)[1];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const uid = () => 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function S() {
    const { extensionSettings } = ctx();
    if (!extensionSettings[MODULE]) extensionSettings[MODULE] = {};
    for (const k of Object.keys(DEFAULTS)) if (extensionSettings[MODULE][k] === undefined) extensionSettings[MODULE][k] = DEFAULTS[k];
    return extensionSettings[MODULE];
  }
  const saveSettings = () => ctx().saveSettingsDebounced();
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
  function ent(name) {
    const st = chatState();
    if (!st.entities[name]) st.entities[name] = { career: null, level: 1, xp: 0, fame: 0, cancel: null, tasks: [], log: [] };
    const e = st.entities[name];
    if (e.career && !CAREERS[e.career]) { e.career = null; e.level = 1; e.xp = 0; }
    if (!e.audience) e.audience = { loyal: 50, brands: 50, public: 50 };
    if (e.heat === undefined) e.heat = 0;
    if (!e.moves) e.moves = [];
    if (e.reaction === undefined) e.reaction = null;
    return e;
  }
  const careerOf = (e) => (e.career && CAREERS[e.career]) || null;
  const maxLevel = (e) => (careerOf(e) ? careerOf(e).ladder.length : 1);
  const titleOf = (e) => { const c = careerOf(e); return c ? c.ladder[clamp(e.level, 1, c.ladder.length) - 1] : 'Без карьеры'; };
  const iconOf = (e) => (careerOf(e) ? careerOf(e).icon : '💼');
  const addLog = (e, text) => { e.log.unshift(text); e.log = e.log.slice(0, 40); };

  /* =====================  ЛОГИКА  ===================== */
  function gainXp(name, e, amount) {
    if (!e.career) return;
    if (e.cancel && amount > 0) amount = Math.floor(amount / 2);
    e.xp += amount;
    while (e.level < maxLevel(e) && e.xp >= xpNeeded(e.level)) {
      e.xp -= xpNeeded(e.level); e.level++;
      addLog(e, `⬆️ Уровень ${e.level}: ${titleOf(e)}`);
      toastr.success(`${iconOf(e)} ${name}: ${titleOf(e)} (ур. ${e.level})`, 'Career & Fame');
    }
    while (e.xp < 0) {
      if (e.level > 1) { e.level--; e.xp += xpNeeded(e.level); addLog(e, `⬇️ Понижение до уровня ${e.level}`); toastr.warning(`${name} понижен(а): ${titleOf(e)}`, 'Career & Fame'); }
      else e.xp = 0;
    }
    if (e.level >= maxLevel(e)) e.xp = Math.min(e.xp, xpNeeded(e.level) - 1);
  }
  function gainFame(e, amount) {
    if (e.cancel && amount > 0) amount = 0;
    if (e.audience && e.audience.loyal < 20 && amount > 0) amount = Math.floor(amount / 2);
    e.fame = clamp(e.fame + amount, 0, 1000);
  }
  function applyCancel(name, e, severity, reason) {
    const sev = clamp(parseInt(severity) || 1, 1, 3); const cfg = CANCEL[sev];
    e.cancel = { severity: sev, reason: reason || 'неизвестно', left: cfg.turns };
    e.fame = clamp(e.fame + cfg.fame, 0, 1000);
    if (sev === 3 && e.level > 1) gainXp(name, e, -Math.round(xpNeeded(e.level - 1) * 0.5));
    if (!e.tasks.some((t) => t.type === 'apology' && !t.done)) {
      e.tasks.push({ id: uid(), type: 'apology', src: 'system', title: 'Публичные извинения', desc: 'Загладить вину перед публикой', steps: ['Признать ошибку', 'Публично извиниться', 'Показать, что выводы сделаны'], xp: 20 * sev, fame: 0, done: false, active: true, progress: 0 });
    }
    addLog(e, `${cfg.icon} ${cfg.label} (ст. ${sev}): ${e.cancel.reason}`);
    toastr.error(`${cfg.icon} ${name}: ${cfg.label} — ${e.cancel.reason}`, 'Career & Fame');
  }
  function liftCancel(name, e, why) {
    if (!e.cancel) return;
    e.cancel = null; e.fame = clamp(e.fame + 20, 0, 1000);
    addLog(e, `✅ Отмена снята ${why || ''}`);
    toastr.info(`${name}: отмена снята`, 'Career & Fame');
  }
  function acceptTask(name, e, id) {
    const t = e.tasks.find((x) => x.id === id && !x.done);
    if (!t) return false;
    t.active = true; t.progress = t.progress || 0;
    addLog(e, `▶️ Взято задание: ${t.title}`);
    toastr.info(`${name}: взято «${t.title}». Выполняйте его в ролевой!`, 'Career & Fame');
    return true;
  }
  function dropTask(name, e, id) {
    const t = e.tasks.find((x) => x.id === id && !x.done);
    if (!t) return;
    t.active = false; t.progress = 0;
    addLog(e, `⏸ Отказ от задания: ${t.title}`);
  }
  function completeTask(name, e, id) {
    const t = e.tasks.find((x) => x.id === id && !x.done);
    if (!t) return;
    t.done = true; t.active = false; t.progress = 100;
    gainXp(name, e, t.xp || 0); gainFame(e, t.fame || 0);
    addLog(e, `🏆 Задание выполнено: ${t.title} (+${t.xp} XP, +${t.fame} славы)`);
    toastr.success(`🏆 ${name}: «${t.title}» выполнено! +${t.xp} XP`, 'Career & Fame');
    if (t.type === 'apology') liftCancel(name, e, '(извинения приняты)');
  }

  function buildReaction(m, d) {
    const parts = [];
    for (const [k, [ic, lb]] of Object.entries(SEG)) {
      const pos = m.r[k + 'Pos'], neg = m.r[k + 'Neg'], v = d[k];
      if (v >= 8) parts.push(`${ic} ${lb}: ${pos}`);
      else if (v <= -8) parts.push(`${ic} ${lb}: ${neg}`);
      else parts.push(`${ic} ${lb}: мнения разделились — ${pos}; но ${neg}`);
    }
    return parts.join(' | ');
  }
  const effOf = (e, type) => ({ ...MOVES[type].base, ...(MOVES[type].career[e.career] || {}) });
  function applyMove(name, e, type, note) {
    const m = MOVES[type];
    if (!m || !e.career) return;
    const eff = effOf(e, type);
    const mult = 0.7 + Math.random() * 0.6;
    const blast = 1 + e.fame / 1000;
    const d = {};
    for (const k of ['loyal', 'brands', 'public']) { d[k] = Math.round(eff[k] * mult * blast); e.audience[k] = clamp(e.audience[k] + d[k], 0, 100); }
    const fameGain = Math.round(eff.fame * mult * blast);
    gainFame(e, fameGain);
    e.heat = clamp(e.heat + eff.heat, 0, 100);
    e.reaction = { type, text: buildReaction(m, d), left: 6 };
    e.moves.unshift({ type, note: note || '', at: ctx().chat?.length || 0 }); e.moves = e.moves.slice(0, 8);
    const sg = (n) => (n >= 0 ? '+' : '') + n;
    addLog(e, `${m.icon} ${m.name}${note ? ` (${note})` : ''}: слава ${sg(fameGain)}; 👥${sg(d.loyal)} 💼${sg(d.brands)} 📰${sg(d.public)}`);
    addLog(e, `📣 ${e.reaction.text}`);
    toastr.info(`${m.icon} ${name}: реакция аудитории — ${e.reaction.text}`, 'Career & Fame', { timeOut: 9000 });
    const p = clamp(eff.p + (e.audience.loyal < 30 ? 0.15 : 0) + (e.heat >= 60 ? 0.15 : 0), 0, 0.95);
    if (!e.cancel && Math.random() < p) applyCancel(name, e, eff.sev, m.name);
  }
  function tickTurn() {
    let changed = false;
    for (const n of names()) {
      const e = ent(n);
      if (e.cancel) { e.cancel.left--; changed = true; if (e.cancel.left <= 0) liftCancel(n, e, '(публика забыла)'); }
      if (e.reaction) { e.reaction.left--; changed = true; if (e.reaction.left <= 0) e.reaction = null; }
      for (const k of Object.keys(SEG)) { const v = e.audience[k]; if (v < 50) { e.audience[k]++; changed = true; } else if (v > 50) { e.audience[k]--; changed = true; } }
      if (e.heat > 0) {
        if (!e.cancel && e.heat >= 20 && Math.random() < e.heat / 500) {
          e.reaction = { type: 'exposed', text: 'Сомнительные рекламные интеграции вскрылись: расследования, разборы, гнев подписчиков', left: 6 };
          e.audience.public = clamp(e.audience.public - 15, 0, 100); e.audience.loyal = clamp(e.audience.loyal - 10, 0, 100);
          applyCancel(n, e, e.heat >= 60 ? 3 : 2, 'разоблачение рекламы сомнительных проектов');
          e.heat = Math.max(0, e.heat - 30);
        }
        e.heat = Math.max(0, e.heat - 2); changed = true;
      }
    }
    return changed;
  }

  /* =====================  МОДЕЛЬ  ===================== */
  async function callLLM(system, user, maxTokens = 500) {
    const s = S(); const c = ctx();
    if (s.mode === 'profile') {
      if (!s.profileId) throw new Error('Не выбран Connection Profile');
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
    try { return await c.generateRaw({ prompt: user, systemPrompt: system, responseLength: maxTokens }); }
    catch (e) { return await c.generateRaw(user, null, false, false, system, maxTokens); }
  }
  function parseJson(text) {
    const m = String(text).match(/\{[\s\S]*\}/);
    if (!m) throw new Error('Модель не вернула JSON');
    return JSON.parse(m[0]);
  }

  function stateSummary() {
    return names().map((n) => {
      const e = ent(n);
      const open = e.tasks.filter((t) => !t.done)
        .map((t) => `[${t.id}] «${t.title}» (${t.active ? 'ВЗЯТО' : 'не взято'}, прогресс ${t.progress || 0}%; шаги: ${(t.steps || []).join(' → ') || t.desc})`).join('; ') || 'нет';
      return `- ${n}: ${titleOf(e)}, ур.${e.level}, слава ${e.fame} (${fameTier(e.fame)}), ${e.cancel ? 'ОТМЕНЁН (' + e.cancel.reason + ')' : 'в порядке'}; аудитория: фанаты ${mood(e.audience.loyal)}, бренды ${mood(e.audience.brands)}, публика ${mood(e.audience.public)}; недавние спорные ходы: ${e.moves.slice(0, 3).map((x) => MOVES[x.type]?.name).join(', ') || 'нет'}; задания: ${open}`;
    }).join('\n');
  }

  async function analyze() {
    const c = ctx();
    if (!c.chat?.length) return;
    const active = names().filter((n) => ent(n).career);
    if (!active.length) return;
    const recent = c.chat.slice(-4).map((m) => `${m.name}: ${m.mes}`).join('\n\n');
    const system = 'Ты — движок карьеры и славы в ролевой игре. Отвечай ТОЛЬКО валидным JSON без пояснений.';
    const user = `Состояние:\n${stateSummary()}\n\nПоследние сообщения:\n${recent}\n\n` +
      `Оцени, что произошло с карьерой/репутацией (только ${active.join(', ')}). Верни JSON:\n` +
      `{"events":[{"who":"имя","xp":-30..40,"fame":-50..80,"summary":"кратко",` +
      `"task_progress":null или {"id":"id задания из списка","progress":0-100},"task_done":null или "id задания из списка",` +
      `"cancel":null или {"severity":1-3,"reason":"за что"},"controversy":null или {"type":"adult|casino|scam|crypto|fake","note":"кратко"},"lift_cancel":false}]}\n` +
      `ПРАВИЛА: прогресс и выполнение задания считаются ТОЛЬКО если в сообщениях реально описаны действия по этому заданию (даже если оно было «не взято» — тогда герой сам взялся за него); ` +
      `task_done — только когда шаги задания действительно доведены до конца в тексте. Награда за задание выдаётся автоматически, ` +
      `поэтому xp/fame в событии — лишь за ДРУГИЕ события. Если ничего значимого — {"events":[]}. Отмена только за реально скандальные поступки. ` +
      `controversy ставь, только когда персонаж РЕАЛЬНО сделал или анонсировал такой шаг: adult — уход на платформу 18+ вроде OnlyFans; casino — реклама казино/лутбоксов/ставок; ` +
      `scam — реклама мошенников/скам-проектов; crypto — реклама крипто-пирамид/памп-схем; fake — фейковые розыгрыши/накрутка. ` +
      `Не засчитывай разговоры, угрозы и отказы, не повторяй уже учтённые недавние ходы. Если персонаж несовершеннолетний — всегда null.`;
    const data = parseJson(await callLLM(system, user, 450));
    for (const ev of data.events || []) {
      if (!active.includes(ev.who)) continue;
      const e = ent(ev.who);
      if (ev.task_progress?.id) {
        const t = e.tasks.find((x) => x.id === ev.task_progress.id && !x.done);
        if (t) { const pr = clamp(parseInt(ev.task_progress.progress) || 0, 0, 99); if (pr > 0 && !t.active) { t.active = true; addLog(e, `▶️ Герой сам взялся за задание: ${t.title}`); } t.progress = Math.max(t.progress || 0, pr); }
      }
      if (ev.task_done) completeTask(ev.who, e, ev.task_done);
      gainXp(ev.who, e, clamp(parseInt(ev.xp) || 0, -30, 40));
      gainFame(e, clamp(parseInt(ev.fame) || 0, -50, 80));
      const cv = ev.controversy;
      if (cv?.type && MOVES[cv.type] && !e.moves.some((x) => x.type === cv.type && c.chat.length - x.at < 6)) applyMove(ev.who, e, cv.type, cv.note);
      if (ev.cancel) applyCancel(ev.who, e, ev.cancel.severity, ev.cancel.reason);
      else if (ev.lift_cancel) liftCancel(ev.who, e);
      if (ev.summary) addLog(e, `• ${ev.summary}`);
    }
    commit();
  }

  async function genTask(name) {
    const e = ent(name);
    if (!careerOf(e)) { toastr.warning('Сначала выберите карьеру', 'Career & Fame'); return; }
    const system = 'Ты придумываешь задания для карьеры в ролевой игре. Отвечай ТОЛЬКО валидным JSON.';
    const user = `Профессия: ${careerOf(e).name}, звание: ${titleOf(e)}, уровень ${e.level}, слава ${e.fame}.\n` +
      `Уже есть: ${e.tasks.filter((t) => !t.done).map((t) => t.title).join(', ') || 'нет'}.\n` +
      `Придумай одно новое задание, которое можно отыграть В СЮЖЕТЕ (конкретные действия). ` +
      `JSON: {"title":"...","desc":"...","steps":["действие 1","действие 2","действие 3"],"xp":10-60,"fame":0-60}`;
    const d = parseJson(await callLLM(system, user, 300));
    e.tasks.push({ id: uid(), type: 'task', src: 'ai', title: String(d.title || 'Задание'), desc: String(d.desc || ''),
      steps: Array.isArray(d.steps) ? d.steps.slice(0, 5).map(String) : [],
      xp: clamp(parseInt(d.xp) || 20, 5, 80), fame: clamp(parseInt(d.fame) || 10, 0, 80), done: false, active: false, progress: 0 });
    toastr.success('Новое задание добавлено в «Доступные»', 'Career & Fame');
  }

  /* =====================  ПРОМПТ  ===================== */
  function updatePrompt() {
    const c = ctx(); const s = S();
    if (!s.enabled || !s.inject) return c.setExtensionPrompt(MODULE, '', 1, 1);
    const lines = names().map((n) => {
      const e = ent(n);
      if (!e.career) return null;
      let l = `${n}: ${titleOf(e)} (ур. ${e.level}), известность — ${fameTier(e.fame)} (${e.fame}/1000).`;
      if (e.cancel) l += ` СЕЙЧАС ПОД ОТМЕНОЙ из-за «${e.cancel.reason}»: публика, бренды и коллеги реагируют враждебно или дистанцируются.`;
      l += `\n  Аудитория: фанаты ${mood(e.audience.loyal)}, бренды и спонсоры ${mood(e.audience.brands)}, публика и СМИ ${mood(e.audience.public)}.`;
      if (e.reaction) l += `\n  Недавняя реакция аудитории (${e.reaction.text}). Покажи эти РАЗНЫЕ реакции в сюжете: комментарии, отписки/донаты, письма от агентов и спонсоров, новости. Фокус — социальные последствия.`;
      if (e.heat >= 50) l += ` Есть риск разоблачения: ходят слухи, журналисты и разоблачители присматриваются.`;
      const act = e.tasks.filter((t) => t.active && !t.done);
      if (act.length) {
        const isUser = n === c.name1;
        l += '\n  Задания в работе: ' + act.map((t) => `«${t.title}» — ${t.desc || ''}${t.steps?.length ? ` (шаги: ${t.steps.join(' → ')})` : ''}, прогресс ${t.progress || 0}%`).join('; ') + '.';
        if (s.demandActions) {
          l += isUser
            ? ` ${n} выполняет это сам в своих постах: не описывай его действия за него, а показывай мир, реакции, помехи и последствия; успех не засчитывай, пока он сам не отыграл нужные действия.`
            : ` Показывай в постах конкретные действия ${n} по этим заданиям (подготовка, процесс, препятствия, результат); не объявляй успех без описанных действий и не завершай сложное задание за один пост.`;
        }
      }
      const avail = e.tasks.filter((t) => !t.done && !t.active).slice(0, 3);
      if (avail.length) l += `\n  Доступные задания (ещё не взяты): ${avail.map((t) => `«${t.title}»`).join(', ')}. Если в сюжете герой сам берётся за такое задание — покажи его действия.`;
      return l;
    }).filter(Boolean);
    c.setExtensionPrompt(MODULE, lines.length ? `[Карьера и слава. Учитывай в повествовании:\n${lines.join('\n')}]` : '', 1, 1, false, 0);
  }

  /* =====================  ТЕЛЕФОН (UI)  ===================== */
  const ui = { open: false, screen: 'home', who: null, tab: 'avail', form: false, busy: false, models: [] };
  const APPS = [
    { id: 'career',   icon: '💼', name: 'Карьера',    bg: 'linear-gradient(135deg,#4facfe,#2563eb)' },
    { id: 'tasks',    icon: '🎯', name: 'Задания',    bg: 'linear-gradient(135deg,#43e97b,#0d9f6e)' },
    { id: 'feed',     icon: '📰', name: 'События',    bg: 'linear-gradient(135deg,#fbbf24,#f97316)' },
    { id: 'aud',      icon: '👥', name: 'Аудитория',  bg: 'linear-gradient(135deg,#c084fc,#7c3aed)' },
    { id: 'moves',    icon: '🎭', name: 'Спорное',    bg: 'linear-gradient(135deg,#fb7185,#e11d48)' },
    { id: 'settings', icon: '⚙️', name: 'Настройки',  bg: 'linear-gradient(135deg,#94a3b8,#475569)' },
  ];
  const E = esc;
  const clock = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  function curWho() { const ns = names(); if (!ns.includes(ui.who)) ui.who = ns[0] || null; return ui.who; }
  const btn = (act, label, id, cls = '', v = '') => `<button class="cfp-btn ${cls}" data-act="${act}"${id ? ` data-id="${E(id)}"` : ''}${v !== '' ? ` data-v="${E(v)}"` : ''}>${label}</button>`;
  const bar = (pct, color) => `<div class="cfp-bar"><i style="width:${clamp(pct, 0, 100)}%;background:${color}"></i></div>`;
  const empty = (txt, extra = '') => `<div class="cfp-empty">${txt}${extra}</div>`;
  const needCareer = (e) => empty('Сначала выберите карьеру', `<div>${btn('open', '💼 Выбрать карьеру', '', 'pri', 'career')}</div>`);

  function screenHome(e, who) {
    if (!e) return empty('Откройте чат с персонажем');
    const prof = `<div class="cfp-card cfp-prof"><div class="cfp-ava">${iconOf(e)}</div><div style="flex:1;min-width:0">
      <b>${E(who)}</b><div class="cfp-sub">${e.career ? LEVEL_ICONS[clamp(e.level, 1, 6) - 1] + ' ' + E(titleOf(e)) + ' · ур. ' + e.level : 'Без карьеры — откройте 💼'}</div>
      ${e.career ? `<div class="cfp-sub">${fameIcon(e.fame)} ${fameTier(e.fame)} · ${e.fame}/1000</div>${bar(e.fame / 10, '#fbbf24')}` : ''}</div></div>`;
    const cancel = e.cancel ? `<div class="cfp-card cfp-alert">${CANCEL[e.cancel.severity].icon} <b>${CANCEL[e.cancel.severity].label}</b>: ${E(e.cancel.reason)}<div class="cfp-sub">Осталось ~${e.cancel.left} сообщ.</div></div>` : '';
    const act = e.tasks.filter((t) => t.active && !t.done).length;
    const badge = { tasks: act ? act : '', aud: e.cancel ? '!' : '', feed: e.reaction ? '•' : '' };
    const grid = APPS.map((a) => `<div class="cfp-app" data-act="open" data-v="${a.id}"><div class="cfp-ico" style="background:${a.bg}">${a.icon}${badge[a.id] ? `<span class="cfp-bdg">${badge[a.id]}</span>` : ''}</div><span>${a.name}</span></div>`).join('');
    return prof + cancel + `<div class="cfp-grid">${grid}</div>`;
  }

  function screenCareer(e, who) {
    const picker = `<div class="cfp-card"><div class="cfp-h">Профессия</div><div class="cfp-picks">${Object.entries(CAREERS).map(([k, c]) =>
      `<div class="cfp-pick ${e.career === k ? 'on' : ''}" data-act="career" data-v="${k}"><span>${c.icon}</span>${c.name}</div>`).join('')}</div></div>`;
    if (!e.career) return picker + empty('Выберите профессию, чтобы начать карьеру');
    const c = careerOf(e); const need = xpNeeded(e.level);
    const xpPct = e.level >= maxLevel(e) ? 100 : Math.round((e.xp / need) * 100);
    const ladder = c.ladder.map((r, i) => `<div class="cfp-step ${i + 1 === e.level ? 'now' : i + 1 < e.level ? 'past' : ''}">${LEVEL_ICONS[i]} <b>${i + 1}</b> ${E(r)}</div>`).join('');
    return picker + `<div class="cfp-card"><div class="cfp-h">${c.icon} ${E(titleOf(e))}</div>
      <div class="cfp-sub">Уровень ${e.level}/${maxLevel(e)} · опыт ${e.xp}/${e.level >= maxLevel(e) ? 'MAX' : need}</div>${bar(xpPct, '#34d399')}
      <div class="cfp-sub" style="margin-top:6px">${fameIcon(e.fame)} Слава: ${e.fame}/1000 — ${fameTier(e.fame)}</div>${bar(e.fame / 10, '#fbbf24')}
      <div style="margin-top:8px">${btn('xp', '🎁 ± XP / слава', '', '')}</div></div>
      <div class="cfp-card"><div class="cfp-h">Карьерная лестница</div>${ladder}</div>`;
  }

  function taskCard(t) {
    const st = t.done ? '✅' : t.active ? '▶️' : '📋';
    const steps = t.steps?.length ? `<div class="cfp-steps">${t.steps.map((s, i) => `<span>${i + 1}. ${E(s)}</span>`).join('')}</div>` : '';
    const prog = t.active && !t.done ? `<div class="cfp-sub">Прогресс: ${t.progress || 0}%</div>${bar(t.progress || 0, '#4facfe')}` : '';
    const b = [];
    if (!t.done) {
      b.push(t.active ? btn('drop', '⏸ Отказаться', t.id) : btn('take', '▶️ Взять', t.id, 'pri'));
      if (t.src !== 'manual') b.push(btn('done', '✔ Зачесть', t.id));
    }
    b.push(btn('del', '🗑', t.id, 'ghost'));
    return `<div class="cfp-card cfp-task ${t.active && !t.done ? 'active' : ''} ${t.done ? 'done' : ''}">
      <div class="cfp-th"><b>${st} ${E(t.title)}</b><span class="cfp-rew">+${t.xp} XP · +${t.fame} ⭐</span></div>
      ${t.desc ? `<div class="cfp-sub">${E(t.desc)}</div>` : ''}${steps}${prog}<div class="cfp-tb">${b.join('')}</div></div>`;
  }
  function screenTasks(e, who) {
    if (!e.career) return needCareer(e);
    const avail = e.tasks.filter((t) => !t.done && !t.active), work = e.tasks.filter((t) => t.active && !t.done), done = e.tasks.filter((t) => t.done);
    const list = { avail, work, done }[ui.tab] || avail;
    const seg = `<div class="cfp-seg">${[['avail', '📋 Доступные', avail.length], ['work', '▶️ В работе', work.length], ['done', '✅ Готово', done.length]]
      .map(([k, l, n]) => `<div class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-v="${k}">${l} ${n}</div>`).join('')}</div>`;
    const top = `<div class="cfp-row">${btn('newtask', ui.busy ? '⏳ Генерация…' : '🎯 Задание от ИИ', '', 'pri')}${btn('addform', ui.form ? '✖ Закрыть' : '✍️ Вручную')}</div>`;
    const form = ui.form ? `<div class="cfp-card"><div class="cfp-h">Новое задание</div>
      <input class="cfp-in" id="cff_title" placeholder="Название"><input class="cfp-in" id="cff_desc" placeholder="Что нужно сделать">
      <div class="cfp-row"><input class="cfp-in" id="cff_xp" type="number" value="25" placeholder="XP"><input class="cfp-in" id="cff_fame" type="number" value="10" placeholder="Слава"></div>
      ${btn('submitform', '＋ Добавить', '', 'pri')}</div>` : '';
    const hint = ui.tab === 'work' && work.length ? `<div class="cfp-sub" style="margin-bottom:6px">Выполняйте задания в ролевой: награда придёт за действия, показанные в постах.</div>` : '';
    return top + form + seg + hint + (list.length ? list.map(taskCard).join('') : empty({ avail: 'Нет доступных заданий', work: 'Нет заданий в работе — возьмите одно из «Доступных»', done: 'Пока ничего не выполнено' }[ui.tab]));
  }

  function screenFeed(e, who) {
    const react = e.reaction ? `<div class="cfp-card cfp-react">📣 <b>Реакция аудитории</b><div class="cfp-sub">${E(e.reaction.text)}</div></div>` : '';
    const log = e.log.length ? e.log.map((l) => `<div class="cfp-note">${E(l)}</div>`).join('') : empty('Событий пока нет');
    return react + log;
  }

  function screenAud(e, who) {
    if (!e.career) return needCareer(e);
    const meters = Object.entries(SEG).map(([k, [ic, lb]]) => `<div class="cfp-sub">${ic} ${lb}: ${e.audience[k]} — ${mood(e.audience[k])}</div>${bar(e.audience[k], '#a78bfa')}`).join('<div style="height:6px"></div>');
    const cancel = e.cancel
      ? `<div class="cfp-card cfp-alert">${CANCEL[e.cancel.severity].icon} <b>${CANCEL[e.cancel.severity].label}</b>: ${E(e.cancel.reason)}<div class="cfp-sub">Осталось ~${e.cancel.left} сообщ.</div><div style="margin-top:6px">${btn('lift', 'Снять отмену')}</div></div>`
      : `<div class="cfp-card"><div class="cfp-sub">Статус: ✅ в порядке</div><div style="margin-top:6px">${btn('cancelbtn', '🚫 Отменить вручную', '', 'danger')}</div></div>`;
    return `<div class="cfp-card"><div class="cfp-h">Настроение аудитории</div>${meters}</div>
      <div class="cfp-card"><div class="cfp-sub">🔥 Риск разоблачения: ${e.heat}%</div>${bar(e.heat, '#ef4565')}</div>
      ${e.reaction ? `<div class="cfp-card cfp-react">📣 ${E(e.reaction.text)}</div>` : ''}${cancel}`;
  }

  function screenMoves(e, who) {
    if (!e.career) return needCareer(e);
    const sg = (n) => (n >= 0 ? '+' : '') + n;
    const cards = MOVE_KEYS.map((k) => {
      const m = MOVES[k], f = effOf(e, k);
      return `<div class="cfp-card"><div class="cfp-th"><b>${m.icon} ${E(m.name)}</b></div>
        <div class="cfp-sub">⭐${sg(f.fame)} · 👥${sg(f.loyal)} · 💼${sg(f.brands)} · 📰${sg(f.public)} · 🔥+${f.heat}</div>
        <div class="cfp-sub">Шанс отмены ≈ ${Math.round(f.p * 100)}%</div><div style="margin-top:6px">${btn('move', 'Совершить', '', '', k)}</div></div>`;
    }).join('');
    const recent = e.moves.length ? `<div class="cfp-card"><div class="cfp-h">Недавние ходы</div>${e.moves.slice(0, 4).map((x) => `<div class="cfp-sub">${MOVES[x.type]?.icon} ${E(MOVES[x.type]?.name || x.type)}${x.note ? ` — ${E(x.note)}` : ''}</div>`).join('')}</div>` : '';
    return `<div class="cfp-sub" style="margin-bottom:6px">Оценки показывают ориентир для вашей профессии; итог зависит от случайности и известности.</div>` + cards + recent;
  }

  function screenSettings() {
    const s = S();
    const chk = (k, label) => `<label class="cfp-chk"><input type="checkbox" data-set="${k}" ${s[k] ? 'checked' : ''}><span>${label}</span></label>`;
    const profiles = ctx().extensionSettings?.connectionManager?.profiles || [];
    return `<div class="cfp-card"><div class="cfp-h">Общее</div>
        ${chk('enabled', 'Расширение включено')}${chk('showFab', 'Плавающая кнопка 📱')}${chk('inject', 'Передавать состояние в промпт')}
        ${chk('demandActions', 'Награда только за действия в постах')}${chk('auto', 'Авто-анализ после каждого ответа')}
        <div class="cfp-sub" style="margin-top:8px">🔆 Непрозрачность телефона: <b id="cfp_opv">${Math.round(s.opacity * 100)}%</b></div>
        <input type="range" min="30" max="100" step="5" value="${Math.round(s.opacity * 100)}" data-set="opacity" class="cfp-range"></div>
      <div class="cfp-card"><div class="cfp-h">Модель для анализа и заданий</div>
        <select class="cfp-in" data-set="mode">
          <option value="current" ${s.mode === 'current' ? 'selected' : ''}>Текущее подключение (без настройки)</option>
          <option value="profile" ${s.mode === 'profile' ? 'selected' : ''}>Connection Profile (ключ в профиле)</option>
          <option value="endpoint" ${s.mode === 'endpoint' ? 'selected' : ''}>Свой endpoint / роутер (ключ необязателен)</option>
        </select>
        ${s.mode === 'profile' ? `<select class="cfp-in" data-set="profileId"><option value="">— выбрать профиль —</option>${profiles.map((p) => `<option value="${E(p.id)}" ${p.id === s.profileId ? 'selected' : ''}>${E(p.name)}</option>`).join('')}</select>` : ''}
        ${s.mode === 'endpoint' ? `<input class="cfp-in" data-set="endpointUrl" placeholder="URL, напр. http://localhost:4000/v1" value="${E(s.endpointUrl)}">
          <input class="cfp-in" type="password" data-set="endpointKey" placeholder="API-ключ (необязательно)" value="${E(s.endpointKey)}">
          <input class="cfp-in" data-set="endpointModel" list="cfp_models" placeholder="ID модели" value="${E(s.endpointModel)}">
          <datalist id="cfp_models">${ui.models.map((m) => `<option value="${E(m)}"></option>`).join('')}</datalist>
          ${btn('loadmodels', '⟳ Загрузить список моделей')}` : ''}</div>
      <div class="cfp-card"><div class="cfp-row">${btn('analyze', ui.busy ? '⏳ Анализ…' : '🔍 Проанализировать сейчас', '', 'pri')}${btn('reset', '🗑 Сбросить чат', '', 'danger')}</div></div>`;
  }

  const TITLES = { home: 'Career & Fame', career: '💼 Карьера', tasks: '🎯 Задания', feed: '📰 События', aud: '👥 Аудитория', moves: '🎭 Спорные ходы', settings: '⚙️ Настройки' };

  function renderPhone() {
    const root = document.getElementById('cf_phone');
    if (!root) return;
    const prevBody = root.querySelector ? root.querySelector('.cfp-body') : null;
    const prevScroll = prevBody && prevBody.dataset?.screen === ui.screen ? prevBody.scrollTop : 0;
    const who = curWho(); const e = who ? ent(who) : null;
    let body;
    if (!S().enabled) body = empty('Расширение выключено', `<div>${btn('open', '⚙️ Настройки', '', '', 'settings')}</div>`);
    else if (ui.screen === 'settings') body = screenSettings();
    else if (!e) body = empty('Откройте чат с персонажем');
    else body = ({ home: screenHome, career: screenCareer, tasks: screenTasks, feed: screenFeed, aud: screenAud, moves: screenMoves }[ui.screen] || screenHome)(e, who);
    const whoBar = e && ui.screen !== 'settings' && S().enabled
      ? `<div class="cfp-who">${names().map((n) => `<div class="cfp-pill ${n === who ? 'on' : ''}" data-act="who" data-v="${E(n)}">${iconOf(ent(n))} ${E(n)}</div>`).join('')}</div>` : '';
    root.innerHTML = `<div class="cfp-notch"></div>
      <div class="cfp-status"><span class="cfp-time">${clock()}</span><span>📶 🔋</span></div>
      <div class="cfp-title">${ui.screen !== 'home' ? '<span class="cfp-back" data-act="home">‹</span>' : '<span class="cfp-back"></span>'}<b>${TITLES[ui.screen] || ''}</b><span class="cfp-x" data-act="close">✕</span></div>
      ${whoBar}<div class="cfp-body" data-screen="${ui.screen}">${body}</div><div class="cfp-homebar" data-act="home"><i></i></div>`;
    const nb = root.querySelector ? root.querySelector('.cfp-body') : null;
    if (nb && prevScroll) nb.scrollTop = prevScroll;
  }

  function updateFab() {
    const fab = document.getElementById('cf_fab');
    if (!fab) return;
    const s = S();
    fab.style.display = s.enabled && s.showFab ? 'flex' : 'none';
    let n = 0, cancelled = false;
    for (const nm of names()) { const e = ent(nm); n += e.tasks.filter((t) => t.active && !t.done).length; if (e.cancel) cancelled = true; }
    const b = fab.querySelector('.cf-badge');
    if (b) { b.textContent = cancelled ? '🚫' : (n || ''); b.style.display = cancelled || n ? 'flex' : 'none'; }
  }
  function applyOpacity() { document.documentElement.style.setProperty('--cfp-op', String(S().opacity)); }
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

  async function onClick(ev) {
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.getAttribute('data-act'), v = el.getAttribute('data-v'), id = el.getAttribute('data-id');
    if (act === 'close') return setOpen(false);
    if (act === 'home') { ui.screen = 'home'; ui.form = false; return renderPhone(); }
    if (ui.busy) return;
    const who = curWho(); const e = who ? ent(who) : null;
    switch (act) {
      case 'open': ui.screen = v; ui.form = false; renderPhone(); break;
      case 'who': ui.who = v; renderPhone(); break;
      case 'tab': ui.tab = v; renderPhone(); break;
      case 'career':
        if (!e) break;
        if (e.career && e.career !== v && !confirm('Сменить профессию? Уровень и опыт сбросятся.')) break;
        if (e.career !== v) { e.career = v; e.level = 1; e.xp = 0; addLog(e, `${CAREERS[v].icon} Новая профессия: ${CAREERS[v].name}`); }
        commit(); break;
      case 'take': if (e && acceptTask(who, e, id)) ui.tab = 'work'; commit(); break;
      case 'drop': if (e) dropTask(who, e, id); commit(); break;
      case 'done': if (e) completeTask(who, e, id); commit(); break;
      case 'del': if (e) e.tasks = e.tasks.filter((t) => t.id !== id); commit(); break;
      case 'newtask': if (e) await busy(() => genTask(who)); break;
      case 'addform': ui.form = !ui.form; renderPhone(); break;
      case 'submitform': {
        const q = (i) => document.getElementById(i)?.value ?? '';
        const title = q('cff_title').trim();
        if (!title) { toastr.warning('Введите название задания', 'Career & Fame'); break; }
        e.tasks.push({ id: uid(), type: 'task', src: 'manual', title, desc: q('cff_desc').trim(), steps: [],
          xp: clamp(parseInt(q('cff_xp')) || 25, 0, 200), fame: clamp(parseInt(q('cff_fame')) || 0, 0, 200), done: false, active: false, progress: 0 });
        ui.form = false; ui.tab = 'avail'; commit(); break;
      }
      case 'lift': if (e) liftCancel(who, e); commit(); break;
      case 'cancelbtn': {
        const reason = prompt('За что отмена?'); if (!reason) break;
        applyCancel(who, e, prompt('Степень 1–3 (1 скандал, 2 отмена, 3 тотальная):', '2'), reason); commit(); break;
      }
      case 'xp':
        gainXp(who, e, parseInt(prompt('Изменить опыт на (±):', '20')) || 0);
        gainFame(e, parseInt(prompt('Изменить славу на (±):', '10')) || 0); commit(); break;
      case 'move':
        if (e && MOVES[v] && confirm(`Совершить: ${MOVES[v].name}?`)) { applyMove(who, e, v, 'вручную'); ui.screen = 'feed'; commit(); }
        break;
      case 'analyze': await busy(analyze); break;
      case 'reset':
        if (confirm('Сбросить всю карьеру в этом чате?')) { ctx().chatMetadata[MODULE] = { entities: {} }; commit(); }
        break;
      case 'loadmodels': await safe(async () => {
        const s = S();
        const res = await fetch(s.endpointUrl.replace(/\/$/, '') + '/models', { headers: s.endpointKey ? { Authorization: `Bearer ${s.endpointKey}` } : {} });
        if (!res.ok) throw new Error(`Не удалось получить модели: ${res.status}`);
        const j = await res.json();
        ui.models = (j.data || j.models || []).map((m) => m.id || m.name || m);
        toastr.success(`Моделей: ${ui.models.length}`, 'Career & Fame'); renderPhone();
      }); break;
    }
  }
  function onInput(ev) {
    const el = ev.target, k = el.getAttribute && el.getAttribute('data-set');
    if (!k || el.type === 'checkbox' || el.tagName === 'SELECT') return;
    const s = S();
    if (k === 'opacity') { s.opacity = clamp(parseInt(el.value) / 100, 0.3, 1); applyOpacity(); const o = document.getElementById('cfp_opv'); if (o) o.textContent = Math.round(s.opacity * 100) + '%'; const d = document.getElementById('cf_d_op'); if (d) d.value = Math.round(s.opacity * 100); }
    else s[k] = el.value;
    saveSettings();
  }
  function onChange(ev) {
    const el = ev.target, k = el.getAttribute && el.getAttribute('data-set');
    if (!k) return;
    const s = S();
    if (el.type === 'checkbox') s[k] = el.checked; else if (k !== 'opacity') s[k] = el.value; else return;
    saveSettings(); syncDrawer();
    if (['enabled', 'mode', 'showFab', 'inject', 'demandActions'].includes(k)) { updateFab(); updatePrompt(); renderPhone(); }
  }

  function initFab() {
    const fab = document.getElementById('cf_fab'), s = S();
    if (s.fabX !== null && s.fabY !== null) Object.assign(fab.style, { left: clamp(s.fabX, 0, window.innerWidth - 54) + 'px', top: clamp(s.fabY, 0, window.innerHeight - 54) + 'px', right: 'auto', bottom: 'auto' });
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
    $('#cf_d_enabled').prop('checked', s.enabled); $('#cf_d_fab').prop('checked', s.showFab); $('#cf_d_op').val(Math.round(s.opacity * 100));
  }
  function mountUI() {
    document.body.insertAdjacentHTML('beforeend', '<div id="cf_fab" title="Career & Fame">📱<span class="cf-badge"></span></div><div id="cf_phone" class="cf-phone"></div>');
    const phone = document.getElementById('cf_phone');
    phone.addEventListener('click', (ev) => safe(() => onClick(ev)));
    phone.addEventListener('input', onInput);
    phone.addEventListener('change', onChange);
    initFab(); applyOpacity(); updateFab();
    setInterval(() => { const t = document.querySelector('#cf_phone .cfp-time'); if (t) t.textContent = clock(); }, 30000);

    const s = S();
    $('#extensions_settings2').append(`<div class="extension_container"><div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header"><b>🌟 Career &amp; Fame</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
      <div class="inline-drawer-content">
        <label class="checkbox_label"><input type="checkbox" id="cf_d_enabled"><span>Включено</span></label>
        <label class="checkbox_label"><input type="checkbox" id="cf_d_fab"><span>Плавающая кнопка 📱</span></label>
        <label>Непрозрачность телефона</label><input type="range" id="cf_d_op" min="30" max="100" step="5" style="width:100%">
        <div class="menu_button" id="cf_d_open">📱 Открыть телефон</div>
        <small>Остальные настройки (модель, промпт, авто-анализ) — в приложении ⚙️ внутри телефона.</small>
      </div></div></div>`);
    syncDrawer();
    $('#cf_d_enabled').on('change', function () { s.enabled = this.checked; saveSettings(); updateFab(); updatePrompt(); renderPhone(); });
    $('#cf_d_fab').on('change', function () { s.showFab = this.checked; saveSettings(); updateFab(); });
    $('#cf_d_op').on('input', function () { s.opacity = clamp(parseInt(this.value) / 100, 0.3, 1); applyOpacity(); saveSettings(); const o = document.getElementById('cfp_opv'); if (o) o.textContent = Math.round(s.opacity * 100) + '%'; });
    $('#cf_d_open').on('click', () => setOpen(true));
  }

  /* =====================  СОБЫТИЯ  ===================== */
  if (globalThis.__CF_TEST__) globalThis.__CF_TEST__.api = { ent, genTask, acceptTask, dropTask, completeTask, analyze, applyMove, applyCancel, tickTurn, renderPhone, onClick, ui, S, updatePrompt, uid };
  jQuery(() => {
    const c = ctx();
    mountUI(); updatePrompt(); renderPhone();
    c.eventSource.on(c.event_types.CHAT_CHANGED, () => { renderPhone(); updatePrompt(); updateFab(); });
    c.eventSource.on(c.event_types.MESSAGE_RECEIVED, () => {
      if (!S().enabled) return;
      if (tickTurn()) { try { saveChat(); } catch (_) {} renderPhone(); updateFab(); }
      updatePrompt();
      if (S().auto) safe(analyze);
    });
  });
})();
