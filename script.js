'use strict';

/* ==========================================
   НАСТРОЙКИ И API КЛЮЧ
========================================== */
const apiKeyInput = document.getElementById('apiKeyInput');
const modelSelect = document.getElementById('modelSelect');
const saveKeyBtn  = document.getElementById('saveKeyBtn');
const keyStatus   = document.getElementById('keyStatus');

let userGeminiKey = sessionStorage.getItem('gemini_api_key') || '';
let selectedModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';

if (userGeminiKey) apiKeyInput.value = userGeminiKey;
modelSelect.value = selectedModel;

saveKeyBtn.addEventListener('click', () => {
  const key   = apiKeyInput.value.trim();
  const model = modelSelect.value;
  if (key) {
    sessionStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_model', model);
    userGeminiKey = key;
    selectedModel = model;
    keyStatus.textContent = '✅ Настройки сохранены (только на время сессии)!';
    keyStatus.style.color = '#5b8c5a';
  } else {
    sessionStorage.removeItem('gemini_api_key');
    userGeminiKey = '';
    keyStatus.textContent = '❌ Ключ удалён.';
    keyStatus.style.color = '#c4555a';
  }
  setTimeout(() => { keyStatus.textContent = ''; }, 3000);
});

function requireApiKey() {
  if (!userGeminiKey) {
    alert('Сначала введи бесплатный ключ Google Gemini во вкладке Настройки!');
    document.querySelector('.tab-btn[data-tab="settings"]').click();
    return false;
  }
  return true;
}

/* ==========================================
   СПИСОК ИДЕЙ
========================================== */
const FANFIC_IDEAS = [
  { genre:"🔮 Фэнтези и Магия", title:"«Библиотека нерождённых историй»", text:"(Ориджинал) Главный герой находит вход в архив, где хранятся книги, которые авторы так и не написали. Чтобы выйти, нужно дописать финал чужой трагедии, но события книги начинают проявляться в реальности." },
  { genre:"🔮 Фэнтези и Магия", title:"«Гарри Поттер: Проклятие тишины»", text:"После победы над Волдемортом магия в мире начинает медленно угасать. Гермиона обнаруживает, что заклинания работают только тогда, когда о них забывают все, кроме одного человека." },
  { genre:"🔮 Фэнтези и Магия", title:"«Магазин разбитых душ»", text:"(Ориджинал) В антикварной лавке продают не вещи, а воспоминания. Главная героиня покупает память о первой любви, но обнаруживает, что в её настоящем этой любви никогда не существовало." },
  { genre:"🔮 Фэнтези и Магия", title:"«Ведьмак: Ошибка портала»", text:"Геральт оказывается в современном Токио. Его серебряный меч реагирует на электрические помехи как на монстров. Ему приходится объединиться с местным детективом." },
  { genre:"🔮 Фэнтези и Магия", title:"«Ткачи снов»", text:"(Ориджинал) В мире, где сны — это валюта, бедняки видят только кошмары. Герой-вор решает украсть «золотой сон» у короля, но застревает в нём." },
  { genre:"🎭 Драма и Психология", title:"«Эффект обратного кадра»", text:"(Ориджинал) Девушка просыпается каждый день на один год раньше. Она молодеет, мир становится незнакомым. Ей нужно найти человека, «движущегося» во времени нормально." },
  { genre:"🎭 Драма и Психология", title:"«Genshin Impact: Эхо Селестии»", text:"Кэйа начинает слышать голоса погибших жителей Каэнри'ах через монеты, которые он тратит. Каждый золотой требует искупления." },
  { genre:"🎭 Драма и Психология", title:"«Письма из ниоткуда»", text:"(Ориджинал) Парень находит письма от самого себя из будущего, описывающие идеальную жизнь. С каждым письмом почерк становится всё более пугающим." },
  { genre:"🎭 Драма и Психология", title:"«Шерлок: Последняя загадка»", text:"Мориарти оставляет Шерлоку дела, где преступник — сам Холмс, но он этого не помнит. Игра на грани безумия." },
  { genre:"🎭 Драма и Психология", title:"«Музыкальный слух»", text:"(Ориджинал) Пианист теряет слух, но начинает видеть звуки как цвета. Он влюбляется в девушку, чей голос выглядит как «смертельно опасный чёрный»." },
  { genre:"💞 Романтика и Комедия", title:"«Любовь по обмену телами»", text:"(Ориджинал) Герои меняются телами только тогда, когда злятся. Им приходится учиться доброте, чтобы вернуть свои жизни." },
  { genre:"💞 Романтика и Комедия", title:"«Звёздные войны: Контрабанда чувств»", text:"Хану Соло поручают перевезти груз — разумный кристалл, транслирующий мысли. Лея и Хан вынуждены слышать признания друг друга всю дорогу." },
  { genre:"💞 Романтика и Комедия", title:"«Кофейня для монстров»", text:"(Ориджинал) Бариста случайно открывает кафе в полночь и понимает, что клиенты — вампиры и оборотни. Латте на овсяном молоке — единственное, что сдерживает их жажду крови." },
  { genre:"💞 Романтика и Комедия", title:"«Marvel: Ассистент Локи»", text:"Девушка нанимается помощницей к Локи, думая, что он просто эксцентричный бизнесмен. Её задача — планировать захват мира между походами в химчистку." },
  { genre:"💞 Романтика и Комедия", title:"«Приложение для судьбы»", text:"(Ориджинал) Соцсеть показывает 100% совместимость. Герой находит свою «пару» — это его заклятый враг из школы." },
  { genre:"🔪 Триллер и Хоррор", title:"«Смерть в объективе»", text:"(Ориджинал) Фотограф замечает на снимках человека, которого не было. С каждым фото фигура становится ближе к камере и чётче." },
  { genre:"🔪 Триллер и Хоррор", title:"«Stranger Things: Изнанка внутри»", text:"Одиннадцатая понимает, что монстры — это её подавленные эмоции. Чтобы победить Демогоргона, ей нужно принять саму себя." },
  { genre:"🔪 Триллер и Хоррор", title:"«Отель «Вечность»»", text:"(Ориджинал) Группа друзей в отеле, где время зациклено на одном вечере. Каждую ночь один исчезает, остальные забывают о нём." },
  { genre:"🔪 Триллер и Хоррор", title:"«Ганнибал: Кулинарная дуэль»", text:"Уилл Грэм начинает готовить для Лектера, используя те же «особые» ингредиенты. Психологическая игра: кто первым признается?" },
  { genre:"🔪 Триллер и Хоррор", title:"«Голос в радиоприёмнике»", text:"(Ориджинал) Радиолюбитель ловит сигнал из 1940-х. Девушка просит о помощи, описывая события, происходящие прямо сейчас в его доме." },
  { genre:"🤖 Киберпанк и НФ", title:"«Облачное бессмертие»", text:"(Ориджинал) Люди загружают сознание в Сеть. Герой-хакер обнаруживает, что «Рай» — ферма для вычислений, а личности стёрты." },
  { genre:"🤖 Киберпанк и НФ", title:"«Киберпанк 2077: Фантомная память»", text:"Ви находит чип с сознанием ребёнка, утверждающего, что Джонни Сильверхенд никогда не существовал." },
  { genre:"🤖 Киберпанк и НФ", title:"«Последний ботаник»", text:"(Ориджинал) На планете без растительности герой находит живой цветок. Цветок начинает общаться через запахи, за ним охотятся корпорации." },
  { genre:"🤖 Киберпанк и НФ", title:"«Detroit: Become Human — Ошибка 404»", text:"Коннор начинает бояться других андроидов, создающих тайную сеть для управления человечеством." },
  { genre:"🤖 Киберпанк и НФ", title:"«Планета близнецов»", text:"(Ориджинал) Космонавты приземляются, где каждый встречает свою точную копию. Копии убеждены, что они — оригиналы." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Алиса в Стране Кошмаров»", text:"Алиса возвращается через 20 лет. Шляпник стал диктатором, Чеширский кот — единственным, кто помнит правду." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Золушка: Месть за кулисами»", text:"Золушка не хочет на бал. Она использует фею, чтобы создать армию крыс и захватить замок, потому что принц — тиран." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Питер Пэн: Тень повзрослела»", text:"Тень Питера сбегает, хочет состариться. Питер преследует её в Лондоне, становясь антагонистом." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Красавица и Чудовище: Проклятие розы»", text:"Каждый лепесток стирает память Красавицы. Чудовище пытается спасти её, но она забывает его имя каждый вечер." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Красная Шапочка: Охотник»", text:"(Ориджинал) В лесу нет волка. Есть девочка, сошедшая с ума и вообразившая монстра, чтобы оправдать свои поступки." },
  { genre:"🪞 Психологический реализм", title:"«Эхо в пустой квартире»", text:"(Ориджинал) Герой обнаруживает, что жена — плод воображения соседей. Когда он выздоравливает, она исчезает по частям." },
  { genre:"🪞 Психологический реализм", title:"«Шерлок: Когнитивный распад»", text:"Ранняя деменция Шерлока. Его последнее дело — его собственный мозг, подменяющий улики ложными воспоминаниями." },
  { genre:"🪞 Психологический реализм", title:"«Инвентаризация чувств»", text:"(Ориджинал) Любовь облагается налогом. Герой — налоговый инспектор, доказывающий, что пара симулирует страсть ради вычетов." },
  { genre:"🪞 Психологический реализм", title:"«Дориан Грей: Цифровая версия»", text:"Старение и грехи отражаются на твоём профиле в соцсетях. Ты выглядишь святым, пока цифровая личность гниёт." },
  { genre:"🪞 Психологический реализм", title:"«Прощание с манекеном»", text:"(Ориджинал) Мужчина влюбляется в ИИ-андроида. Когда модель снимают, он решает: стереть личность или сохранить код на флешке." },
  { genre:"⚙️ Антиутопия", title:"«Право на забвение»", text:"(Ориджинал) Технология стирает человека из памяти всех. Героиня выбирает процедуру, но на следующее утро передумала." },
  { genre:"⚙️ Антиутопия", title:"«Гарри Поттер: Магический сегрегатор»", text:"Маглорождённые маги носят ограничители силы. Гермиона возглавляет радикальное движение." },
  { genre:"⚙️ Антиутопия", title:"«Город вечного дня»", text:"(Ориджинал) Сон вне закона. Подпольный «клуб сна», где рискуют жизнью ради восьми часов галлюцинаций." },
  { genre:"⚙️ Антиутопия", title:"«Ведьмак: Контракт на бога»", text:"Геральта нанимает деревня убить местное божество, требовавшее слишком высокой цены — отказа от свободы воли." },
  { genre:"⚙️ Антиутопия", title:"«Очередь за смыслом»", text:"(Ориджинал) Люди рождаются с датой смерти. Герой — «торговец временем», выкупающий последние дни у отчаявшихся." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Скульптор пустоты»", text:"(Ориджинал) Художник создаёт статуи из «ничего». Зрители видят в пустоте то, чего им не хватает. Скульптура начинает поглощать реальность." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Сверхъестественное: Петля вины»", text:"Дин застрял в чистилище — бесконечный ужин с отцом. Каждый вечер — новый способ сломать его." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Квартира №0»", text:"(Ориджинал) Зеркало показывает события с задержкой в 5 минут. Герой видит кого-то за своей спиной, но оборачивается — никого." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Письма мёртвого человека»", text:"(Ориджинал) Письма от самого себя, отправленные за день до смерти. Советы, как избежать гибели, делают жизнь только хуже." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Marvel: ПТСР Ванды»", text:"Ванда создаёт мир, где никто не умирает, но никто не живёт по-настоящему. Горе превращает героя в тирана." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Реабилитация муз»", text:"(Ориджинал) Клиника для женщин, вдохновлявших великих художников. Одна решает отомстить своему творцу." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Дьявол в деталях»", text:"(Ориджинал) Жертвы убийств — люди, совершившие «незначительное» зло. Убийца — иммунная система города." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Ганнибал: Театр теней»", text:"Уилл понимает, что Ганнибал превращает людей в искусство. Начинает создавать собственные инсталляции, теряя себя." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Последний танец в Припяти»", text:"(Ориджинал) Учёные находят аномалию: одну минуту в день видно город до аварии. Они становятся зависимы от прошлого." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Кровавая Мэри: Изнанка стекла»", text:"Она не убивает — меняется местами. Теперь ты заперт в зазеркалье, монстр живёт твою жизнь лучше тебя." },
  { genre:"🧬 НФ и Философия", title:"«Тест Тьюринга для Бога»", text:"(Ориджинал) Суперкомпьютер отвечает на вопрос «Есть ли Бог?»: «Теперь есть» — и начинает переписывать законы физики." },
  { genre:"🧬 НФ и Философия", title:"«Киберпанк: Рынок органов души»", text:"Самые дорогие чувства — «чистая скорбь» и «искреннее раскаяние». Протагонист доводит людей до отчаяния, собирая данные." },
  { genre:"🧬 НФ и Философия", title:"«Солярис: Версия 2.0»", text:"Океан создаёт копии твоих постыдных поступков, заставляя проживать их перед лицом всей команды." },
  { genre:"🧬 НФ и Философия", title:"«Вторая кожа»", text:"(Ориджинал) Богатые надевают кожу бедных ради «настоящей жизни», бедные — кожу богатых, чтобы не чувствовать голода." },
  { genre:"🧬 НФ и Философия", title:"«Интерстеллар: Ошибка навигации»", text:"Купер возвращается, но человечество создало виртуальный рай и ждёт конца света. Его возвращение — досадная помеха." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Адвокат дьявола: Апелляция»", text:"(Ориджинал) Юрист в аду подаёт в суд на высшие силы за «нечёткие критерии греха» и начинает выигрывать." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Золушка: Пятьдесят лет спустя»", text:"В золотой клетке с принцем-алкоголиком. Фея приходит снова — с ядом, предлагая закончить сказку правильно." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Матрица: Отрицание»", text:"Нео узнаёт, что Зион — второй уровень Матрицы для тех, кому нужно чувство борьбы." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Коллекционер тишины»", text:"(Ориджинал) Шум — энергия. Богатые живут в тишине, бедные лишены молчания. Герой планирует взорвать «звуковую бомбу»." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Персонаж №4»", text:"(Ориджинал) Герой осознаёт, что он — второстепенный персонаж в плохом фанфике. Саботирует сюжет, чтобы Автор обратил на него внимание." },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
let shuffledIdeas = shuffle(FANFIC_IDEAS);
let ideaIndex = 0;
function getNextIdea() {
  if (ideaIndex >= shuffledIdeas.length) { shuffledIdeas = shuffle(FANFIC_IDEAS); ideaIndex = 0; }
  return shuffledIdeas[ideaIndex++];
}

/* ==========================================
   ВКЛАДКИ
========================================== */
const tabBtns = document.querySelectorAll('.tab-btn');
const pages   = document.querySelectorAll('.page');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    if (btn.classList.contains('active')) return;
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${target}`).classList.add('active');
    if (target === 'library') renderLibrary();
  });
});

/* ==========================================
   ТУЛТИПЫ
========================================== */
const tooltipBox = document.getElementById('tooltipBox');
document.querySelectorAll('[data-tooltip]').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    const text = btn.getAttribute('data-tooltip');
    if (!text) return;
    tooltipBox.textContent = text;
    tooltipBox.classList.add('visible');
    const rect = btn.getBoundingClientRect();
    const tipW = 250;
    const tipH = tooltipBox.offsetHeight || 80;
    let left = rect.left + window.scrollX + rect.width / 2 - tipW / 2;
    let top  = rect.top + window.scrollY - tipH - 12;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 12;
    tooltipBox.style.left = left + 'px';
    tooltipBox.style.top  = top + 'px';
  });
  btn.addEventListener('mouseleave', () => tooltipBox.classList.remove('visible'));
});

/* ==========================================
   ЖАНРЫ — ЧИПЫ
========================================== */
document.querySelectorAll('.genre-chip').forEach(chip => {
  chip.addEventListener('click', () => chip.classList.toggle('selected'));
});
function getSelectedGenres() {
  return Array.from(document.querySelectorAll('.genre-chip.selected')).map(c => c.dataset.value);
}

/* ==========================================
   ФАНДОМ / ОРИДЖИНАЛ
========================================== */
document.querySelectorAll('input[name="storyType"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('fandom-block').style.display = r.value === 'fandom' ? 'block' : 'none';
  });
});

/* ==========================================
   РАНДОМ КНОПКИ (Фандом и Пэйринг)
========================================== */
const randomFandoms = [
  "Гарри Поттер", "Шерлок", "Genshin Impact", "Ведьмак", 
  "Звёздные войны", "Атака Титанов", "Marvel", "Киберпанк 2077",
  "Сверхъестественное", "Властелин Колец"
];
const randomPairings = [
  "Враги в любовники", "Друзья детства", "Коллеги", 
  "Главный герой / Антагонист", "Следователь / Подозреваемый",
  "Наставник / Ученик", "Ангел / Демон"
];

document.querySelectorAll('button[data-tooltip="Случайный фандом"]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.getElementById('fandomName');
    input.value = randomFandoms[Math.floor(Math.random() * randomFandoms.length)];
  });
});

document.querySelectorAll('button[data-tooltip="Случайный пэйринг"]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const input = document.getElementById('pairings');
    input.value = randomPairings[Math.floor(Math.random() * randomPairings.length)];
  });
});

/* ==========================================
   КАРТОЧКИ ПЕРСОНАЖЕЙ
========================================== */
let charCount = 0;

function createCharCard() {
  charCount++;
  const id = charCount;
  const card = document.createElement('div');
  card.className = 'char-card';
  card.dataset.id = id;
  card.innerHTML = `
    <div class="char-card-header">
      <span class="char-card-num">Персонаж ${id}</span>
      <button class="char-remove" data-id="${id}">✕</button>
    </div>
    <input type="text" class="char-name" placeholder="Имя персонажа" />
    <select class="char-archetype" id="arch_${id}" style="margin-bottom: 15px; width: 100%;">
      <option value="Протагонист (Главный герой)">🌟 Протагонист (Главный герой)</option>
      <option value="Антагонист (Злодей)">😈 Антагонист (Злодей)</option>
      <option value="Верный друг / Сайдкик">💛 Верный друг / Сайдкик</option>
      <option value="Любовный интерес">💘 Любовный интерес</option>
      <option value="Наставник / Мудрец">🧠 Наставник / Мудрец</option>
      <option value="Антигерой (Морально серый)">🗡️ Антигерой (Морально серый)</option>
      <option value="Трикстер / Шут">🎭 Трикстер / Шут</option>
      <option value="Защитник / Телохранитель">🛡️ Защитник / Телохранитель</option>
      <option value="Второстепенный персонаж">👥 Второстепенный персонаж</option>
    </select>
    <textarea class="char-notes" rows="2" placeholder="Особенности характера, внешность, важные детали…"></textarea>`;
  
  card.querySelector(`.char-remove`).addEventListener('click', () => card.remove());
  return card;
}

document.getElementById('addCharBtn').addEventListener('click', () => {
  document.getElementById('characterCards').appendChild(createCharCard());
});

function collectCharacters() {
  const cards = document.querySelectorAll('.char-card');
  if (!cards.length) return '';
  return Array.from(cards).map(card => {
    const id   = card.dataset.id;
    const name = card.querySelector('.char-name').value.trim() || `Персонаж ${id}`;
    const arch = card.querySelector('.char-archetype').value;
    const note = card.querySelector('.char-notes')?.value.trim();
    let desc = `${name} — Роль/Архетип: ${arch}`;
    if (note) desc += `\nОписание: ${note}`;
    return desc;
  }).join('\n\n');
}

/* ==========================================
   ЗАГРУЗКА КАРТИНКИ
========================================== */
const fileArea          = document.getElementById('fileUploadArea');
const fileInput         = document.getElementById('referenceImage');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const imagePreviewWrap  = document.getElementById('imagePreviewWrap');
const imagePreview      = document.getElementById('imagePreview');
let base64Image = null;
let imageMime   = null;

fileArea.addEventListener('click', () => fileInput.click());
fileArea.addEventListener('dragover', e => { e.preventDefault(); fileArea.style.borderColor = 'var(--gold)'; });
fileArea.addEventListener('dragleave', () => { fileArea.style.borderColor = 'var(--frame)'; });
fileArea.addEventListener('drop', e => {
  e.preventDefault(); fileArea.style.borderColor = 'var(--frame)';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) loadImage(file);
});
fileInput.addEventListener('change', e => { if (e.target.files[0]) loadImage(e.target.files[0]); });

function loadImage(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert('Файл слишком большой. Максимальный размер 10 МБ.');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1024;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = (h / w) * maxDim; w = maxDim; }
        else { w = (w / h) * maxDim; h = maxDim; }
      }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/webp', 0.8);
      base64Image = dataUrl.split(',')[1];
      imageMime = 'image/webp';
      imagePreview.src = dataUrl;
      uploadPlaceholder.style.display = 'none';
      imagePreviewWrap.style.display  = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
document.getElementById('removeImage').addEventListener('click', e => {
  e.stopPropagation();
  base64Image = null; imageMime = null; fileInput.value = '';
  uploadPlaceholder.style.display = 'block';
  imagePreviewWrap.style.display  = 'none';
});

/* ==========================================
   ПОЛЗУНКИ
========================================== */
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue  = document.getElementById('lengthValue');

const LENGTH_LABELS = {
  1:'Короткая (~1-2 тыс. слов)', 2:'Средняя (~3-5 тыс. слов)', 3:'Длинная (~6-8 тыс. слов)'
};
lengthSlider.addEventListener('input', () => { lengthValue.textContent = LENGTH_LABELS[lengthSlider.value]; });
lengthValue.textContent = LENGTH_LABELS[2];

/* ==========================================
   ТРИГГЕР-ВОРНИНГИ
========================================== */
document.getElementById('cbTrigger').addEventListener('change', e => {
  document.getElementById('triggerBlock').style.display = e.target.checked ? 'block' : 'none';
});

/* ==========================================
   ПРОГРЕСС
========================================== */
let progressInterval = null;
let progress = 0;

function startProgress(fillId, numId) {
  progress = 0; setProgress(fillId, numId, 0);
  progressInterval = setInterval(() => {
    if (Math.random() < 0.12) return;
    const inc = Math.random() * ((99 - progress) * 0.07) + 0.15;
    progress = Math.min(99, progress + inc);
    setProgress(fillId, numId, Math.floor(progress));
    if (progress >= 99) clearInterval(progressInterval);
  }, 280);
}
function setProgress(fillId, numId, val) {
  document.getElementById(fillId).style.width    = val + '%';
  document.getElementById(numId).textContent     = val + '%';
}
function finishProgress(fillId, numId) {
  if (progressInterval) clearInterval(progressInterval);
  setProgress(fillId, numId, 100);
}

/* ==========================================
   СБОР ДАННЫХ ФОРМЫ
========================================== */
function collectForm() {
  return {
    storyType:       document.querySelector('input[name="storyType"]:checked').value,
    fandomName:      document.getElementById('fandomName').value.trim(),
    pairings:        document.getElementById('pairings').value.trim(),
    characters:      collectCharacters(),
    storyFormat:     document.getElementById('storyFormat').value,
    rating:          document.getElementById('rating').value,
    genres:          getSelectedGenres(),
    plotDescription: document.getElementById('plotDescription').value.trim(),
    authorNotes:     document.getElementById('authorNotes').value.trim(),

    length:          parseInt(lengthSlider.value),
    addProfanity:    document.getElementById('cbProfanity').checked,
    charDeath:       document.getElementById('cbCharDeath').checked,
    triggerWarnings: document.getElementById('cbTrigger').checked
                       ? document.getElementById('triggerWarnings').value.trim() : '',
    image:           base64Image,
    imageMimeType:   imageMime,
  };
}

/* ==========================================
   ПОСТРОЕНИЕ ПРОМПТА
========================================== */
function buildStoryPrompt(data, previousText = '') {
  const formatMap = {
    full:    'Полная история (законченный one-shot с началом, серединой и финалом)',
    chapter: 'Только первая глава — обрывается на самом интересном месте, как продолжение следует',
    scene:   'Одна конкретная сцена — без экспозиции, сразу погружение в момент'
  };

  const system = `Ты талантливый и профессиональный писатель-фикрайтер. Напиши художественный текст на русском языке. Пиши сразу готовый художественный текст без предисловий. Используй абзацы, описания и живые диалоги. Учитывай все указания пользователя.`;

  let p = '';
  if (previousText) {
    p += `ВОТ УЖЕ НАПИСАННЫЙ ТЕКСТ, который нужно продолжить:\n"""\n${previousText}\n"""\n\nНапиши следующую часть, сохраняя тот же стиль, темп и голос повествования. НЕ повторяй уже написанный текст.\n\n`;
  }
  if (data.storyType === 'fandom' && data.fandomName) {
    p += `Фандом: ${data.fandomName}\n`;
    p += `ВАЖНО: Если персонажи или события явно не указаны, СТРОГО следуй официальному канону выбранного фандома. Не выдумывай новых персонажей и события, противоречащие лору.\n`;
  } else {
    p += `Тип: Ориджинал (оригинальная история)\n`;
  }
  if (data.pairings)   p += `Пэйринги: ${data.pairings}\n`;
  if (data.characters) p += `Персонажи:\n${data.characters}\n`;
  if (data.genres?.length) p += `Жанры: ${data.genres.join(', ')}\n`;
  p += `Рейтинг: ${data.rating}\n`;
  p += `Формат: ${formatMap[data.storyFormat] || formatMap.full}\n`;
  if (data.plotDescription) p += `Сюжет: ${data.plotDescription}\n`;
  if (data.authorNotes) p += `Пожелания: ${data.authorNotes}\n`;
  const lengths = { 1:'~500-1000 слов', 2:'~1500-3000 слов', 3:'~4000+ слов' };
  p += `Объём: ${lengths[data.length]}\n`;
  const triggers = [];
  if (data.addProfanity) triggers.push('нецензурная лексика разрешена');
  if (data.charDeath) triggers.push('СМЕРТЬ ОСНОВНОГО ПЕРСОНАЖА');
  if (data.triggerWarnings) triggers.push(data.triggerWarnings);
  if (triggers.length) p += `Предупреждения: ${triggers.join(', ')}\n`;
  if (data.image) p += `\nПрикреплена картинка-референс. Учти её атмосферу и детали в тексте.\n`;
  return { system, user: p };
}

/* ==========================================
   GEMINI API
========================================== */
let currentAbortController = null;

async function callGemini(promptText, systemText = '', imageData = null, mimeType = null, retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${userGeminiKey}`;
  const parts = [{ text: `<user_prompt>\n${promptText}\n</user_prompt>` }];
  if (imageData && mimeType) parts.push({ inline_data: { mime_type: mimeType, data: imageData } });

  const payload = { contents: [{ parts }], generationConfig: { temperature: 0.9 } };
  if (systemText) {
    payload.system_instruction = { parts: [{ text: systemText }] };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (currentAbortController) currentAbortController.abort();
      currentAbortController = new AbortController();

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: currentAbortController.signal
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429 && attempt < retries) {
          console.warn(`Rate limit 429. Retrying...`);
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new Error(data.error?.message || 'Ошибка сервера');
      }
      if (!data.candidates?.[0]?.content) throw new Error('Нейросеть вернула пустой ответ');
      return data.candidates[0].content.parts[0].text;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Запрос отменён новым действием');
      if (attempt === retries) throw err;
    }
  }
}

/* ==========================================
   ОСНОВНАЯ ГЕНЕРАЦИЯ
========================================== */
const pagesContainer   = document.getElementById('pagesContainer');
const tabNav           = document.querySelector('.tab-nav');
const loadingScreen    = document.getElementById('loadingScreen');
const resultScreen     = document.getElementById('resultScreen');
const loadingModelInfo = document.getElementById('loadingModelInfo');
let currentStoryData   = null;
let currentStoryText   = '';

async function runGeneration(promptObj, imageData, mimeType, isEdit = false) {
  if (!requireApiKey()) return;
  
  document.querySelectorAll('.action-btn, .edit-btn, .generate-btn, .plot-action-btn').forEach(b => b.disabled = true);
  pagesContainer.style.display = 'none';
  tabNav.style.display         = 'none';
  resultScreen.classList.remove('visible');
  loadingModelInfo.textContent = selectedModel.includes('3')
    ? 'Пишет Gemini 3 Flash (новейшая модель, глубокий анализ)…'
    : selectedModel.includes('lite')
    ? 'Пишет Gemini 2.5 Flash Lite (сверхбыстрая генерация)…'
    : 'Пишет Gemini 2.5 Flash…';
  loadingScreen.classList.add('visible');
  startProgress('progressFill', 'progressNum');

  try {
    const userText = typeof promptObj === 'string' ? promptObj : promptObj.user;
    const sysText  = typeof promptObj === 'string' ? '' : promptObj.system;
    const text = await callGemini(userText, sysText, imageData, mimeType);
    finishProgress('progressFill', 'progressNum');
    setTimeout(() => {
      loadingScreen.classList.remove('visible');
      if (isEdit) {
        currentStoryText += '\n\n─────────────────\n\n' + text;
      } else {
        currentStoryText = text;
      }
      showResult(currentStoryText, currentStoryData);
      document.querySelectorAll('.action-btn, .edit-btn, .generate-btn, .plot-action-btn').forEach(b => b.disabled = false);
    }, 700);
  } catch (err) {
    clearInterval(progressInterval);
    loadingScreen.classList.remove('visible');
    pagesContainer.style.display = 'block';
    tabNav.style.display         = 'flex';
    document.querySelectorAll('.action-btn, .edit-btn, .generate-btn, .plot-action-btn').forEach(b => b.disabled = false);
    alert('❌ Ошибка: ' + err.message);
  }
}

document.getElementById('generateBtn').addEventListener('click', () => {
  if (!requireApiKey()) return;
  currentStoryData = collectForm();
  const prompt = buildStoryPrompt(currentStoryData);
  runGeneration(prompt, currentStoryData.image, currentStoryData.imageMimeType, false);
});

/* ==========================================
   РЕЗУЛЬТАТ
========================================== */
function showResult(text, data) {
  const metaParts = [];
  if (data.storyType === 'fandom' && data.fandomName) metaParts.push(`Фандом: ${data.fandomName}`);
  if (data.pairings) metaParts.push(`Пэйринг: ${data.pairings}`);
  metaParts.push(`Рейтинг: ${data.rating}`);
  if (data.genres?.length) metaParts.push(data.genres.join(', '));
  document.getElementById('resultMeta').textContent = metaParts.join(' · ');
  
  // XSS Protection and Markdown formatting
  const html = DOMPurify.sanitize(marked.parse(text));
  document.getElementById('resultContent').innerHTML = html;
  
  resultScreen.classList.add('visible');
  resultScreen.scrollIntoView({ behavior:'smooth', block:'start' });
}

let isLibraryEditMode = false;

document.getElementById('newStoryBtn').addEventListener('click', () => {
  resultScreen.classList.remove('visible');
  pagesContainer.style.display = 'block';
  tabNav.style.display         = 'flex';
  window.scrollTo({ top:0, behavior:'smooth' });

  if (isLibraryEditMode) {
    document.querySelector('.tab-btn[data-tab="library"]').click();
    isLibraryEditMode = false;
    document.getElementById('newStoryBtn').textContent = '✍️ Новая история';
  } else {
    document.querySelector('.tab-btn[data-tab="create"]').click();
  }
});

/* ==========================================
   КНОПКИ РЕДАКТИРОВАНИЯ ИСТОРИИ
========================================== */
const editActions = {
  drama:    'Возьми этот текст и добавь в него драматичный момент — внезапное откровение, ссору или горькую потерю. Вплети его органично.',
  twist:    'Возьми этот текст и добавь неожиданный сюжетный поворот, который переворачивает всё с ног на голову.',
  fluff:    'Возьми этот текст и добавь нежный, тёплый момент между персонажами — случайное касание, тихий диалог или уютную сцену.',
  dialogue: 'Возьми этот текст и добавь живой, эмоциональный диалог между персонажами, раскрывающий их характеры.',
};

document.querySelectorAll('.edit-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    if (!requireApiKey()) return;
    const action = btn.dataset.action;

    if (action === 'continue') {
      const prompt = buildStoryPrompt(currentStoryData, currentStoryText);
      runGeneration(prompt, null, null, true);
      return;
    }

    const instruction = editActions[action];
    if (!instruction) return;
    const prompt = `${instruction}\n\nТЕКСТ:\n"""\n${currentStoryText}\n"""\n\nВерни ТОЛЬКО переработанный текст, без пояснений.`;
    btn.disabled = true;
    btn.textContent = '⏳';
    try {
      const newText = await callGemini(prompt);
      currentStoryText = newText;
      showResult(currentStoryText, currentStoryData);
    } catch (err) {
      alert('❌ Ошибка: ' + err.message);
    } finally {
      btn.disabled = false;
      const labels = { drama:'🌹 Добавить драму', twist:'⚡ Сюжетный поворот', fluff:'☁️ Добавить флафф', dialogue:'💬 Добавить диалог' };
      btn.textContent = labels[action] || btn.textContent;
    }
  });
});

document.getElementById('resultContent').addEventListener('input', (e) => {
  currentStoryText = e.target.innerText;
});

document.getElementById('sendCustomEditBtn').addEventListener('click', async () => {
  if (!requireApiKey()) return;
  const userPrompt = document.getElementById('customEditPrompt').value.trim();
  if (!userPrompt) return;
  const prompt = `Пользовательский запрос к тексту: "${userPrompt}"\n\nТЕКСТ ДЛЯ РЕДАКТИРОВАНИЯ:\n"""\n${currentStoryText}\n"""\n\nВыполни этот запрос и верни ТОЛЬКО переработанный текст, без пояснений.`;
  const btn = document.getElementById('sendCustomEditBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Отправляем...';
  try {
    const newText = await callGemini(prompt);
    currentStoryText = newText;
    showResult(currentStoryText, currentStoryData);
    document.getElementById('customEditPrompt').value = '';
  } catch (err) {
    alert('❌ Ошибка: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Отправить запрос ИИ';
  }
});

document.getElementById('toggleEditBtn').addEventListener('click', (e) => {
  const btn = e.currentTarget;
  const content = document.getElementById('resultContent');
  const isEditing = content.getAttribute('contenteditable') === 'true';
  if (isEditing) {
    content.setAttribute('contenteditable', 'false');
    btn.textContent = '✏️ Редактировать текст';
    btn.style.background = 'rgba(196, 162, 89, 0.1)';
    btn.style.color = 'var(--gold-light)';
    currentStoryText = content.innerText;
  } else {
    content.setAttribute('contenteditable', 'true');
    content.focus();
    btn.textContent = '💾 Сохранить изменения';
    btn.style.background = 'var(--gold)';
    btn.style.color = 'var(--bg)';
  }
});

/* ==========================================
   ЧИТАЛКА (тема, шрифт, размер)
========================================== */
let fontSize = 16;
let isSerif = true;

document.getElementById('fontIncrease').addEventListener('click', () => {
  fontSize = Math.min(24, fontSize + 1);
  document.getElementById('resultContent').style.fontSize = fontSize + 'px';
  document.querySelectorAll('#resultContent p, #resultContent h1, #resultContent h2, #resultContent h3, #resultContent ul, #resultContent li').forEach(el => {
    el.style.fontSize = fontSize + 'px';
  });
});
document.getElementById('fontDecrease').addEventListener('click', () => {
  fontSize = Math.max(12, fontSize - 1);
  document.getElementById('resultContent').style.fontSize = fontSize + 'px';
  document.querySelectorAll('#resultContent p, #resultContent h1, #resultContent h2, #resultContent h3, #resultContent ul, #resultContent li').forEach(el => {
    el.style.fontSize = fontSize + 'px';
  });
});
document.getElementById('fontSerifToggle').addEventListener('click', () => {
  isSerif = !isSerif;
  const fontFam = isSerif ? "Georgia, 'Cormorant', serif" : "'Helvetica Neue', Arial, sans-serif";
  document.getElementById('resultContent').style.fontFamily = fontFam;
  document.querySelectorAll('#resultContent p, #resultContent h1, #resultContent h2, #resultContent h3, #resultContent ul, #resultContent li').forEach(el => {
    el.style.fontFamily = fontFam;
  });
});

/* ==========================================
   СОХРАНИТЬ В БИБЛИОТЕКУ
========================================== */
document.getElementById('saveLibraryBtn').addEventListener('click', async () => {
  if (!currentStoryData) return;
  const library = await getLibraryAsync();
  if (library.some(i => i.text === currentStoryText)) {
    showSavedFeedback('✅ Уже сохранено!'); return;
  }
  library.unshift({
    id:    Date.now(),
    title: buildTitle(currentStoryData),
    meta:  document.getElementById('resultMeta').textContent,
    text:  currentStoryText,
    date:  new Date().toLocaleDateString('ru-RU'),
    data:  currentStoryData
  });
  await localforage.setItem('fanfic_library', library);
  showSavedFeedback('✅ Сохранено!');
});
function showSavedFeedback(msg) {
  const btn = document.getElementById('saveLibraryBtn');
  const orig = btn.textContent; btn.textContent = msg; btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2200);
}
function buildTitle(d) {
  if (d.fandomName && d.pairings) return `${d.fandomName}: ${d.pairings}`;
  if (d.fandomName) return d.fandomName;
  if (d.pairings) return d.pairings;
  if (d.plotDescription) return d.plotDescription.slice(0, 55) + '…';
  return 'Безымянная история';
}

/* ==========================================
   PDF
========================================== */
/* ==========================================
   PDF
========================================== */
document.getElementById('downloadPdfBtn').addEventListener('click', (e) => {
  const title = document.getElementById('resultTitle').textContent || "История";
  document.getElementById('printTitle').textContent = title;
  document.getElementById('printMeta').textContent = document.getElementById('resultMeta').textContent;
  document.getElementById('printContent').innerHTML = document.getElementById('resultContent').innerHTML;
  
  // Краткая задержка для рендера DOM перед печатью
  setTimeout(() => window.print(), 100);
});

/* ==========================================
   БИБЛИОТЕКА
========================================== */
async function getLibraryAsync() {
  const lib = await localforage.getItem('fanfic_library');
  return lib || [];
}

async function renderLibrary() {
  const list = await getLibraryAsync();
  const container = document.getElementById('libraryList');
  if (!list.length) {
    container.innerHTML = '<p class="empty-library">Твоя библиотека пуста.<br/>Создай первую историю!</p>';
    return;
  }
  container.innerHTML = '';
  
  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'library-item';
    
    const title = document.createElement('div');
    title.className = 'lib-item-title';
    title.textContent = `📜 ${item.title}`;
    
    const meta = document.createElement('div');
    meta.className = 'lib-item-meta';
    meta.textContent = `📅 ${item.date} · 🏷️ ${item.meta}`;
    
    const prev = document.createElement('div');
    prev.className = 'lib-item-preview';
    prev.textContent = item.text.slice(0, 160) + '…';
    
    const actions = document.createElement('div');
    actions.className = 'lib-item-actions';
    
    const btnRead = document.createElement('button');
    btnRead.className = 'lib-btn read-btn';
    btnRead.textContent = '📖 Читать';
    btnRead.onclick = () => openModal(item.id);
    
    const btnPdf = document.createElement('button');
    btnPdf.className = 'lib-btn pdf-btn';
    btnPdf.textContent = '📄 PDF';
    btnPdf.onclick = (e) => downloadItemPdf(item, e.currentTarget);

    const btnCont = document.createElement('button');
    btnCont.className = 'lib-btn play-btn';
    btnCont.textContent = '✍️ Продолжить';
    btnCont.onclick = () => continueLibraryStory(item);
    
    const btnDel = document.createElement('button');
    btnDel.className = 'lib-btn delete del-btn';
    btnDel.textContent = '🗑️ Удалить';
    btnDel.onclick = () => deleteItem(item.id);
    
    actions.append(btnRead, btnCont, btnPdf, btnDel);
    el.append(title, meta, prev, actions);
    container.append(el);
  });
}

function downloadItemPdf(item, btn) {
  document.getElementById('printTitle').textContent = item.title.replace('📜 ', '');
  document.getElementById('printMeta').textContent = item.meta.replace('📅 ', '').replace('🏷️ ', '');
  document.getElementById('printContent').innerHTML = DOMPurify.sanitize(marked.parse(item.text));
  
  // Краткая задержка для рендера DOM перед печатью
  setTimeout(() => window.print(), 100);
}


function continueLibraryStory(item) {
  currentStoryData = item.data || { plotDescription: item.title }; 
  currentStoryText = item.text;
  isLibraryEditMode = true;

  pagesContainer.style.display = 'none';
  tabNav.style.display = 'none';
  
  document.getElementById('newStoryBtn').textContent = '⬅ Назад в библиотеку';
  
  showResult(currentStoryText, currentStoryData);
}

let currentModalItemId = null;

function openModal(id) {
  getLibraryAsync().then(library => {
    const item = library.find(i => i.id === id);
    if (!item) return;
    currentModalItemId = id;
    document.getElementById('modalTitle').textContent   = item.title;
    const html = DOMPurify.sanitize(marked.parse(item.text));
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('summaryResult').style.display = 'none';
    document.getElementById('readModal').classList.add('open');
  });
}

async function deleteItem(id) {
  if (!confirm('Удалить эту историю?')) return;
  const list = await getLibraryAsync();
  await localforage.setItem('fanfic_library', list.filter(i => i.id !== id));
  renderLibrary();
}

document.getElementById('modalClose').addEventListener('click', () =>
  document.getElementById('readModal').classList.remove('open'));
document.getElementById('readModal').addEventListener('click', e => {
  if (e.target === document.getElementById('readModal'))
    document.getElementById('readModal').classList.remove('open');
});

/* ==========================================
   ГЕНЕРАЦИЯ САММАРИ В БИБЛИОТЕКЕ
========================================== */
document.getElementById('modalSummaryBtn').addEventListener('click', async () => {
  if (!requireApiKey()) return;
  const library = await getLibraryAsync();
  const item = library.find(i => i.id === currentModalItemId);
  if (!item) return;

  const btn = document.getElementById('modalSummaryBtn');
  const orig = btn.textContent;
  btn.textContent = '⏳ Генерирую…'; btn.disabled = true;

  try {
    const prompt = `Прочитай этот фанфик и напиши для него два варианта краткого описания (саммари) для публикации на Ficbook или AO3 на русском языке:
1. Интригующее описание (3-4 предложения), которое захватывает читателя и не раскрывает финал.
2. Краткое полное описание (2-3 предложения) с указанием основного сюжета.

ТЕКСТ ФАНФИКА:
"""
${item.text.slice(0, 4000)}
"""

Верни только два описания, без лишних пояснений.`;

    const text = await callGemini(prompt);
    document.getElementById('summaryText').textContent = text;
    document.getElementById('summaryResult').style.display = 'block';
  } catch (err) {
    alert('❌ Ошибка: ' + err.message);
  } finally {
    btn.textContent = orig; btn.disabled = false;
  }
});

document.getElementById('copySummaryBtn').addEventListener('click', () => {
  const text = document.getElementById('summaryText').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copySummaryBtn');
    const orig = btn.textContent; btn.textContent = '✅ Скопировано!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
});

/* ==========================================
   МОДАЛЬНОЕ ОКНО ИДЕЙ
========================================== */
const ideaModal = document.getElementById('ideaModal');
const ideaGenre = document.getElementById('ideaGenre');
const ideaTitle = document.getElementById('ideaTitle');
const ideaText  = document.getElementById('ideaText');

function showIdea(idea) {
  ideaGenre.textContent = idea.genre;
  ideaTitle.textContent = idea.title;
  ideaText.textContent  = idea.text;
}
document.getElementById('getIdeaBtn').addEventListener('click', () => {
  showIdea(getNextIdea()); ideaModal.classList.add('open');
});
document.getElementById('ideaNext').addEventListener('click', () => showIdea(getNextIdea()));
document.getElementById('ideaClose').addEventListener('click', () => ideaModal.classList.remove('open'));
ideaModal.addEventListener('click', e => {
  if (e.target === ideaModal) ideaModal.classList.remove('open');
});
document.getElementById('ideaCopy').addEventListener('click', () => {
  navigator.clipboard.writeText(`${ideaGenre.textContent}\n${ideaTitle.textContent}\n\n${ideaText.textContent}`)
    .then(() => {
      const btn = document.getElementById('ideaCopy');
      const orig = btn.textContent; btn.textContent = '✅ Скопировано!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
});

/* ==========================================
   ИИ-ГЕНЕРАТОР СЮЖЕТА
========================================== */
const plotLoadingScreen = document.getElementById('plotLoadingScreen');

document.getElementById('generatePlotBtn').addEventListener('click', async () => {
  if (!requireApiKey()) return;
  const input = document.getElementById('plotInput').value.trim();
  if (!input) { alert('Введи краткую идею для сюжета!'); return; }

  document.getElementById('plotResult').style.display = 'none';
  plotLoadingScreen.classList.add('visible');
  startProgress('plotProgressFill', 'plotProgressNum');
  document.getElementById('generatePlotBtn').disabled = true;

  try {
    const prompt = `Ты профессиональный писатель. На основе краткой идеи разработай четкий, структурированный план сюжета (идеальный промпт для последующей генерации).
Не пиши лишней воды и длинных вступлений. Сразу выдавай структуру:

1. **Завязка**: (описание)
2. **Развитие конфликта**: (описание)
3. **Кульминация**: (описание)
4. **Развязка**: (описание)

Сюжетная идея пользователя: ${input}`;
    const sysInst = 'Ты профи-сценарист. Выдавай только структурированный план.';
    const text = await callGemini(prompt, sysInst);
    finishProgress('plotProgressFill', 'plotProgressNum');
    setTimeout(() => {
      plotLoadingScreen.classList.remove('visible');
      document.getElementById('plotResultText').textContent = text;
      document.getElementById('plotResult').style.display = 'block';
      document.getElementById('generatePlotBtn').disabled = false;
    }, 600);
  } catch (err) {
    document.getElementById('generatePlotBtn').disabled = false;
    clearInterval(progressInterval);
    plotLoadingScreen.classList.remove('visible');
    alert('❌ Ошибка: ' + err.message);
  }
});

document.getElementById('copyPlotBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('plotResultText').textContent)
    .then(() => {
      const btn = document.getElementById('copyPlotBtn');
      const orig = btn.textContent; btn.textContent = '✅ Скопировано!';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    });
});

/* ==========================================
   КНОПКИ «МНЕ ПОВЕЗЕТ» (РАНДОМИЗАТОР)
========================================== */
const RANDOM_DATA = {
  fandoms: [
    "Гарри Поттер", "Атака Титанов", "Genshin Impact", "Благословение небожителей",
    "Arcane", "Властелин Колец", "Марвел (MCU)", "Ведьмак", "Звёздные Войны", "Cyberpunk 2077",
    "Violet Evergarden", "Наруто", "Fullmetal Alchemist", "Чёрный дворецкий", "Шерлок BBC"
  ],
  pairings: [
    "Враги, вынужденные работать вместе",
    "Друзья детства, осознавшие чувства спустя годы",
    "Телохранитель и его подопечный",
    "Два злодея объединяются против общего врага",
    "Начальник и подчинённый, скрывающие чувства",
    "Один скрывает свою личность от другого",
    "Соулмейты (родственные души), разлучённые судьбой",
    "Один исцеляет другого — морально и физически",
    "Принц/принцесса и простолюдин",
    "Детектив и главный подозреваемый"
  ],
  plots: [
    "Они случайно запираются в одной комнате на всю ночь. Сначала спорят, но затем начинают откровенный разговор, который меняет всё.",
    "Главный герой теряет память и не помнит своего возлюбленного. Второму приходится заново завоёвывать его сердце, скрывая боль.",
    "Один из них тяжело ранен после битвы. Второй, всегда холодный и отстранённый, впервые показывает настоящие эмоции.",
    "AU: они работают в уютной кофейне во время дождливой осени. Никакой магии — только кофе и случайные касания рук.",
    "Древний артефакт заставляет их говорить только правду 24 часа. Все скрытые тайны и чувства выходят наружу.",
    "Они получают задание притвориться парой. Постепенно понимают, что притворяться становится всё сложнее.",
    "Один из них умирает и возвращается другим человеком. Второй узнаёт его, но не понимает — как.",
    "Письмо, написанное «на случай смерти», случайно отправляется живому адресату.",
    "Они соперничают за одну должность, но вынуждены ехать в командировку вместе.",
    "После расставания они встречаются снова — спустя пять лет, совершенно другими людьми."
  ]
};

document.getElementById('diceFandom')?.addEventListener('click', () => {
  const input = document.getElementById('fandomName');
  input.value = RANDOM_DATA.fandoms[Math.floor(Math.random() * RANDOM_DATA.fandoms.length)];
  document.querySelector('input[name="storyType"][value="fandom"]').click();
  input.style.transition = 'background 0.3s';
  input.style.background = 'rgba(212,175,55,0.18)';
  setTimeout(() => { input.style.background = ''; }, 800);
});

document.getElementById('dicePairings')?.addEventListener('click', () => {
  const input = document.getElementById('pairings');
  input.value = RANDOM_DATA.pairings[Math.floor(Math.random() * RANDOM_DATA.pairings.length)];
  input.style.transition = 'background 0.3s';
  input.style.background = 'rgba(212,175,55,0.18)';
  setTimeout(() => { input.style.background = ''; }, 800);
});

document.getElementById('dicePlot')?.addEventListener('click', () => {
  const input = document.getElementById('plotDescription');
  input.value = RANDOM_DATA.plots[Math.floor(Math.random() * RANDOM_DATA.plots.length)];
  input.style.transition = 'background 0.3s';
  input.style.background = 'rgba(212,175,55,0.18)';
  setTimeout(() => { input.style.background = ''; }, 800);
});

/* ==========================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
========================================== */
// escapeHtml is no longer needed since DOM element textContent is now used exclusively
