document.addEventListener("DOMContentLoaded", () => {
  const titles = document.querySelectorAll("h2");
  const children = document.querySelectorAll(".page-main .enfant");

  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 0.2,
    },
  );

  titles.forEach((title) => observer.observe(title));

  const childObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("visible", entry.isIntersecting);
      });
    },
    {
      root: null,
      rootMargin: "0px",
      threshold: 0.15,
    },
  );

  children.forEach((child) => childObserver.observe(child));

  // Appareils tactiles et mouvement réduit : pas de bulles ni de curseur animé
  if (
    window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)")
      .matches
  )
    return;

  const fish = document.createElement("div");
  let lastMoveTime = 0;

  document.body.style.cursor = "auto";
  fish.innerHTML = `<img id="fish-cursor" src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Cpath fill=%27%23f2e676%27 d=%27M3 16c5-8 13-9 19-3l7-5v16l-7-5c-6 6-14 5-19-3z%27/%3E%3Ccircle cx=%277.5%27 cy=%2715%27 r=%271.4%27 fill=%27%23021a34%27/%3E%3C/svg%3E" alt="" style="position: fixed; pointer-events: none; width: 32px; height: 32px; transform: translate(-50%, -50%); z-index: 9999;">`;
  fish.style.position = "fixed";
  fish.style.pointerEvents = "none";
  fish.style.fontSize = "26px";
  fish.style.transform = "translate(-50%, -50%)";
  fish.style.zIndex = "9999";
  fish.style.userSelect = "none";
  document.body.appendChild(fish);

  document.addEventListener("mousemove", (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    fish.style.left = `${mouseX}px`;
    fish.style.top = `${mouseY}px`;

    const now = Date.now();
    if (now - lastMoveTime > 150) {
      createRipple(mouseX, mouseY);
      lastMoveTime = now;
    }
  });

  document.addEventListener("click", (event) => {
    createRipple(event.clientX, event.clientY);
  });

  function createRipple(x, y) {
    const ripple = document.createElement("div");
    ripple.style.position = "fixed";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.pointerEvents = "none";
    ripple.style.border = "2px solid rgba(255, 255, 255, 0.7)";
    ripple.style.borderRadius = "50%";
    ripple.style.transform = "translate(-50%, -50%)";
    ripple.style.zIndex = "9997";
    document.body.appendChild(ripple);

    ripple
      .animate(
        [
          { width: "0px", height: "0px", opacity: 1 },
          {
            width: "90px",
            height: "90px",
            opacity: 0,
            borderColor: "rgba(255, 255, 255, 0)",
          },
        ],
        { duration: 700, easing: "ease-out", fill: "forwards" },
      )
      .finished.then(() => ripple.remove());
  }
});

// MOBILE DRAWER
const drawer = document.getElementById("drawer");
const burger = document.getElementById("burger");

function toggleDrawer() {
  if (!drawer || !burger) return;

  const isOpen = drawer.classList.toggle("open");
  burger.classList.toggle("open", isOpen);
  burger.setAttribute("aria-expanded", String(isOpen));
  burger.setAttribute(
    "aria-label",
    isOpen ? "Fermer le menu" : "Ouvrir le menu",
  );
  document.body.style.overflow = isOpen ? "hidden" : "";
}

function closeDrawer() {
  if (!drawer || !burger) return;

  drawer.classList.remove("open");
  burger.classList.remove("open");
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-label", "Ouvrir le menu");
  document.body.style.overflow = "";
}

if (burger) {
  burger.addEventListener("click", toggleDrawer);
}

if (drawer) {
  drawer.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && drawer?.classList.contains("open")) {
    closeDrawer();
  }
});

// Lien de la page courante
document.querySelectorAll(".nav-link").forEach((a) => {
  const page = location.pathname.split("/").pop() || "index.html";
  if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page");
});

// Jauge de profondeur : la page descend dans le golfe (0 à 500 m)
(() => {
  const MAX = 500;
  const g = document.createElement("div");
  g.className = "gauge";
  g.setAttribute("aria-hidden", "true");
  g.innerHTML =
    '<i class="gauge-line"></i><i class="gauge-dot"></i><p class="gauge-txt"><b></b><span></span></p>';
  document.body.appendChild(g);
  const b = g.querySelector("b"),
    z = g.querySelector("span");
  let busy = false;
  const range = () =>
    Math.max(1, document.documentElement.scrollHeight - innerHeight);
  function maj() {
    busy = false;
    const p = Math.min(1, Math.max(0, scrollY / range()));
    const m = Math.round(p * MAX);
    b.textContent = m + " m";
    z.textContent =
      m < 3 ? "Surface" : m < 200 ? "Zone lumineuse" : "Zone crépusculaire";
    g.style.setProperty("--p", p);
  }
  function reperes() {
    document.querySelectorAll(".contour").forEach((c) => {
      const y = c.getBoundingClientRect().top + scrollY;
      c.textContent = Math.round(Math.min(1, y / range()) * MAX) + " m";
    });
  }
  addEventListener(
    "scroll",
    () => {
      if (!busy) {
        busy = true;
        requestAnimationFrame(maj);
      }
    },
    { passive: true },
  );
  addEventListener("resize", () => {
    maj();
    reperes();
  });
  addEventListener("load", () => {
    maj();
    reperes();
  });
  maj();
  reperes();
})();
