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

let essays = JSON.parse(
    localStorage.getItem("essays")
) || [];

let currentEssayIndex = -1;


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

    currentEssayIndex = -1;

    essayTitle.value = "";

    essayType.value = "essay";

    essayText.value = "";

    essayEditor.style.display = "block";

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


    localStorage.setItem(
        "essays",
        JSON.stringify(essays)
    );


    essayEditor.style.display = "none";

    currentEssayIndex = -1;

    showEssays();

};


// ==============================
// РЕДАКТИРОВАНИЕ
// ==============================

window.editEssay = function(index) {

    const essay =
        essays[index];

    currentEssayIndex = index;


    essayTitle.value =
        essay.title;

    essayType.value =
        essay.type;

    essayText.value =
        essay.text;


    essayEditor.style.display =
        "block";


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


    localStorage.setItem(
        "essays",
        JSON.stringify(essays)
    );


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
// Проверка вкладки Эссе
essayTab.addEventListener("click", function () {

    console.log("Вкладка Эссе нажата");

    hideAll();

    essaysSection.style.display = "block";

    showEssays();

});
