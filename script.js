'use strict';

/* ==========================================
   НАСТРОЙКИ И API КЛЮЧ
========================================== */
const apiKeyInput = document.getElementById('apiKeyInput');
const modelSelect = document.getElementById('modelSelect');
const saveKeyBtn  = document.getElementById('saveKeyBtn');
const keyStatus   = document.getElementById('keyStatus');

// Загружаем настройки при входе
let userGeminiKey = localStorage.getItem('gemini_api_key') || '';
let selectedModel = localStorage.getItem('gemini_model') || 'gemini-2.0-flash';

if (userGeminiKey) apiKeyInput.value = userGeminiKey;
modelSelect.value = selectedModel;

saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  const model = modelSelect.value;
  
  if (key) {
    localStorage.setItem('gemini_api_key', key);
    localStorage.setItem('gemini_model', model);
    userGeminiKey = key;
    selectedModel = model;
    keyStatus.textContent = '✅ Настройки успешно сохранены в браузере!';
    keyStatus.style.color = '#5b8c5a';
  } else {
    localStorage.removeItem('gemini_api_key');
    userGeminiKey = '';
    keyStatus.textContent = '❌ Ключ удалён.';
    keyStatus.style.color = '#c4555a';
  }
  setTimeout(() => { keyStatus.textContent = ''; }, 3000);
});

function requireApiKey() {
  if (!userGeminiKey) {
    alert('Сначала нужно ввести бесплатный ключ Google Gemini в настройках!');
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
  { genre:"🔮 Фэнтези и Магия", title:"«Магазин разбитых душ»", text:"(Ориджинал) Городское фэнтези. В антикварной лавке продают не вещи, а воспоминания. Главная героиня покупает память о своей первой любви, но обнаруживает, что в её настоящем этой любви никогда не существовало." },
  { genre:"🔮 Фэнтези и Магия", title:"«Ведьмак: Ошибка портала»", text:"Геральт оказывается в современном Токио. Его серебряный меч реагирует на электрические помехи как на монстров. Ему приходится объединиться с местным детективом, чтобы выследить «цифрового духа»." },
  { genre:"🔮 Фэнтези и Магия", title:"«Ткачи снов»", text:"(Ориджинал) В мире, где сны — это валюта, бедняки видят только кошмары. Герой-вор решает украсть «золотой сон» у короля, но застревает в нем, понимая, что это ловушка для его разума." },
  { genre:"🎭 Драма и Психология", title:"«Эффект обратного кадра»", text:"(Ориджинал) Девушка просыпается каждый день на один год раньше. Она молодеет, а мир вокруг становится всё более незнакомым. Ей нужно найти человека, который «движется» во времени нормально, чтобы остановить процесс." },
  { genre:"🎭 Драма и Психология", title:"«Genshin Impact: Эхо Селестии»", text:"Кэйа внезапно начинает слышать голоса погибших жителей Каэнри'ах через монеты, которые он тратит. Каждый золотой требует искупления, превращая его жизнь в череду опасных квестов." },
  { genre:"🎭 Драма и Психология", title:"«Письма из ниоткуда»", text:"(Ориджинал) Парень находит в почтовом ящике письма от самого себя из будущего, где он описывает идеальную жизнь. Однако с каждым письмом почерк становится всё более неразборчивым и пугающим." },
  { genre:"🎭 Драма и Психология", title:"«Шерлок: Последняя загадка»", text:"Мориарти оставляет Шерлоку серию дел, где преступник — сам Холмс, но он этого не помнит. Это игра на грани безумия и потери самоидентификации." },
  { genre:"🎭 Драма и Психология", title:"«Музыкальный слух»", text:"(Ориджинал) Пианист теряет слух, но начинает видеть звуки как цвета. Он влюбляется в девушку, чей голос выглядит как «смертельно опасный чёрный», и пытается разгадать её тайну." },
  { genre:"💞 Романтика и Комедия", title:"«Любовь по обмену телами»", text:"(Ориджинал) Классический троп, но с условием: герои меняются телами только тогда, когда злятся друг на друга. Им приходится учиться доброте, чтобы вернуть свои жизни." },
  { genre:"💞 Романтика и Комедия", title:"«Звёздные войны: Контрабанда чувств»", text:"Хану Соло поручают перевезти груз, который оказывается разумным кристаллом, транслирующим мысли окружающих. Лея и Хан вынуждены слушать признания друг друга всю дорогу." },
  { genre:"💞 Романтика и Комедия", title:"«Кофейня для монстров»", text:"(Ориджинал) Обычный бариста случайно открывает кафе в полночь и понимает, что его клиенты — вампиры и оборотни. Оказывается, латте на овсяном молоке — единственное, что сдерживает их жажду крови." },
  { genre:"💞 Романтика и Комедия", title:"«Marvel: Ассистент Локи»", text:"Обычная девушка нанимается помощницей к Локи, думая, что он просто эксцентричный бизнесмен. Её задача — планировать захват мира между походами в химчистку." },
  { genre:"💞 Романтика и Комедия", title:"«Приложение для судьбы»", text:"(Ориджинал) Появляется соцсеть, которая показывает 100% совместимость. Герой находит свою «пару», но это его заклятый враг из школы." },
  { genre:"🔪 Триллер и Хоррор", title:"«Смерть в объективе»", text:"(Ориджинал) Фотограф замечает на своих снимках человека, которого не было в реальности. С каждым новым фото фигура становится ближе к камере и чётче." },
  { genre:"🔪 Триллер и Хоррор", title:"«Stranger Things: Изнанка внутри»", text:"Одиннадцатая понимает, что монстры — это её подавленные эмоции. Чтобы победить Демогоргона, ей нужно научиться ненавидеть саму себя, что разрушает её личность." },
  { genre:"🔪 Триллер и Хоррор", title:"«Отель «Вечность»»", text:"(Ориджинал) Группа друзей заезжает в отель, где время зациклено на одном вечере. Каждую ночь один из них исчезает, а остальные забывают о его существовании." },
  { genre:"🔪 Триллер и Хоррор", title:"«Ганнибал: Кулинарная дуэль»", text:"Уилл Грэм начинает готовить для Лектера, используя те же «особые» ингредиенты. Это превращается в психологическую игру: кто первым признается, из чего сделано блюдо?" },
  { genre:"🔪 Триллер и Хоррор", title:"«Голос в радиоприёмнике»", text:"(Ориджинал) Радиолюбитель ловит сигнал из 1940-х годов. Девушка на той стороне просит о помощи, описывая события, которые происходят прямо сейчас в его доме." },
  { genre:"🤖 Киберпанк и НФ", title:"«Облачное бессмертие»", text:"(Ориджинал) Люди загружают сознание в Сеть после смерти. Герой-хакер обнаруживает, что «Рай» — это просто ферма для вычислений, а личности стёрты." },
  { genre:"🤖 Киберпанк и НФ", title:"«Киберпанк 2077: Фантомная память»", text:"Ви находит чип с сознанием ребёнка, который утверждает, что Джонни Сильверхенд никогда не существовал, а был лишь программой подавления." },
  { genre:"🤖 Киберпанк и НФ", title:"«Последний ботаник»", text:"(Ориджинал) На планете, где вся растительность вымерла, герой находит настоящий живой цветок. За ним охотятся корпорации, но цветок начинает общаться с героем через запахи." },
  { genre:"🤖 Киберпанк и НФ", title:"«Detroit: Become Human — Ошибка 404»", text:"Коннор начинает чувствовать страх не перед людьми, а перед другими андроидами, которые создают тайную сеть для управления человечеством." },
  { genre:"🤖 Киберпанк и НФ", title:"«Планета близнецов»", text:"(Ориджинал) Космонавты приземляются на планету, где каждый встречает свою точную копию. Проблема в том, что копии убеждены, что они — оригиналы, прилетевшие с Земли." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Алиса в Стране Кошмаров»", text:"Алиса возвращается в Страну Чудес через 20 лет и видит, что Шляпник стал диктатором, а Чеширский кот — единственным, кто помнит правду." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Золушка: Месть за кулисами»", text:"(Ориджинал) Золушка не хочет на бал. Она использует фею-крёстную, чтобы создать армию крыс и захватить замок, потому что принц — тиран." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Питер Пэн: Тень повзрослела»", text:"Тень Питера Пэна сбегает от него, потому что хочет состариться и умереть как человек. Питер преследует её в Лондоне, становясь антагонистом." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Красавица и Чудовище: Проклятие розы»", text:"Каждый лепесток, который падает, стирает память Красавицы о том, кто она такая. Чудовище пытается спасти её, но она забывает его имя каждый вечер." },
  { genre:"🧚 Сказки и Ретеллинги", title:"«Красная Шапочка: Охотник»", text:"(Ориджинал) В лесу нет волка. Есть только девочка, которая сошла с ума и вообразила монстра, чтобы оправдать свои поступки." },
  { genre:"🪞 Психологический реализм", title:"«Эхо в пустой квартире»", text:"(Ориджинал) Герой обнаруживает, что его жена — это коллективный плод воображения его соседей. Когда он начинает выздоравливать, она буквально исчезает по частям." },
  { genre:"🪞 Психологический реализм", title:"«Шерлок: Когнитивный распад»", text:"У Шерлока ранняя стадия деменции. Он пытается раскрыть своё последнее дело, понимая, что его главный враг теперь — его собственный мозг, который подменяет улики ложными воспоминаниями." },
  { genre:"🪞 Психологический реализм", title:"«Инвентаризация чувств»", text:"(Ориджинал) В этом мире любовь облагается налогом. Люди обязаны подавать декларацию о силе своих чувств. Главный герой — налоговый инспектор, который должен доказать, что пара симулирует страсть ради вычетов." },
  { genre:"🪞 Психологический реализм", title:"«Дориан Грей: Цифровая версия»", text:"Современный ретеллинг. Твоё старение и грехи отражаются не на холсте, а на твоём профиле в соцсетях. Ты выглядишь святым, пока твоя цифровая личность гниёт заживо." },
  { genre:"🪞 Психологический реализм", title:"«Прощание с манекеном»", text:"(Ориджинал) Одинокий мужчина влюбляется в ИИ-андроида. Когда модель снимают с производства, он должен решить: стереть её личность или «убить» физически, сохранив код на флешке." },
  { genre:"⚙️ Антиутопия", title:"«Право на забвение»", text:"(Ориджинал) Технология позволяет полностью стереть человека из памяти всех знакомых. Это легальный способ самоубийства без смерти. Главная героиня выбирает эту процедуру, но на следующее утро просыпается и понимает, что передумала." },
  { genre:"⚙️ Антиутопия", title:"«Гарри Поттер: Магический сегрегатор»", text:"Взрослый мир, где маглорождённые маги обязаны носить ограничители силы. Гермиона возглавляет подпольное радикальное движение, которое планирует лишить магии всех чистокровных." },
  { genre:"⚙️ Антиутопия", title:"«Город вечного дня»", text:"(Ориджинал) Социум, где сон объявлен вне закона. Герой находит подпольный «клуб сна», где люди рискуют жизнью ради восьми часов галлюцинаций, которые мы называем снами." },
  { genre:"⚙️ Антиутопия", title:"«Ведьмак: Контракт на бога»", text:"Геральта нанимает деревня, чтобы убить их местное божество, которое долгие годы защищало их, но взамен требовало слишком высокой моральной цены — отказа от свободы воли." },
  { genre:"⚙️ Антиутопия", title:"«Очередь за смыслом»", text:"(Ориджинал) Люди рождаются с датой смерти на запястье. Главный герой — «торговец временем», который выкупает последние дни у отчаявшихся, чтобы продать их богачам." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Скульптор пустоты»", text:"(Ориджинал) Художник создаёт статуи из «ничего». Зрители видят в пустоте то, чего им больше всего не хватает. Однажды он создаёт скульптуру, которая начинает поглощать реальность вокруг себя." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Сверхъестественное: Петля вины»", text:"Дин застревает в чистилище, которое выглядит как бесконечный ужин с отцом. Каждый вечер он должен оправдываться за свои ошибки, и каждый раз отец находит новый способ его сломать." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Квартира №0»", text:"(Ориджинал) Герой снимает комнату, в которой зеркало показывает события с задержкой в 5 минут. Он видит, как кто-то входит в его комнату и стоит за его спиной, но когда оборачивается — там никого нет." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Письма мёртвого человека»", text:"(Ориджинал) Ты начинаешь получать письма от самого себя, отправленные за день до твоей реальной смерти. В письмах ты даёшь советы, как избежать гибели, но каждый совет делает твою жизнь только хуже." },
  { genre:"👁️ Экзистенциальный хоррор", title:"«Marvel: ПТСР Ванды»", text:"После всех битв Ванда создаёт мир, где никто не умирает, но и никто не живёт по-настоящему. Это история о том, как горе превращает героя в самого страшного тирана в истории." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Реабилитация муз»", text:"(Ориджинал) Клиника для женщин, которые вдохновляли великих художников и поэтов, а потом были выброшены. Они учатся жить без чужого восхищения, но одна из них решает отомстить своему творцу." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Дьявол в деталях»", text:"(Ориджинал) Детектив расследует серию убийств, где жертвы — это люди, совершившие «незначительное» зло: толкнувшие старика, солгавшие ребёнку. Убийца утверждает, что он — иммунная система города." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Ганнибал: Театр теней»", text:"Уилл Грэм понимает, что Ганнибал не убивает людей, а «превращает их в искусство». Он начинает подыгрывать ему, создавая собственные кровавые инсталляции, чтобы понять, в какой момент перестал быть зрителем." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Последний танец в Припяти»", text:"(Ориджинал) История о двух учёных в зоне отчуждения, которые находят аномалию, позволяющую на одну минуту в день видеть город до аварии. Они становятся зависимы от этого прошлого, игнорируя радиацию." },
  { genre:"🌹 Тёмная романтика и Нуар", title:"«Кровавая Мэри: Изнанка стекла»", text:"Она не убивает тех, кто её зовёт. Она меняется с ними местами. Теперь ты заперт в зазеркалье, наблюдая, как монстр проживает твою скучную жизнь гораздо лучше, чем ты сам." },
  { genre:"🧬 НФ и Философия", title:"«Тест Тьюринга для Бога»", text:"(Ориджинал) Учёные создают суперкомпьютер и задают ему вопрос: «Есть ли Бог?». Машина отвечает: «Теперь есть», и начинает переписывать законы физики под свои капризы." },
  { genre:"🧬 НФ и Философия", title:"«Киберпанк: Рынок органов души»", text:"В мире, где чувства можно скачивать, самые дорогие — это «чистая скорбь» и «искреннее раскаяние». Протагонист промышляет тем, что доводит людей до отчаяния, чтобы собрать урожай данных." },
  { genre:"🧬 НФ и Философия", title:"«Солярис: Версия 2.0»", text:"Океан на другой планете больше не создаёт фантомов людей. Он создаёт копии твоих самых постыдных поступков, заставляя тебя проживать их снова и снова перед лицом всей команды корабля." },
  { genre:"🧬 НФ и Философия", title:"«Вторая кожа»", text:"(Ориджинал) Технология позволяет надеть «костюм» другого человека. Богатые надевают кожу бедных, чтобы почувствовать «настоящую жизнь», а бедные — кожу богатых, чтобы хотя бы день не чувствовать голода." },
  { genre:"🧬 НФ и Философия", title:"«Интерстеллар: Ошибка навигации»", text:"Купер возвращается на Землю, но обнаруживает, что человечество решило не спасаться. Они создали виртуальный рай и просто ждут конца света, считая его возвращение досадной помехой." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Адвокат дьявола: Апелляция»", text:"(Ориджинал) Юрист попадает в ад и решает подать в суд на высшие силы за «нечёткие критерии греха». Он начинает выигрывать дела, и грешники начинают массово возвращаться на землю." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Золушка: Пятьдесят лет спустя»", text:"Она живёт в золотой клетке с принцем-алкоголиком. Фея-крёстная приходит снова, но не с туфельками, а с ядом, предлагая Золушке закончить сказку так, как она того заслуживает." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Матрица: Отрицание»", text:"Нео узнаёт, что Зион — это второй уровень Матрицы, созданный для тех, кому нужно чувство борьбы. Настоящая реальность настолько прекрасна, что человеческий разум отказывается в неё верить." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Коллекционер тишины»", text:"(Ориджинал) Мир, где шум — это энергия. Самые богатые живут в абсолютной тишине, лишая бедняков права на молчание. Главный герой — террорист, который планирует взорвать «звуковую бомбу» в элитном квартале." },
  { genre:"🃏 Твисты и Парадоксы", title:"«Персонаж №4»", text:"(Ориджинал) Герой осознаёт, что он — второстепенный персонаж в плохом фанфике. Он начинает саботировать сюжет, отказываясь говорить свои реплики, чтобы заставить Автора обратить на него внимание." },
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
  if (ideaIndex >= shuffledIdeas.length) {
    shuffledIdeas = shuffle(FANFIC_IDEAS);
    ideaIndex = 0;
  }
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

document.querySelectorAll('.help-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    const text = btn.getAttribute('data-tooltip');
    if (!text) return;
    tooltipBox.textContent = text;
    tooltipBox.classList.add('visible');
    const rect   = btn.getBoundingClientRect();
    const tipW   = 250;
    const tipH   = tooltipBox.offsetHeight || 80;
    let   left   = rect.left + rect.width / 2 - tipW / 2;
    let   top    = rect.top - tipH - 12;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    if (top < 8) top = rect.bottom + 12;
    tooltipBox.style.left = left + 'px';
    tooltipBox.style.top  = top  + 'px';
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
  return Array.from(document.querySelectorAll('.genre-chip.selected'))
    .map(c => c.dataset.value);
}

/* ==========================================
   ФАНДОМ / ОРИДЖИНАЛ
========================================== */
document.querySelectorAll('input[name="storyType"]').forEach(r => {
  r.addEventListener('change', () => {
    document.getElementById('fandom-block').style.display =
      r.value === 'fandom' ? 'block' : 'none';
  });
});

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
  imageMime = file.type;
  const reader = new FileReader();
  reader.onload = e => {
    base64Image = e.target.result.split(',')[1];
    imagePreview.src = e.target.result;
    uploadPlaceholder.style.display = 'none';
    imagePreviewWrap.style.display  = 'block';
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
const toneSlider   = document.getElementById('toneSlider');
const toneValue    = document.getElementById('toneValue');
const lengthSlider = document.getElementById('lengthSlider');
const lengthValue  = document.getElementById('lengthValue');

const TONE_LABELS = {
  1:'1 — Чистая трагедия', 2:'2 — Тяжёлый ангст', 3:'3 — Много драмы',
  4:'4 — Напряжение', 5:'5 — Баланс', 6:'6 — Лёгкая грусть',
  7:'7 — Тепло', 8:'8 — Уютно', 9:'9 — Очень мило', 10:'10 — Чистый флафф'
};
const LENGTH_LABELS = {
  1:'Короткая (~1-2 тыс. слов)',
  2:'Средняя (~3-5 тыс. слов)',
  3:'Длинная (~6-8 тыс. слов)'
};
toneSlider.addEventListener('input',   () => { toneValue.textContent   = TONE_LABELS[toneSlider.value]; });
lengthSlider.addEventListener('input', () => { lengthValue.textContent = LENGTH_LABELS[lengthSlider.value]; });
toneValue.textContent   = TONE_LABELS[5];
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
    characters:      document.getElementById('characters').value.trim(),
    rating:          document.getElementById('rating').value,
    genres:          getSelectedGenres(),
    plotDescription: document.getElementById('plotDescription').value.trim(),
    authorNotes:     document.getElementById('authorNotes').value.trim(),
    tone:            parseInt(toneSlider.value),
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
   ГЕНЕРАЦИЯ ПРОМПТА ДЛЯ ИСТОРИИ
========================================== */
function buildStoryPrompt(data) {
  let p = `Ты талантливый и профессиональный писатель-фикрайтер. Напиши художественный текст (историю) на русском языке.\n\n`;
  if (data.storyType === 'fandom' && data.fandomName) p += `Фандом: ${data.fandomName}\n`;
  else p += `Тип истории: Ориджинал (оригинальная история)\n`;

  if (data.pairings) p += `Пэйринги/Отношения: ${data.pairings}\n`;
  if (data.characters) p += `Персонажи: ${data.characters}\n`;
  if (data.genres && data.genres.length) p += `Жанры: ${data.genres.join(', ')}\n`;
  p += `Рейтинг: ${data.rating}\n`;
  if (data.plotDescription) p += `Сюжет/Завязка: ${data.plotDescription}\n`;
  if (data.authorNotes) p += `Пожелания к стилю: ${data.authorNotes}\n`;

  const lengths = { 1: "Короткая сцена (около 500-1000 слов)", 2: "Средний рассказ (около 1500-3000 слов)", 3: "Длинная история (около 4000+ слов)" };
  p += `Объем: ${lengths[data.length]}\n`;
  p += `Тональность (1-трагедия, 10-флафф): ${data.tone}/10\n`;

  const triggers = [];
  if (data.addProfanity) triggers.push("разрешена нецензурная лексика");
  if (data.charDeath) triggers.push("СМЕРТЬ ОСНОВНОГО ПЕРСОНАЖА");
  if (data.triggerWarnings) triggers.push(data.triggerWarnings);
  if (triggers.length) p += `Предупреждения: ${triggers.join(', ')}\n`;

  if (data.image) p += `\nЯ также прикрепил картинку. Пожалуйста, опиши атмосферу или детали из этой картинки в тексте истории.\n`;

  p += `\nПиши сразу готовый художественный текст, без приветствий и предисловий. Используй абзацы, красивые описания и живые диалоги.`;
  return p;
}

/* ==========================================
   ГЕНЕРАЦИЯ ЧЕРЕЗ GOOGLE GEMINI API (КЛИЕНТ)
========================================== */
async function callGemini(promptText, imageData = null, mimeType = null) {
  // Используем модель, которую выбрал пользователь
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${userGeminiKey}`;
  
  const parts = [{ text: promptText }];
  if (imageData && mimeType) {
    parts.push({
      inline_data: { mime_type: mimeType, data: imageData }
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: parts }],
      generationConfig: { temperature: 0.7 }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Ошибка генерации');
  if (!data.candidates || !data.candidates[0].content) throw new Error('Нейросеть вернула пустой ответ');
  
  return data.candidates[0].content.parts[0].text;
}

/* ==========================================
   ГЕНЕРАЦИЯ ФАНФИКА (КНОПКА)
========================================== */
const pagesContainer = document.getElementById('pagesContainer');
const tabNav         = document.querySelector('.tab-nav');
const loadingScreen  = document.getElementById('loadingScreen');
const resultScreen   = document.getElementById('resultScreen');
const loadingModelInfo = document.getElementById('loadingModelInfo');
let currentStoryData = null;

document.getElementById('generateBtn').addEventListener('click', async () => {
  if (!requireApiKey()) return;

  const formData = collectForm();
  pagesContainer.style.display = 'none';
  tabNav.style.display         = 'none';
  resultScreen.classList.remove('visible');
  
  // Обновляем текст загрузки в зависимости от модели
  loadingModelInfo.textContent = selectedModel.includes('pro') 
    ? 'Пишет Gemini 1.5 Pro (это займет чуть больше времени, но результат того стоит)...' 
    : 'Пишет быстрая Gemini 2.0 Flash...';
    
  loadingScreen.classList.add('visible');
  startProgress('progressFill', 'progressNum');

  try {
    const prompt = buildStoryPrompt(formData);
    const text = await callGemini(prompt, formData.image, formData.imageMimeType);

    finishProgress('progressFill', 'progressNum');
    setTimeout(() => {
      loadingScreen.classList.remove('visible');
      currentStoryData = { ...formData, text: text, date: new Date().toLocaleDateString('ru-RU') };
      showResult(text, formData);
    }, 700);
  } catch (err) {
    clearInterval(progressInterval);
    loadingScreen.classList.remove('visible');
    pagesContainer.style.display = 'block';
    tabNav.style.display         = 'flex';
    alert('❌ Ошибка: ' + err.message);
  }
});

/* ==========================================
   РЕЗУЛЬТАТ ФАНФИКА
========================================== */
function showResult(text, data) {
  const metaParts = [];
  if (data.storyType === 'fandom' && data.fandomName) metaParts.push(`Фандом: ${data.fandomName}`);
  if (data.pairings) metaParts.push(`Пэйринг: ${data.pairings}`);
  metaParts.push(`Рейтинг: ${data.rating}`);
  if (data.genres?.length) metaParts.push(data.genres.join(', '));
  document.getElementById('resultMeta').textContent = metaParts.join(' · ');
  const html = text.trim().split(/\n{2,}/)
    .map(p => `<p>${p.replace(/\n/g,'<br/>')}</p>`).join('');
  document.getElementById('resultContent').innerHTML = html;
  resultScreen.classList.add('visible');
  resultScreen.scrollIntoView({ behavior:'smooth', block:'start' });
}

document.getElementById('newStoryBtn').addEventListener('click', () => {
  resultScreen.classList.remove('visible');
  pagesContainer.style.display = 'block';
  tabNav.style.display         = 'flex';
  window.scrollTo({ top:0, behavior:'smooth' });
});

/* ==========================================
   СОХРАНИТЬ В БИБЛИОТЕКУ
========================================== */
document.getElementById('saveLibraryBtn').addEventListener('click', () => {
  if (!currentStoryData) return;
  const library = getLibrary();
  if (library.some(i => i.text === currentStoryData.text)) {
    showSavedFeedback('✅ Уже сохранено!'); return;
  }
  library.unshift({
    id:    Date.now(),
    title: buildTitle(currentStoryData),
    meta:  document.getElementById('resultMeta').textContent,
    text:  currentStoryData.text,
    date:  currentStoryData.date,
  });
  localStorage.setItem('fanfic_library', JSON.stringify(library));
  showSavedFeedback('✅ Сохранено!');
});
function showSavedFeedback(msg) {
  const btn = document.getElementById('saveLibraryBtn');
  const orig = btn.textContent;
  btn.textContent = msg; btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 2200);
}
function buildTitle(d) {
  if (d.fandomName && d.pairings) return `${d.fandomName}: ${d.pairings}`;
  if (d.fandomName)  return d.fandomName;
  if (d.pairings)    return d.pairings;
  if (d.plotDescription) return d.plotDescription.slice(0,55) + '…';
  return 'Безымянная история';
}

/* ==========================================
   PDF
========================================== */
document.getElementById('downloadPdfBtn').addEventListener('click', () => {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="font-family:Georgia,serif;background:#f7f2e8;padding:44px;color:#2c1810;max-width:680px;margin:0 auto;">
      <h1 style="font-family:Georgia,serif;font-size:2rem;text-align:center;color:#8b6914;margin-bottom:6px;">
        ${document.getElementById('resultTitle').textContent}
      </h1>
      <p style="text-align:center;font-style:italic;color:#5c3d2e;margin-bottom:28px;font-size:.88rem;">
        ${document.getElementById('resultMeta').textContent}
      </p>
      <hr style="border:1px solid #c4a882;margin-bottom:28px;"/>
      <div style="font-size:1rem;line-height:1.9;">
        ${document.getElementById('resultContent').innerHTML}
      </div>
    </div>`;
  html2pdf().set({
    margin:[12,14],
    filename:'fanfic.pdf',
    image:{ type:'jpeg', quality:.97 },
    html2canvas:{ scale:2, backgroundColor:'#f7f2e8', useCORS:true },
    jsPDF:{ unit:'mm', format:'a4', orientation:'portrait' },
  }).from(el).save();
});

/* ==========================================
   БИБЛИОТЕКА
========================================== */
function getLibrary() {
  return JSON.parse(localStorage.getItem('fanfic_library') || '[]');
}
function renderLibrary() {
  const list      = getLibrary();
  const container = document.getElementById('libraryList');
  if (!list.length) {
    container.innerHTML = '<p class="empty-library">Твоя библиотека пуста.<br/>Создай первую историю!</p>';
    return;
  }
  container.innerHTML = list.map(item => `
    <div class="library-item">
      <div class="lib-item-title">${escapeHtml(item.title)}</div>
      <div class="lib-item-meta">${escapeHtml(item.meta)} · ${item.date}</div>
      <div class="lib-item-preview">${escapeHtml(item.text.slice(0,160))}…</div>
      <div class="lib-item-actions">
        <button class="lib-btn read-btn" data-id="${item.id}">📖 Читать</button>
        <button class="lib-btn delete del-btn" data-id="${item.id}">🗑️ Удалить</button>
      </div>
    </div>`).join('');
  container.querySelectorAll('.read-btn').forEach(btn =>
    btn.addEventListener('click', () => openModal(parseInt(btn.dataset.id))));
  container.querySelectorAll('.del-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteItem(parseInt(btn.dataset.id))));
}
function openModal(id) {
  const item = getLibrary().find(i => i.id === id);
  if (!item) return;
  document.getElementById('modalTitle').textContent   = item.title;
  document.getElementById('modalContent').textContent = item.text;
  document.getElementById('readModal').classList.add('open');
}
function deleteItem(id) {
  if (!confirm('Удалить эту историю?')) return;
  localStorage.setItem('fanfic_library',
    JSON.stringify(getLibrary().filter(i => i.id !== id)));
  renderLibrary();
}
document.getElementById('modalClose').addEventListener('click', () =>
  document.getElementById('readModal').classList.remove('open'));
document.getElementById('readModal').addEventListener('click', e => {
  if (e.target === document.getElementById('readModal'))
    document.getElementById('readModal').classList.remove('open');
});

/* ==========================================
   МОДАЛЬНОЕ ОКНО ИДЕЙ
========================================== */
const ideaModal  = document.getElementById('ideaModal');
const ideaGenre  = document.getElementById('ideaGenre');
const ideaTitle  = document.getElementById('ideaTitle');
const ideaText   = document.getElementById('ideaText');

function showIdea(idea) {
  ideaGenre.textContent = idea.genre;
  ideaTitle.textContent = idea.title;
  ideaText.textContent  = idea.text;
}

document.getElementById('getIdeaBtn').addEventListener('click', () => {
  showIdea(getNextIdea());
  ideaModal.classList.add('open');
});
document.getElementById('ideaNext').addEventListener('click', () => {
  showIdea(getNextIdea());
});
document.getElementById('ideaClose').addEventListener('click', () =>
  ideaModal.classList.remove('open'));
ideaModal.addEventListener('click', e => {
  if (e.target === ideaModal) ideaModal.classList.remove('open');
});
document.getElementById('ideaCopy').addEventListener('click', () => {
  const text = `${ideaGenre.textContent}\n${ideaTitle.textContent}\n\n${ideaText.textContent}`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('ideaCopy');
    const orig = btn.textContent;
    btn.textContent = '✅ Скопировано!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
});

/* ==========================================
   ИИ-ГЕНЕРАТОР СЮЖЕТА (КЛИЕНТ)
========================================== */
const plotLoadingScreen = document.getElementById('plotLoadingScreen');

document.getElementById('generatePlotBtn').addEventListener('click', async () => {
  if (!requireApiKey()) return;

  const input = document.getElementById('plotInput').value.trim();
  if (!input) { alert('Введи краткую идею для сюжета!'); return; }

  document.getElementById('plotResult').style.display = 'none';
  plotLoadingScreen.classList.add('visible');
  startProgress('plotProgressFill', 'plotProgressNum');

  try {
    const prompt = `Ты — профессиональный автор фанфиков и литературных сюжетов. 
На основе краткой идеи напиши подробный сюжет-синопсис (до 1000 слов) на русском языке.

Структура ответа:
1. **Завязка** — представь мир, героев и начальный конфликт
2. **Развитие** — нарастание напряжения, ключевые события, повороты
3. **Кульминация** — главное столкновение или открытие
4. **Развязка** — как всё заканчивается, что меняется в героях

Идея пользователя: ${input}`;

    const text = await callGemini(prompt);

    finishProgress('plotProgressFill', 'plotProgressNum');
    setTimeout(() => {
      plotLoadingScreen.classList.remove('visible');
      document.getElementById('plotResultText').textContent = text;
      document.getElementById('plotResult').style.display = 'block';
    }, 600);
  } catch (err) {
    clearInterval(progressInterval);
    plotLoadingScreen.classList.remove('visible');
    alert('❌ Ошибка: ' + err.message);
  }
});

document.getElementById('copyPlotBtn').addEventListener('click', () => {
  const text = document.getElementById('plotResultText').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyPlotBtn');
    const orig = btn.textContent;
    btn.textContent = '✅ Скопировано!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
});

/* ==========================================
   УТИЛИТЫ
========================================== */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
