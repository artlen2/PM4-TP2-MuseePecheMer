document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const TPS = 0.05;
  const TVQ = 0.09975;
  const MOIS = [
    "JANVIER",
    "FÉVRIER",
    "MARS",
    "AVRIL",
    "MAI",
    "JUIN",
    "JUILLET",
    "AOÛT",
    "SEPTEMBRE",
    "OCTOBRE",
    "NOVEMBRE",
    "DÉCEMBRE",
  ];
  const PRIX = {
    adult: 12,
    student: 8,
    senior: 8,
    child: 5,
    under6: 0,
    family: 30,
  };
  const NOMS = {
    adult: "Adulte",
    student: "Étudiant",
    senior: "Aîné",
    child: "Enfant (6-12 ans)",
    under6: "Enfant (moins de 6 ans)",
    family: "Famille",
  };
  const sel = {
    date: null,
    time: null,
    tickets: {
      adult: 0,
      student: 0,
      senior: 0,
      child: 0,
      under6: 0,
      family: 0,
    },
    contact: {},
  };
  const blocs = ["calendar", "hour", "tickets", "contact", "confirmation"].map(
    (id) => document.getElementById(id),
  );
  const pSteps = $$(".progress-step");
  const pLines = $$(".progress-line");
  let step = 0,
    max = 0,
    done = false;

  const money = (n) => n.toFixed(2).replace(".", ",") + " $";
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const dateLabel = (d) =>
    d.toLocaleDateString("fr-CA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  function totaux() {
    const sub = Object.keys(PRIX).reduce(
      (t, k) => t + sel.tickets[k] * PRIX[k],
      0,
    );
    const tps = Math.round(sub * TPS * 100) / 100;
    const tvq = Math.round(sub * TVQ * 100) / 100;
    return { sub, tps, tvq, total: sub + tps + tvq };
  }
  const lignes = () =>
    Object.keys(PRIX)
      .filter((k) => sel.tickets[k] > 0)
      .map((k) => ({
        label: `${sel.tickets[k]} × ${NOMS[k]}`,
        prix: sel.tickets[k] * PRIX[k],
      }));
  const row = (l, p) => `<div><span>${l}</span><strong>${p}</strong></div>`;

  function majPanier() {
    const t = totaux();
    $("#cart-date").textContent = sel.date ? dateLabel(sel.date) : "À choisir";
    $("#cart-time").textContent = sel.time || "À choisir";
    const l = lignes();
    $("#cart-tickets").innerHTML = l.length
      ? l.map((x) => row(x.label, x.prix ? money(x.prix) : "Gratuit")).join("")
      : row("Aucun billet", "0,00 $");
    $("#cart-taxes").innerHTML = t.sub
      ? row("Sous-total", money(t.sub)) +
        row("TPS (5 %)", money(t.tps)) +
        row("TVQ (9,975 %)", money(t.tvq))
      : "";
    $("#cart-total").textContent = money(t.total);
  }

  /* calendrier : mois navigable, jours fermés et passés désactivés */
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  let vue = new Date(auj.getFullYear(), auj.getMonth(), 1);
  function ouvert(d) {
    if (d < auj) return false;
    const m = d.getMonth(),
      j = d.getDate(),
      w = d.getDay();
    if ((m === 11 && [24, 25, 31].includes(j)) || (m === 0 && j === 1))
      return false;
    return (m >= 5 && m <= 8) || (w !== 1 && w !== 2);
  }
  function calendrier() {
    $("#cal-title").textContent =
      `${MOIS[vue.getMonth()]} ${vue.getFullYear()}`;
    $("#prev").disabled = vue <= new Date(auj.getFullYear(), auj.getMonth(), 1);
    const nb = new Date(vue.getFullYear(), vue.getMonth() + 1, 0).getDate();
    let h = "<i></i>".repeat((vue.getDay() + 6) % 7);
    for (let n = 1; n <= nb; n++) {
      const d = new Date(vue.getFullYear(), vue.getMonth(), n);
      const on = sel.date && +sel.date === +d;
      h += `<button type="button" data-d="${n}" ${ouvert(d) ? "" : "disabled"} class="${on ? "selected" : ""}" aria-pressed="${!!on}">${n}</button>`;
    }
    $("#cal-days").innerHTML = h;
  }
  $("#prev").onclick = () => {
    vue = new Date(vue.getFullYear(), vue.getMonth() - 1, 1);
    calendrier();
  };
  $("#next").onclick = () => {
    vue = new Date(vue.getFullYear(), vue.getMonth() + 1, 1);
    calendrier();
  };
  $("#cal-days").onclick = (e) => {
    const b = e.target.closest("button[data-d]");
    if (!b) return;
    sel.date = new Date(vue.getFullYear(), vue.getMonth(), +b.dataset.d);
    calendrier();
    majPanier();
  };
  $$(".time-slots button").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".time-slots button").forEach((x) => {
        x.classList.remove("selected");
        x.setAttribute("aria-pressed", "false");
      });
      b.classList.add("selected");
      b.setAttribute("aria-pressed", "true");
      sel.time = b.textContent.trim();
      majPanier();
    }),
  );
  $$(".ticket-row").forEach((r) =>
    r.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        const k = r.dataset.ticket;
        sel.tickets[k] = Math.max(
          0,
          Math.min(
            20,
            sel.tickets[k] + (b.dataset.action === "increase" ? 1 : -1),
          ),
        );
        r.querySelector("span").textContent = sel.tickets[k];
        majPanier();
      }),
    ),
  );

  /* validation des coordonnées */
  function champs() {
    const v = (id) => $("#" + id).value.trim();
    const r = [
      ["prenom", v("prenom") ? "" : "Entrez votre prénom."],
      ["nom", v("nom") ? "" : "Entrez votre nom."],
      [
        "courriel",
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("courriel"))
          ? ""
          : "Entrez un courriel valide, par exemple nom@exemple.ca.",
      ],
      [
        "tel",
        !v("tel") || v("tel").replace(/\D/g, "").length >= 10
          ? ""
          : "Entrez un numéro à 10 chiffres ou laissez vide.",
      ],
    ];
    r.forEach(([id, m]) => {
      $("#m-" + id).textContent = m;
      $("#" + id).setAttribute("aria-invalid", m ? "true" : "false");
    });
    const bad = r.find((x) => x[1]);
    if (bad) {
      $("#" + bad[0]).focus();
      return "Corrigez les champs indiqués.";
    }
    sel.contact = {
      prenom: v("prenom"),
      nom: v("nom"),
      courriel: v("courriel"),
      tel: v("tel"),
    };
    return "";
  }
  function valider(i) {
    if (i === 0) return sel.date ? "" : "Choisissez une date disponible.";
    if (i === 1) return sel.time ? "" : "Choisissez une heure.";
    if (i === 2) return lignes().length ? "" : "Ajoutez au moins un billet.";
    if (i === 3) return champs();
    return "";
  }

  function recap() {
    const c = sel.contact,
      t = totaux();
    const dl = (a, b) => `<div><dt>${a}</dt><dd>${b}</dd></div>`;
    $("#recap").innerHTML =
      `<p class="recap-title">Vérifiez avant de confirmer</p><dl class="recap">${dl("Date", esc(dateLabel(sel.date)))}${dl("Heure", esc(sel.time))}${dl(
        "Billets",
        lignes()
          .map((x) => esc(x.label))
          .join("<br>"),
      )}${dl("Nom", esc(c.prenom + " " + c.nom))}${dl("Courriel", esc(c.courriel))}${c.tel ? dl("Téléphone", esc(c.tel)) : ""}${dl("Total", "<strong>" + money(t.total) + "</strong> (taxes incluses)")}</dl>`;
  }

  function aller(i) {
    step = i;
    max = Math.max(max, i);
    blocs.forEach((b, k) => (b.hidden = k !== i));
    pSteps.forEach((s, k) => {
      s.classList.toggle("active", k === i);
      s.classList.toggle("completed", k < i);
      s.disabled = done || k > max;
      s.querySelector("span").textContent =
        k < i ? "✓" : String(k + 1).padStart(2, "0");
    });
    pLines.forEach((l, k) => l.classList.toggle("completed", k < i));
    $(".cart-number").textContent = String(i + 1).padStart(2, "0");
    if (i === 4) recap();
  }
  function avancer() {
    const err = valider(step),
      box = blocs[step].querySelector(".step-error");
    box.textContent = err;
    if (!err) {
      aller(step + 1);
      $(".reservation-layout").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
  $$(".next").forEach((b) => b.addEventListener("click", avancer));
  $("#contact-form").addEventListener("submit", (e) => {
    e.preventDefault();
    avancer();
  });
  pSteps.forEach((s, k) =>
    s.addEventListener("click", () => {
      if (!done && k <= max) aller(k);
    }),
  );

  $("#confirm").addEventListener("click", () => {
    const ref = "MPM-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const c = sel.contact,
      t = totaux();
    done = true;
    pSteps.forEach((s) => {
      s.classList.remove("active");
      s.classList.add("completed");
      s.disabled = true;
      s.querySelector("span").textContent = "✓";
    });
    pLines.forEach((l) => l.classList.add("completed"));
    $(".cart-number").textContent = "✓";
    $(".cart-note").textContent =
      "Réservation confirmée. Conservez votre numéro.";
    blocs[4].innerHTML = `<div class="reservation-block-heading"><span>✓</span><h3>Réservation confirmée</h3></div>
      <article class="billet" tabindex="-1" id="billet"><p class="billet-kicker">Merci ${esc(c.prenom)}, à bientôt à Gaspé</p><p class="billet-ref" aria-label="Numéro de réservation">${ref}</p><p class="billet-sub">Présentez ce numéro à l'accueil du musée.</p>
      <dl class="recap"><div><dt>Date</dt><dd>${esc(dateLabel(sel.date))}</dd></div><div><dt>Heure</dt><dd>${esc(sel.time)}</dd></div><div><dt>Billets</dt><dd>${lignes()
        .map((x) => esc(x.label))
        .join(
          "<br>",
        )}</dd></div><div><dt>Total payé</dt><dd><strong>${money(t.total)}</strong><br><small>Sous-total ${money(t.sub)}, TPS ${money(t.tps)}, TVQ ${money(t.tvq)}</small></dd></div></dl>
      <p class="billet-note">Un récapitulatif sera envoyé à <strong>${esc(c.courriel)}</strong>. Adresse : Quai de Gaspé, ancien entrepôt maritime.</p></article>
      <div class="reservation-confirmation-actions"><a href="information.html" class="reservation-action-btn">Infos du musée</a><a href="index.html" class="reservation-action-btn">Retour à l'accueil</a></div>`;
    blocs[4].hidden = false;
    $("#billet").scrollIntoView({ behavior: "smooth", block: "center" });
    $("#billet").focus({ preventScroll: true });
  });

  calendrier();
  majPanier();
  aller(0);
});
