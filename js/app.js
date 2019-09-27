/**
 * Firebase Database for saving players score
 */
// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyBWhRmfnK8Mu6XhwFIhQ_0IFeLmvjy2Snk",
    authDomain: "memorygame-ae106.firebaseapp.com",
    databaseURL: "https://memorygame-ae106.firebaseio.com/",
    projectId: "memorygame-ae106",
    storageBucket: "memorygame-ae106.appspot.com",
    messagingSenderId: "676981133676",
    appId: "1:676981133676:web:5ba8e5218cd76120816349"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var userId;
function writePlayerData(name, timer, rate) {
    firebase.database().ref('players/' + userId).set({
        username: name,
        timer: timer,
        rate: rate
    });
}
let playersData = new Array();
function retrievePlayersData(){
    var ref = firebase.database().ref("players");
    ref.once("value").then(function (snapshot) { //snapshot = "players"
        snapshot.forEach(function (childSnapshot) { //childSnapshot = ID
            playersData.push(childSnapshot.child("username").val());
            playersData.push(childSnapshot.child("timer").val());
            playersData.push(childSnapshot.child("rate").val());
        });
    });
}
retrievePlayersData();
let medalPlayer = "";
let lessTimer = 0;
function creatPlayerListOnHtml(){
    if (playersData.length > 0){
        const frag = document.createDocumentFragment();
        let timers = new Array(); // collect all timers of all players in one array
        let idIndxCounter = 0;
        for (let i = 0; i < playersData.length; i++) {
            const name = playersData[i];
            const time = playersData[++i];
            const rate = playersData[++i];

            if (rate.includes("3")) {
                // count time in minutes
                const splitTime = time.split(":");
                let currentTime = ((parseInt(splitTime[0], 10)) * 60) + (parseInt(splitTime[1], 10));
                timers.push(currentTime);
            }
            else {
                timers.push(1000);
            }
            const li = document.createElement('li');
            const pName = document.createElement('p');
            const pTimer = document.createElement('p');
            const pRate = document.createElement('p');
            li.className = 'player';
            pName.id = "player" + idIndxCounter; // set id of p tag with timers index to match between them easy 
            pName.innerHTML = name;
            pTimer.innerHTML = time;
            pRate.innerHTML = rate;
            li.appendChild(pName);
            li.appendChild(pTimer);
            li.appendChild(pRate);
            frag.appendChild(li);
            idIndxCounter++;
        }
        document.querySelector(".playersList").appendChild(frag);
        /**
         * Give the faster player and only who make 3 stars the gold medal
         * Note: if there more than player have the same timer then no one have the gold medal
         */
        lessTimer = Math.min(...timers); // get minimum timer in the array
        let index = timers.indexOf(lessTimer); // get the index of that timer 
        index = (timers.slice(index + 1, timers.length)).indexOf(lessTimer); // check if the timer is not repeated in another index
        if (index === -1) {
            medalPlayer = timers.indexOf(lessTimer);
            medalPlayer = `#player${medalPlayer}`;
            /* const id = timers.indexOf(lessTimer);
            document.querySelector(`#player${id}`).innerHTML += "🥇"; */
        }
        else {
            medalPlayer = "NoPlayer";
        }
    }
}
function addPlayerToPlayerList(playername, timer, rate){
    let currentPlayer = document.querySelector(".currentPlayer");
    if (currentPlayer != null){ 
        currentPlayer.remove();
    }
    let text = `<li class="player currentPlayer"><p>${playername}</p><p>${timer}</p><p>${rate}</p></li>`;
    document.querySelector(".playersList").insertAdjacentHTML('afterbegin', text);
}
/*
 * Create a list that holds all of your cards
 */
const cards = document.querySelectorAll(".card");
const starRate = document.querySelectorAll(".starRate");
let clickedCards = new Array(); // to pick the clicked card and compare it with the next card 
let matchCounter = 0; // add one each time player match tow cards, if counter reach 8 then all cards match and the palyer win
const icons = document.querySelectorAll(".icon");
const layer = document.querySelector(".endLayer");
const layer2 = document.querySelector(".startLayer");
let timerMin = 0.0;
let timerSec = 0.0;
let time = document.querySelector("#time");
let movement = document.querySelector("#movement");
let stars = document.querySelector("#stars");
let moves = document.querySelector(".moves");
let timerText = document.querySelector("#timerText");
let moveCounter = 0; // the number of clicks that player made
let restartElm = document.querySelector(".restart");
let intervalId;
const playerNameInput = document.querySelector("#playerName");
let playerName = "Unknown";
let timerTextToDB = "0:0";
let rate = "⭐?";
/*
 * Display the cards on the page
 *   - shuffle the list of cards using the provided "shuffle" method below
 *   - loop through each card and create its HTML
 *   - add each card's HTML to the page
 */
// Shuffle function from http://stackoverflow.com/a/2450976
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
/*
 * set up the event listener for a card. If a card is clicked:
 *  - display the card's symbol (put this functionality in another function that you call from this one)
 *  - add the card to a *list* of "open" cards (put this functionality in another function that you call from this one)
 *  - if the list already has another card, check to see if the two cards match
 *    + if the cards do match, lock the cards in the open position (put this functionality in another function that you call from this one)
 *    + if the cards do not match, remove the cards from the list and hide the card's symbol (put this functionality in another function that you call from this one)
 *    + increment the move counter and display it on the page (put this functionality in another function that you call from this one)
 *    + if all cards have matched, display a message with the final score (put this functionality in another function that you call from this one)
*/
const timer = () => {
    timerSec++;
    if (timerSec === 60.0) {
        timerSec = 0;
        timerMin++;
    }
    timerText.innerHTML = `${timerMin}:${timerSec}`;
};
let reassignIcons = () => {
    // array of icones class name (bootstrap font-awesome)
    let iconsArr = ["fa-diamond", "fa-bicycle", "fa-bomb", "fa-leaf", "fa-anchor", "fa-paper-plane-o", "fa-cube", "fa-bolt", "fa-diamond", "fa-bicycle", "fa-bomb", "fa-leaf", "fa-anchor", "fa-paper-plane-o", "fa-cube", "fa-bolt"]; 
    iconsArr = shuffle(iconsArr);
    icons.forEach(function (icon) {
        icon.className = `icon fa ${iconsArr.pop()}`;
    });
};
reassignIcons();

/* open card */
const openCard = (card) => {
    card.classList.toggle("open");
    card.classList.toggle("show");
};
/* if card match */
const matchCard = (card) => {
    card.classList.add("match");
};
const chekTowCards = (card1, card2) => {
    let str1 = card1.className; // string hold the classes of the fist card
    let str2 = card2.className; // string hold the classes of the second card
    if (str1.includes(str2)) {
        matchCard(card1.parentNode);
        matchCard(card2.parentNode);
        matchCounter++;
        if (matchCounter == 8){
            setTimeout(function () {gameOver();}, 500);
        }
    }
    else {
        setTimeout(function () {
            card1.parentNode.className = "card";
            card2.parentNode.className = "card"; 
        }, 500);
    }
};
// if card clicked
const cardClicked = (card) => {
    if (card.className === "card" ){ // if the clicked card not open or has matched
        moveCounter++;
        moves.innerHTML = moveCounter;
        if (moveCounter > 55){
            starRate[1].classList.remove("fa-star");
        } else if (moveCounter > 38){
            starRate[0].classList.remove("fa-star");
        }
        if (clickedCards.length == 0) {
            card.classList.toggle("open");
            card.classList.toggle("show");
            clickedCards.push(card);
        }
        else if (clickedCards.length == 1) {
            card.classList.toggle("open");
            card.classList.toggle("show");
            let card1 = clickedCards.pop().childNodes;
            let card2 = card.childNodes;

            chekTowCards(card1[1], card2[1]);
        }
    }
};
// assign click event for each cards
cards.forEach(
    function (card) {
        card.addEventListener('click', function () {cardClicked(card);});
    }
);
const start = () => {
    let text = playerNameInput.value;
    if (text === ""){
        playerNameInput.style.border = "3px solid rgb(217, 46, 46)";
    }
    else{
        creatPlayerListOnHtml();
        userId = firebase.database().ref().push().key; //define a player ID so every time player restart the game just modify the score to the same ID and not assign a new player
        intervalId = setInterval(timer, 1000);
        playerName = text.substr(0, 14); 
        layer2.style.display = "none";
    }
};
const gameOver = () => {
    clearInterval(intervalId);
    timerTextToDB = `${timerMin} : ${timerSec}`;
    time.innerHTML = timerTextToDB;
    movement.innerHTML = moveCounter;
    if (moveCounter < 38){
        stars.innerHTML = "⭐ ⭐ ⭐";
        rate = "⭐3";
    } else if (moveCounter < 55){
        stars.innerHTML = "⭐ ⭐";
        rate = "⭐2";
    }
    else {
        stars.innerHTML = "⭐";
        rate = "⭐1";
    }
    let countTime = (timerMin * 60) + timerSec;
    /**
     * add Emojie depend on time: 🔥 Fast - 👍 Average - 🐢 Slow
     */
    if (countTime < 35) { 
        playerName += " |🔥";
    } else if (countTime < 55){ 
        playerName += " |👍";
    }else {
        playerName += " |🐢";
    }
    writePlayerData(playerName, timerTextToDB, rate);
    // medalPlayer = "NoPlayer" && medalPlayer === "NoPlayer"
    if (countTime < lessTimer) {
        playerName += "🥇";
    } else {
        document.querySelector(medalPlayer).innerHTML += "🥇";
    }
    addPlayerToPlayerList(playerName, timerTextToDB, rate);
    layer.style.display = "block";
};
const restart = () => {
    starRate[0].classList.add("fa-star");
    starRate[1].classList.add("fa-star");
    timerText.innerHTML = "0:0";
    clearInterval(intervalId);
    matchCounter = 0;
    timerMin = 0.0; 
    timerSec = 0.0;
    playerName = (playerNameInput.value).substr(0, 14); //reassign the name to remove the extar text we add it in 
    moveCounter = 0;
    clickedCards.pop();
    moves.innerHTML = "0";
    layer.style.display = "none";
    intervalId = setInterval(timer, 1000);
    cards.forEach(
        function (card) {
            card.className = "card";
        }
    );
    reassignIcons();
};
restartElm.addEventListener('click', function () { restart(); });
