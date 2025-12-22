// EFFET MACHINE A ECRIRE (Simple)
const textElement = document.getElementById('typing-text');
const textToType = "Tout ce qu'il faut savoir avant de venir.";
let index = 0;
setTimeout(() => {
    const interval = setInterval(() => {
            if (index < textToType.length) {
            textElement.innerHTML += textToType.charAt(index);
            index++;
        } else {
            clearInterval(interval);
        }
    }, 50);
}, 500);