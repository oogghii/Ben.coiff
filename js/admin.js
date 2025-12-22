// admin.js

// --- 1. Initialisation Supabase ---
const supabaseClient = window.supabase.createClient(
  "https://bmagjduzjqtuzaudbpwt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYWdqZHV6anF0dXphdWRicHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTYzMjUsImV4cCI6MjA4MTU3MjMyNX0.0DZKw2BpHm9qSIv6RxwVEPro6TYiPO9sz4_Rtjqi96M"
);

const ADMIN_EMAIL = "admin@admin.com"; 

// --- 2. Nouvelle Gestion de l'Authentification (Modal) ---
async function handleAuthentication() {
    // 1. Check existing session
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        // Déjà connecté : On charge les données
        return true;
    } else {
        // Pas connecté : On affiche la jolie modal
        const authModal = document.getElementById("authModal");
        const authForm = document.getElementById("authForm");
        const authPassword = document.getElementById("authPassword");
        const authError = document.getElementById("authError");
        const authBtn = document.getElementById("authSubmitBtn");

        authModal.classList.remove("hidden");
        authPassword.focus();

        // On gère la soumission du formulaire
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // UI Feedback (Loading)
            authBtn.textContent = "Vérification...";
            authBtn.disabled = true;
            authError.classList.add("hidden");

            const password = authPassword.value;

            // Connexion Supabase
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: ADMIN_EMAIL,
                password: password
            });

            if (error) {
                // Erreur
                authError.classList.remove("hidden");
                authBtn.textContent = "Connexion";
                authBtn.disabled = false;
                authPassword.value = "";
                authPassword.focus();
            } else {
                // Succès
                authModal.classList.add("hidden");
                // On lance le chargement des données
                await loadDashboardData();
            }
        });

        return false; // Indique qu'on attend une action utilisateur
    }
}

// Fonction pour charger toutes les données (remplace l'ancien init logique)
async function loadDashboardData() {
    await cleanPastCreneaux();
    await cleanPastReservations();
    await fetchCreneaux();
    await fetchReservations();
    await fetchAvis();
    await fetchPresets();
}

// --- 3. Gestion des Créneaux ---
const btnOuvrirModal = document.getElementById('ouvrirModalCreneau');
const modalc = document.getElementById('modalCreneau');
const btnFermerModal = document.getElementById('fermerModalCreneau');
const formCreneau = document.getElementById('ajoutCreneauForm');
const container = document.getElementById("creneauxContainer"); 
const noCreneauxP = document.getElementById("noCreneaux");

// Gestion Modal
if (btnOuvrirModal) btnOuvrirModal.addEventListener('click', () => modalc.classList.remove('hidden'));
if (btnFermerModal) btnFermerModal.addEventListener('click', () => {
  modalc.classList.add('hidden');
  formCreneau.reset();
});
if (modalc) modalc.addEventListener('click', (e) => {
  if (e.target === modalc) {
    modalc.classList.add('hidden');
    formCreneau.reset();
  }
});

// Affichage des Créneaux
async function fetchCreneaux() {
  if (!container) return;
  container.innerHTML = "";
  noCreneauxP.classList.add("hidden");

  const formatterDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatterHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

  try {
    const { data, error } = await supabaseClient.from("creneaux").select("*");
    if (error) throw error;

    if (!data || data.length === 0) {
      noCreneauxP.classList.remove("hidden");
      return;
    }

    const groupes = {};
    data.forEach(c => {
      const dateStr = new Date(c.slot).toDateString();
      if (!groupes[dateStr]) groupes[dateStr] = [];
      groupes[dateStr].push(c);
    });

    Object.entries(groupes)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .forEach(([date, creneaux]) => {
        const dateCard = document.createElement("div");
        dateCard.className = "rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 mb-4";

        const btnToggle = document.createElement("button");
        btnToggle.className = "w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-[#151515] text-zinc-900 dark:text-zinc-100 font-serif font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition";
        const dateFormatted = formatterDate.format(new Date(date));
        btnToggle.innerHTML = `
          <span class="capitalize">${dateFormatted}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-violet-500 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        `;

        const creneauxDiv = document.createElement("div");
        creneauxDiv.className = "hidden bg-white dark:bg-[#0a0a0a] divide-y divide-zinc-100 dark:divide-zinc-800";

        creneaux.sort((a, b) => new Date(a.slot) - new Date(b.slot));

        creneaux.forEach(c => {
          const creneauItem = document.createElement("div");
          creneauItem.className = "flex justify-between items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition";

          const infoDiv = document.createElement("div");
          const heureSpan = document.createElement("span");
          heureSpan.className = "text-lg font-bold text-violet-600 dark:text-violet-400 mr-4 font-mono";
          heureSpan.textContent = formatterHeure.format(new Date(c.slot));

          const lieuSpan = document.createElement("span");
          lieuSpan.className = "text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]";
          lieuSpan.textContent = (c.lieu || "Lieu non défini") + " (" + (c.postal || "?") + ")";

          infoDiv.appendChild(heureSpan);
          infoDiv.appendChild(lieuSpan);

          const btnSuppr = document.createElement("button");
          btnSuppr.className = "text-zinc-400 hover:text-red-500 transition";
          btnSuppr.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;
          
          btnSuppr.addEventListener("click", async () => await supprimerCreneau(c.id));

          creneauItem.appendChild(infoDiv);
          creneauItem.appendChild(btnSuppr);
          creneauxDiv.appendChild(creneauItem);
        });

        btnToggle.addEventListener("click", () => {
          creneauxDiv.classList.toggle("hidden");
          btnToggle.querySelector("svg").classList.toggle("rotate-180");
        });

        dateCard.appendChild(btnToggle);
        dateCard.appendChild(creneauxDiv);
        container.appendChild(dateCard);
      });
  } catch (err) {
    console.error("Erreur fetchCreneaux:", err);
    if (err.code === 'PGRST301' || err.message?.includes('JWT')) {
         alert("Session expirée, veuillez recharger.");
    }
  }
}

async function supprimerCreneau(id) {
  if(!confirm("Supprimer ce créneau ?")) return;
  try {
    const { error } = await supabaseClient.from("creneaux").delete().eq("id", id);
    if (error) throw error;
    await fetchCreneaux();
  } catch (err) {
    alert("Erreur suppression (Droits insuffisants ?)");
    console.error(err);
  }
}

if (formCreneau) {
    formCreneau.addEventListener("submit", async e => {
        e.preventDefault();
        
        const btn = document.getElementById("submitCreneauBtn");
        const originalText = btn.textContent;
        
        // Get values
        const dateVal = document.getElementById("dateCreneau").value; // Returns YYYY-MM-DD
        const heureVal = document.getElementById("heureCreneau").value; // Returns HH:MM
        const lieuVal = document.getElementById("lieuCreneau").value.trim();
        const postalVal = document.getElementById("postal").value.trim();

        if (!dateVal || !heureVal || !lieuVal || !postalVal) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        // 1. UI Feedback: Loading state
        btn.textContent = "Ajout en cours...";
        btn.disabled = true;

        try {
            // --- CORRECTION UTC ICI ---
            // On crée une date locale JS et on la convertit en ISO (UTC)
            // Ex: 17:00 France devient 16:00 UTC
            const isoString = new Date(`${dateVal}T${heureVal}:00`).toISOString();

            const nouveauCreneau = {
                slot: isoString,
                lieu: lieuVal,
                postal: postalVal,
            };

            const { error } = await supabaseClient.from("creneaux").insert([nouveauCreneau]);
            
            if (error) throw error;

            // 3. Success
            formCreneau.reset();
            modalc.classList.add("hidden");
            await fetchCreneaux(); // Refresh list

        } catch (err) {
            console.error("Erreur ajout créneau:", err);
            alert("Erreur lors de l'ajout : " + (err.message || "Inconnue"));
        } finally {
            // 4. Restore Button
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// Nettoyage anciens créneaux
async function cleanPastCreneaux() {
  try {
    const { data } = await supabaseClient.from("creneaux").select("*");
    const now = new Date();
    const past = data.filter(c => new Date(c.slot) < now);
    if(past.length > 0) {
        await Promise.all(past.map(c => supabaseClient.from("creneaux").delete().eq("id", c.id)));
    }
  } catch (err) { console.error(err); }
}

// --- 4. Gestion des Réservations ---
async function fetchReservations() {
  const container = document.getElementById("reservationsBody");
  const noResaP = document.getElementById("noReservations");
  if (!container) return;
  
  container.innerHTML = "";
  noResaP.classList.add("hidden");

  const formatterDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatterHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

  try {
    const { data: creneauxData } = await supabaseClient.from("creneaux").select("*");
    const lieuxParSlot = {};
    creneauxData?.forEach(c => { lieuxParSlot[new Date(c.slot).toISOString()] = c.lieu; });

    const { data: reservationsData, error } = await supabaseClient.from("reservations").select("*");
    if (error) throw error;

    if (!reservationsData || reservationsData.length === 0) {
      noResaP.classList.remove("hidden");
      return;
    }

    const groupes = {};
    reservationsData.forEach(r => {
      if (r.slot) {
        const dateOnly = new Date(r.slot).toISOString().split('T')[0];
        if (!groupes[dateOnly]) groupes[dateOnly] = [];
        groupes[dateOnly].push(r);
      }
    });

    Object.entries(groupes)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .forEach(([date, reservations]) => {
        const dateCard = document.createElement("div");
        dateCard.className = "mb-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800";

        const btnToggle = document.createElement("button");
        btnToggle.className = "w-full flex items-center justify-between p-4 bg-zinc-100 dark:bg-[#151515] text-zinc-900 dark:text-zinc-100 font-serif font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition";
        const dateFormatted = formatterDate.format(new Date(date));
        btnToggle.innerHTML = `<span class="capitalize">${dateFormatted}</span><svg class="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>`;

        const resDiv = document.createElement("div");
        resDiv.className = "hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-[#0a0a0a]";

        reservations.sort((a, b) => new Date(a.slot) - new Date(b.slot)).forEach(r => {
            const slotStr = new Date(r.slot).toISOString();
            const lieu = lieuxParSlot[slotStr] || "Lieu inconnu";

            const resItem = document.createElement("div");
            resItem.className = "p-4 flex flex-col md:flex-row md:items-center justify-between gap-4";

            resItem.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="font-mono text-violet-600 dark:text-violet-400 font-bold text-lg">${formatterHeure.format(new Date(r.slot))}</span>
                    <div>
                        <p class="font-bold text-zinc-900 dark:text-zinc-100">${r.prenom} ${r.nom}</p>
                        <p class="text-xs text-zinc-500 uppercase tracking-wider">${lieu} • ${r.contact || "Pas de contact"}</p>
                    </div>
                </div>
            `;

            const btnSuppr = document.createElement("button");
            btnSuppr.className = "px-3 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold uppercase rounded hover:bg-red-200 transition self-start md:self-center";
            btnSuppr.textContent = "Annuler";
            btnSuppr.onclick = () => supprimerReservation(r.id);

            resItem.appendChild(btnSuppr);
            resDiv.appendChild(resItem);
        });

        btnToggle.addEventListener("click", () => resDiv.classList.toggle("hidden"));
        dateCard.append(btnToggle, resDiv);
        container.appendChild(dateCard);
      });

  } catch (err) { console.error(err); }
}

async function supprimerReservation(id) {
  if(!confirm("Annuler cette réservation ?")) return;
  try {
    const { error } = await supabaseClient.from("reservations").delete().eq("id", id);
    if(error) throw error;
    await fetchReservations();
  } catch (err) { 
      console.error(err); 
      alert("Erreur suppression (Droits insuffisants ?)");
  }
}

async function cleanPastReservations() {
    try {
        const { data } = await supabaseClient.from("reservations").select("*");
        const now = new Date();
        const past = data.filter(r => new Date(r.slot.replace(' ', 'T')) < now);
        if(past.length) await Promise.all(past.map(r => supabaseClient.from("reservations").delete().eq("id", r.id)));
    } catch(e) { console.error(e); }
}

// --- 5. Gestion des Avis ---
async function fetchAvis() {
  const container = document.getElementById("avisEnAttenteContainer");
  const noAvisP = document.getElementById("noAvisEnAttente");
  if (!container) return;

  container.innerHTML = "";
  noAvisP.classList.add("hidden");

  try {
    const { data, error } = await supabaseClient.from("avis").select("*").order("created_at", { ascending: false });
    if (error) throw error;

    if (!data || data.length === 0) {
      noAvisP.classList.remove("hidden");
      return;
    }

    data.forEach(a => {
      const card = document.createElement("div");
      card.className = "bg-white dark:bg-[#0a0a0a] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col gap-4 shadow-sm";

      const badgeColor = a.status ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200";
      const statusText = a.status ? "Validé" : "En attente";

      card.innerHTML = `
        <div class="flex justify-between items-start">
            <div>
                <h4 class="font-bold text-zinc-900 dark:text-zinc-100">${a.prenom} ${a.nom}</h4>
                <div class="text-yellow-500 text-sm mt-1">${"★".repeat(a.note)}${"☆".repeat(5 - a.note)}</div>
            </div>
            <span class="px-2 py-1 text-[10px] uppercase tracking-widest font-bold border rounded ${badgeColor}">${statusText}</span>
        </div>
        <p class="text-sm text-zinc-600 dark:text-zinc-300 italic">"${a.text}"</p>
        <div class="text-[10px] text-zinc-400 text-right">${new Date(a.created_at).toLocaleDateString()}</div>
        
        <div class="grid grid-cols-2 gap-3 mt-2">
             <button onclick="toggleValidation('${a.id}')" class="py-2 rounded text-xs font-bold uppercase tracking-widest border transition ${a.status ? 'border-yellow-500 text-yellow-600 hover:bg-yellow-50' : 'bg-violet-600 text-white hover:bg-violet-500'}">
                ${a.status ? 'Masquer' : 'Approuver'}
             </button>
             <button onclick="supprimerAvis('${a.id}')" class="py-2 rounded text-xs font-bold uppercase tracking-widest border border-red-200 text-red-500 hover:bg-red-50 transition">
                Supprimer
             </button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) { console.error(err); }
}

window.toggleValidation = async (id) => {
    const { data } = await supabaseClient.from("avis").select("status").eq("id", id).single();
    if(data) {
        const { error } = await supabaseClient.from("avis").update({ status: !data.status }).eq("id", id);
        if(!error) fetchAvis();
        else alert("Erreur mise à jour");
    }
};
window.supprimerAvis = async (id) => {
    if(confirm("Supprimer l'avis ?")) {
        const { error } = await supabaseClient.from("avis").delete().eq("id", id);
        if(!error) fetchAvis();
        else alert("Erreur suppression");
    }
};

// --- 6. Gestion des Presets ---
const ouvrirModalBtn = document.getElementById("ouvrirModalPreset");
const modal = document.getElementById("modalPreset");
const fermerModalBtn = document.getElementById("fermerModalPreset");
const ouvrirPanelBtn = document.getElementById("ouvrirPanel");
const panelHoraires = document.getElementById("panelHoraires");
const listeHoraires = document.getElementById("listeHoraires");
const ajouterHoraireBtn = document.getElementById("ajouterHoraire");

if(ouvrirModalBtn) {
    ouvrirModalBtn.addEventListener("click", () => {
        modal.classList.remove("hidden");
        document.getElementById("ajoutPresetForm").reset();
        listeHoraires.innerHTML = "";
        panelHoraires.classList.add("hidden");
        ajouterInputHoraire(); 
        modal.setAttribute("data-edit-id", "");
    });
}
if(fermerModalBtn) fermerModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
if(ouvrirPanelBtn) ouvrirPanelBtn.addEventListener("click", () => panelHoraires.classList.toggle("hidden"));

function ajouterInputHoraire(val = "") {
    const div = document.createElement("div");
    div.className = "flex gap-2 items-center";
    div.innerHTML = `
        <input type="time" required value="${val}" class="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm dark:text-white">
        <button type="button" class="text-zinc-400 hover:text-red-500">&times;</button>
    `;
    div.querySelector("button").onclick = () => div.remove();
    listeHoraires.appendChild(div);
}
if(ajouterHoraireBtn) ajouterHoraireBtn.onclick = () => ajouterInputHoraire();

function afficherPresets(presets) {
    const container = document.getElementById("presetsList");
    container.innerHTML = "";
    if(!presets.length) return;

    presets.forEach(p => {
        const horaires = JSON.parse(p.date); 
        const card = document.createElement("div");
        card.className = "bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col gap-4";
        const tags = horaires.map(h => `<span class="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs px-2 py-1 rounded font-mono">${h}</span>`).join("");

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <h4 class="font-serif font-bold text-lg dark:text-white">${p.name}</h4>
                <button class="text-zinc-400 hover:text-red-500 text-xs uppercase" onclick="supprimerPreset('${p.id}')">Suppr</button>
            </div>
            <div class="flex flex-wrap gap-2">${tags}</div>
            <button class="btn-apply-preset mt-auto w-full px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg transition-all">
                Appliquer ce preset
            </button>
        `;
        
        card.querySelector(".btn-apply-preset").addEventListener("click", () => ouvrirModalDatePourPreset(horaires));
        container.appendChild(card);
    });
}

window.supprimerPreset = async (id) => {
    if(confirm("Supprimer ce preset ?")) {
        const { error } = await supabaseClient.from("presets").delete().eq("id", id);
        if(!error) fetchPresets();
        else alert("Erreur suppression preset");
    }
}

async function fetchPresets() {
    try {
        const { data } = await supabaseClient.from("presets").select("*");
        afficherPresets(data || []);
    } catch(e) { console.error(e); }
}

const formPreset = document.getElementById("ajoutPresetForm");
if(formPreset) {
    formPreset.addEventListener("submit", async e => {
        e.preventDefault();
        const nom = document.getElementById("nomPreset").value;
        const inputs = listeHoraires.querySelectorAll("input");
        const heures = Array.from(inputs).map(i => i.value).filter(v => v);
        if(!heures.length) return alert("Ajoutez au moins un horaire");
        const payload = { name: nom, date: JSON.stringify(heures) };
        try {
            const { error } = await supabaseClient.from("presets").insert([payload]);
            if (error) throw error;
            modal.classList.add("hidden");
            fetchPresets();
        } catch(err) { console.error(err); alert("Erreur ajout preset"); }
    });
}

function ouvrirModalDatePourPreset(horaires) {
    let m = document.getElementById("modalApplyPreset");
    if(!m) {
        m = document.createElement("div");
        m.id = "modalApplyPreset";
        m.className = "fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4";
        m.innerHTML = `
            <div class="bg-white dark:bg-[#101010] rounded-xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-popup-show">
                <h3 class="text-xl font-serif dark:text-white mb-4">Appliquer le Preset</h3>
                <label class="block text-xs uppercase text-zinc-500 mb-1">Date</label>
                <input type="date" id="applyDate" class="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 rounded p-2 mb-4 dark:text-white">
                <label class="block text-xs uppercase text-zinc-500 mb-1">Lieu par défaut</label>
                <input type="text" id="applyLieu" value="Studio Privé" class="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 rounded p-2 mb-4 dark:text-white">
                <label class="block text-xs uppercase text-zinc-500 mb-1">Code Postal</label>
                <input type="text" id="applyCP" value="14000" class="w-full bg-transparent border border-zinc-300 dark:border-zinc-700 rounded p-2 mb-6 dark:text-white">
                <div class="flex gap-3">
                    <button id="btnCancelApply" class="flex-1 py-2 border border-zinc-300 dark:border-zinc-700 rounded text-xs font-bold uppercase hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-white">Annuler</button>
                    <button id="btnConfirmApply" class="flex-1 py-2 bg-violet-600 text-white rounded text-xs font-bold uppercase hover:bg-violet-500">Valider</button>
                </div>
            </div>
        `;
        document.body.appendChild(m);
        document.getElementById("btnCancelApply").onclick = () => m.classList.add("hidden");
    }
    m.classList.remove("hidden");
    
    const btnConfirm = document.getElementById("btnConfirmApply");
    const newBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);

    newBtn.onclick = async () => {
        const dateStr = document.getElementById("applyDate").value;
        const lieuStr = document.getElementById("applyLieu").value;
        const cpStr = document.getElementById("applyCP").value;
        if(!dateStr) return alert("Date requise");

        try {
            const inserts = horaires.map(h => {
                const [hh, mm] = h.split(":");
                // --- CORRECTION UTC ICI ---
                // On construit la date locale précise : "YYYY-MM-DDTHH:MM:00"
                const localDate = new Date(`${dateStr}T${hh}:${mm}:00`);
                
                return {
                    slot: localDate.toISOString(), // Convertit en UTC proprement
                    lieu: lieuStr,
                    postal: cpStr
                };
            });
            const { error } = await supabaseClient.from("creneaux").insert(inserts);
            if(error) throw error;
            m.classList.add("hidden");
            fetchCreneaux();
        } catch(e) {
            console.error(e);
            alert("Erreur application preset");
        }
    };
}

// --- 7. Init Modifié ---
async function init() {
    // Si l'auth retourne true (session existante), on charge direct.
    // Sinon, la modal s'occupera de lancer loadDashboardData() après le login.
    const isLogged = await handleAuthentication();
    if (isLogged) {
        await loadDashboardData();
    }
}

document.addEventListener("DOMContentLoaded", init);