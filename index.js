(() => {
  const MODULE = 'career_fame';
  const ctx = () => SillyTavern.getContext();

  /* ---------- Данные ---------- */
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

  // Спорные ходы. Эффекты зависят от профессии (career) и от известности (чем выше слава — тем громче эффект).
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
    mode: 'current', profileId: '',
    endpointUrl: 'http://localhost:4000/v1', endpointKey: '', endpointModel: '',
  };

  const xpNeeded = (lvl) => Math.round(100 * Math.pow(lvl, 1.4));
  const fameRow = (f) => [...FAME_TIERS].reverse().find(([min]) => f >= min);
  const fameTier = (f) => fameRow(f)[2];
  const fameIcon = (f) => fameRow(f)[1];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
    if (e.career && !CAREERS[e.career]) { e.career = null; e.level = 1; e.xp = 0; } // удалённые профессии
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
  const addLog = (e, text) => { e.log.unshift(text); e.log = e.log.slice(0, 30); };

  /* ---------- Логика ---------- */
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
    if (e.audience && e.audience.loyal < 20 && amount > 0) amount = Math.floor(amount / 2); // фанаты отвернулись
    e.fame = clamp(e.fame + amount, 0, 1000);
  }
  function applyCancel(name, e, severity, reason) {
    const sev = clamp(parseInt(severity) || 1, 1, 3); const cfg = CANCEL[sev];
    e.cancel = { severity: sev, reason: reason || 'неизвестно', left: cfg.turns };
    e.fame = clamp(e.fame + cfg.fame, 0, 1000);
    if (sev === 3 && e.level > 1) gainXp(name, e, -Math.round(xpNeeded(e.level - 1) * 0.5));
    if (!e.tasks.some((t) => t.type === 'apology' && !t.done)) {
      e.tasks.push({ id: 't' + Date.now(), type: 'apology', title: 'Публичные извинения', desc: 'Загладить вину перед публикой', steps: ['Признать ошибку', 'Публично извиниться', 'Показать, что выводы сделаны'], xp: 20 * sev, fame: 0, done: false, active: true, progress: 0 });
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
    if (!t) return;
    t.active = true; t.progress = t.progress || 0;
    addLog(e, `▶️ Взял(а) задание: ${t.title}`);
    toastr.info(`${name}: взято задание «${t.title}». Выполняйте его в ролевой!`, 'Career & Fame');
  }
  function dropTask(name, e, id) {
    const t = e.tasks.find((x) => x.id === id && !x.done);
    if (!t) return;
    t.active = false; t.progress = 0;
    addLog(e, `⏸ Отказ от задания: ${t.title}`);
  }
  // auto=true — засчитывается только взятое задание (по действиям в посте)
  function completeTask(name, e, id, auto = false) {
    const t = e.tasks.find((x) => x.id === id && !x.done && (!auto || x.active));
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
  function applyMove(name, e, type, note) {
    const m = MOVES[type];
    if (!m || !e.career) return;
    const eff = { ...m.base, ...(m.career[e.career] || {}) };
    const mult = 0.7 + Math.random() * 0.6;      // разброс реакции
    const blast = 1 + e.fame / 1000;             // чем известнее, тем громче
    const d = {};
    for (const k of ['loyal', 'brands', 'public']) { d[k] = Math.round(eff[k] * mult * blast); e.audience[k] = clamp(e.audience[k] + d[k], 0, 100); }
    const fameGain = Math.round(eff.fame * mult * blast);
    gainFame(e, fameGain);
    e.heat = clamp(e.heat + eff.heat, 0, 100);
    e.reaction = { type, text: buildReaction(m, d), left: 6 };
    e.moves.unshift({ type, note: note || '', at: ctx().chat?.length || 0 }); e.moves = e.moves.slice(0, 8);
    addLog(e, `${m.icon} ${m.name}${note ? ` (${note})` : ''}: слава ${fameGain >= 0 ? '+' : ''}${fameGain}; 👥${d.loyal >= 0 ? '+' : ''}${d.loyal} 💼${d.brands >= 0 ? '+' : ''}${d.brands} 📰${d.public >= 0 ? '+' : ''}${d.public}`);
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
        // риск разоблачения сомнительной рекламы
        if (!e.cancel && e.heat >= 20 && Math.random() < e.heat / 500) {
          e.reaction = { type: 'exposed', text: '📣 Сомнительные рекламные интеграции вскрылись: расследования, разборы, гнев подписчиков', left: 6 };
          e.audience.public = clamp(e.audience.public - 15, 0, 100); e.audience.loyal = clamp(e.audience.loyal - 10, 0, 100);
          applyCancel(n, e, e.heat >= 60 ? 3 : 2, 'разоблачение рекламы сомнительных проектов');
          e.heat = Math.max(0, e.heat - 30);
        }
        e.heat = Math.max(0, e.heat - 2); changed = true;
      }
    }
    return changed;
  }

  /* ---------- Вызов модели ---------- */
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
      const act = e.tasks.filter((t) => t.active && !t.done)
        .map((t) => `[${t.id}] «${t.title}» (прогресс ${t.progress || 0}%; шаги: ${(t.steps || []).join(' → ') || t.desc})`).join('; ') || 'нет';
      return `- ${n}: ${titleOf(e)}, ур.${e.level}, слава ${e.fame} (${fameTier(e.fame)}), ${e.cancel ? 'ОТМЕНЁН (' + e.cancel.reason + ')' : 'в порядке'}; аудитория: фанаты ${mood(e.audience.loyal)}, бренды ${mood(e.audience.brands)}, публика ${mood(e.audience.public)}; недавние спорные ходы: ${e.moves.slice(0, 3).map((x) => MOVES[x.type]?.name).join(', ') || 'нет'}; ВЗЯТЫЕ задания: ${act}`;
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
      `"task_progress":null или {"id":"id взятого задания","progress":0-100},"task_done":null или "id взятого задания",` +
      `"cancel":null или {"severity":1-3,"reason":"за что"},"controversy":null или {"type":"adult|casino|scam|crypto|fake","note":"кратко"},"lift_cancel":false}]}\n` +
      `ПРАВИЛА: прогресс и выполнение задания считаются ТОЛЬКО если в сообщениях реально описаны действия по этому заданию; ` +
      `task_done — только когда шаги задания действительно доведены до конца в тексте. Награда за задание выдаётся автоматически, ` +
      `поэтому xp/fame в событии — лишь за ДРУГИЕ события. Если ничего значимого — {"events":[]}. Отмена только за реально скандальные поступки. controversy ставь, только когда персонаж РЕАЛЬНО сделал или анонсировал такой шаг: adult — уход на платформу 18+ вроде OnlyFans; casino — реклама казино/лутбоксов/ставок; scam — реклама мошенников/скам-проектов; crypto — реклама крипто-пирамид/памп-схем; fake — фейковые розыгрыши/накрутка. Не засчитывай разговоры, угрозы и отказы, не повторяй уже учтённые недавние ходы. Если персонаж несовершеннолетний — всегда null.`;
    const data = parseJson(await callLLM(system, user, 450));
    for (const ev of data.events || []) {
      if (!active.includes(ev.who)) continue;
      const e = ent(ev.who);
      if (ev.task_progress?.id) {
        const t = e.tasks.find((x) => x.id === ev.task_progress.id && x.active && !x.done);
        if (t) t.progress = clamp(Math.max(t.progress || 0, parseInt(ev.task_progress.progress) || 0), 0, 99);
      }
      if (ev.task_done) completeTask(ev.who, e, ev.task_done, true);
      gainXp(ev.who, e, clamp(parseInt(ev.xp) || 0, -30, 40));
      gainFame(e, clamp(parseInt(ev.fame) || 0, -50, 80));
      const cv = ev.controversy;
      if (cv?.type && MOVES[cv.type] && !e.moves.some((x) => x.type === cv.type && c.chat.length - x.at < 6)) applyMove(ev.who, e, cv.type, cv.note);
      if (ev.cancel) applyCancel(ev.who, e, ev.cancel.severity, ev.cancel.reason);
      else if (ev.lift_cancel) liftCancel(ev.who, e);
      if (ev.summary) addLog(e, `• ${ev.summary}`);
    }
    saveChat(); render(); updatePrompt();
  }

  async function genTask(name) {
    const e = ent(name);
    if (!careerOf(e)) return toastr.warning('Сначала выберите карьеру', 'Career & Fame');
    const system = 'Ты придумываешь задания для карьеры в ролевой игре. Отвечай ТОЛЬКО валидным JSON.';
    const user = `Профессия: ${careerOf(e).name}, звание: ${titleOf(e)}, уровень ${e.level}, слава ${e.fame}.\n` +
      `Уже есть: ${e.tasks.filter((t) => !t.done).map((t) => t.title).join(', ') || 'нет'}.\n` +
      `Придумай одно новое задание, которое можно отыграть В СЮЖЕТЕ (конкретные действия). ` +
      `JSON: {"title":"...","desc":"...","steps":["действие 1","действие 2","действие 3"],"xp":10-60,"fame":0-60}`;
    const d = parseJson(await callLLM(system, user, 300));
    e.tasks.push({ id: 't' + Date.now(), type: 'task', title: d.title || 'Задание', desc: d.desc || '', steps: Array.isArray(d.steps) ? d.steps.slice(0, 5).map(String) : [],
      xp: clamp(parseInt(d.xp) || 20, 5, 80), fame: clamp(parseInt(d.fame) || 10, 0, 80), done: false, active: false, progress: 0 });
    saveChat(); render(); updatePrompt();
  }

  /* ---------- Инъекция в промпт ---------- */
  function updatePrompt() {
    const c = ctx(); const s = S();
    if (!s.enabled || !s.inject) return c.setExtensionPrompt(MODULE, '', 1, 1);
    const lines = names().map((n) => {
      const e = ent(n);
      if (!e.career) return null;
      let l = `${n}: ${titleOf(e)} (ур. ${e.level}), известность — ${fameTier(e.fame)} (${e.fame}/1000).`;
      if (e.cancel) l += ` СЕЙЧАС ПОД ОТМЕНОЙ из-за «${e.cancel.reason}»: публика, бренды и коллеги реагируют враждебно или дистанцируются.`;
      l += `\n  Аудитория: фанаты ${mood(e.audience.loyal)}, бренды и спонсоры ${mood(e.audience.brands)}, публика и СМИ ${mood(e.audience.public)}.`;
      if (e.reaction) l += `\n  Недавняя реакция аудитории на спорный шаг (${e.reaction.text}). Покажи эти РАЗНЫЕ реакции в сюжете: комментарии, отписки/донаты, письма от агентов и спонсоров, новости. Фокус — социальные последствия.`;
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
      return l;
    }).filter(Boolean);
    c.setExtensionPrompt(MODULE, lines.length ? `[Карьера и слава. Учитывай в повествовании:\n${lines.join('\n')}]` : '', 1, 1, false, 0);
  }

  /* ---------- UI ---------- */
  function taskHtml(n, t) {
    const status = t.done ? '✅' : t.active ? '▶️' : '📋';
    const steps = t.steps?.length ? `<div class="cf-muted">${t.steps.map((s, i) => `${i + 1}. ${esc(s)}`).join(' → ')}</div>` : '';
    const prog = t.active ? `<div class="cf-bar task"><div style="width:${t.progress || 0}%"></div></div><div class="cf-muted">Прогресс: ${t.progress || 0}%</div>` : '';
    const btns = t.done ? '' :
      (t.active
        ? `<span class="menu_button cf-drop" data-n="${esc(n)}" data-id="${t.id}" title="Отказаться">⏸</span>`
        : `<span class="menu_button cf-take" data-n="${esc(n)}" data-id="${t.id}" title="Взять задание">▶️ Взять</span>`) +
      `<span class="menu_button cf-done" data-n="${esc(n)}" data-id="${t.id}" title="Засчитать вручную">✔</span>`;
    return `<div class="cf-task ${t.done ? 'done' : ''} ${t.active ? 'active' : ''}">
      <div><b>${status} ${esc(t.title)}</b> <span class="cf-muted">+${t.xp} XP · +${t.fame} ⭐</span>
        <div class="cf-muted">${esc(t.desc)}</div>${steps}${prog}</div>
      <div class="cf-tbtns">${btns}<span class="menu_button cf-del" data-n="${esc(n)}" data-id="${t.id}" title="Удалить">✖</span></div></div>`;
  }

  function render() {
    const box = $('#cf_entities');
    if (!box.length) return;
    if (!S().enabled) return box.html('<div class="cf-muted">Расширение выключено</div>');
    box.html(names().map((n) => {
      const e = ent(n);
      const opts = Object.entries(CAREERS).map(([k, v]) => `<option value="${k}" ${e.career === k ? 'selected' : ''}>${v.icon} ${v.name}</option>`).join('');
      const need = xpNeeded(e.level);
      const xpPct = e.level >= maxLevel(e) ? 100 : Math.round((e.xp / need) * 100);
      return `<div class="cf-entity">
        <h4><span>${iconOf(e)} ${esc(n)}</span><span class="cf-muted">${e.career ? LEVEL_ICONS[clamp(e.level, 1, 6) - 1] + ' ' : ''}${esc(titleOf(e))}</span></h4>
        <div class="cf-row"><select class="text_pole cf-career" data-n="${esc(n)}"><option value="">— без карьеры —</option>${opts}</select></div>
        ${e.career ? `
        <div class="cf-muted">📈 Уровень ${e.level}/${maxLevel(e)} · опыт ${e.xp}/${e.level >= maxLevel(e) ? 'MAX' : need}</div>
        <div class="cf-bar"><div style="width:${xpPct}%"></div></div>
        <div class="cf-muted">${fameIcon(e.fame)} Слава: ${e.fame}/1000 — ${fameTier(e.fame)}</div>
        <div class="cf-bar fame"><div style="width:${e.fame / 10}%"></div></div>
        ${Object.entries(SEG).map(([k, [ic, lb]]) => `<div class="cf-muted">${ic} ${lb}: ${e.audience[k]} — ${mood(e.audience[k])}</div><div class="cf-bar aud"><div style="width:${e.audience[k]}%"></div></div>`).join('')}
        <div class="cf-muted">🔥 Риск разоблачения: ${e.heat}%</div><div class="cf-bar heat"><div style="width:${e.heat}%"></div></div>
        ${e.reaction ? `<div class="cf-react">📣 ${esc(e.reaction.text)}</div>` : ''}
        ${e.cancel ? `<div class="cf-cancel">${CANCEL[e.cancel.severity].icon} <b>${CANCEL[e.cancel.severity].label}</b>: ${esc(e.cancel.reason)}<br><span class="cf-muted">Осталось ~${e.cancel.left} сообщ.</span>
          <span class="menu_button cf-lift" data-n="${esc(n)}">Снять</span></div>` : ''}
        <div class="cf-row">
          <span class="menu_button cf-newtask" data-n="${esc(n)}">🎯 Задание (ИИ)</span>
          <span class="menu_button cf-addtask" data-n="${esc(n)}">✍️ Вручную</span>
          <span class="menu_button cf-cancelbtn" data-n="${esc(n)}">🚫 Отменить</span>
          <span class="menu_button cf-move" data-n="${esc(n)}">🎭 Спорный ход</span>
          <span class="menu_button cf-xp" data-n="${esc(n)}">🎁 ± XP/слава</span>
        </div>
        ${e.tasks.map((t) => taskHtml(n, t)).join('')}
        <details><summary class="cf-muted">📜 Журнал</summary><div class="cf-log">${e.log.map((l) => `<div>${esc(l)}</div>`).join('') || '—'}</div></details>` : ''}
      </div>`;
    }).join(''));
  }

  function refreshProfiles() {
    const profiles = ctx().extensionSettings?.connectionManager?.profiles || [];
    const sel = $('#cf_profile').empty().append('<option value="">— выбрать профиль —</option>');
    profiles.forEach((p) => sel.append(`<option value="${p.id}" ${p.id === S().profileId ? 'selected' : ''}>${esc(p.name)}</option>`));
  }
  function syncModeUI() { const m = S().mode; $('#cf_profile_block').toggle(m === 'profile'); $('#cf_endpoint_block').toggle(m === 'endpoint'); }
  async function safe(fn) { try { await fn(); } catch (err) { console.error('[Career&Fame]', err); toastr.error(String(err.message || err), 'Career & Fame'); } }

  function mountUI() {
    const s = S();
    $('#extensions_settings2').append(`<div class="extension_container" id="cf_root">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header"><b>🌟 Career &amp; Fame</b><div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div></div>
      <div class="inline-drawer-content">
        <label class="checkbox_label"><input type="checkbox" id="cf_enabled" ${s.enabled ? 'checked' : ''}><span>Включено</span></label>
        <label class="checkbox_label"><input type="checkbox" id="cf_inject" ${s.inject ? 'checked' : ''}><span>Передавать состояние карьеры в промпт</span></label>
        <label class="checkbox_label"><input type="checkbox" id="cf_actions" ${s.demandActions ? 'checked' : ''}><span>Задания выполняются действиями в постах (награда только за показанные действия)</span></label>
        <label class="checkbox_label"><input type="checkbox" id="cf_auto" ${s.auto ? 'checked' : ''}><span>Авто-анализ после каждого ответа</span></label>
        <hr>
        <label>Модель для анализа и заданий</label>
        <select id="cf_mode" class="text_pole">
          <option value="current" ${s.mode === 'current' ? 'selected' : ''}>Текущее подключение (без настройки)</option>
          <option value="profile" ${s.mode === 'profile' ? 'selected' : ''}>Connection Profile (ключ уже в профиле)</option>
          <option value="endpoint" ${s.mode === 'endpoint' ? 'selected' : ''}>Свой endpoint / роутер (ключ необязателен)</option>
        </select>
        <div id="cf_profile_block"><select id="cf_profile" class="text_pole"></select></div>
        <div id="cf_endpoint_block">
          <input id="cf_url" class="text_pole" placeholder="URL, напр. http://localhost:4000/v1" value="${esc(s.endpointUrl)}">
          <input id="cf_key" class="text_pole" type="password" placeholder="API-ключ (необязательно)" value="${esc(s.endpointKey)}">
          <div class="cf-row"><select id="cf_model_list" class="text_pole" style="flex:1"><option value="">— список моделей —</option></select>
            <span class="menu_button" id="cf_load_models">Загрузить</span></div>
          <input id="cf_model" class="text_pole" placeholder="ID модели" value="${esc(s.endpointModel)}">
        </div>
        <hr>
        <div class="cf-row"><span class="menu_button" id="cf_analyze">🔍 Проанализировать сейчас</span>
          <span class="menu_button" id="cf_reset">🗑 Сбросить карьеру в чате</span></div>
        <div id="cf_entities"></div>
      </div>
    </div></div>`);
    refreshProfiles(); syncModeUI(); render();

    const root = $('#cf_root');
    root.on('change', '#cf_enabled', function () { s.enabled = this.checked; saveSettings(); render(); updatePrompt(); });
    root.on('change', '#cf_inject', function () { s.inject = this.checked; saveSettings(); updatePrompt(); });
    root.on('change', '#cf_actions', function () { s.demandActions = this.checked; saveSettings(); updatePrompt(); });
    root.on('change', '#cf_auto', function () { s.auto = this.checked; saveSettings(); });
    root.on('change', '#cf_mode', function () { s.mode = this.value; saveSettings(); syncModeUI(); if (s.mode === 'profile') refreshProfiles(); });
    root.on('change', '#cf_profile', function () { s.profileId = this.value; saveSettings(); });
    root.on('input', '#cf_url', function () { s.endpointUrl = this.value; saveSettings(); });
    root.on('input', '#cf_key', function () { s.endpointKey = this.value; saveSettings(); });
    root.on('input', '#cf_model', function () { s.endpointModel = this.value; saveSettings(); });
    root.on('change', '#cf_model_list', function () { if (this.value) { s.endpointModel = this.value; $('#cf_model').val(this.value); saveSettings(); } });
    root.on('click', '#cf_load_models', () => safe(async () => {
      const headers = s.endpointKey ? { Authorization: `Bearer ${s.endpointKey}` } : {};
      const res = await fetch(s.endpointUrl.replace(/\/$/, '') + '/models', { headers });
      if (!res.ok) throw new Error(`Не удалось получить модели: ${res.status}`);
      const j = await res.json();
      const sel = $('#cf_model_list').empty().append('<option value="">— список моделей —</option>');
      (j.data || j.models || []).forEach((m) => { const id = m.id || m.name || m; sel.append(`<option value="${esc(id)}">${esc(id)}</option>`); });
      toastr.success('Модели загружены', 'Career & Fame');
    }));
    root.on('click', '#cf_analyze', () => safe(analyze));
    root.on('click', '#cf_reset', () => { if (confirm('Сбросить всю карьеру в этом чате?')) { ctx().chatMetadata[MODULE] = { entities: {} }; saveChat(); render(); updatePrompt(); } });

    const upd = () => { saveChat(); render(); updatePrompt(); };
    root.on('change', '.cf-career', function () { const e = ent($(this).data('n')); e.career = this.value || null; e.level = 1; e.xp = 0; upd(); });
    root.on('click', '.cf-newtask', function () { const n = $(this).data('n'); safe(() => genTask(n)); });
    root.on('click', '.cf-addtask', function () {
      const n = $(this).data('n'); const title = prompt('Название задания:'); if (!title) return;
      const desc = prompt('Что нужно сделать (описание):') || '';
      ent(n).tasks.push({ id: 't' + Date.now(), type: 'task', title, desc, steps: [], xp: 25, fame: 10, done: false, active: false, progress: 0 }); upd();
    });
    root.on('click', '.cf-take', function () { const n = $(this).data('n'); acceptTask(n, ent(n), String($(this).data('id'))); upd(); });
    root.on('click', '.cf-drop', function () { const n = $(this).data('n'); dropTask(n, ent(n), String($(this).data('id'))); upd(); });
    root.on('click', '.cf-done', function () { const n = $(this).data('n'); completeTask(n, ent(n), String($(this).data('id'))); upd(); });
    root.on('click', '.cf-del', function () { const e = ent($(this).data('n')); e.tasks = e.tasks.filter((t) => t.id !== String($(this).data('id'))); upd(); });
    root.on('click', '.cf-lift', function () { const n = $(this).data('n'); liftCancel(n, ent(n)); upd(); });
    root.on('click', '.cf-cancelbtn', function () {
      const n = $(this).data('n'); const reason = prompt('За что отмена?'); if (!reason) return;
      applyCancel(n, ent(n), prompt('Степень 1–3 (1 скандал, 2 отмена, 3 тотальная):', '2'), reason); upd();
    });
    root.on('click', '.cf-move', function () {
      const n = $(this).data('n');
      const list = MOVE_KEYS.map((k, i) => `${i + 1}. ${MOVES[k].icon} ${MOVES[k].name}`).join('\n');
      const i = parseInt(prompt(`Спорный ход — выберите номер:\n${list}`)) - 1;
      if (!MOVE_KEYS[i]) return;
      applyMove(n, ent(n), MOVE_KEYS[i], 'вручную'); upd();
    });
    root.on('click', '.cf-xp', function () {
      const n = $(this).data('n'); const e = ent(n);
      gainXp(n, e, parseInt(prompt('Изменить опыт на (±):', '20')) || 0);
      gainFame(e, parseInt(prompt('Изменить славу на (±):', '10')) || 0); upd();
    });
  }

  /* ---------- События ---------- */
  jQuery(() => {
    const c = ctx();
    mountUI(); updatePrompt();
    c.eventSource.on(c.event_types.CHAT_CHANGED, () => { render(); updatePrompt(); });
    c.eventSource.on(c.event_types.MESSAGE_RECEIVED, () => {
      if (!S().enabled) return;
      if (tickTurn()) { saveChat(); render(); }
      updatePrompt();
      if (S().auto) safe(analyze);
    });
  });
})();
