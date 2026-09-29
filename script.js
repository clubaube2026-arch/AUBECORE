const AUBE_CONFIG = {
  brand: {
    name: "AUBECORE",
    club: "AUBE",
    tagline: "A door. A room. Strangers you haven't met yet."
  },

  event: {
    id: "evt_001",
    name: "Halloween",
    date: "Oct 24, 2026",
    time: "5pm - 11pm",
    location: "ECR",
    shortInfo: `“ONE MORE DRINK”
becomes
“WHAT JUST HAPPENED?!” 💀

🩸 DRESS SCARY.
🎃 BRING YOUR SQUAD.
🖤 MAKE IT A NIGHT TO REMEMBER.

THIS HALLOWEEN, NOBODY LEAVES INNOCENT. 👹`,
    poster: "images/poster.jpg"
  },

  tickets: {
    currency: "₹",
    pricePerTicket: 699,
    maxPerCustomer: 2
  },

  members: {
    count: 40,
    endpoint: ""
  },

  // First entry = large featured review, second = the one side review shown by
  // default. The rest appear when the visitor taps the "More from the room" button.
  reviews: [
    {
      name: "Ananya R.",
      rating: 5,
      text: "Walked in not knowing a soul, left with a full group chat. AUBE gets the vibe exactly right."
    },
    {
      name: "Karthik V.",
      rating: 5,
      text: "No dress code stress, no awkward small talk — just good music and better company."
    },
    {
      name: "Meera S.",
      rating: 4,
      text: "Been to a few AUBE nights now. Every single one has been worth the drive down ECR."
    },
    {
      name: "Rohit K.",
      rating: 5,
      text: "The lineup changes every time but the energy never drops."
    },
    {
      name: "Divya N.",
      rating: 4,
      text: "Best place to bring friends visiting Chennai — they always ask when the next one is."
    },
    {
      name: "Aravind S.",
      rating: 5,
      text: "Chill start, wild finish. Exactly what a Friday should feel like."
    }
  ],

  previousEvents: [],

  organizer: {
    phone: "98845 56781",
    instagram: "club_aube",
    email: "clubaube2026@gmail.com"
  },

  api: {
    register: "https://script.google.com/macros/s/AKfycbw9_PihTa4vQZarqB3tmDybTy-9EUZsbQ6HM1ZjPmKsR0SI2LD7jWSWQ58xILEv4ZIB/exec",
    ticket: "https://script.google.com/macros/s/AKfycbx2_Q6WbumuEGgiPCycPSIrxKYEdGJxtUkuy3Wa3OuwZuH7xtHkl3DwlOwFHgb5Q3yY/exec"
  }
};

window.AUBE_CONFIG = AUBE_CONFIG;

/**
 * AUBECORE — script.js
 * Static frontend. Registrations go to the Google Apps Script endpoint in
 * AUBE_CONFIG.api.register. Tickets are handed out via DM (WhatsApp / Instagram).
 */

(function(){
  "use strict";

  const CFG = window.AUBE_CONFIG;
  const WA_NUMBER = "919884556781"; // country code + number

  /* ---------------------------------------------------------------
     BACKEND ADAPTER
  --------------------------------------------------------------- */
  const Backend = {
    async register(payload, endpoint = CFG.api.register){
      try{
        const res = await fetch(endpoint, {
          method:"POST",
          headers:{ "Content-Type":"text/plain;charset=utf-8" },
          body:JSON.stringify(payload)
        });
        const data = await res.json();
        if(!data.ok) throw new Error(data.error || "Registration failed");
        return data;
      }catch(e){
        console.error("[AUBECORE] Registration failed:", e);
        return { ok:false, error:e.message };
      }
    },

    async memberCount(){
      try{
        const res = await fetch(CFG.members.endpoint);
        if(!res.ok) throw new Error("no live endpoint");
        const data = await res.json();
        return data.count;
      }catch(e){
        return CFG.members.count;
      }
    }
  };

  /* ---------------------------------------------------------------
     HYDRATE CONFIG INTO THE DOM
  --------------------------------------------------------------- */
  function hydrateConfig(){
    const e = CFG.event;
    setText("posterEventName", e.name);
    setText("posterShortInfo", e.shortInfo);
    setText("posterDate", e.date);
    setText("posterTime", e.time);
    setText("posterLocation", e.location);
    setText("smallPosterName", e.name);
    setText("smallPosterDate", e.date);

    if(e.poster && !e.poster.startsWith("[")){
      const mainFrame = document.getElementById("mainPosterFrame");
      const smallFrame = document.getElementById("smallPosterFrame");
      if(mainFrame) mainFrame.innerHTML = `<img src="${e.poster}" alt="${escapeHtml(e.name)}">`;
      if(smallFrame) smallFrame.innerHTML = `<img src="${e.poster}" alt="${escapeHtml(e.name)}">`;
    }

    setText("smallMemberMsg", CFG.members.count + " strangers");

    // contact
    const org = CFG.organizer;
    setText("contactPhoneVal", org.phone);
    setText("contactInstaVal", org.instagram);
    setText("contactEmailVal", org.email);
    setHref("contactPhone", `https://wa.me/${WA_NUMBER}`);
    setHref("contactInstagram", `https://instagram.com/${org.instagram.replace("@","")}`);
    setHref("contactEmail", `mailto:${org.email}`);
    setHref("finalInstagram", `https://instagram.com/${org.instagram.replace("@","")}`);
    setHref("finalEmail", `mailto:${org.email}`);

    renderReviews();

    // gallery + events list (only runs if these sections exist in the markup)
    const gallery = document.getElementById("galleryGrid");
    const list = document.getElementById("eventsList");
    if(gallery && list){
      CFG.previousEvents.forEach(ev=>{
        const row = document.createElement("div");
        row.className = "event-row";
        row.innerHTML = `<h4>${escapeHtml(ev.name)}</h4><span>${escapeHtml(ev.date)}</span>`;
        list.appendChild(row);

        ev.photos.forEach(src=>{
          const item = document.createElement("div");
          item.className = "gallery-item";
          if(src && !src.startsWith("[")){
            item.innerHTML = `<img src="${src}" alt="${escapeHtml(ev.name)}"><div class="cap">${escapeHtml(ev.name)}</div>`;
            item.addEventListener("click", ()=>openLightbox(src));
          }else{
            item.innerHTML = `<div class="gallery-placeholder">${escapeHtml(src)}<br><small>${escapeHtml(ev.name)}</small></div>`;
          }
          gallery.appendChild(item);
        });
      });
    }

    updatePriceUI();
  }

  function reviewInnerHtml(r){
    const rating = Math.max(0, Math.min(5, Number(r.rating) || 0));
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
    return `
      <span class="stars">${stars}</span>
      <p>${escapeHtml(r.text)}</p>
      <span class="reviewer">${escapeHtml(r.name)}</span>
    `;
  }

  function renderReviews(){
    const featured = document.getElementById("reviewFeatured");
    const side = document.getElementById("reviewsSide");
    if(!featured || !side) return;

    const list = CFG.reviews || [];
    if(!list.length) return;

    const [first, ...rest] = list;
    featured.innerHTML = reviewInnerHtml(first);

    side.innerHTML = "";
    rest.forEach((r, i)=>{
      const card = document.createElement("div");
      card.className = "review-card glass" + (i >= 1 ? " extra" : ""); // only 1 side card shows by default
      card.innerHTML = reviewInnerHtml(r);
      side.appendChild(card);
    });

    const toggle = document.getElementById("reviewsToggle");
    if(toggle){
      if(rest.length <= 1){ toggle.parentElement.style.display = "none"; return; }
      toggle.onclick = ()=>{
        const open = side.classList.toggle("expanded");
        toggle.textContent = open ? "Show less ↑" : "More from the room ↓";
      };
    }
  }

  function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = val; }
  function setHref(id, val){
    const el = document.getElementById(id);
    if(!el) return;
    el.setAttribute("href", val);
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  /* ---------------------------------------------------------------
     SCREEN FLOW: entry -> (first-time | returning)
  --------------------------------------------------------------- */
  const screenEntry = document.getElementById("screen-entry");
  const mainSite = document.getElementById("main-site");
  const nav = document.getElementById("site-nav");

  const entryBrandText = document.getElementById("entryBrandText");
  if(entryBrandText){
    entryBrandText.addEventListener("click", ()=> popEl(entryBrandText));
  }

  document.getElementById("choiceFirstTime").addEventListener("click", ()=> enterMainSite({ jumpToTickets:false }));
  document.getElementById("choiceReturning").addEventListener("click", ()=> enterMainSite({ jumpToTickets:true }));

  function enterMainSite({ jumpToTickets }){
    screenEntry.classList.add("hidden");
    setTimeout(()=>{
      mainSite.classList.add("visible");
      nav.classList.add("visible");
      if(jumpToTickets){
        document.getElementById("tickets").scrollIntoView({ behavior:"smooth" });
      }
      initReveals();
      animateCounter();
    }, 350);
  }

  const spotSeatBtnEntry = document.getElementById("spotSeatBtnEntry");
  if(spotSeatBtnEntry){
    spotSeatBtnEntry.addEventListener("click", ()=>{
      enterMainSite({ jumpToTickets:false });
      setTimeout(()=> openModal("modalRegister"), 500);
    });
  }

  const entryToast = document.getElementById("entryToast");
  const entryToastClose = document.getElementById("entryToastClose");
  if(entryToastClose && entryToast){
    entryToastClose.addEventListener("click", ()=> entryToast.classList.add("hidden"));
  }

  const spotSeatBtnFinal = document.getElementById("spotSeatBtnFinal");
  if(spotSeatBtnFinal){
    spotSeatBtnFinal.addEventListener("click", ()=> openModal("modalRegister"));
  }

  /* mobile nav */
  document.getElementById("navToggle").addEventListener("click", ()=>{
    document.getElementById("navLinks").classList.toggle("open");
  });
  document.querySelectorAll(".nav-link").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.getElementById("navLinks").classList.remove("open");
      const target = document.getElementById(btn.dataset.target);
      if(target) target.scrollIntoView({ behavior:"smooth" });
    });
  });
  document.getElementById("navBuyBtn").addEventListener("click", ()=> openModal("modalTickets"));

  /* ---------------------------------------------------------------
     SCROLL REVEAL
  --------------------------------------------------------------- */
  function initReveals(){
    const items = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold:0.15 });
    items.forEach(i=>io.observe(i));
  }

  /* ---------------------------------------------------------------
     MEMBER COUNTER (only runs if #counter-section exists)
  --------------------------------------------------------------- */
  let counterAnimated = false;
  async function animateCounter(){
    const section = document.getElementById("counter-section");
    const el = document.getElementById("counterNumber");
    if(!section || !el) return;
    const target = await Backend.memberCount();
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting && !counterAnimated){
          counterAnimated = true;
          runCountUp(el, target, 1800);
          io.disconnect();
        }
      });
    }, { threshold:0.4 });
    io.observe(section);
  }
  function runCountUp(el, target, duration){
    const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now-start)/duration);
      const eased = 1 - Math.pow(1-p, 3);
      el.textContent = Math.floor(eased*target);
      if(p<1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------
     LIGHTBOX
  --------------------------------------------------------------- */
  const lightbox = document.getElementById("lightbox");
  function openLightbox(src){
    document.getElementById("lightboxImg").src = src;
    lightbox.classList.add("open");
  }
  document.getElementById("lightboxClose").addEventListener("click", ()=> lightbox.classList.remove("open"));
  lightbox.addEventListener("click", (e)=>{ if(e.target===lightbox) lightbox.classList.remove("open"); });

  /* ---------------------------------------------------------------
     TAP FEEDBACK
  --------------------------------------------------------------- */
  function popEl(el){
    if(!el) return;
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
  }

  document.querySelectorAll(".poster").forEach(posterEl=>{
    posterEl.addEventListener("click", ()=>{
      popEl(posterEl);
      const src = CFG.event.poster;
      if(src && !src.startsWith("[")) openLightbox(src);
    });
  });

  document.querySelectorAll(".contact-card").forEach(card=>{
    card.addEventListener("click", ()=> popEl(card));
  });

  /* ---------------------------------------------------------------
     MODAL HELPERS
  --------------------------------------------------------------- */
  function openModal(id){ document.getElementById(id).classList.add("open"); }
  function closeModal(id){ document.getElementById(id).classList.remove("open"); }
  document.querySelectorAll("[data-close-modal]").forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      const overlay = e.target.closest(".modal-overlay");
      if(overlay) overlay.classList.remove("open");
    });
  });
  document.querySelectorAll(".modal-overlay").forEach(ov=>{
    ov.addEventListener("click", (e)=>{ if(e.target===ov) ov.classList.remove("open"); });
  });

  document.getElementById("buyTicketsBtn").addEventListener("click", ()=> openModal("modalTickets"));

  /* ---------------------------------------------------------------
     VALIDATION HELPERS
  --------------------------------------------------------------- */
  const NAME_RE = /^[a-zA-Z][a-zA-Z\s.'-]{1,59}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^[6-9]\d{9}$/;

  function validateField({ value, type, errEl, inputEl }){
    let msg = "";
    const v = (value || "").trim();
    if(!v){ msg = "This field is required."; }
    else if(type==="name" && !NAME_RE.test(v)) msg = "Enter a valid full name.";
    else if(type==="email" && !EMAIL_RE.test(v)) msg = "Enter a valid email address.";
    else if(type==="phone" && !PHONE_RE.test(v.replace(/\D/g,""))) msg = "Enter a valid 10-digit phone number.";
    else if(type==="guests"){
      const n = Number(v);
      if(!Number.isInteger(n) || n <= 0) msg = "Enter a whole number greater than 0.";
    }
    errEl.textContent = msg;
    inputEl.classList.toggle("invalid", !!msg);
    return !msg;
  }

  function setLoading(btn, isLoading, label){
    btn.disabled = isLoading;
    btn.innerHTML = isLoading ? `<span class="spinner"></span> Processing…` : label;
  }

  /* ---------------------------------------------------------------
     REGISTRATION FORM (Spot Your Seat)
  --------------------------------------------------------------- */
  const registerForm = document.getElementById("registerForm");
  registerForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const nameEl = document.getElementById("regName");
    const emailEl = document.getElementById("regEmail");
    const phoneEl = document.getElementById("regPhone");
    const guestsEl = document.getElementById("regGuests");

    const okName = validateField({ value:nameEl.value, type:"name", errEl:document.getElementById("errName"), inputEl:nameEl });
    const okEmail = validateField({ value:emailEl.value, type:"email", errEl:document.getElementById("errEmail"), inputEl:emailEl });
    const okPhone = validateField({ value:phoneEl.value, type:"phone", errEl:document.getElementById("errPhone"), inputEl:phoneEl });
    const okGuests = validateField({ value:guestsEl.value, type:"guests", errEl:document.getElementById("errGuests"), inputEl:guestsEl });

    if(!(okName && okEmail && okPhone && okGuests)) return;

    const btn = document.getElementById("registerSubmitBtn");
    setLoading(btn, true, "Confirm Registration");
    const result = await Backend.register({
      name:nameEl.value.trim(), email:emailEl.value.trim(),
      phone:phoneEl.value.trim(), guests:Number(guestsEl.value),
      eventId: CFG.event.id
    });
    setLoading(btn, false, "Confirm Registration");

    if(result.ok){
      closeModal("modalRegister");
      registerForm.reset();
      openModal("modalRegisterConfirmed");
      burstConfetti();
    }else{
      alert(result.error || "Something went wrong. Please try again.");
    }
  });

  /* ---------------------------------------------------------------
     JOIN THE CIRCLE (optional — needs a trigger button with id joinCircleBtn)
  --------------------------------------------------------------- */
  const joinCircleBtn = document.getElementById("joinCircleBtn");
  const joinCircleForm = document.getElementById("joinCircleForm");

  if(joinCircleBtn){
    joinCircleBtn.addEventListener("click", ()=> openModal("modalJoinCircle"));
  }

  if(joinCircleForm){
    joinCircleForm.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const nameEl = document.getElementById("joinName");
      const emailEl = document.getElementById("joinEmail");
      const phoneEl = document.getElementById("joinPhone");

      const okName = validateField({ value:nameEl.value, type:"name", errEl:document.getElementById("joinErrName"), inputEl:nameEl });
      const okEmail = validateField({ value:emailEl.value, type:"email", errEl:document.getElementById("joinErrEmail"), inputEl:emailEl });
      const okPhone = validateField({ value:phoneEl.value, type:"phone", errEl:document.getElementById("joinErrPhone"), inputEl:phoneEl });

      if(!(okName && okEmail && okPhone)) return;

      const btn = document.getElementById("joinCircleSubmitBtn");
      setLoading(btn, true, "Join The Circle");
      const result = await Backend.register({
        name:nameEl.value.trim(), email:emailEl.value.trim(),
        phone:phoneEl.value.trim(), guests:1,
        eventId:"join_circle"
      });
      setLoading(btn, false, "Join The Circle");

      if(result.ok){
        closeModal("modalJoinCircle");
        joinCircleForm.reset();
        openModal("modalJoinConfirmed");
        burstConfetti();
      }
    });
  }

  /* ---------------------------------------------------------------
     TICKET FLOW: quantity -> details -> "DM for tickets"
  --------------------------------------------------------------- */
  let selectedQty = 0;

  document.querySelectorAll(".qty-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const qty = Number(btn.dataset.qty);
      if(qty > CFG.tickets.maxPerCustomer) return;
      selectedQty = qty;
      document.querySelectorAll(".qty-btn").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      updatePriceUI();
      document.getElementById("proceedToPaymentBtn").disabled = false;
    });
  });

  function money(n){ return `${CFG.tickets.currency}${n.toLocaleString("en-IN")}`; }
  function updatePriceUI(){
    const each = CFG.tickets.pricePerTicket;
    document.getElementById("priceEach").textContent = money(each);
    document.getElementById("priceQty").textContent = selectedQty || "—";
    document.getElementById("priceTotal").textContent = selectedQty ? money(each*selectedQty) : "—";
  }

  document.getElementById("proceedToPaymentBtn").addEventListener("click", ()=>{
    if(!selectedQty || selectedQty > CFG.tickets.maxPerCustomer) return;
    const total = selectedQty * CFG.tickets.pricePerTicket;
    document.getElementById("payQtyLabel").textContent = `${selectedQty} ticket${selectedQty>1?"s":""} × ${money(CFG.tickets.pricePerTicket)}`;
    document.getElementById("payQtyPrice").textContent = money(total);
    document.getElementById("payTotal").textContent = money(total);
    closeModal("modalTickets");
    openModal("modalPayment");
  });

  const ticketRegForm = document.getElementById("ticketRegForm");
  ticketRegForm.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const nameEl = document.getElementById("tName");
    const emailEl = document.getElementById("tEmail");
    const phoneEl = document.getElementById("tPhone");

    const okName  = validateField({ value:nameEl.value,  type:"name",  errEl:document.getElementById("tErrName"),  inputEl:nameEl });
    const okEmail = validateField({ value:emailEl.value, type:"email", errEl:document.getElementById("tErrEmail"), inputEl:emailEl });
    const okPhone = validateField({ value:phoneEl.value, type:"phone", errEl:document.getElementById("tErrPhone"), inputEl:phoneEl });
    if(!(okName && okEmail && okPhone)) return;

    const btn = document.getElementById("confirmPaymentBtn");
    setLoading(btn, true, "Register");

    const total = selectedQty * CFG.tickets.pricePerTicket;
    const name = nameEl.value.trim();

    const result = await Backend.register({
      name,
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      guests: selectedQty,
      quantity: selectedQty,
      amount: total,
      eventId: CFG.event.id + "_ticket"
    }, CFG.api.ticket);   // ticket form -> ticket Google Sheet

    setLoading(btn, false, "Register");

    if(!result.ok){
      alert(result.error || "Something went wrong. Please try again.");
      return;
    }

    // pre-filled WhatsApp message
    const msg = `Hi AUBE! I'm ${name}. I registered for ${selectedQty} ticket${selectedQty>1?"s":""} (${money(total)}) for ${CFG.event.name}.`;
    document.getElementById("dmWhatsApp").href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

    closeModal("modalPayment");
    ticketRegForm.reset();
    openModal("modalDM");
    burstConfetti();

    // reset selection for next time
    selectedQty = 0;
    document.querySelectorAll(".qty-btn").forEach(b=>b.classList.remove("selected"));
    document.getElementById("proceedToPaymentBtn").disabled = true;
    updatePriceUI();
  });

  /* ---------------------------------------------------------------
     CONFETTI
  --------------------------------------------------------------- */
  function burstConfetti(){
    if(typeof confetti !== "function") return;
    const colors = ["#eef1f3", "#aeb5bc", "#a72c3a", "#f4f6f8"];
    confetti({ particleCount: 90, spread: 70, origin:{ y:0.6 }, colors, scalar:0.9 });
    setTimeout(()=> confetti({ particleCount: 50, spread: 100, origin:{ y:0.5 }, colors, scalar:0.7 }), 250);
  }

  /* ---------------------------------------------------------------
     INIT
  --------------------------------------------------------------- */
  hydrateConfig();

})();
