// ----------------------------------------------------
    // 1. SUPABASE CONFIG
    // ----------------------------------------------------
    const supabaseClient = window.supabase.createClient(
      "https://bmagjduzjqtuzaudbpwt.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYWdqZHV6anF0dXphdWRicHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTYzMjUsImV4cCI6MjA4MTU3MjMyNX0.0DZKw2BpHm9qSIv6RxwVEPro6TYiPO9sz4_Rtjqi96M"
    );

    // ----------------------------------------------------
    // 2. ANIMATION TEXTE TYPING
    // ----------------------------------------------------
    const textToType = "Ce que vous pensez";
    const textElement = document.getElementById("typing-text");
    let typeIndex = 0;
    
    function animateText() {
      if (typeIndex < textToType.length) {
        textElement.innerHTML += textToType.charAt(typeIndex);
        typeIndex++;
        setTimeout(animateText, 80);
      }
    }
    // Démarrage retardé pour laisser le fade-in se faire
    setTimeout(animateText, 800);


    // ----------------------------------------------------
    // 3. LOGIQUE MENU MOBILE (Copiée de index.html)
    // ----------------------------------------------------
    const btnMenu = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');
    const bars = [document.getElementById('bar1'), document.getElementById('bar2'), document.getElementById('bar3')];
    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            mobileMenu.classList.add('menu-open');
            menuOverlay.classList.add('overlay-open');
            document.body.style.overflow = 'hidden';
            bars[0].classList.add('rotate-45', 'translate-y-2');
            bars[1].classList.add('opacity-0');
            bars[2].classList.add('-rotate-45', '-translate-y-2');
        } else {
            mobileMenu.classList.remove('menu-open');
            menuOverlay.classList.remove('overlay-open');
            document.body.style.overflow = '';
            bars[0].classList.remove('rotate-45', 'translate-y-2');
            bars[1].classList.remove('opacity-0');
            bars[2].classList.remove('-rotate-45', '-translate-y-2');
        }
    }
    btnMenu.addEventListener('click', toggleMenu);
    menuOverlay.addEventListener('click', toggleMenu);


    // ----------------------------------------------------
    // 4. SYSTÈME DE NOTATION (ÉTOILES)
    // ----------------------------------------------------
    const starBtns = document.querySelectorAll('.star-btn');
    const noteInput = document.getElementById('noteInput');
    let currentRating = 5;

    // Initialisation visuelle (Tout allumé)
    updateStars(5);

    starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.getAttribute('data-val'));
            currentRating = val;
            noteInput.value = val;
            updateStars(val);
        });
        
        // Survol optionnel pour UX
        btn.addEventListener('mouseenter', () => {
            const val = parseInt(btn.getAttribute('data-val'));
            updateStars(val, true); // true = mode preview
        });
    });

    document.getElementById('star-container').addEventListener('mouseleave', () => {
        updateStars(currentRating); // Retour à la note sélectionnée
    });

    function updateStars(count, isPreview = false) {
        starBtns.forEach(btn => {
            const val = parseInt(btn.getAttribute('data-val'));
            if (val <= count) {
                // Étoile allumée
                btn.classList.remove('text-zinc-300');
                btn.classList.add(isPreview ? 'text-violet-300' : 'text-violet-500');
            } else {
                // Étoile éteinte
                btn.classList.remove('text-violet-500', 'text-violet-300');
                btn.classList.add('text-zinc-300');
            }
        });
    }

    // ----------------------------------------------------
    // 5. GESTION DES AVIS (ENVOI & LECTURE)
    // ----------------------------------------------------
    const form = document.getElementById('reviewForm');
    const messageElem = document.getElementById('formMessage');
    const reviewsSection = document.getElementById('reviews-grid');

    // --- ENVOI ---
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const prenom = form.prenom.value.trim();
        const nom = form.nom.value.trim();
        const text = form.text.value.trim(); 
        const note = Number(form.note.value);

        messageElem.textContent = '';
        messageElem.className = 'text-center text-sm font-medium h-5 transition-colors duration-300';

        if (!prenom || !nom || !text || !note) {
          messageElem.textContent = "Tous les champs sont requis.";
          messageElem.classList.add('text-red-500');
          return;
        }

        const reviewData = {
          prenom,
          nom,
          text,
          note,
          status: false, // En attente de validation admin
          created_at: new Date().toISOString(),
        };

        try {
          const { error } = await supabaseClient
            .from('avis')
            .insert([reviewData]);

          if (error) throw error;

          form.reset();
          // Reset visuel des étoiles
          currentRating = 5;
          noteInput.value = 5;
          updateStars(5);

          messageElem.textContent = "Merci ! Votre avis sera publié après validation.";
          messageElem.classList.add('text-violet-600');

        } catch (err) {
          console.error(err);
          messageElem.textContent = "Erreur lors de l'envoi. Réessayez plus tard.";
          messageElem.classList.add('text-red-500');
        }
      });
    }

    // --- LECTURE ---
    async function loadReviews() {
      if (!reviewsSection) return;

      try {
        const { data: reviews, error } = await supabaseClient
          .from('avis')
          .select('*')
          .eq('status', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        reviewsSection.innerHTML = '';

        if (!reviews || reviews.length === 0) {
          reviewsSection.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-center opacity-60">
                <p class="text-4xl mb-2">🤷‍♂️</p>
                <p class="text-zinc-500 font-serif text-xl">Aucun avis pour le moment.</p>
                <p class="text-xs uppercase tracking-widest text-zinc-400 mt-2">Soyez le premier !</p>
            </div>`;
          return;
        }

        reviews.forEach((r, index) => {
          // Génération des étoiles HTML
          let starsHtml = '';
          for (let i = 1; i <= 5; i++) {
            starsHtml += i <= r.note
              ? `<svg class="w-4 h-4 fill-current text-violet-500" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09L5.644 11 1 7.09l6.061-.91L10 1l2.939 5.18L19 7.09 14.356 11l1.522 7.09z"/></svg>`
              : `<svg class="w-4 h-4 text-zinc-200" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09L5.644 11 1 7.09l6.061-.91L10 1l2.939 5.18L19 7.09 14.356 11l1.522 7.09z"/></svg>`;
          }

          // Formatage Date
          const date = new Date(r.created_at);
          const dateStr = date.toLocaleDateString('fr-FR', {
            year: 'numeric', month: 'long', day: 'numeric'
          });

          // Création de la carte
          const article = document.createElement('article');
          article.className = `
            bg-white border border-zinc-100
            p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1
            transition-all duration-300 flex flex-col justify-between h-full
            opacity-0 animate-fade-in-up
          `;
          article.style.animationDelay = `${index * 100}ms`;

          article.innerHTML = `
            <div>
              <div class="flex space-x-1 mb-4">${starsHtml}</div>
              <p class="text-zinc-600 font-light italic leading-relaxed mb-6">"${r.text}"</p>
            </div>
            <div class="mt-auto pt-4 border-t border-zinc-50 flex items-center justify-between">
              <p class="font-bold text-zinc-900 uppercase text-xs tracking-widest">${r.prenom} ${r.nom.charAt(0)}.</p>
              <span class="text-[10px] text-zinc-400 font-sans">${dateStr}</span>
            </div>
          `;

          reviewsSection.appendChild(article);
        });

      } catch (err) {
        console.error(err);
        reviewsSection.innerHTML = '<p class="col-span-full text-center text-red-400 text-sm uppercase tracking-widest">Impossible de charger les avis.</p>';
      }
    }

    // Charger les avis au démarrage
    loadReviews();