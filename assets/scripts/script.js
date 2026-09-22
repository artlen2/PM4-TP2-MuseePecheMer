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
