/* Жанры, их цвета, стили переходов и самые известные исполнители.
   fx   — стиль перехода при открытии жанра (см. transitions.js)
   anim — стиль анимации букв заголовка (см. styles.css) */
window.GENRES = [
  {
    id: 'pop', name: 'Поп', tag: 'Хиты для всех',
    desc: 'Запоминающиеся мелодии, яркие припевы и стадионные шоу. Музыка, которую знают все.',
    color: '#ff4d8d', color2: '#ffb86b', fx: 'circle', anim: 'zoom',
    artists: [
      { name: 'Michael Jackson', country: 'США', hits: ['Billie Jean', 'Thriller', 'Beat It'] },
      { name: 'Madonna', country: 'США', hits: ['Like a Prayer', 'Vogue', 'Hung Up'] },
      { name: 'Taylor Swift', country: 'США', hits: ['Shake It Off', 'Blank Space', 'Anti-Hero'] },
      { name: 'Ed Sheeran', country: 'Великобритания', hits: ['Shape of You', 'Perfect', 'Thinking Out Loud'] },
      { name: 'Billie Eilish', country: 'США', hits: ['bad guy', 'Ocean Eyes', 'What Was I Made For?'] },
      { name: 'Dua Lipa', country: 'Великобритания', hits: ['Levitating', 'Don’t Start Now', 'New Rules'] }
    ]
  },
  {
    id: 'rock', name: 'Рок', tag: 'Риффы и бунт',
    desc: 'Гитарные риффы, живые барабаны и бунтарский дух — от The Beatles до гранжа 90-х.',
    color: '#c92a2a', color2: '#ff7a45', fx: 'teeth', anim: 'drop',
    artists: [
      { name: 'The Beatles', country: 'Великобритания', hits: ['Hey Jude', 'Let It Be', 'Yesterday'] },
      { name: 'Queen', country: 'Великобритания', hits: ['Bohemian Rhapsody', 'We Will Rock You', 'Don’t Stop Me Now'] },
      { name: 'Led Zeppelin', country: 'Великобритания', hits: ['Stairway to Heaven', 'Whole Lotta Love', 'Kashmir'] },
      { name: 'Pink Floyd', country: 'Великобритания', hits: ['Wish You Were Here', 'Comfortably Numb', 'Another Brick in the Wall'] },
      { name: 'The Rolling Stones', country: 'Великобритания', hits: ['Satisfaction', 'Paint It Black', 'Angie'] },
      { name: 'Nirvana', country: 'США', hits: ['Smells Like Teen Spirit', 'Come as You Are', 'Lithium'] }
    ]
  },
  {
    id: 'hiphop', name: 'Хип-хоп', tag: 'Ритм и рифма',
    desc: 'Бит, рифма и улицы Нью-Йорка, которые превратились в мировую культуру.',
    color: '#2b2f42', color2: '#f5b700', fx: 'blinds', anim: 'slide',
    artists: [
      { name: 'Eminem', country: 'США', hits: ['Lose Yourself', 'Stan', 'The Real Slim Shady'] },
      { name: 'Jay-Z', country: 'США', hits: ['99 Problems', 'Empire State of Mind', 'Hard Knock Life'] },
      { name: 'Kendrick Lamar', country: 'США', hits: ['HUMBLE.', 'Alright', 'Not Like Us'] },
      { name: 'Drake', country: 'Канада', hits: ['Hotline Bling', 'God’s Plan', 'One Dance'] },
      { name: '2Pac', country: 'США', hits: ['California Love', 'Changes', 'Dear Mama'] },
      { name: 'The Notorious B.I.G.', country: 'США', hits: ['Juicy', 'Hypnotize', 'Big Poppa'] }
    ]
  },
  {
    id: 'electronic', name: 'Электроника', tag: 'Синты и бит',
    desc: 'Синтезаторы, драм-машины и танцполы — от французского хауса до дабстепа.',
    color: '#00a8e8', color2: '#7df9ff', fx: 'glitch', anim: 'glitch',
    artists: [
      { name: 'Daft Punk', country: 'Франция', hits: ['One More Time', 'Get Lucky', 'Harder, Better, Faster, Stronger'] },
      { name: 'The Prodigy', country: 'Великобритания', hits: ['Firestarter', 'Breathe', 'Voodoo People'] },
      { name: 'Avicii', country: 'Швеция', hits: ['Wake Me Up', 'Levels', 'Hey Brother'] },
      { name: 'Calvin Harris', country: 'Великобритания', hits: ['Summer', 'Feel So Close', 'This Is What You Came For'] },
      { name: 'deadmau5', country: 'Канада', hits: ['Strobe', 'Ghosts ’n’ Stuff', 'I Remember'] },
      { name: 'Skrillex', country: 'США', hits: ['Scary Monsters and Nice Sprites', 'Bangarang', 'Cinema'] }
    ]
  },
  {
    id: 'jazz', name: 'Джаз', tag: 'Свинг и импровизация',
    desc: 'Импровизация, свинг и «голубая» нота. Музыка, которая рождается прямо сейчас.',
    color: '#b9770e', color2: '#f4d06f', fx: 'curtains', anim: 'wave',
    artists: [
      { name: 'Miles Davis', country: 'США', hits: ['So What', 'Blue in Green', 'All Blues'] },
      { name: 'John Coltrane', country: 'США', hits: ['Giant Steps', 'My Favorite Things', 'A Love Supreme'] },
      { name: 'Louis Armstrong', country: 'США', hits: ['What a Wonderful World', 'La Vie en Rose', 'Hello, Dolly!'] },
      { name: 'Duke Ellington', country: 'США', hits: ['Take the “A” Train', 'Mood Indigo', 'Caravan'] },
      { name: 'Ella Fitzgerald', country: 'США', hits: ['Summertime', 'Mack the Knife', 'A-Tisket, A-Tasket'] },
      { name: 'Billie Holiday', country: 'США', hits: ['Strange Fruit', 'God Bless the Child', 'Lady Sings the Blues'] }
    ]
  },
  {
    id: 'classical', name: 'Классика', tag: 'Вечные мелодии',
    desc: 'Симфонии, сонаты и оперы — фундамент, на котором стоит вся остальная музыка.',
    color: '#7b2d3b', color2: '#e0b87a', fx: 'iris', anim: 'blur',
    artists: [
      { name: 'Wolfgang Amadeus Mozart', country: 'Австрия', hits: ['Eine kleine Nachtmusik', 'Реквием', 'Волшебная флейта'] },
      { name: 'Ludwig van Beethoven', country: 'Германия', hits: ['Симфония № 5', 'К Элизе', 'Лунная соната'] },
      { name: 'Johann Sebastian Bach', country: 'Германия', hits: ['Токката и фуга ре минор', 'Бранденбургские концерты', 'Ария на струне соль'] },
      { name: 'Пётр Чайковский', country: 'Россия', hits: ['Лебединое озеро', 'Щелкунчик', 'Времена года'] },
      { name: 'Frédéric Chopin', country: 'Польша', hits: ['Ноктюрн ми-бемоль мажор', 'Революционный этюд', 'Героический полонез'] },
      { name: 'Antonio Vivaldi', country: 'Италия', hits: ['Времена года', 'Gloria', 'Концерт для мандолины'] }
    ]
  },
  {
    id: 'metal', name: 'Метал', tag: 'Тяжесть и скорость',
    desc: 'Тяжёлые риффы, скорость и мощь. Громче бывает только ещё громче.',
    color: '#4b5563', color2: '#cbd5e1', fx: 'diagonal', anim: 'drop',
    artists: [
      { name: 'Metallica', country: 'США', hits: ['Enter Sandman', 'Master of Puppets', 'One'] },
      { name: 'Black Sabbath', country: 'Великобритания', hits: ['Paranoid', 'Iron Man', 'War Pigs'] },
      { name: 'Iron Maiden', country: 'Великобритания', hits: ['The Trooper', 'Run to the Hills', 'Fear of the Dark'] },
      { name: 'Slayer', country: 'США', hits: ['Raining Blood', 'Angel of Death', 'South of Heaven'] },
      { name: 'Megadeth', country: 'США', hits: ['Symphony of Destruction', 'Holy Wars', 'Peace Sells'] },
      { name: 'Judas Priest', country: 'Великобритания', hits: ['Breaking the Law', 'Painkiller', 'You’ve Got Another Thing Comin’'] }
    ]
  },
  {
    id: 'rnb', name: 'R&B и соул', tag: 'Грув и душа',
    desc: 'Глубокий вокал, грув и настоящие эмоции — от Motown до современных хитов.',
    color: '#7048e8', color2: '#d0a2ff', fx: 'flip', anim: 'flip',
    artists: [
      { name: 'Beyoncé', country: 'США', hits: ['Crazy in Love', 'Halo', 'Single Ladies'] },
      { name: 'Stevie Wonder', country: 'США', hits: ['Superstition', 'Sir Duke', 'I Just Called to Say I Love You'] },
      { name: 'Aretha Franklin', country: 'США', hits: ['Respect', 'A Natural Woman', 'Chain of Fools'] },
      { name: 'Marvin Gaye', country: 'США', hits: ['What’s Going On', 'Let’s Get It On', 'I Heard It Through the Grapevine'] },
      { name: 'Whitney Houston', country: 'США', hits: ['I Will Always Love You', 'I Wanna Dance with Somebody', 'How Will I Know'] },
      { name: 'The Weeknd', country: 'Канада', hits: ['Blinding Lights', 'Starboy', 'Can’t Feel My Face'] }
    ]
  },
  {
    id: 'country', name: 'Кантри', tag: 'Гитара и дорога',
    desc: 'Гитара, истории из жизни и дорога на запад — сердце американской глубинки.',
    color: '#9a5b2b', color2: '#e8c07a', fx: 'slide', anim: 'slide',
    artists: [
      { name: 'Johnny Cash', country: 'США', hits: ['Ring of Fire', 'Hurt', 'Folsom Prison Blues'] },
      { name: 'Dolly Parton', country: 'США', hits: ['Jolene', '9 to 5', 'I Will Always Love You'] },
      { name: 'Willie Nelson', country: 'США', hits: ['On the Road Again', 'Always on My Mind', 'Blue Eyes Crying in the Rain'] },
      { name: 'Garth Brooks', country: 'США', hits: ['Friends in Low Places', 'The Dance', 'The Thunder Rolls'] },
      { name: 'Shania Twain', country: 'Канада', hits: ['Man! I Feel Like a Woman!', 'You’re Still the One', 'That Don’t Impress Me Much'] },
      { name: 'Luke Combs', country: 'США', hits: ['Beautiful Crazy', 'Hurricane', 'Fast Car'] }
    ]
  },
  {
    id: 'reggae', name: 'Регги', tag: 'Солнце и offbeat',
    desc: 'Ямайский ритм, философия мира и солнечное настроение, которое не спутать ни с чем.',
    color: '#2f9e44', color2: '#ffd43b', fx: 'spin', anim: 'wave',
    artists: [
      { name: 'Bob Marley', country: 'Ямайка', hits: ['No Woman, No Cry', 'Three Little Birds', 'One Love'] },
      { name: 'Peter Tosh', country: 'Ямайка', hits: ['Legalize It', 'Equal Rights', 'Mystic Man'] },
      { name: 'Jimmy Cliff', country: 'Ямайка', hits: ['The Harder They Come', 'Many Rivers to Cross', 'I Can See Clearly Now'] },
      { name: 'Burning Spear', country: 'Ямайка', hits: ['Marcus Garvey', 'Slavery Days', 'Door Peep'] },
      { name: 'Damian Marley', country: 'Ямайка', hits: ['Welcome to Jamrock', 'Road to Zion', 'Medication'] },
      { name: 'UB40', country: 'Великобритания', hits: ['Red Red Wine', 'Can’t Help Falling in Love', 'One in Ten'] }
    ]
  },
  {
    id: 'latin', name: 'Латина', tag: 'Жаркие ритмы',
    desc: 'Горячие ритмы реггетона, сальсы и поп-музыки на испанском языке.',
    color: '#e8590c', color2: '#ff2e63', fx: 'pixels', anim: 'zoom',
    artists: [
      { name: 'Shakira', country: 'Колумбия', hits: ['Hips Don’t Lie', 'Waka Waka', 'Whenever, Wherever'] },
      { name: 'Bad Bunny', country: 'Пуэрто-Рико', hits: ['Me Porto Bonito', 'Tití Me Preguntó', 'Dákiti'] },
      { name: 'Daddy Yankee', country: 'Пуэрто-Рико', hits: ['Gasolina', 'Con Calma', 'Rompe'] },
      { name: 'Juanes', country: 'Колумбия', hits: ['La Camisa Negra', 'A Dios le Pido', 'Para Tu Amor'] },
      { name: 'Ricky Martin', country: 'Пуэрто-Рико', hits: ['Livin’ la Vida Loca', 'She Bangs', 'Vente Pa’ Ca'] },
      { name: 'J Balvin', country: 'Колумбия', hits: ['Mi Gente', 'Ginza', 'Ay Vamos'] }
    ]
  },
  {
    id: 'blues', name: 'Блюз', tag: 'Корни всего',
    desc: 'Двенадцать тактов, из которых выросли рок-н-ролл и джаз.',
    color: '#1c4e80', color2: '#5aa9e6', fx: 'iris', anim: 'blur',
    artists: [
      { name: 'B.B. King', country: 'США', hits: ['The Thrill Is Gone', 'Three O’Clock Blues', 'Rock Me Baby'] },
      { name: 'Muddy Waters', country: 'США', hits: ['Hoochie Coochie Man', 'Mannish Boy', 'Got My Mojo Working'] },
      { name: 'Robert Johnson', country: 'США', hits: ['Cross Road Blues', 'Hellhound on My Trail', 'Sweet Home Chicago'] },
      { name: 'Howlin’ Wolf', country: 'США', hits: ['Smokestack Lightnin’', 'Spoonful', 'Killing Floor'] },
      { name: 'John Lee Hooker', country: 'США', hits: ['Boom Boom', 'Boogie Chillen', 'One Bourbon, One Scotch, One Beer'] },
      { name: 'Eric Clapton', country: 'Великобритания', hits: ['Layla', 'Tears in Heaven', 'Cocaine'] }
    ]
  },
  {
    id: 'punk', name: 'Панк', tag: 'Три аккорда',
    desc: 'Три аккорда, максимум энергии и никаких правил.',
    color: '#d6006f', color2: '#ffe600', fx: 'glitch', anim: 'glitch',
    artists: [
      { name: 'Ramones', country: 'США', hits: ['Blitzkrieg Bop', 'I Wanna Be Sedated', 'Rockaway Beach'] },
      { name: 'Sex Pistols', country: 'Великобритания', hits: ['Anarchy in the U.K.', 'God Save the Queen', 'Pretty Vacant'] },
      { name: 'The Clash', country: 'Великобритания', hits: ['London Calling', 'Should I Stay or Should I Go', 'Rock the Casbah'] },
      { name: 'Green Day', country: 'США', hits: ['American Idiot', 'Basket Case', 'Boulevard of Broken Dreams'] },
      { name: 'blink-182', country: 'США', hits: ['All the Small Things', 'What’s My Age Again?', 'I Miss You'] },
      { name: 'The Offspring', country: 'США', hits: ['Pretty Fly (for a White Guy)', 'Self Esteem', 'The Kids Aren’t Alright'] }
    ]
  },
  {
    id: 'kpop', name: 'K-Pop', tag: 'Шоу и хореография',
    desc: 'Идеальная хореография, мощный продакшн и армии фанатов по всему миру.',
    color: '#9b5de5', color2: '#00f5d4', fx: 'pixels', anim: 'flip',
    artists: [
      { name: 'BTS', country: 'Южная Корея', hits: ['Dynamite', 'Butter', 'Boy With Luv'] },
      { name: 'BLACKPINK', country: 'Южная Корея', hits: ['DDU-DU DDU-DU', 'How You Like That', 'Kill This Love'] },
      { name: 'PSY', country: 'Южная Корея', hits: ['Gangnam Style', 'Gentleman', 'That That'] },
      { name: 'EXO', country: 'Южная Корея', hits: ['Growl', 'Love Shot', 'Call Me Baby'] },
      { name: 'TWICE', country: 'Южная Корея', hits: ['Cheer Up', 'TT', 'Fancy'] },
      { name: 'Stray Kids', country: 'Южная Корея', hits: ['God’s Menu', 'Maniac', 'S-Class'] }
    ]
  },
  {
    id: 'russian-rock', name: 'Русский рок', tag: 'Поэзия и гитары',
    desc: 'Поэзия, надрыв и гитары — голос целых поколений.',
    color: '#a4161a', color2: '#f5e6d3', fx: 'curtains', anim: 'drop',
    artists: [
      { name: 'Кино', country: 'СССР', hits: ['Группа крови', 'Звезда по имени Солнце', 'Пачка сигарет'] },
      { name: 'ДДТ', country: 'Россия', hits: ['Что такое осень', 'Родина', 'Осенняя'] },
      { name: 'Алиса', country: 'Россия', hits: ['Небо славян', 'Трасса Е-95', 'Мы вместе'] },
      { name: 'Земфира', country: 'Россия', hits: ['Хочешь?', 'Искала', 'Прости меня моя любовь'] },
      { name: 'Сплин', country: 'Россия', hits: ['Выхода нет', 'Романс', 'Орбит без сахара'] },
      { name: 'Ария', country: 'Россия', hits: ['Герой асфальта', 'Воля и разум', 'Улица роз'] }
    ]
  }
];
