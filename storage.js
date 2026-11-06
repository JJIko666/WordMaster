// =======================
// Storage.js
// Работа с сохранением слов
// =======================

let words = JSON.parse(localStorage.getItem("words")) || [];

function saveWords() {
    localStorage.setItem("words", JSON.stringify(words));
}

function getWords() {
    return words;
}

function addWord(english, russian, image = "") {

    words.push({
        english,
        russian,
        image,
        favorite: false,
        learned: 0,
        mistakes: 0
    });

    saveWords();

}

function deleteWord(index){

    words.splice(index,1);

    saveWords();

}