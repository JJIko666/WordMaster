// ---------- Элементы ----------
const englishInput = document.getElementById("english");
const russianInput = document.getElementById("russian");
const imageInput = document.getElementById("image");
const saveBtn = document.getElementById("saveBtn");
const wordList = document.getElementById("wordList");
const bulkInput = document.getElementById("bulkInput");
const importBtn = document.getElementById("importBtn");
const setList = document.getElementById("setList");
const newSetBtn = document.getElementById("newSetBtn");
const importSetBtn = document.getElementById("importSetBtn");
const importSetCode = document.getElementById("importSetCode");
const createSet = document.getElementById("createSet");
const viewSet = document.getElementById("viewSet");
const viewSetTitle = document.getElementById("viewSetTitle");
const viewSetInfo = document.getElementById("viewSetInfo");
const viewWordList = document.getElementById("viewWordList");
const studySetBtn = document.getElementById("studySetBtn");
const backHomeBtn = document.getElementById("backHomeBtn");
const setName = document.getElementById("setName");
const setWords = document.getElementById("setWords");
const writeSet = document.getElementById("writeSet");
const guessSet = document.getElementById("guessSet");
const scrambleSet = document.getElementById("scrambleSet");
const saveSetBtn = document.getElementById("saveSetBtn");
const cancelSetBtn = document.getElementById("cancelSetBtn");
const search = document.getElementById("search");
const clearAll = document.getElementById("clearAll");
const themeBtn = document.getElementById("themeBtn");

// ======================
// НАПИШИ УСЛЫШАННОЕ
// ======================

const listenWord = document.getElementById("listenWord");
const listenSet = document.getElementById("listenSet");
const listenAnswer = document.getElementById("listenAnswer");
const playSoundBtn = document.getElementById("playSoundBtn");
const checkListenBtn = document.getElementById("checkListenBtn");
const nextListenBtn = document.getElementById("nextListenBtn");
const exitListenBtn = document.getElementById("exitListenBtn");
const listenResult = document.getElementById("listenResult");

let listenWords = [];
let currentListenWord = null;

let examWords = [];
let examQuestion = 0;
let examCorrect = 0;


// ---------- Игра "Напиши перевод" ----------
const writeWord = document.getElementById("writeWord");
const writeAnswer = document.getElementById("writeAnswer");
const checkAnswerBtn = document.getElementById("checkAnswerBtn");
const startWriteBtn = document.getElementById("startWriteBtn");
const exitWriteBtn = document.getElementById("exitWriteBtn");
const writeResult = document.getElementById("writeResult");

let writeCorrect = "";
let writeRunning = false;


// Вкладки
const homeTab = document.getElementById("homeTab");
const studyTab = document.getElementById("studyTab");
const gamesTab = document.getElementById("gamesTab");
const statsTab = document.getElementById("statsTab");

// Страницы
const home = document.getElementById("home");
const study = document.getElementById("study");
const games = document.getElementById("games");
const stats = document.getElementById("stats");
const guessGame = document.getElementById("guessGame");
const writeGame = document.getElementById("writeGame");
const scrambleGame = document.getElementById("scrambleGame");
const examGame = document.getElementById("examGame");
const listenGame =
document.getElementById("listenGame");
// ---------- Слова ----------
let words = JSON.parse(localStorage.getItem("words")) || [];
let activeWords = words;
let currentWords = [...words];
let currentSet = -1;
// ======================
// УРОВЕНЬ ИГРОКА
// ======================

let xp = Number(localStorage.getItem("xp")) || 0;
let level = Number(localStorage.getItem("level")) || 1;
// ---------- Показ слов ----------
function showWords(){

    wordList.innerHTML = "";

    if(currentWords.length === 0){

        wordList.innerHTML = "<p>Пока слов нет.</p>";
        return;

    }

const text = search.value.trim().toLowerCase();

currentWords.forEach((word,index)=>{

    if(
        !word.english.toLowerCase().includes(text) &&
        !word.russian.toLowerCase().includes(text)
    ){
        return;
    }

        wordList.innerHTML += `
       <div class="word">

    <span>
        ${word.favorite ? "❤️" : "🤍"}
        <b>${word.english}</b>
        —
        ${word.russian}
    </span>

    <div class="wordButtons">

        <button onclick="toggleFavorite(${index})">
            ❤️
        </button>

        <button onclick="deleteWord(${index})">
            ❌
        </button>

    </div>

</div>
        `;

    });

}

// ---------- Добавление ----------
saveBtn.addEventListener("click",()=>{

    const english = englishInput.value.trim();
    const russian = russianInput.value.trim();

    if(english==="" || russian===""){

        alert("Заполни оба поля!");

        return;
    }

    const file = imageInput.files[0];

let image = "";

if(file){

    image = URL.createObjectURL(file);

}

words.push({
    english,
    russian,
    image,
    favorite: false,

    level: 0,
    correct: 0,
    wrong: 0,
    nextReview: Date.now()
});

localStorage.setItem(
    "words",
    JSON.stringify(words)
);
currentWords = [...words];
    englishInput.value="";
    russianInput.value="";

    showWords();
updateCard();
updateStats();

});

// ---------- Удаление ----------


window.deleteWord = deleteWord;

function deleteWord(index){

    const word = currentWords[index];

    const realIndex = words.findIndex(w =>
        w.english === word.english &&
        w.russian === word.russian
    );

    if(realIndex === -1) return;

    words.splice(realIndex,1);

    localStorage.setItem(
        "words",
        JSON.stringify(words)
    );

    currentWords = [...words];

    showWords();
    updateCard();
    updateStats();

}

// ---------- Вкладки ----------

function hideAll(){

    home.style.display = "none";
    study.style.display = "none";
    games.style.display = "none";
    stats.style.display = "none";
    createSet.style.display = "none";
    viewSet.style.display = "none";

    guessGame.style.display = "none";
    writeGame.style.display = "none";
    scrambleGame.style.display = "none";
    examGame.style.display = "none";
    listenGame.style.display = "none";

    const essaysBlock = document.getElementById("essays");
    if (essaysBlock) essaysBlock.style.display = "none";

}

homeTab.onclick = function () {

    hideAll();

    words = JSON.parse(localStorage.getItem("words")) || [];

    currentWords = [...words];

    currentSet = -1;

    currentCard = 0;

    home.style.display = "block";

    showWords();
    updateCard();

};
studyTab.onclick = function () {
    hideAll();

    currentWords = [...words];
    currentSet = -1;
    currentCard = 0;

    study.style.display = "block";

    updateCard();
};

gamesTab.onclick = function () {
    hideAll();
    games.style.display = "block";
};

statsTab.onclick = function () {
    hideAll();
    stats.style.display = "block";
};

showWords();
// ===========================
// КАРТОЧКИ
// ===========================

const flashcard = document.getElementById("flashcard");
const cardInner = document.getElementById("cardInner");
const cardFrontText = document.getElementById("cardFrontText");
const cardBackText = document.getElementById("cardBackText");
const cardImage = document.getElementById("cardImage");
const cardCounter = document.getElementById("cardCounter");

const flipBtn = document.getElementById("flipBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const speakBtn = document.getElementById("speakBtn");
const knowBtn = document.getElementById("knowBtn");
const dontKnowBtn = document.getElementById("dontKnowBtn");

let currentCard = 0;
let isFront = true;

function updateCard(){

    const reviewWords = currentWords.filter(word =>
    !word.nextReview || word.nextReview <= Date.now()
);

if(reviewWords.length === 0){

cardFrontText.textContent = "🎉 Сегодня всё повторено!";
cardBackText.textContent = "";
cardImage.style.display = "none";
cardCounter.textContent = "0 / 0";
    return;
}
  if(currentCard >= reviewWords.length){
    currentCard = 0;
}

const word = reviewWords[currentCard];
    if(word.image){

    cardImage.src = word.image;
    cardImage.style.display = "block";

}else{

    cardImage.style.display = "none";

}

   cardFrontText.textContent = word.english;
cardBackText.textContent = word.russian;

    cardCounter.textContent =
(currentCard+1)+" / "+reviewWords.length;
}

flipBtn.onclick = ()=>{

   if(currentWords.length===0) return;

    isFront = !isFront;

    cardInner.classList.toggle("flip");
    updateCard();

}

flashcard.onclick=()=>{

    if(currentWords.length===0) return;

   isFront = !isFront;

cardInner.classList.toggle("flip");

    updateCard();

}

nextBtn.onclick=()=>{

    if(currentWords.length===0) return;

    currentCard++;

   const reviewWords = currentWords.filter(word =>
    !word.nextReview || word.nextReview <= Date.now()
);

if(currentCard >= reviewWords.length){

    currentCard = 0;

}

    cardInner.classList.remove("flip");
    isFront = true;

    updateCard();
    saveProgress();
    if(quests.length){

quests[1].progress++;

updateDailyQuests();

}

}

prevBtn.onclick=()=>{

    if(currentWords.length===0) return;

    currentCard--;

 const reviewWords = currentWords.filter(word =>
    !word.nextReview || word.nextReview <= Date.now()
);

if(currentCard < 0){

    currentCard = reviewWords.length - 1;

}

    cardInner.classList.remove("flip");
    isFront = true;

    updateCard();
    saveProgress();

}

updateCard();

speakBtn.onclick = () => {

  if(currentWords.length === 0){

    cardFrontText.textContent = "🎉 Сегодня повторять нечего!";
    cardBackText.textContent = "";

    cardImage.style.display = "none";

    cardCounter.textContent = "0 / 0";

    return;
}

    const reviewWords = currentWords.filter(word =>
    !word.nextReview || word.nextReview <= Date.now()
);

if(reviewWords.length === 0) return;

const speech = new SpeechSynthesisUtterance(
    reviewWords[currentCard].english
);

    speech.lang = "en-US";
speech.rate = 0.85;
speech.pitch = 1;
speech.volume = 1;

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);

}
window.toggleFavorite = toggleFavorite;

function toggleFavorite(index){

    const word = currentWords[index];

    const realIndex = words.findIndex(w =>
        w.english === word.english &&
        w.russian === word.russian
    );

    if(realIndex === -1) return;

    words[realIndex].favorite = !words[realIndex].favorite;

    localStorage.setItem(
        "words",
        JSON.stringify(words)
    );

    currentWords = [...words];

    showWords();
    updateStats();

}   
// ======================
// СТАТИСТИКА
// ======================

const statWords = document.getElementById("statWords");
const statFavorite = document.getElementById("statFavorite");
const statNormal = document.getElementById("statNormal");
const statProgress = document.getElementById("statProgress");
const progressFill =
document.getElementById("progressFill");

const correctCount =
document.getElementById("correctCount");

const wrongCount =
document.getElementById("wrongCount");

const studyTime =
document.getElementById("studyTime");

const streak =
document.getElementById("streak");

const levelText = document.getElementById("level");

const xpText =
document.getElementById("xpText");

const xpBar =
document.getElementById("xpBar");


function updateStats(){

    const total = words.length;

    const favorite = words.filter(word => word.favorite).length;

    const normal = total - favorite;

    let progress = 0;

    if(total > 0){
        progress = Math.round((favorite / total) * 100);
    }

    statWords.textContent = total;
    statFavorite.textContent = favorite;
    statNormal.textContent = normal;
    statProgress.textContent = progress + "%";
    progressFill.style.width = progress + "%";

correctCount.textContent =
localStorage.getItem("correct") || 0;

wrongCount.textContent =
localStorage.getItem("wrong") || 0;

studyTime.textContent =
Math.floor(words.length * 0.7) + " мин";

streak.textContent =
localStorage.getItem("streak") || 1;
document.getElementById("progressFill").style.width =
progress + "%";


}

function updateXP(){

    xp = Number(localStorage.getItem("xp")) || 0;

    level = Math.floor(xp / 100) + 1;

    const currentXP = xp % 100;

    levelText.textContent = level;

    document.getElementById("xpText").textContent =
        currentXP + " / 100 XP";

    document.getElementById("xpBar").style.width =
        currentXP + "%";

        document.getElementById("rank").textContent =
getRank(level);

    localStorage.setItem("level", level);
}
function addXP(amount){

    xp += amount;

    localStorage.setItem("xp", xp);

    if(quests.length){

        quests[2].progress += amount;

    }

    updateDailyQuests();

    updateXP();

}
function getRank(level){

    if(level < 5) return "🌱 Новичок";

    if(level < 10) return "🥉 Ученик";

    if(level < 20) return "🥈 Знаток";

    if(level < 35) return "🥇 Эксперт";

    if(level < 50) return "💎 Мастер";

    if(level < 75) return "👑 Легенда";

    return "🔥 WordMaster";
}

updateXP();
const achievementList =
document.getElementById("achievementList");


const achievements = [

{
id:"first",
icon:"🌱",
title:"Первое слово",
desc:"Добавить первое слово",
check:()=>words.length>=1
},

{
id:"words50",

icon:"📚",

title:"50 слов",

desc:"Добавить 50 слов",

goal:50,

progress:()=>words.length,

check:()=>words.length>=50
},

{
id:"words100",
icon:"📖",
title:"100 слов",
desc:"Сохранить 100 слов",
check:()=>words.length>=100
},

{
id:"favorite",
icon:"❤️",
title:"Коллекционер",
desc:"Добавить 10 избранных",
check:()=>words.filter(w=>w.favorite).length>=10
},

{
id:"correct50",
icon:"🎯",
title:"Меткий",
desc:"50 правильных ответов",
check:()=>(
Number(localStorage.getItem("correct"))||0)>=50
},

{
id:"correct200",
icon:"🏅",
title:"Эксперт",
desc:"200 правильных ответов",
check:()=>(
Number(localStorage.getItem("correct"))||0)>=200
},

{
id:"level5",
icon:"⭐",
title:"Уровень 5",
desc:"Получить 5 уровень",
check:()=>level>=5
},

{
id:"level10",
icon:"👑",
title:"Мастер",
desc:"Получить 10 уровень",
check:()=>level>=10
},

{
id:"streak7",
icon:"🔥",
title:"7 дней подряд",
desc:"Серия 7",
check:()=>(
Number(localStorage.getItem("streak"))||0)>=7
},

{
id:"all",
icon:"🏆",
title:"Легенда",
desc:"Открыть все достижения",
check:()=>false
}

];

function updateAchievements(){

    achievementList.innerHTML = "";

    let unlocked = 0;

    achievements.forEach(a=>{

        const ok = a.check();
        const key = "achievement_" + a.id;

if(ok && !localStorage.getItem(key)){

localStorage.setItem(key,true);


}

        if(ok) unlocked++;

        achievementList.innerHTML += `
        <div class="badge ${ok ? "unlocked" : "locked"}">

            <div class="badgeIcon">${a.icon}</div>

            <div class="badgeTitle">${a.title}</div>

            <div class="badgeDesc">${a.desc}</div>
            <div class="badgeProgress">

<div class="badgeFill"

style="width:${
a.goal
?
Math.min(a.progress()/a.goal*100,100)
:
100
}%">

</div>

</div>

<div class="badgeCounter">

${
a.goal
?
Math.min(a.progress(),a.goal)+" / "+a.goal
:
""
}

</div>

        </div>
        `;
    });

    // последнее достижение
    if(unlocked === achievements.length - 1){

        const last = achievementList.lastElementChild;

        last.classList.remove("locked");
        last.classList.add("unlocked");

    }

}
// ======================
// ИГРА "УГАДАЙ ПЕРЕВОД"
// ======================

const gameWord = document.getElementById("gameWord");
const answers = document.getElementById("answers");
const startGameBtn = document.getElementById("startGameBtn");
const exitGameBtn = document.getElementById("exitGameBtn");
const gameResult = document.getElementById("gameResult");

let correctAnswer = "";
let gameTimer = null;
let gameRunning = false;
let gameWords = [];
let currentGameWord = null;

startGameBtn.onclick = startGame;
if (exitGameBtn) {

exitGameBtn.onclick = () => {

gameRunning = false;

clearTimeout(gameTimer);

hideAll();

games.style.display = "block";

};

}

function startGame(){
    gameRunning = true;

    if(gameWords.length === 0){

    let sourceWords = words;

    if(guessSet.value !== "all"){
        sourceWords = sets[guessSet.value].words;
    }

    gameWords = [...sourceWords];

}

    let sourceWords = gameWords;

if(guessSet.value !== "all"){

    sourceWords = sets[guessSet.value].words;

}

if(sourceWords.length < 4){

    alert("В наборе должно быть минимум 4 слова!");

    return;

}

    gameResult.textContent = "";
const randomIndex = Math.floor(Math.random() * gameWords.length);

currentGameWord = gameWords[randomIndex];

correctAnswer = currentGameWord.russian;

gameWord.textContent = currentGameWord.english;

    let variants = [correctAnswer];

    while(variants.length < 4){

       const random =
sourceWords[Math.floor(Math.random() * sourceWords.length)].russian;
        if(!variants.includes(random)){
            variants.push(random);
        }

    }

    variants.sort(()=>Math.random()-0.5);

    answers.innerHTML = "";

    variants.forEach(answer=>{

        const btn = document.createElement("button");

        btn.className = "answerBtn";

        btn.textContent = answer;

        btn.onclick = ()=>{

          if(answer===correctAnswer){

    btn.classList.add("correct");
    gameResult.textContent = "🎉 Правильно!";

    gameWords.splice(randomIndex, 1);

    let correct =
    Number(localStorage.getItem("correct")) || 0;

    correct++;
    let xp =
Number(localStorage.getItem("xp")) || 0;

addXP(15);

    localStorage.setItem("correct", correct);

}else{

    btn.classList.add("wrong");
    gameResult.textContent =
    "❌ Неправильно. Правильный ответ: " + correctAnswer;

    let wrong =
    Number(localStorage.getItem("wrong")) || 0;

    wrong++;

    localStorage.setItem("wrong", wrong);

}

updateStats();


            gameTimer = setTimeout(() => {

    if (!gameRunning) return;

    if (gameWords.length === 0) {

        gameWord.textContent = "🏆 Молодец! Все слова пройдены.";

        answers.innerHTML = "";

        gameResult.textContent = "";

        gameRunning = false;

        gameWords = [];

        return;

    }

    startGame();

},1200);

        };

        answers.appendChild(btn);

    });

}

document.addEventListener("keydown", (e) => {

    if (study.style.display !== "block") return;

    // Пробел — перевернуть карточку
    if (e.code === "Space") {
        e.preventDefault();
        flipBtn.click();
    }

    // A — предыдущая карточка
    if (e.key === "a" || e.key === "A") {
        prevBtn.click();
    }

    // D — следующая карточка
    if (e.key === "d" || e.key === "D") {
        nextBtn.click();
    }

    // E — озвучить слово
    if (e.key === "e" || e.key === "E") {
        speakBtn.click();
    }

});


// ======================
// МАССОВЫЙ ИМПОРТ
// ======================

importBtn.onclick = function () {

    const text = bulkInput.value.trim();

    if (text === "") {
        alert("Вставь список слов!");
        return;
    }

    const lines = text.split("\n");

    let added = 0;

    lines.forEach(line => {

        line = line.trim();

        if (line === "") return;

       let parts;

// house - дом
if (line.includes(" - ")) {

    parts = line.split(" - ");

// house-дом
} else if (line.includes("-")) {

    parts = line.split("-");

// house,дом
} else if (line.includes(",")) {

    parts = line.split(",");

// house = дом
} else if (line.includes("=")) {

    parts = line.split("=");

// house<TAB>дом
} else if (line.includes("\t")) {

    parts = line.split("\t");

// house      дом
} else {

    parts = line.trim().split(/\s+/);

}
        if (parts.length < 2) return;

        const english = parts[0].trim();
        const russian = parts[1].trim();
        const exists = words.some(
    word => word.english.toLowerCase() === english.toLowerCase()
);

if (exists) return;

       words.push({
    english,
    russian,
    image: "",
    favorite: false,

    level: 0,
    correct: 0,
    wrong: 0,
    nextReview: Date.now()
});

        added++;

    });

    if(quests.length){

quests[0].progress++;

updateDailyQuests();

}

    localStorage.setItem("words", JSON.stringify(words));
    
    currentWords = [...words];

    bulkInput.value = "";

    showWords();
    updateCard();
    updateStats();

    alert("✅ Добавлено " + added + " слов!");

};
// ======================
// НАБОРЫ
// ======================

let sets = JSON.parse(localStorage.getItem("sets")) || [];

function showSets() {

    if (sets.length === 0) {

        setList.innerHTML = "<p>Пока наборов нет.</p>";
        return;

    }

    setList.innerHTML = "";

    sets.forEach((set, index) => {

        const progress = set.progress || 0;

        setList.innerHTML += `
        <div class="setCard">

            <h2>📚 ${set.name}</h2>

            <p>📖 Слов: ${set.words.length}</p>

            <p>⭐ Прогресс: ${progress}%</p>

            <div class="progressBar">
                <div class="progressFill"
                     style="width:${progress}%">
                </div>
            </div>

            <div class="setButtons">

    <button onclick="openSet(${index})">
        📖 Открыть
    </button>

    <button onclick="studySet(${index})">
    🃏 Учить набор
</button>

    <button onclick="editSet(${index})">
        ✏️
    </button>

    <button onclick="shareSet(${index})">
    📤
</button>

    <button onclick="deleteSet(${index})">
        🗑
    </button>

</div>
        </div>
        `;

    });
writeSet.innerHTML =
`
<option value="all">
📚 Все слова
</option>
`;
guessSet.innerHTML = `
<option value="all">
📚 Все слова
</option>
`;
scrambleSet.innerHTML = `
<option value="all">
📚 Все слова
</option>
`;
listenSet.innerHTML = `
<option value="all">
📚 Все слова
</option>
`;

sets.forEach((set,index)=>{

    guessSet.innerHTML += `
    <option value="${index}">
        ${set.name}
    </option>
    `;

});
sets.forEach((set,index)=>{

    scrambleSet.innerHTML += `
    <option value="${index}">
        ${set.name}
    </option>
    `;

});

sets.forEach((set, index) => {

    writeSet.innerHTML += `
    <option value="${index}">
        ${set.name}
    </option>
    `;

});
sets.forEach((set,index)=>{

    listenSet.innerHTML += `
    <option value="${index}">
        ${set.name}
    </option>
    `;

});
}

newSetBtn.onclick = function () {

    hideAll();

    createSet.style.display = "block";

};
cancelSetBtn.onclick = function () {

    hideAll();

    home.style.display = "block";

};
saveSetBtn.onclick = function () {

    const name = setName.value.trim();

    if(name === ""){

        alert("Введите название набора!");

        return;

    }

    const lines = setWords.value.trim().split("\n");

    const newWords = [];

    lines.forEach(line => {

        line = line.trim();

        if(line === "") return;

        let parts = [];

        if(line.includes(" - ")){

            parts = line.split(" - ");

        }else if(line.includes("-")){

            parts = line.split("-");

        }else if(line.includes(",")){

            parts = line.split(",");

        }else if(line.includes("\t")){

            parts = line.split("\t");

        }

        if(parts.length >= 2){

newWords.push({

    english: parts[0].trim(),
    russian: parts[1].trim(),
    image: "",
    favorite: false,

    level: 0,
    correct: 0,
    wrong: 0,
    nextReview: Date.now()

});

        }

    });

    if(currentSet==-1){

    sets.push({

        name:name,
        words:newWords,
        progress:0,
        currentCard:0

    });

}else{

    sets[currentSet].name=name;
    sets[currentSet].words=newWords;

}

    localStorage.setItem(
        "sets",
        JSON.stringify(sets)
    );

    setName.value = "";
    setWords.value = "";

    hideAll();

    home.style.display = "block";

    showSets();
    currentSet = -1;

};


showSets();
clearAll.onclick = () => {

    if(confirm("Удалить все слова?")){

        words = [];
        currentWords = [];
        currentCard = 0;

        localStorage.setItem(
            "words",
            JSON.stringify(words)
        );

        showWords();
        updateCard();
        updateStats();

    }

};
search.oninput = () => {

    showSets();
showWords();
updateCard();
updateStats();

};
// ==============================
// ПОДЕЛИТЬСЯ НАБОРОМ
// ==============================

async function shareSet(index) {

    const set = sets[index];

    const data = JSON.stringify({
        name: set.name,
        words: set.words
    });

    const code =
        "WM1:" +
        btoa(unescape(encodeURIComponent(data)));

    try {

        await navigator.clipboard.writeText(code);

        alert(
            "📤 Код набора скопирован!\n\n" +
            "Теперь открой WordMaster на телефоне и вставь этот код."
        );

    } catch (error) {

        prompt(
            "📤 Скопируй код набора:",
            code
        );

    }
}
async function shareSet(index) {

    const set = sets[index];

    const data = JSON.stringify({
        name: set.name,
        words: set.words
    });

    const code =
        "WM1:" +
        btoa(unescape(encodeURIComponent(data)));

    try {

        await navigator.clipboard.writeText(code);

        alert(
            "📤 Код набора скопирован!\n\n" +
            "Теперь открой WordMaster на телефоне и вставь этот код."
        );

    } catch (error) {

        prompt(
            "📤 Скопируй код набора:",
            code
        );

    }
}

window.shareSet = shareSet; 
window.shareSet = shareSet;

window.deleteSet = deleteSet;
window.openSet = openSet;
window.studySet = studySet;
window.editSet = editSet;
function deleteSet(index){

    if(!confirm("Удалить набор?")) return;

    sets.splice(index,1);

    localStorage.setItem(
        "sets",
        JSON.stringify(sets)
    );

    showSets();

}
function openSet(index){

    currentSet = index;

    hideAll();

    viewSet.style.display = "block";

    const set = sets[index];

    viewSetTitle.textContent = "📚 " + set.name;

    viewSetInfo.innerHTML =
        "<b>Слов:</b> " + set.words.length;

    viewWordList.innerHTML = "";

    set.words.forEach((word,i)=>{

        viewWordList.innerHTML += `
        <div class="word">

            <span>
                <b>${word.english}</b>
                —
                ${word.russian}
            </span>

        </div>
        `;

    });

}
function studySet(index){

    currentSet = index;

    currentWords = [...sets[index].words];

    currentCard = sets[index].currentCard || 0;

    hideAll();

    study.style.display = "block";

    updateCard();

}
function editSet(index){

    currentSet = index;

    setName.value = sets[index].name;

    let text = "";

    sets[index].words.forEach(word=>{

        text += word.english + " - " + word.russian + "\n";

    });

    setWords.value = text;

    hideAll();

    createSet.style.display = "block";

}
function saveProgress(){

    if(currentSet === -1) return;

    sets[currentSet].currentCard = currentCard;

    localStorage.setItem(
        "sets",
        JSON.stringify(sets)
    );

}
studySetBtn.onclick = () => {

    currentWords = [...sets[currentSet].words];

    currentCard = sets[currentSet].currentCard || 0;

    hideAll();

    study.style.display = "block";

    updateCard();

};

backHomeBtn.onclick = () => {

    hideAll();

    home.style.display = "block";

};
// ======================
// ТЕМНАЯ ТЕМА
// ======================

if(localStorage.getItem("theme") === "dark"){

    document.body.classList.add("dark");

    themeBtn.textContent = "☀️";

}

themeBtn.onclick = () => {

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark")){

        localStorage.setItem("theme","dark");

        themeBtn.textContent = "☀️";

    }else{

        localStorage.setItem("theme","light");

        themeBtn.textContent = "🌙";

    }

};

// ======================
// НАПИШИ ПЕРЕВОД
// ======================
let randomIndex = 0;
let writeWords = [];
startWriteBtn.onclick = function () {
    
    writeRunning = true;
const reviewWords = currentWords.filter(word =>
    !word.nextReview || word.nextReview <= Date.now()
);
   if(reviewWords.length === 0){

    cardFrontText.textContent = "🎉 Сегодня всё повторено!";
    cardBackText.textContent = "";
    cardImage.style.display = "none";
    cardCounter.textContent = "0 / 0";

    return;

}
   writeWords = [];

if(writeSet.value === "all"){
    writeWords = [...reviewWords];
}else{
    writeWords = [...sets[writeSet.value].words];
}

if(writeWords.length === 0){

    alert("В этом наборе нет слов!");

    return;

}

randomIndex =
Math.floor(Math.random()*writeWords.length);

const randomWord =
writeWords[randomIndex];
    writeWord.textContent = randomWord.english;

    writeCorrect = randomWord.russian.toLowerCase();

    writeAnswer.value = "";

    writeResult.textContent = "";

    writeAnswer.focus();

};

checkAnswerBtn.onclick = function () {

    if(writeCorrect === "") return;

    const answer =
        writeAnswer.value.trim().toLowerCase();

    if(answer === writeCorrect){

        writeResult.textContent = "✅ Правильно!";
        writeWords.splice(randomIndex,1);

      setTimeout(() => {

    if(!writeRunning) return;

    if(writeWords.length === 0){

        writeWord.textContent = "🏆 Игра окончена!";

        writeAnswer.value = "";

        writeResult.textContent = "";

        writeRunning = false;

        writeWords = [];

        return;

    }

    startWriteBtn.click();

},1000);

    }else{

        writeResult.textContent =
        "❌ Правильный ответ: " + writeCorrect;

    }

};
exitWriteBtn.onclick = function () {

    writeRunning = false;

    writeCorrect = "";

    writeWord.textContent = "Нажми «Начать»";

    writeAnswer.value = "";

    writeResult.textContent = "";

};

// ======================
// ИГРА "СОБЕРИ СЛОВО"
// ======================
const lettersBox = document.getElementById("letters");
const scrambleTranslate = document.getElementById("scrambleTranslate");
const scrambleAnswer = document.getElementById("scrambleAnswer");
const checkWordBtn = document.getElementById("checkWordBtn");
const newWordBtn = document.getElementById("newWordBtn");
const scrambleResult = document.getElementById("scrambleResult");


let currentScrambleWord = "";
let userWord = "";


function startScramble(){

   let sourceWords = words;

if(scrambleSet.value !== "all"){

    sourceWords = sets[scrambleSet.value].words;

}

if(sourceWords.length === 0){

    alert("В этом наборе нет слов!");
    return;

}

const random =
sourceWords[Math.floor(Math.random()*sourceWords.length)];


    currentScrambleWord = random.english.toLowerCase();

    scrambleTranslate.textContent =
    "Перевод: " + random.russian;


    userWord = "";

    scrambleAnswer.textContent = "";


    let letters =
    currentScrambleWord.split("");


do{

    letters.sort(() => Math.random() - 0.5);

}while(
    letters.join("") === currentScrambleWord
);


    lettersBox.innerHTML = "";


    letters.forEach(letter=>{

        let btn = document.createElement("button");

        btn.textContent = letter;

        btn.className="letterBtn";


        btn.onclick=()=>{

            userWord += letter;

            scrambleAnswer.textContent =
            userWord;

            btn.disabled=true;

        };


        lettersBox.appendChild(btn);

    });


    scrambleResult.textContent="";

}
newWordBtn.onclick = () => {
    startScramble();
};




checkWordBtn.onclick = ()=>{


    if(userWord === currentScrambleWord){

        scrambleResult.textContent = "🎉 Правильно!";

setTimeout(() => {



},1000);

    }else{

       scrambleResult.textContent =
"❌ Правильное слово: " + currentScrambleWord;

setTimeout(() => {



},1500);

    }

};
// ======================
// ИНТЕРВАЛЬНЫЕ ПОВТОРЕНИЯ
// ======================

function markCorrect(index){

    words[index].correct++;

    if(words[index].level < 5){
        words[index].level++;
    }

    let days = 0;

    switch(words[index].level){

        case 0:
            days = 0;
            break;

        case 1:
            days = 1;
            break;

        case 2:
            days = 3;
            break;

        case 3:
            days = 7;
            break;

        case 4:
            days = 14;
            break;

        case 5:
            days = 30;
            break;
    }

    words[index].nextReview =
        Date.now() + days * 24 * 60 * 60 * 1000;

    localStorage.setItem("words", JSON.stringify(words));
}

function markWrong(index){

    words[index].wrong++;

    words[index].level = 0;

    words[index].nextReview = Date.now();

    localStorage.setItem("words", JSON.stringify(words));
}

knowBtn.onclick = () => {

    const reviewWords = currentWords.filter(word =>
        !word.nextReview || word.nextReview <= Date.now()
    );

    if(reviewWords.length === 0) return;

    const word = reviewWords[currentCard];

    const index = words.findIndex(w =>
        w.english === word.english &&
        w.russian === word.russian
    );

    if(index === -1) return;

    markCorrect(index);

    addXP(5);

    if(currentCard >= reviewWords.length - 1){
        currentCard = 0;
    }

    updateCard();

};

dontKnowBtn.onclick = () => {

    const reviewWords = currentWords.filter(word =>
        !word.nextReview || word.nextReview <= Date.now()
    );

    if(reviewWords.length === 0) return;

    const word = reviewWords[currentCard];

    const index = words.findIndex(w =>
        w.english === word.english &&
        w.russian === word.russian
    );

    if(index === -1) return;

    markWrong(index);

    currentCard = 0;

    updateCard();

};
document.getElementById("playGuess").onclick = () => {

    hideAll();

    guessGame.style.display = "block";

};

document.getElementById("playWrite").onclick = () => {

    hideAll();

    writeGame.style.display = "block";

};

document.getElementById("playScramble").onclick = () => {

    hideAll();

    scrambleGame.style.display = "block";

};

document.getElementById("playExam").onclick = () => {

    hideAll();

    examGame.style.display = "block";

};


console.log(guessGame);
console.log(writeGame);
console.log(scrambleGame);


const examWord = document.getElementById("examWord");
const examAnswers = document.getElementById("examAnswers");
const examCounter = document.getElementById("examCounter");
const examResult = document.getElementById("examResult");

const startExamBtn = document.getElementById("startExamBtn");
const exitExamBtn = document.getElementById("exitExamBtn");


document.getElementById("playExam").onclick = () => {

    hideAll();

    examGame.style.display = "block";
};
document.getElementById("playListen").onclick = () => {

    hideAll();

    listenGame.style.display = "block";

};

startExamBtn.onclick = () => {

    if(words.length < 4){

        alert("Добавьте минимум 4 слова.");

        return;
    }

    examWords = [...words]
        .sort(() => Math.random() - 0.5)
        .slice(0,20);

    examQuestion = 0;
    examCorrect = 0;

    nextExamQuestion();
};

function nextExamQuestion(){

    if(examQuestion >= examWords.length){

        examWord.textContent =
        "🏆 Экзамен окончен";

        examAnswers.innerHTML = "";

        examResult.textContent =
        "Правильно: " +
        examCorrect +
        " из " +
        examWords.length;

if(examCorrect === examWords.length){
    addXP(100); // идеальный экзамен
}else{
    addXP(examCorrect * 5); // по 5 XP за каждый правильный ответ
}
       
        return;
    
    }

    examCounter.textContent =
    "Вопрос " +
    (examQuestion+1) +
    " / " +
    examWords.length;

    const word = examWords[examQuestion];

    examWord.textContent = word.english;

    let variants = [word.russian];

    while(variants.length < 4){

        const random =
        words[Math.floor(Math.random()*words.length)].russian;

        if(!variants.includes(random))
            variants.push(random);
    }

    variants.sort(()=>Math.random()-0.5);

    examAnswers.innerHTML = "";

    variants.forEach(answer=>{

        const btn = document.createElement("button");

        btn.className = "answerBtn";

        btn.textContent = answer;

        btn.onclick = ()=>{

            if(answer === word.russian){

                examCorrect++;

                btn.classList.add("correct");

            }else{

                btn.classList.add("wrong");

            }

            setTimeout(()=>{

                examQuestion++;

                nextExamQuestion();

            },800);

        };

        examAnswers.appendChild(btn);

    });

}

exitExamBtn.onclick = ()=>{

    hideAll();

    games.style.display = "block";

};

exitWriteBtn.onclick = () => {

    hideAll();

    games.style.display = "block";

};


newWordBtn.onclick = () => {
    startScramble();
};
exitScrambleBtn.onclick = () => {

    hideAll();

    games.style.display = "block";

};

document.getElementById("guessGame").style.display = "none";
document.getElementById("writeGame").style.display = "none";
document.getElementById("scrambleGame").style.display = "none";

const exam = document.getElementById("examGame");
if (exam) exam.style.display = "none";

flashcard.animate(

[
    {
        opacity:0,
        transform:"scale(.95)"
    },

    {
        opacity:1,
        transform:"scale(1)"
    }

],

{
    duration:250
}

);
flashcard.animate(

[
    {
        opacity:0,
        transform:"scale(.95)"
    },

    {
        opacity:1,
        transform:"scale(1)"
    }

],

{
    duration:250
}

);
// ======================
// DAILY QUESTS
// ======================

const dailyQuestsBox =
document.getElementById("dailyQuests");

let today =
new Date().toLocaleDateString();

let savedDate =
localStorage.getItem("dailyDate");

let quests =
JSON.parse(localStorage.getItem("dailyQuests")) || [];

if(savedDate !== today){

quests=[

{
text:"Добавить 5 слов",
goal:5,
progress:0,
reward:20
},

{
text:"Изучить 10 карточек",
goal:10,
progress:0,
reward:30
},

{
text:"Получить 50 XP",
goal:50,
progress:0,
reward:40
}

];

localStorage.setItem(
"dailyDate",
today
);

localStorage.setItem(
"dailyQuests",
JSON.stringify(quests)
);

}

function updateDailyQuests(){

dailyQuestsBox.innerHTML="";

quests.forEach((q,index)=>{

let done=q.progress>=q.goal;

dailyQuestsBox.innerHTML+=`

<div class="quest">

<h3>${done?"✅":"🎯"} ${q.text}</h3>

<div class="progressBar">

<div class="progressFill"

style="width:${
(q.progress/q.goal)*100
}%">

</div>

</div>

<p>

${q.progress} / ${q.goal}

</p>

<p>

🎁 ${q.reward} XP

</p>

</div>

`;

});

localStorage.setItem(
"dailyQuests",
JSON.stringify(quests)
);

}

updateDailyQuests();
// ======================
// ИГРА "НАПИШИ УСЛЫШАННОЕ"
// ======================

function startListenGame(){

    let sourceWords = words;

if(listenSet.value !== "all"){

    sourceWords = sets[listenSet.value].words;

}

if(sourceWords.length === 0){

    alert("В этом наборе нет слов!");

    return;

}

currentListenWord =
sourceWords[Math.floor(Math.random()*sourceWords.length)];

    listenAnswer.value = "";

    listenResult.textContent = "";

    listenWord.textContent = "🔊 Слушай слово";

    speakListenWord();
}

function speakListenWord(){

    if(!currentListenWord) return;

    const speech =
    new SpeechSynthesisUtterance(
        currentListenWord.english
    );

    speech.lang = "en-US";
    speech.rate = 0.85;
    speech.pitch = 1;

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);

}

startListenBtn.onclick = ()=>{

    startListenGame();

};

playSoundBtn.onclick = ()=>{

    speakListenWord();

};

checkListenBtn.onclick = ()=>{

    if(!currentListenWord) return;

    const answer =
    listenAnswer.value
    .trim()
    .toLowerCase();

    if(answer === currentListenWord.english.toLowerCase()){

        listenResult.textContent =
        "✅ Правильно!";

        addXP(10);

    }else{

        listenResult.textContent =
        "❌ Правильный ответ: " +
        currentListenWord.english;

    }

};

nextListenBtn.onclick = ()=>{

    startListenGame();

};

exitListenBtn.onclick = ()=>{

    hideAll();

    games.style.display = "block";

};
// ==============================
// ЭССЕ И ПИСЬМА
// ==============================

const ESSAYS_KEY = "essays";
const ESSAY_DRAFT_KEY = "essayDraft";

// Safe read: broken JSON no longer crashes the whole script
function loadEssayJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.error("Cannot read " + key, error);
        return fallback;
    }
}

// Safe write: returns true / false (storage can be full or blocked)
function saveEssayJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Cannot save " + key, error);
        return false;
    }
}

let essays = loadEssayJSON(ESSAYS_KEY, []);

if (!Array.isArray(essays)) {
    essays = [];
}

let currentEssayIndex = -1;

// Ask the browser not to delete our data when disk space is low
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist();
}


// Элементы

const essayTab =
    document.getElementById("essayTab");

const essaysSection =
    document.getElementById("essays");

const essayList =
    document.getElementById("essayList");

const newEssayBtn =
    document.getElementById("newEssayBtn");

const essayEditor =
    document.getElementById("essayEditor");

const essayTitle =
    document.getElementById("essayTitle");

const essayType =
    document.getElementById("essayType");

const essayText =
    document.getElementById("essayText");
    const essayWordCount = document.getElementById("essayWordCount");

function updateEssayWordCount() {

    const text = essayText.value.trim();

    if (text === "") {
        essayWordCount.textContent = "0";
        return;
    }

    const words = text.split(/\s+/).filter(word => word.length > 0);

    essayWordCount.textContent = words.length;
}

essayText.addEventListener("input", updateEssayWordCount);

updateEssayWordCount();

const saveEssayBtn =
    document.getElementById("saveEssayBtn");

const copyEssayBtn =
    document.getElementById("copyEssayBtn");

const cancelEssayBtn =
    document.getElementById("cancelEssayBtn");



// ==============================
// АВТОСОХРАНЕНИЕ ЧЕРНОВИКА
// ==============================

const essaySaveStatus =
    document.getElementById("essaySaveStatus");

let essayDraftTimer = null;

// true = something was typed after the last Save / Cancel / open
let essayUnsaved = false;

// true = typed text is not yet written to the draft
let essayDraftPending = false;

function setEssaySaveStatus(message) {

    if (essaySaveStatus) {
        essaySaveStatus.textContent = message;
    }

}

function saveEssayDraftNow() {

    clearTimeout(essayDraftTimer);

    const draft = {
        index: currentEssayIndex,
        title: essayTitle.value,
        type: essayType.value,
        text: essayText.value,
        updatedAt: Date.now()
    };

    const ok = saveEssayJSON(ESSAY_DRAFT_KEY, draft);

    essayDraftPending = !ok;

    setEssaySaveStatus(
        ok
            ? "✅ Автосохранено " + new Date().toLocaleTimeString()
            : "⚠ Не удалось сохранить! Нажми 📋 Копировать"
    );

}

// Wait 400 ms after the last key, so we do not write on every letter
function scheduleEssayDraftSave() {

    essayUnsaved = true;
    essayDraftPending = true;

    setEssaySaveStatus("Сохранение...");

    clearTimeout(essayDraftTimer);

    essayDraftTimer = setTimeout(saveEssayDraftNow, 400);

}

function flushEssayDraft() {

    if (essayDraftPending) {
        saveEssayDraftNow();
    }

}

function clearEssayDraft() {

    clearTimeout(essayDraftTimer);

    essayDraftPending = false;
    essayUnsaved = false;

    try {
        localStorage.removeItem(ESSAY_DRAFT_KEY);
    } catch (error) {}

    setEssaySaveStatus("");

}

essayTitle.addEventListener("input", scheduleEssayDraftSave);
essayText.addEventListener("input", scheduleEssayDraftSave);
essayType.addEventListener("change", scheduleEssayDraftSave);

// Save immediately when the tab is hidden, switched or closed
document.addEventListener("visibilitychange", () => {

    if (document.visibilityState === "hidden") {
        flushEssayDraft();
    }

});

window.addEventListener("pagehide", flushEssayDraft);
window.addEventListener("beforeunload", flushEssayDraft);

// Restore the draft when the page opens
function restoreEssayDraft() {

    const draft = loadEssayJSON(ESSAY_DRAFT_KEY, null);

    if (!draft) return;

    if (
        (draft.title || "").trim() === "" &&
        (draft.text || "").trim() === ""
    ) {
        return;
    }

    currentEssayIndex =
        Number.isInteger(draft.index) && essays[draft.index]
            ? draft.index
            : -1;

    essayTitle.value = draft.title || "";
    essayType.value = draft.type || "essay";
    essayText.value = draft.text || "";

    updateEssayWordCount();

    hideAll();

    essaysSection.style.display = "block";
    essayEditor.style.display = "block";

    showEssays();

    essayUnsaved = true;

    setEssaySaveStatus("♻️ Черновик восстановлен");

}

// ==============================
// ОТКРЫТЬ ВКЛАДКУ
// ==============================

essayTab.onclick = () => {

    hideAll();

    essaysSection.style.display = "block";

    showEssays();

};


// ==============================
// ПОКАЗАТЬ СПИСОК
// ==============================

function showEssays() {

    if (essays.length === 0) {

        essayList.innerHTML = `
            <p>
                Пока нет сохранённых работ.
            </p>
        `;

        return;
    }


    essayList.innerHTML = "";


    essays.forEach((essay, index) => {

        let typeIcon = "📝";

        if (essay.type === "letter") {
            typeIcon = "✉️";
        }

        if (essay.type === "article") {
            typeIcon = "📰";
        }

        if (essay.type === "other") {
            typeIcon = "📄";
        }


        essayList.innerHTML += `

            <div class="essayItem">

                <div class="essayInfo">

                    <h3>
                        ${typeIcon}
                        ${escapeEssayHTML(essay.title)}
                    </h3>

                    <p>
                        ${escapeEssayHTML(
                            essay.text.substring(0, 120)
                        )}
                        ${essay.text.length > 120 ? "..." : ""}
                    </p>

                </div>


                <div class="essayActions">

                    <button
                        onclick="editEssay(${index})"
                    >
                        ✏️
                    </button>

                    <button
                        onclick="copySavedEssay(${index})"
                    >
                        📋
                    </button>

                    <button
                        onclick="deleteEssay(${index})"
                    >
                        🗑
                    </button>

                </div>

            </div>

        `;

    });

}


// ==============================
// НОВАЯ РАБОТА
// ==============================

newEssayBtn.onclick = () => {

    if (
        essayUnsaved &&
        !confirm(
            "Есть несохранённые изменения. Начать новую работу? Черновик будет заменён."
        )
    ) {
        return;
    }

    clearEssayDraft();

    currentEssayIndex = -1;

    essayTitle.value = "";

    essayType.value = "essay";

    essayText.value = "";

    essayEditor.style.display = "block";

    updateEssayWordCount();

    essayTitle.focus();

};


// ==============================
// СОХРАНИТЬ
// ==============================

saveEssayBtn.onclick = () => {

    const title =
        essayTitle.value.trim();

    const text =
        essayText.value.trim();

    const type =
        essayType.value;


    if (title === "") {

        alert("Введите название работы!");

        return;

    }


    if (text === "") {

        alert("Напишите текст работы!");

        return;

    }


    const essay = {

        title: title,

        type: type,

        text: text,

        date: Date.now()

    };


    // Новая работа

    if (currentEssayIndex === -1) {

        essays.push(essay);

    }

    // Редактирование

    else {

        essays[currentEssayIndex] = essay;

    }


    if (!saveEssayJSON(ESSAYS_KEY, essays)) {

        alert(
            "❌ Не удалось сохранить: память браузера переполнена.\n" +
            "Текст остался в редакторе — скопируй его кнопкой 📋."
        );

        return;

    }

    // Real save worked, the safety draft is not needed any more
    clearEssayDraft();

    essayEditor.style.display = "none";

    currentEssayIndex = -1;

    showEssays();

};


// ==============================
// РЕДАКТИРОВАНИЕ
// ==============================

window.editEssay = function(index) {

    if (
        essayUnsaved &&
        !confirm(
            "Есть несохранённые изменения. Открыть другую работу? Черновик будет заменён."
        )
    ) {
        return;
    }

    const essay =
        essays[index];

    clearEssayDraft();

    currentEssayIndex = index;


    essayTitle.value =
        essay.title;

    essayType.value =
        essay.type;

    essayText.value =
        essay.text;


    essayEditor.style.display =
        "block";

    updateEssayWordCount();


    essayTitle.focus();

};


// ==============================
// УДАЛЕНИЕ
// ==============================

window.deleteEssay = function(index) {

    if (
        !confirm(
            "Удалить эту работу?"
        )
    ) {

        return;

    }


    essays.splice(index, 1);


    // The editor may be open for a work whose number just changed
    if (essayEditor.style.display === "block") {

        if (currentEssayIndex === index) {

            // The work that was being edited is deleted
            currentEssayIndex = -1;

        }

        else if (currentEssayIndex > index) {

            currentEssayIndex--;

        }

        flushEssayDraft();

        if (essayUnsaved) {
            saveEssayDraftNow();
        }

    }


    if (!saveEssayJSON(ESSAYS_KEY, essays)) {

        alert("❌ Не удалось сохранить изменения.");

    }


    showEssays();

};


// ==============================
// КОПИРОВАНИЕ ИЗ СПИСКА
// ==============================

window.copySavedEssay = async function(index) {

    const essay =
        essays[index];


    try {

        await navigator.clipboard.writeText(
            essay.text
        );

        alert("📋 Текст скопирован!");

    }

    catch (error) {

        alert(
            "Не удалось скопировать текст."
        );

    }

};


// ==============================
// КНОПКА КОПИРОВАТЬ В РЕДАКТОРЕ
// ==============================

copyEssayBtn.onclick = async () => {

    const text =
        essayText.value;


    if (text.trim() === "") {

        alert("Нет текста для копирования!");

        return;

    }


    try {

        await navigator.clipboard.writeText(text);

        alert("📋 Текст скопирован!");

    }

    catch (error) {

        essayText.select();

        document.execCommand("copy");

        alert("📋 Текст скопирован!");

    }

};


// ==============================
// ОТМЕНА
// ==============================

cancelEssayBtn.onclick = () => {

    if (
        essayUnsaved &&
        !confirm("Отменить изменения? Написанный текст будет удалён.")
    ) {
        return;
    }

    clearEssayDraft();

    essayEditor.style.display = "none";

    currentEssayIndex = -1;

};


// ==============================
// ЗАЩИТА HTML
// ==============================

function escapeEssayHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
// Restore an unsaved draft after a crash / power cut / closed tab
restoreEssayDraft();

// ==============================
// ИМПОРТ НАБОРА
// ==============================

importSetBtn.onclick = function () {

    const code = importSetCode.value.trim();

    if (!code) {
        alert("❌ Вставь код набора.");
        return;
    }

    try {

        if (!code.startsWith("WM1:")) {
            throw new Error("Неверный формат");
        }

        const base64 = code.substring(4);

        const json = decodeURIComponent(
            escape(atob(base64))
        );

        const imported = JSON.parse(json);

        if (
            !imported.name ||
            !Array.isArray(imported.words)
        ) {
            throw new Error("Неверные данные");
        }

        let newName = imported.name;
        let number = 2;

        while (sets.some(set => set.name === newName)) {

            newName = `${imported.name} (${number})`;

            number++;
        }

        sets.push({

            name: newName,

            words: imported.words,

            progress: 0,

            currentCard: 0

        });

        localStorage.setItem(
            "sets",
            JSON.stringify(sets)
        );

        importSetCode.value = "";

        showSets();

        alert(
            `✅ Набор "${newName}" успешно импортирован!`
        );

    } catch (error) {

        alert(
            "❌ Не удалось импортировать набор.\n\n" +
            "Проверь, что ты вставил полный код."
        );

    }

};
/*
 * WordMaster - accounts and sync
 * ------------------------------
 * 1. Checks if you are logged in (asks the server). If not -> shows the login screen.
 * 2. After login, copies your saved data from the server into localStorage.
 * 3. Only THEN loads script.js, so script.js works exactly as before.
 * 4. Every change that script.js writes to localStorage is sent to the server
 *    (with a short delay). If there is no connection, the change waits and is
 *    sent later, nothing is lost.
 *
 * Keys that start with "wm_" are internal and are never sent to the server.
 */
(function () {
    "use strict";

    var LS = window.localStorage;

    var USER_KEY = "wm_user";       // whose data is in this browser
    var DIRTY_KEY = "wm_dirty";     // keys that are not on the server yet
    var BACKUP_KEY = "wm_backup";   // safety copy if data had to be replaced

    var nativeSet = Storage.prototype.setItem;
    var nativeRemove = Storage.prototype.removeItem;

    var authed = false;
    var appLoaded = false;
    var pending = {};               // key -> string (save) | null (delete)
    var flushTimer = null;
    var inflight = null;
    var retryDelay = 5000;
    var statusEl = null;
    var statusKind = "saved";
    var infoNotice = "";


    // ============================================================
    // Small helpers
    // ============================================================

    function isSynced(key) {
        return typeof key === "string" && key.indexOf("wm_") !== 0;
    }

    function syncedKeys() {
        var keys = [];
        for (var i = 0; i < LS.length; i++) {
            var key = LS.key(i);
            if (isSynced(key)) keys.push(key);
        }
        return keys;
    }

    function readDirty() {
        try {
            var list = JSON.parse(LS.getItem(DIRTY_KEY) || "[]");
            return Array.isArray(list) ? list : [];
        } catch (error) {
            return [];
        }
    }

    function writeDirty(list) {
        try {
            if (list.length) LS.setItem(DIRTY_KEY, JSON.stringify(list));
            else LS.removeItem(DIRTY_KEY);
        } catch (error) { /* storage full: nothing more we can do */ }
    }

    function collectLocal() {
        var data = {};
        syncedKeys().forEach(function (key) {
            data[key] = LS.getItem(key);
        });
        return data;
    }

    function wipeLocal() {
        syncedKeys().forEach(function (key) {
            nativeRemove.call(LS, key);
        });
        try { LS.removeItem(DIRTY_KEY); } catch (error) {}
    }

    function backupLocal(owner) {
        try {
            LS.setItem(BACKUP_KEY, JSON.stringify({
                owner: owner,
                savedAt: new Date().toISOString(),
                data: collectLocal()
            }));
        } catch (error) { /* too big for the browser: skip the backup */ }
    }

    function applyServerData(items) {
        syncedKeys().forEach(function (key) {
            if (!(key in items)) nativeRemove.call(LS, key);
        });
        Object.keys(items).forEach(function (key) {
            nativeSet.call(LS, key, items[key]);
        });
    }

    async function api(method, path, body, options) {
        try {
            var init = {
                method: method,
                credentials: "same-origin",
                headers: {},
                keepalive: !!(options && options.keepalive)
            };
            if (body !== undefined) {
                init.headers["Content-Type"] = "application/json";
                init.body = JSON.stringify(body);
            }
            var response = await fetch(path, init);
            var data = null;
            try { data = await response.json(); } catch (error) {}
            return { ok: response.ok, status: response.status, data: data };
        } catch (error) {
            return { ok: false, status: 0, data: null };   // no connection
        }
    }

    async function pushKeys(keys) {
        var items = {};
        keys.forEach(function (key) {
            items[key] = LS.getItem(key);                  // null = deleted
        });
        return api("PUT", "/api/data", { items: items });
    }


    // ============================================================
    // Sync: every localStorage change goes to the server
    // ============================================================

    function queue(key, value) {
        pending[key] = value;

        var dirty = readDirty();
        if (dirty.indexOf(key) === -1) {
            dirty.push(key);
            writeDirty(dirty);
        }

        setStatus("pending");

        clearTimeout(flushTimer);
        flushTimer = setTimeout(function () { flush(); }, 800);
    }

    Storage.prototype.setItem = function (key, value) {
        nativeSet.call(this, key, value);
        if (this === LS && authed && isSynced(String(key))) {
            queue(String(key), String(value));
        }
    };

    Storage.prototype.removeItem = function (key) {
        nativeRemove.call(this, key);
        if (this === LS && authed && isSynced(String(key))) {
            queue(String(key), null);
        }
    };

    async function flush(options) {
        clearTimeout(flushTimer);
        flushTimer = null;

        if (inflight) await inflight;

        var keys = Object.keys(pending);
        if (!keys.length) {
            if (authed) setStatus("saved");
            return true;
        }

        var items = pending;
        pending = {};

        inflight = api("PUT", "/api/data", { items: items }, options);
        var result = await inflight;
        inflight = null;

        if (result.ok) {
            var dirty = readDirty().filter(function (key) {
                return !(key in items) || (key in pending);
            });
            writeDirty(dirty);
            retryDelay = 5000;

            if (Object.keys(pending).length) {
                flushTimer = setTimeout(function () { flush(); }, 800);
            } else {
                setStatus("saved");
            }
            return true;
        }

        // failed: put the changes back (newer changes win)
        keys.forEach(function (key) {
            if (!(key in pending)) pending[key] = items[key];
        });

        if (result.status === 401) {
            sessionExpired();
            return false;
        }

        // 4xx (except 429) means the server refuses this data: retrying is pointless
        if (result.status >= 400 && result.status < 500 && result.status !== 429) {
            keys.forEach(function (key) { delete pending[key]; });
            writeDirty(readDirty().filter(function (key) {
                return keys.indexOf(key) === -1;
            }));
            setStatus("error", (result.data && result.data.message) || "сервер отклонил данные");
            return false;
        }

        setStatus("offline");
        flushTimer = setTimeout(function () { flush(); }, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 60000);
        return false;
    }

    function resumeDirty() {
        readDirty().forEach(function (key) {
            pending[key] = LS.getItem(key);
        });
        if (Object.keys(pending).length) {
            setStatus("pending");
            flushTimer = setTimeout(function () { flush(); }, 800);
        }
    }

    // Send everything that is waiting when the page is closed / hidden
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden" && authed) flush({ keepalive: true });
    });
    window.addEventListener("pagehide", function () {
        if (authed) flush({ keepalive: true });
    });
    window.addEventListener("online", function () {
        if (authed) flush();
    });

    function sessionExpired() {
        authed = false;
        showAuth("login", "Сессия закончилась. Войди снова — несохранённые изменения не потеряются.");
    }


    // ============================================================
    // Styles + login screen
    // ============================================================

    var css = document.createElement("style");
    css.textContent =
        "#wmAuth{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;" +
        "padding:16px;background:linear-gradient(135deg,#0f172a,#1e1b4b 55%,#0f172a);overflow:auto;" +
        "font-family:Arial,Helvetica,sans-serif;}" +
        "#wmAuth .wmCard{width:min(92vw,400px);background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);" +
        "border-radius:24px;padding:28px;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.45);}" +
        "#wmAuth h1{margin:0 0 4px;font-size:30px;text-align:center;color:#fff;}" +
        "#wmAuth .wmSub{margin:0 0 20px;text-align:center;opacity:.75;font-size:14px;color:#fff;}" +
        "#wmAuth .wmTabs{display:flex;gap:8px;margin-bottom:16px;}" +
        "#wmAuth .wmTabs button{flex:1;padding:10px;font-size:15px;border-radius:12px;background:rgba(255,255,255,.1);" +
        "box-shadow:none;transform:none!important;opacity:.7;}" +
        "#wmAuth .wmTabs button.active{background:linear-gradient(135deg,#3b82f6,#8b5cf6);opacity:1;}" +
        "#wmAuth input{display:block;width:100%;box-sizing:border-box;margin:0 0 12px;padding:13px 14px;font-size:16px;" +
        "border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;outline:none;}" +
        "#wmAuth input::placeholder{color:rgba(255,255,255,.55);}" +
        "#wmAuth .wmSubmit{width:100%;padding:14px;font-size:17px;border-radius:14px;transform:none!important;}" +
        "#wmAuth .wmSubmit:disabled{opacity:.6;cursor:wait;}" +
        "#wmAuth .wmError{min-height:20px;margin:0 0 10px;color:#fca5a5;font-size:14px;}" +
        "#wmAuth .wmNote{margin:12px 0 0;font-size:13px;opacity:.7;text-align:center;color:#fff;}" +
        "#wmUserChip{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;margin:0 0 12px;" +
        "font-size:14px;color:#fff;}" +
        "#wmUserChip .wmStatus{opacity:.8;}" +
        "#wmUserChip button{width:auto;min-width:0;margin:0;padding:6px 14px;font-size:13px;border-radius:12px;" +
        "transform:none!important;box-shadow:none!important;}";
    document.head.appendChild(css);

    var ui = null;
    var mode = "login";

    function buildAuthUI() {
        if (ui) return ui;

        var overlay = document.createElement("div");
        overlay.id = "wmAuth";

        var card = document.createElement("div");
        card.className = "wmCard";

        var title = document.createElement("h1");
        title.textContent = "📚 WordMaster";

        var sub = document.createElement("p");
        sub.className = "wmSub";
        sub.textContent = "Войди, чтобы твои слова были на любом устройстве";

        var tabs = document.createElement("div");
        tabs.className = "wmTabs";

        var tabLogin = document.createElement("button");
        tabLogin.type = "button";
        tabLogin.id = "wmTabLogin";
        tabLogin.textContent = "Вход";

        var tabRegister = document.createElement("button");
        tabRegister.type = "button";
        tabRegister.id = "wmTabRegister";
        tabRegister.textContent = "Регистрация";

        tabs.appendChild(tabLogin);
        tabs.appendChild(tabRegister);

        var form = document.createElement("form");
        form.id = "wmForm";

        var inUser = document.createElement("input");
        inUser.id = "wmUser";
        inUser.type = "text";
        inUser.placeholder = "Имя пользователя";
        inUser.autocomplete = "username";
        inUser.maxLength = 30;

        var inPass = document.createElement("input");
        inPass.id = "wmPass";
        inPass.type = "password";
        inPass.placeholder = "Пароль";
        inPass.maxLength = 128;

        var inPass2 = document.createElement("input");
        inPass2.id = "wmPass2";
        inPass2.type = "password";
        inPass2.placeholder = "Повтори пароль";
        inPass2.autocomplete = "new-password";
        inPass2.maxLength = 128;

        var error = document.createElement("p");
        error.className = "wmError";
        error.setAttribute("role", "alert");

        var submit = document.createElement("button");
        submit.type = "submit";
        submit.className = "wmSubmit";
        submit.id = "wmSubmit";

        var note = document.createElement("p");
        note.className = "wmNote";

        form.appendChild(inUser);
        form.appendChild(inPass);
        form.appendChild(inPass2);
        form.appendChild(error);
        form.appendChild(submit);

        card.appendChild(title);
        card.appendChild(sub);
        card.appendChild(tabs);
        card.appendChild(form);
        card.appendChild(note);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        tabLogin.addEventListener("click", function () { setMode("login"); });
        tabRegister.addEventListener("click", function () { setMode("register"); });
        form.addEventListener("submit", function (event) {
            event.preventDefault();
            submitForm();
        });

        ui = {
            overlay: overlay, tabLogin: tabLogin, tabRegister: tabRegister,
            inUser: inUser, inPass: inPass, inPass2: inPass2,
            error: error, submit: submit, note: note
        };
        return ui;
    }

    function setMode(newMode) {
        mode = newMode;
        var form = buildAuthUI();

        var register = mode === "register";
        form.tabLogin.className = register ? "" : "active";
        form.tabRegister.className = register ? "active" : "";
        form.inPass2.style.display = register ? "block" : "none";
        form.inPass.autocomplete = register ? "new-password" : "current-password";
        form.submit.textContent = register ? "Создать аккаунт" : "Войти";
        form.error.textContent = "";

        var hasAnonymousData = !LS.getItem(USER_KEY) && syncedKeys().length > 0;
        form.note.textContent = register
            ? (hasAnonymousData
                ? "Слова и данные, которые уже есть в этом браузере, будут перенесены в новый аккаунт."
                : "Пароль: минимум 8 символов. Восстановить пароль нельзя — запомни его.")
            : "Пароль хранится на сервере в зашифрованном виде.";
    }

    function showAuth(newMode, message) {
        var form = buildAuthUI();
        setMode(newMode || "login");
        form.overlay.style.display = "flex";
        form.error.textContent = message || "";
        form.inPass.value = "";
        form.inPass2.value = "";

        var previous = LS.getItem(USER_KEY);
        if (previous && !form.inUser.value) form.inUser.value = previous;

        try { (form.inUser.value ? form.inPass : form.inUser).focus(); } catch (error) {}
    }

    function hideAuth() {
        if (ui) ui.overlay.style.display = "none";
    }

    async function submitForm() {
        var form = buildAuthUI();
        var username = form.inUser.value.trim();
        var password = form.inPass.value;

        form.error.textContent = "";

        if (!username || !password) {
            form.error.textContent = "Введи имя и пароль.";
            return;
        }
        if (mode === "register") {
            if (password.length < 8) {
                form.error.textContent = "Пароль: минимум 8 символов.";
                return;
            }
            if (password !== form.inPass2.value) {
                form.error.textContent = "Пароли не совпадают.";
                return;
            }
        }

        form.submit.disabled = true;

        var result;
        var uploaded = false;

        if (mode === "register") {
            var payload = { username: username, password: password };
            // data that exists in this browser without an account moves into the new account
            if (!LS.getItem(USER_KEY)) {
                var local = collectLocal();
                if (Object.keys(local).length) {
                    payload.data = local;
                    uploaded = true;
                }
            }
            result = await api("POST", "/api/register", payload);
        } else {
            result = await api("POST", "/api/login", { username: username, password: password });
        }

        form.submit.disabled = false;

        if (!result.ok) {
            form.error.textContent =
                result.status === 0
                    ? "Нет связи с сервером. Запущен ли server.py?"
                    : ((result.data && result.data.message) || "Ошибка. Попробуй ещё раз.");
            return;
        }

        hideAuth();

        if (appLoaded) {            // login after an expired session: restart cleanly
            location.reload();
            return;
        }

        await onAuthed(result.data.username, uploaded);
    }


    // ============================================================
    // After login
    // ============================================================

    async function onAuthed(username, alreadyUploaded) {
        var previous = LS.getItem(USER_KEY);
        var offlineWithLocal = false;

        if (!alreadyUploaded) {

            if (previous === username) {
                // push changes made while offline BEFORE we download anything
                var dirty = readDirty();
                if (dirty.length) {
                    var pushed = await pushKeys(dirty);
                    if (pushed.ok) writeDirty([]);
                    else offlineWithLocal = true;      // keep local data, retry later
                }
            } else if (previous) {
                // another account's data is still in this browser
                backupLocal(previous);
                wipeLocal();
            }

            if (!offlineWithLocal) {
                var pulled = await api("GET", "/api/data");

                if (pulled.status === 401) {
                    showAuth("login");
                    return;
                }

                if (!pulled.ok) {
                    if (previous === username) {
                        offlineWithLocal = true;       // use what this browser has
                    } else {
                        showAuth("login", "Не удалось загрузить данные с сервера. Попробуй ещё раз.");
                        return;
                    }
                } else {
                    var items = (pulled.data && pulled.data.items) || {};
                    var local = syncedKeys();

                    if (Object.keys(items).length === 0 && local.length &&
                        (previous === username || !previous)) {
                        await pushKeys(local);         // first device: upload what is here
                    } else {
                        if (!previous && local.length) {
                            backupLocal("no-account");
                            infoNotice = "Данные из этого браузера заменены данными аккаунта (копия сохранена).";
                        }
                        try {
                            applyServerData(items);
                        } catch (error) {
                            showAuth("login", "В браузере не хватает места для данных аккаунта.");
                            return;
                        }
                    }
                }
            }
        }

        LS.setItem(USER_KEY, username);
        authed = true;

        mountChip(username);

        if (offlineWithLocal) {
            resumeDirty();
            setStatus("offline");
        }

        loadApp();
    }

    function loadApp() {
        if (appLoaded) return;
        appLoaded = true;

        var script = document.createElement("script");
        script.src = "script.js";
        script.onerror = function () {
            alert("Не удалось загрузить script.js");
        };
        document.body.appendChild(script);
    }


    // ============================================================
    // User bar (name, sync status, logout)
    // ============================================================

    function setStatus(kind, detail) {
        statusKind = kind;
        if (!statusEl) return;

        var text = "";
        if (kind === "saved") text = "☁️ Сохранено";
        else if (kind === "pending") text = "⏳ Сохраняю…";
        else if (kind === "offline") text = "⚠ Нет связи — изменения сохранены на этом устройстве";
        else if (kind === "error") text = "⚠ Не синхронизировано: " + detail;

        statusEl.textContent = text;
    }

    function mountChip(username) {
        var old = document.getElementById("wmUserChip");
        if (old && old.parentNode) old.parentNode.removeChild(old);

        var chip = document.createElement("div");
        chip.id = "wmUserChip";

        var name = document.createElement("span");
        name.textContent = "👤 " + username;

        statusEl = document.createElement("span");
        statusEl.className = "wmStatus";

        var logoutBtn = document.createElement("button");
        logoutBtn.type = "button";
        logoutBtn.id = "wmLogout";
        logoutBtn.textContent = "Выйти";
        logoutBtn.addEventListener("click", logout);

        chip.appendChild(name);
        chip.appendChild(statusEl);
        chip.appendChild(logoutBtn);

        var header = document.querySelector("header");
        if (header) header.insertBefore(chip, header.firstChild);
        else document.body.insertBefore(chip, document.body.firstChild);

        setStatus(statusKind);

        if (infoNotice) {
            statusEl.textContent = "ℹ️ " + infoNotice;
            infoNotice = "";
            setTimeout(function () { setStatus(statusKind); }, 12000);
        }
    }

    async function logout() {
        setStatus("pending");

        var sent = await flush();

        if (!sent && !confirm(
            "Последние изменения не удалось отправить на сервер (нет связи).\n" +
            "Если выйти сейчас, они пропадут. Всё равно выйти?"
        )) {
            return;
        }

        authed = false;
        await api("POST", "/api/logout", {});

        wipeLocal();
        try { LS.removeItem(USER_KEY); } catch (error) {}

        location.reload();
    }


    // ============================================================
    // Start
    // ============================================================

    async function boot() {
        var me = await api("GET", "/api/me");

        if (me.ok) {
            await onAuthed(me.data.username, false);
            return;
        }

        // server not reachable but this browser has an account's data: work offline
        if (me.status === 0 && LS.getItem(USER_KEY)) {
            authed = true;
            mountChip(LS.getItem(USER_KEY));
            resumeDirty();
            setStatus("offline");
            loadApp();
            return;
        }

        showAuth(
            "login",
            me.status === 0 ? "Нет связи с сервером. Запущен ли server.py?" : ""
        );
    }

    boot();

})();
