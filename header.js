document.addEventListener("DOMContentLoaded", () => {
    // 1. Sélection des éléments
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('menu-overlay');
    const bars = [
        document.getElementById('bar1'), 
        document.getElementById('bar2'), 
        document.getElementById('bar3')
    ];
    let isOpen = false;

    // 2. Fonction de bascule (Toggle)
    function toggleMenu() {
        isOpen = !isOpen;

        if (isOpen) {
            // --- OUVRIR ---
            
            // Menu : Devient visible et interactif
            menu.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-2');
            menu.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');

            // Overlay : Devient visible (on enlève hidden)
            overlay.classList.remove('hidden');
            
            // Icône : Croix
            bars[0].classList.add('rotate-45', 'translate-y-2');
            bars[1].classList.add('opacity-0');
            bars[2].classList.add('-rotate-45', '-translate-y-2');

            // Body : Bloquer le scroll
            document.body.style.overflow = 'hidden';

        } else {
            // --- FERMER ---

            // Menu : Devient invisible
            menu.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
            menu.classList.add('opacity-0', 'pointer-events-none', '-translate-y-2');

            // Overlay : Se cache (on remet hidden)
            overlay.classList.add('hidden');

            // Icône : Burger
            bars[0].classList.remove('rotate-45', 'translate-y-2');
            bars[1].classList.remove('opacity-0');
            bars[2].classList.remove('-rotate-45', '-translate-y-2');

            // Body : Réactiver le scroll
            document.body.style.overflow = '';
        }
    }

    // 3. Écouteurs d'événements
    if(btn) btn.addEventListener('click', toggleMenu);
    
    // Fermer si on clique sur le fond noir
    if(overlay) overlay.addEventListener('click', toggleMenu);
    
    // Fermer si on clique sur un lien du menu
    if(menu) {
        const links = menu.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', toggleMenu);
        });
    }
});