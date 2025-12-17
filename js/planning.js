// === 1. NOTIFICATION SYSTEM (FAST & SMOOTH) ===

// Type: 'success' (default) or 'error'
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const bgColor = type === 'error' ? 'bg-red-500' : 'bg-zinc-900';
    const icon = type === 'error' ? '⚠️' : '✅';
    
    toast.className = `
    ${bgColor} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 
    text-sm font-medium transform transition-all duration-300 pointer-events-auto
    animate-pop-in
    `;
    
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Custom Confirm Logic
let confirmCallback = null;
function showConfirm(message, onYes) {
    const modal = document.getElementById('custom-confirm');
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = onYes;
    modal.classList.remove('hidden');
}

function closeCustomConfirm() {
    document.getElementById('custom-confirm').classList.add('hidden');
    confirmCallback = null;
}

document.getElementById('confirm-btn-yes').addEventListener('click', () => {
    if(confirmCallback) confirmCallback();
    closeCustomConfirm();
});


// === 2. SUPABASE & LOGIC ===

const supabaseClient = window.supabase.createClient(
  "https://bmagjduzjqtuzaudbpwt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYWdqZHV6anF0dXphdWRicHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTYzMjUsImV4cCI6MjA4MTU3MjMyNX0.0DZKw2BpHm9qSIv6RxwVEPro6TYiPO9sz4_Rtjqi96M"
);

let reservations = new Set();
let creneauxDispos = {};
const LOCAL_STORAGE_KEY = 'bencoiff_ma_reservation';

async function fetchCreneaux() {
const { data, error } = await supabaseClient.from('creneaux').select('slot, lieu, postal');
if (error) { console.error(error); return; }

creneauxDispos = {};
data.forEach(c => {
    const slotDate = new Date(c.slot);
    const date = slotDate.toISOString().slice(0, 10);
    const heure = slotDate.toTimeString().slice(0, 5);
    
    if (!creneauxDispos[date]) creneauxDispos[date] = {};
    const groupeKey = `${c.lieu || 'Lieu non spécifié'} | ${c.postal || 'Code postal non spécifié'}`;
    
    if (!creneauxDispos[date][groupeKey]) creneauxDispos[date][groupeKey] = [];
    if (!creneauxDispos[date][groupeKey].includes(heure)) {
    creneauxDispos[date][groupeKey].push(heure);
    }
});
}

async function fetchReservations() {
const { data, error } = await supabaseClient.from("reservations").select("slot");
if (error) { console.error(error); return; }
reservations = new Set();
data.forEach(r => {
    const slotDate = new Date(r.slot);
    const date = slotDate.toISOString().slice(0, 10);
    const heure = slotDate.toTimeString().slice(0, 5);
    reservations.add(`${date} ${heure}`);
});
}

async function renderPlanning() {
await fetchCreneaux();
await fetchReservations();

const planning = document.getElementById("planning");
planning.innerHTML = "";

const dates = Object.keys(creneauxDispos).sort();
const now = new Date();
const maResaString = localStorage.getItem(LOCAL_STORAGE_KEY);
const maResa = maResaString ? JSON.parse(maResaString) : null;

if (dates.length === 0) {
    planning.innerHTML = `<div class="p-8 border border-zinc-200 rounded-2xl text-zinc-400 bg-white text-center">Aucun créneau disponible.</div>`;
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

    const groupes = creneauxDispos[date];
    for (const groupeKey in groupes) {
    const [lieu, postal] = groupeKey.split(" | ");
    const groupDiv = document.createElement("div");
    groupDiv.className = `mb-6 last:mb-0`;
    groupDiv.innerHTML = `
        <h3 class="text-xs font-bold uppercase tracking-widest mb-3 text-violet-500 flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        ${lieu} <span class="text-zinc-400 font-normal normal-case">(${postal})</span>
        </h3>
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"></div>
    `;
    section.appendChild(groupDiv);

    const slotsDiv = groupDiv.querySelector("div.grid");
    groupes[groupeKey].sort().forEach(heure => {
        const slotDateTime = new Date(`${date}T${heure}:00`);
        if (slotDateTime < now) return;

        const key = `${date} ${heure}`;
        const btn = document.createElement("button");
        const isMyBooking = maResa && maResa.slotKey === key;
        const isTaken = reservations.has(key);

        if (isMyBooking) {
        btn.innerHTML = `<span>${heure}</span> <span class="block text-[8px] uppercase mt-0.5">MOI</span>`;
        btn.className = `bg-violet-100 text-violet-700 border-2 border-violet-500 px-2 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-violet-200 transition-colors`;
        btn.addEventListener("click", () => ouvrirModalMyBooking(maResa));
        } else if (isTaken) {
        btn.textContent = heure;
        btn.className = `bg-zinc-100 text-zinc-300 px-2 py-2 rounded-lg text-sm font-medium cursor-not-allowed border border-zinc-100`;
        } else {
        btn.textContent = heure;
        btn.className = `relative inline-flex items-center justify-center bg-zinc-900 text-white px-2 py-2 rounded-lg text-sm font-bold tracking-wide shadow-md transition-all duration-200 hover:bg-violet-500 hover:scale-105 hover:shadow-lg`;
        btn.addEventListener("click", () => ouvrirFormulaire(key));
        }
        slotsDiv.appendChild(btn);
    });
    }
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

async function annulerReservation() {
    showConfirm("Es-tu sûr de vouloir annuler ton rendez-vous ?", async () => {
        
        const maResaString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!maResaString) return;
        const maResa = JSON.parse(maResaString);

        const { error } = await supabaseClient.from('reservations').delete().eq('id', maResa.id);

        if (error) {
            showToast("Erreur lors de l'annulation.", "error");
            return;
        }

        localStorage.removeItem(LOCAL_STORAGE_KEY);
        fermerModalMyBooking();
        renderPlanning();
        showToast("Rendez-vous annulé.");
    });
}

function formatDateBeau(slot) {
const date = new Date(slot.replace(" ", "T"));
if (isNaN(date)) return slot;
const options = { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" };
const formatted = new Intl.DateTimeFormat("fr-FR", options).format(date);
return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

async function ouvrirFormulaire(slot) {
if(localStorage.getItem(LOCAL_STORAGE_KEY)) {
    showToast("Tu as déjà un rendez-vous ! Annule l'ancien d'abord.", "error");
    return;
}

const form = document.getElementById("reservationForm");
form.dataset.slot = slot;
const slotIso = slot.replace(" ", "T");
const { data: creneauData } = await supabaseClient.from("creneaux").select("lieu, postal").eq("slot", slotIso).single();
const locText = creneauData ? `<span class="block mt-1 text-xs text-zinc-400 font-normal">📍 ${creneauData.lieu} (${creneauData.postal})</span>` : "";

document.getElementById("selectedSlotFormatted").innerHTML = `📅 ${formatDateBeau(slot)} ${locText}`;
form.classList.remove("hidden");
}

function fermerFormulaire() {
const form = document.getElementById("reservationForm");
form.classList.add("hidden");
document.getElementById("prenom").value = "";
document.getElementById("nom").value = "";
document.getElementById("contactValue").value = "";
document.getElementById("confirmation").textContent = "";
}

// Contact Type Logic (Buttons)
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
    
    if (type === "tel") { input.type = "tel"; input.placeholder = "06 12 34 56 78"; }
    else { input.type = "text"; input.placeholder = (type === "insta") ? "@ton_insta" : "@ton_snap"; }
});
});

async function validerReservationBridge() {
    const visualInput = document.getElementById("contactValue");
    document.getElementById("contact").value = visualInput.value;
    await validerReservation();
}

async function validerReservation() {
const form = document.getElementById("reservationForm");
const slot = form.dataset.slot;
const [dateStr, heureStr] = slot.split(" ");
const prenom = document.getElementById("prenom").value.trim();
const nom = document.getElementById("nom").value.trim();
const contact = document.getElementById("contact").value.trim();

if (!prenom || !nom || !contact) {
    showToast("Merci de remplir tous les champs.", "error");
    return;
}

if (reservations.has(slot)) {
    showToast("Ce créneau est déjà réservé.", "error");
    return;
}

try {
    const { data: creneauData } = await supabaseClient.from("creneaux").select("lieu, postal").eq("slot", `${dateStr}T${heureStr}`).single();
    
    const { data, error } = await supabaseClient
    .from("reservations")
    .insert([{
        slot: `${dateStr}T${heureStr}:00`,
        prenom, nom, contact, 
        lieu: creneauData?.lieu || "Lieu inconnu", 
        postal: creneauData?.postal || ""
    }])
    .select();

    if (error) throw error;

    const localData = { id: data[0].id, slotKey: slot, prenom: prenom, nom: nom };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localData));
    reservations.add(slot);
    
    fermerFormulaire();
    renderPlanning();
    
    showToast(`Réservé pour ${prenom} !`);
    
} catch (err) {
    console.error(err);
    showToast("Erreur lors de la réservation.", "error");
}
}

// Init
const textElement = document.getElementById('typing-text');
const textToType = "Sélectionne un horaire disponible ci-dessous.";
let index = 0;
function startTyping() {
    const interval = setInterval(() => {
        if (index < textToType.length) { textElement.innerHTML += textToType.charAt(index); index++; } 
        else { clearInterval(interval); }
    }, 50);
}

window.addEventListener("DOMContentLoaded", () => {
    setTimeout(startTyping, 500);
    renderPlanning();
    
    // Menu Logic
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
});