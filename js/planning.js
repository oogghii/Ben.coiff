/**
 * ============================================================
 * 1. CONFIGURATION & ÉTAT GLOBAL
 * ============================================================
 */
const CONFIG = {
    SUPABASE_URL: "https://bmagjduzjqtuzaudbpwt.supabase.co",
    SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYWdqZHV6anF0dXphdWRicHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTYzMjUsImV4cCI6MjA4MTU3MjMyNX0.0DZKw2BpHm9qSIv6RxwVEPro6TYiPO9sz4_Rtjqi96M",
    LOCAL_STORAGE_KEY: 'bencoiff_ma_reservation'
};

// Initialisation de Supabase
const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

// État de l'application (State)
let state = {
    reservations: new Set(), // Liste des créneaux déjà réservés
    creneauxDispos: {},      // Créneaux ouverts par le coiffeur
    confirmCallback: null    // Pour la fenêtre de confirmation
};

/**
 * ============================================================
 * 2. UTILITAIRES (Dates & Notifications)
 * ============================================================
 */

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const isError = type === 'error';

    toast.className = `
        ${isError ? 'bg-red-500' : 'bg-zinc-900'} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 
        text-sm font-medium transform transition-all duration-300 pointer-events-auto animate-pop-in
    `;
    toast.innerHTML = `<span>${isError ? '⚠️' : '✅'}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDateBeau(slotString) {
    const date = new Date(slotString.replace(" ", "T"));
    if (isNaN(date)) return slotString;

    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
    const formatted = new Intl.DateTimeFormat("fr-FR", options).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * ============================================================
 * 3. INTERACTION API (Supabase)
 * ============================================================
 */

async function fetchCreneaux() {
    const { data, error } = await supabaseClient.from('creneaux').select('slot, lieu, postal');
    if (error) { console.error("Erreur fetchCreneaux:", error); return; }

    state.creneauxDispos = {};

    data.forEach(c => {
        const slotDate = new Date(c.slot);
        const date = slotDate.toISOString().slice(0, 10);
        const heure = slotDate.toTimeString().slice(0, 5);

        if (!state.creneauxDispos[date]) state.creneauxDispos[date] = {};
        
        // Clé unique pour regrouper par Lieu
        const groupeKey = `${c.lieu || 'Lieu non spécifié'} | ${c.postal || 'Code postal non spécifié'}`;

        if (!state.creneauxDispos[date][groupeKey]) state.creneauxDispos[date][groupeKey] = [];
        if (!state.creneauxDispos[date][groupeKey].includes(heure)) {
            state.creneauxDispos[date][groupeKey].push(heure);
        }
    });
}

async function fetchReservations() {
    const { data, error } = await supabaseClient.from("reservations").select("slot");
    if (error) { console.error("Erreur fetchReservations:", error); return; }

    state.reservations = new Set();
    data.forEach(r => {
        const slotDate = new Date(r.slot);
        const date = slotDate.toISOString().slice(0, 10);
        const heure = slotDate.toTimeString().slice(0, 5);
        state.reservations.add(`${date} ${heure}`);
    });
}

async function annulerReservationAPI(id, secretKey) {
    return await supabaseClient.rpc('cancel_reservation', {
        p_id: id,
        p_secret: secretKey
    });
}

async function creerReservationAPI(payload) {
    return await supabaseClient
        .from("reservations")
        .insert([payload])
        .select()
        .single();
}

/**
 * ============================================================
 * 4. LOGIQUE D'AFFICHAGE (UI & Planning)
 * ============================================================
 */

async function renderPlanning() {
    await fetchCreneaux();
    await fetchReservations();

    const planning = document.getElementById("planning");
    planning.innerHTML = "";

    const dates = Object.keys(state.creneauxDispos).sort();
    const now = new Date();
    const maResaString = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
    const maResa = maResaString ? JSON.parse(maResaString) : null;

    if (dates.length === 0) {
        planning.innerHTML = `<div class="p-8 border border-zinc-200 rounded-2xl text-zinc-400 bg-white text-center">Aucun créneau disponible pour le moment.</div>`;
        return;
    }

    dates.forEach(date => {
        const section = document.createElement("div");
        section.className = `bg-white text-zinc-900 rounded-2xl p-6 md:p-8 shadow-sm border border-zinc-200 w-full`;

        const dateObj = new Date(date + "T00:00:00");
        let dateString = dateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        section.innerHTML = `<h2 class="text-2xl font-serif font-bold mb-6 text-zinc-900 border-b border-zinc-100 pb-4">${dateString}</h2>`;
        
        planning.appendChild(section);

        const groupes = state.creneauxDispos[date];
        for (const groupeKey in groupes) {
            const [lieu, postal] = groupeKey.split(" | ");
            
            const groupDiv = document.createElement("div");
            groupDiv.className = `mb-6 last:mb-0`;
            groupDiv.innerHTML = `
                <h3 class="text-xs font-bold uppercase tracking-widest mb-3 text-violet-500 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    ${lieu} <span class="text-zinc-400 font-normal normal-case">(${postal})</span>
                </h3>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 slots-container"></div>
            `;
            section.appendChild(groupDiv);

            const slotsContainer = groupDiv.querySelector(".slots-container");
            groupes[groupeKey].sort().forEach(heure => {
                const slotKey = `${date} ${heure}`;
                const slotDateTime = new Date(`${date}T${heure}:00`);

                if (slotDateTime < now) return;

                // ... (dans la boucle renderPlanning)

                const btn = document.createElement("button");
                const isMyBooking = maResa && maResa.slotKey === slotKey;
                const isTaken = state.reservations.has(slotKey);

                // STYLE DE BASE : On fixe une hauteur (h-10) pour que tout soit aligné
                // "relative" est important pour positionner l'étiquette par rapport au bouton
                const baseStyle = "relative w-full h-10 flex items-center justify-center rounded-lg text-sm font-bold shadow-md transition-all duration-200";

                if (isMyBooking) {
                    // --- STYLE : MON RDV (Badge en bas) ---
                    btn.className = `${baseStyle} bg-violet-300 text-white border-2 border-violet-500 z-10`;
                    
                    // Changement ici :
                    // 1. On remplace '-top-2.5' par '-bottom-2.5' (elle descend en bas)
                    // 2. On garde le texte bien centré
                    btn.innerHTML = `
                        ${heure}
                        <span class="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-[9px] px-2 py-0.5 rounded-full shadow-sm tracking-wide border border-zinc-900">
                            MOI
                        </span>
                    `;
                    btn.addEventListener("click", () => ouvrirModalMyBooking(maResa));

                } else if (isTaken) {
                    // --- STYLE : PRIS ---
                    btn.textContent = heure;
                    btn.className = `${baseStyle} bg-zinc-100 text-zinc-300 cursor-not-allowed shadow-none border border-zinc-100`;

                } else {
                    // --- STYLE : DISPO (Le classique Noir) ---
                    btn.textContent = heure;
                    btn.className = `${baseStyle} bg-zinc-900 text-white hover:bg-violet-600 hover:scale-105 hover:shadow-lg`;
                    
                    btn.addEventListener("click", () => ouvrirFormulaire(slotKey, lieu, postal));
                }
                
                slotsContainer.appendChild(btn);
            });
        }
    });
}

/**
 * ============================================================
 * 5. MODALES ET FORMULAIRES
 * ============================================================
 */

// On accepte lieu et postal en paramètres pour éviter de re-chercher dans la DB
async function ouvrirFormulaire(slotKey, lieu, postal) {
    if (localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY)) {
        showToast("Tu as déjà un rendez-vous ! Annule l'ancien d'abord.", "error");
        return;
    }

    const form = document.getElementById("reservationForm");
    
    // On sauvegarde ces infos dans le formulaire pour l'étape de validation
    form.dataset.slot = slotKey; 
    form.dataset.lieu = lieu;
    form.dataset.postal = postal;

    // Mise à jour visuelle
    const locText = `<span class="block mt-1 text-xs text-zinc-400 font-normal">📍 ${lieu} (${postal})</span>`;

    document.getElementById("selectedSlotFormatted").innerHTML = `📅 ${formatDateBeau(slotKey)} ${locText}`;
    form.classList.remove("hidden");
}

function fermerFormulaire() {
    const form = document.getElementById("reservationForm");
    form.classList.add("hidden");
    document.getElementById("prenom").value = "";
    document.getElementById("nom").value = "";
    document.getElementById("contactValue").value = "";
    
    document.querySelectorAll(".contact-btn").forEach(b => {
        b.classList.remove("bg-white", "shadow-sm", "text-zinc-900", "active");
        b.classList.add("text-zinc-500");
    });
}

function ouvrirModalMyBooking(data) {
    const modal = document.getElementById("modalMyBooking");
    document.getElementById("myBookingDetails").innerHTML = `
        <div><strong>👤 Nom :</strong> ${data.prenom} ${data.nom}</div>
        <div><strong>📅 Date :</strong> ${formatDateBeau(data.slotKey)}</div>
    `;
    modal.classList.remove("hidden");
}

function fermerModalMyBooking() {
    document.getElementById("modalMyBooking").classList.add("hidden");
}

function showConfirm(message, onYes) {
    const modal = document.getElementById('custom-confirm');
    document.getElementById('confirm-message').textContent = message;
    state.confirmCallback = onYes;
    modal.classList.remove('hidden');
}

function closeCustomConfirm() {
    document.getElementById('custom-confirm').classList.add('hidden');
    state.confirmCallback = null;
}

document.getElementById('confirm-btn-yes').addEventListener('click', () => {
    if (state.confirmCallback) state.confirmCallback();
    closeCustomConfirm();
});

/**
 * ============================================================
 * 6. ACTIONS UTILISATEUR (Valider / Annuler)
 * ============================================================
 */

async function validerReservationBridge() {
    const visualInput = document.getElementById("contactValue");
    document.getElementById("contact").value = visualInput.value;
    await validerReservation();
}

async function validerReservation() {
    const form = document.getElementById("reservationForm");
    const slotKey = form.dataset.slot; // Ex: "2025-12-20 01:30"
    
    // On récupère le lieu et le postal stockés précédemment
    const lieu = form.dataset.lieu;
    const postal = form.dataset.postal;

    const prenom = document.getElementById("prenom").value.trim();
    const nom = document.getElementById("nom").value.trim();
    const contact = document.getElementById("contact").value.trim();

    if (!prenom || !nom || !contact) {
        showToast("Merci de remplir tous les champs.", "error");
        return;
    }

    // --- CORRECTION UTC ICI ---
    // .toISOString() convertit 01:30 (France) en 00:30 (UTC) automatiquement
    const slotIso = new Date(slotKey).toISOString();
    
    const secretKey = self.crypto.randomUUID();

    try {
        const { data, error } = await creerReservationAPI({
            slot: slotIso,
            prenom,
            nom,
            contact,
            lieu: lieu,     
            postal: postal, 
            secret_key: secretKey
        });

        if (error) throw error;

        const localData = { 
            id: data.id, 
            slotKey: slotKey, 
            prenom, 
            nom,
            secretKey 
        };
        localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(localData));
        
        state.reservations.add(slotKey);
        fermerFormulaire();
        renderPlanning();
        showToast(`Réservé avec succès pour ${prenom} !`);
        
    } catch (err) {
        console.error(err);
        showToast("Erreur lors de la réservation.", "error");
    }
}

async function annulerReservation() {
    showConfirm("Es-tu sûr de vouloir annuler ton rendez-vous ?", async () => {
        const maResaString = localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY);
        if (!maResaString) return;
        
        const maResa = JSON.parse(maResaString);

        if (!maResa.secretKey) {
            showToast("Erreur de sécurité : Clé manquante.", "error");
            return;
        }

        const { error } = await annulerReservationAPI(maResa.id, maResa.secretKey);

        if (error) {
            console.error(error);
            showToast("Impossible d'annuler (Erreur serveur).", "error");
            return;
        }

        localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEY);
        fermerModalMyBooking();
        renderPlanning();
        showToast("Rendez-vous annulé.");
    });
}

/**
 * ============================================================
 * 7. INITIALISATION & NAVIGATION
 * ============================================================
 */

document.querySelectorAll(".contact-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".contact-btn").forEach(b => {
            b.classList.remove("bg-white", "shadow-sm", "text-zinc-900", "active");
            b.classList.add("text-zinc-500");
        });
        btn.classList.add("active", "bg-white", "shadow-sm", "text-zinc-900");
        btn.classList.remove("text-zinc-500");

        const type = btn.getAttribute("data-type");
        document.getElementById("contactType").value = type;
        const input = document.getElementById("contactValue");

        if (type === "tel") { 
            input.type = "tel"; 
            input.placeholder = "06 12 34 56 78"; 
        } else { 
            input.type = "text"; 
            input.placeholder = (type === "insta") ? "@ton_insta" : "@ton_snap"; 
        }
    });
});

const textElement = document.getElementById('typing-text');
const textToType = "Sélectionne un horaire disponible ci-dessous.";
let typeIndex = 0;

function startTyping() {
    const interval = setInterval(() => {
        if (typeIndex < textToType.length) { 
            textElement.innerHTML += textToType.charAt(typeIndex); 
            typeIndex++; 
        } else { 
            clearInterval(interval); 
        }
    }, 50);
}

window.addEventListener("DOMContentLoaded", () => {
    setTimeout(startTyping, 500);
    renderPlanning();
});