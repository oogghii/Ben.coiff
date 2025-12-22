// Typing text
const textElement = document.getElementById('typing-sub');
const textToType = "Et sans le prix.";
let index = 0;
setTimeout(() => {
    const interval = setInterval(() => {
            if (index < textToType.length) {
            textElement.innerHTML += textToType.charAt(index);
            index++;
        } else {
            clearInterval(interval);
        }
    }, 100);
}, 1000);

// ----------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------
const carouselContainer = document.getElementById('gallery-grid');
const totalImages = 9;
const imageFolder = 'images/';

// ----------------------------------------------------
// 1. SETUP DU CARROUSEL
// ----------------------------------------------------

// On enveloppe le carrousel dans un div "wrapper" pour positionner les flèches
// C'est de la manipulation DOM pour ne pas vous faire changer tout votre HTML
const wrapper = document.createElement('div');
wrapper.className = 'relative group'; // 'group' permet d'afficher les flèches au survol
carouselContainer.parentNode.insertBefore(wrapper, carouselContainer);
wrapper.appendChild(carouselContainer);

// Styles du conteneur (Scroll horizontal + Snap)
carouselContainer.className = "flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 no-scrollbar scroll-p-4 px-4 scroll-smooth";

// ----------------------------------------------------
// 2. GÉNÉRATION DES IMAGES
// ----------------------------------------------------
let contentHTML = '';
for (let i = 1; i <= totalImages; i++) {
    // Largeurs adaptées : Mobile (85%) / Tablette (45%) / PC (30%)
    contentHTML += `
    <div class="relative flex-none w-[85%] sm:w-[45%] lg:w-[30%] aspect-square snap-start rounded-2xl overflow-hidden bg-zinc-200 cursor-zoom-in shadow-sm hover:shadow-md transition-all duration-300"
            onclick="openLightbox('${imageFolder}coupe${i}.png')">
            <img src="${imageFolder}coupe${i}.png" alt="Coupe ${i}" loading="lazy"
            class="h-full w-full object-cover object-top transition-transform duration-700 ease-in-out hover:scale-105" />
            <div class="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300"></div>
    </div>`;
}
carouselContainer.innerHTML = contentHTML;

// ----------------------------------------------------
// 3. AJOUT DES BOUTONS DE NAVIGATION (PC UNIQUEMENT)
// ----------------------------------------------------

const btnClass = "absolute top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur text-zinc-800 p-3 rounded-full shadow-lg hover:bg-violet-500 hover:text-white transition-all duration-300 hidden md:flex opacity-0 group-hover:opacity-100 cursor-pointer disabled:opacity-0";

// Bouton Gauche
const prevBtn = document.createElement('button');
prevBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>';
prevBtn.className = `${btnClass} left-2`;
prevBtn.onclick = () => scrollCarousel(-1);

// Bouton Droite
const nextBtn = document.createElement('button');
nextBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
nextBtn.className = `${btnClass} right-2`;
nextBtn.onclick = () => scrollCarousel(1);

wrapper.appendChild(prevBtn);
wrapper.appendChild(nextBtn);

// Fonction de scroll au clic
function scrollCarousel(direction) {
    // On scrolle de la moitié de la largeur visible du conteneur
    const scrollAmount = carouselContainer.clientWidth / 2;
    carouselContainer.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

// ----------------------------------------------------
// 4. TRANSFORMER LA MOLETTE SOURIS (Vertical -> Horizontal)
// ----------------------------------------------------
carouselContainer.addEventListener('wheel', (evt) => {
    // Si l'utilisateur utilise une souris classique (pas un trackpad qui permet déjà le horizontal)
    // evt.deltaY est la valeur du scroll vertical
    if (evt.deltaY !== 0) {
        evt.preventDefault(); // On empêche la page de descendre
        carouselContainer.scrollLeft += evt.deltaY; // On déplace le carrousel sur le côté
    }
});

// ----------------------------------------------------
// LIGHTBOX (Code Standard)
// ----------------------------------------------------
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');

function openLightbox(src) {
    lightboxImg.src = src;
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

lightbox.addEventListener('click', () => {
    lightbox.classList.add('hidden');
    lightboxImg.src = '';
    document.body.style.overflow = '';
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { lightbox.click(); }
});

const startDate = new Date('2025-01-01');
  const currentDate = new Date();

  // Calcul du nombre de mois (différence d'années * 12 + différence de mois)
  let months = (currentDate.getFullYear() - startDate.getFullYear()) * 12;
  months -= startDate.getMonth();
  months += currentDate.getMonth();

  // On ajoute 1 pour inclure le mois en cours si on veut, 
  // ou on laisse tel quel pour "mois révolus". 
  // Ici je laisse la différence brute, ce qui donne 0 en Janvier 2025, 1 en Février, etc.
  // SI tu veux que Janvier compte pour 1 mois déjà, ajoute +1 à la ligne suivante :
  months = months <= 0 ? 1 : months + 1;

  document.getElementById('months-count').textContent = months;