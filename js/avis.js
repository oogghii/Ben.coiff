// --- API URLs & CONFIG ---
const supabaseClient = window.supabase.createClient(
  "https://bmagjduzjqtuzaudbpwt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYWdqZHV6anF0dXphdWRicHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTYzMjUsImV4cCI6MjA4MTU3MjMyNX0.0DZKw2BpHm9qSIv6RxwVEPro6TYiPO9sz4_Rtjqi96M"
);

// --- DARK MODE LOGIC ---
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  if (document.documentElement.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
}

// Check initial theme
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

// --- TYPING ANIMATION ---
const textToType = "Vos Avis !";
const textElement = document.getElementById("text");
let typeIndex = 0;
let forward = true;

function animateText() {
  if (!textElement) return;
  
  if (forward) {
    textElement.textContent += textToType.charAt(typeIndex);
    typeIndex++;
    if (typeIndex === textToType.length) {
      forward = false;
      setTimeout(animateText, 2000); // Wait 2s before deleting
    } else {
      setTimeout(animateText, 100);
    }
  } else {
    textElement.textContent = textElement.textContent.slice(0, -1);
    typeIndex--;
    if (typeIndex === 0) {
      forward = true;
      setTimeout(animateText, 500);
    } else {
      setTimeout(animateText, 50);
    }
  }
}

// Start animation
animateText();

// --- REVIEW SYSTEM LOGIC ---
const form = document.getElementById('reviewForm');
const messageElem = document.getElementById('formMessage');
const reviewsSection = document.querySelector('section[aria-label="Avis des clients"]');

// Handle Form Submission
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const prenom = form.prenom.value.trim();
    const nom = form.nom.value.trim();
    // note that the textarea id in HTML is textInput, but name is text
    const text = form.text.value.trim(); 
    const note = Number(form.note.value);

    messageElem.textContent = '';
    messageElem.classList.remove('text-green-600', 'text-red-600', 'dark:text-green-400', 'dark:text-red-400');

    if (!prenom || !nom || !text || !note) {
      messageElem.textContent = "Veuillez remplir tous les champs.";
      messageElem.classList.add('text-red-600', 'dark:text-red-400');
      return;
    }

    const reviewData = {
      prenom,
      nom,
      text,
      note,
      status: false, // Pending validation
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabaseClient
        .from('avis')
        .insert([reviewData]);

      if (error) throw error;

      form.reset();
      messageElem.textContent = "Merci pour votre avis, il sera publié après validation !";
      messageElem.classList.add('text-green-600', 'dark:text-green-400');

      // Note: We don't reload reviews here because the new review is not validated yet

    } catch (err) {
      console.error(err);
      messageElem.textContent = "Erreur lors de l'envoi. Réessayez plus tard.";
      messageElem.classList.add('text-red-600', 'dark:text-red-400');
    }
  });
}

// Handle Loading Reviews
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
      reviewsSection.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400 text-lg">Aucun avis publié pour le moment. Soyez le premier !</p>';
      return;
    }

    reviews.forEach((r, index) => {
      // Star Rating SVG Generation
      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += i <= r.note
          ? `<svg class="w-5 h-5 fill-current text-yellow-400 dark:text-yellow-300" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09L5.644 11 1 7.09l6.061-.91L10 1l2.939 5.18L19 7.09 14.356 11l1.522 7.09z"/></svg>`
          : `<svg class="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linejoin="round" stroke-linecap="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.18 6.675h7.014c.969 0 1.371 1.24.588 1.81l-5.676 4.108 2.18 6.674c.3.922-.755 1.688-1.538 1.118l-5.676-4.108-5.676 4.108c-.783.57-1.838-.196-1.538-1.118l2.18-6.674-5.676-4.108c-.783-.57-.38-1.81.588-1.81h7.014l2.18-6.675z"/></svg>`;
      }

      // Date Formatting
      const date = new Date(r.created_at);
      const dateStr = date.toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      // Create Article Element
      const article = document.createElement('article');
      // Matches the index.html card style
      article.className = `
        bg-white dark:bg-gray-900/80
        border border-gray-200 dark:border-gray-700
        text-gray-800 dark:text-gray-100
        p-6 rounded-2xl shadow-xl
        animate__animated animate__fadeInUp 
        hover:shadow-2xl transition-all duration-300 flex flex-col justify-between
      `.trim();
      
      // Stagger animation based on index
      article.style.animationDelay = `${index * 0.1}s`;

      article.innerHTML = `
        <div>
          <div class="flex space-x-1 mb-3">${starsHtml}</div>
          <p class="italic opacity-90 leading-relaxed mb-4 text-gray-700 dark:text-gray-300">"${r.text}"</p>
        </div>
        <div class="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
          <p class="font-bold text-indigo-600 dark:text-indigo-400 uppercase text-sm tracking-wide">${r.prenom} ${r.nom}</p>
          <span class="text-xs text-gray-400 dark:text-gray-500">${dateStr}</span>
        </div>
      `;

      reviewsSection.appendChild(article);
    });

  } catch (err) {
    console.error(err);
    reviewsSection.innerHTML = '<p class="col-span-full text-center text-red-500">Impossible de charger les avis.</p>';
  }
}

// Initial Load
loadReviews();


// --- SOCIAL POPUP LOGIC ---
const btnReseaux = document.getElementById('btnReseaux');
const popupReseaux = document.getElementById('popupReseaux');
const fermerPopupReseaux = document.getElementById('fermerPopupReseaux');
const popupContent = document.getElementById('popupContent');

if (btnReseaux && popupReseaux && fermerPopupReseaux) {
  
  btnReseaux.addEventListener('click', () => {
    popupReseaux.classList.remove('hidden');
    // Animation handling
    if(popupContent) {
      popupContent.classList.remove('opacity-0', 'scale-90', 'pointer-events-none');
      popupContent.classList.add('opacity-100', 'scale-100');
    }
  });

  const closePopup = () => {
    if(popupContent) {
      popupContent.classList.remove('opacity-100', 'scale-100');
      popupContent.classList.add('opacity-0', 'scale-90', 'pointer-events-none');
    }
    // Delay hiding the container to allow transition
    setTimeout(() => {
       popupReseaux.classList.add('hidden');
    }, 200);
  };

  fermerPopupReseaux.addEventListener('click', closePopup);

  popupReseaux.addEventListener('click', (e) => {
    if (e.target === popupReseaux) {
      closePopup();
    }
  });
}