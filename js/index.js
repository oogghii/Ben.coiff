// 1. La carte (Conteneur)
const card = document.createElement('div');
// Mobile : Hauteur fixe. Desktop : Hauteur adaptative ou ratio.
card.className = "group relative w-full h-80 sm:h-96 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-violet-900/20 transition-all duration-500 bg-zinc-100 dark:bg-zinc-800";

// 2. L'image
const img = document.createElement('img');
img.src = photo.url; 
img.alt = "Réalisation Bencoiff";
// Zoom très lent au survol (effet premium)
img.className = "w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[800ms] ease-out";

// 3. Overlay (Ombre intérieure légère en bas pour le contraste si tu mets du texte)
const overlay = document.createElement('div');
overlay.className = "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500";

// Assemblage
card.appendChild(img);
card.appendChild(overlay);

// Clic Lightbox
card.addEventListener('click', () => openLightbox(photo.url));

galleryContainer.appendChild(card);