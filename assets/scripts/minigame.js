document.addEventListener("DOMContentLoaded", () => {
  const field = document.querySelector("#diveField");
  const diver = document.querySelector("#diver");
  const diverImage = diver?.querySelector("img");
  const bubbleLayer = document.querySelector("#diveBubbles");

  if (!field || !diver || !diverImage || !bubbleLayer) return;

  const heldDirections = new Set();
  const keyDirections = new Map([
    ["ArrowUp", "up"],
    ["w", "up"],
    ["ArrowDown", "down"],
    ["s", "down"],
    ["ArrowLeft", "left"],
    ["a", "left"],
    ["ArrowRight", "right"],
    ["d", "right"],
  ]);
  const position = { x: 50, y: 50 };
  let facing = "right";
  let lastFrame = 0;
  let lastFrameChange = 0;
  let spritesAvailable = true;

  function setFrame(frame) {
    if (!spritesAvailable) return;
    diverImage.src = `./assets/images/diver${frame + 1}.png`;
    diverImage.dataset.frame = String(frame);
  }

  diverImage.addEventListener("error", () => {
    spritesAvailable = false;
    diverImage.hidden = true;
  });
  diverImage.addEventListener("load", () => {
    diverImage.hidden = false;
  });

  function updateDiver() {
    diver.style.left = `${position.x}%`;
    diver.style.top = `${position.y}%`;
    diver.classList.toggle("faces-left", facing === "left");
  }

  function setDirection(direction, active) {
    if (active) heldDirections.add(direction);
    else heldDirections.delete(direction);
  }

  function swim(timestamp) {
    const delta = lastFrame ? Math.min((timestamp - lastFrame) / 1000, 0.05) : 0;
    lastFrame = timestamp;

    if (timestamp - lastFrameChange >= 220) {
      setFrame(Number(diverImage.dataset.frame) === 0 ? 1 : 0);
      lastFrameChange = timestamp;
    }

    let dx = 0;
    let dy = 0;

    if (heldDirections.has("left")) dx -= 1;
    if (heldDirections.has("right")) dx += 1;
    if (heldDirections.has("up")) dy -= 1;
    if (heldDirections.has("down")) dy += 1;

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const length = Math.hypot(dx, dy);
      position.x += (dx / length) * delta * 23;
      position.y += (dy / length) * delta * 26;
      position.x = Math.max(6, Math.min(94, position.x));
      position.y = Math.max(10, Math.min(90, position.y));
      if (dx !== 0) facing = dx < 0 ? "left" : "right";
    }

    updateDiver();
    requestAnimationFrame(swim);
  }

  document.addEventListener("keydown", (event) => {
    const direction = keyDirections.get(event.key) || keyDirections.get(event.key.toLowerCase());
    if (!direction) return;
    event.preventDefault();
    setDirection(direction, true);
  });

  document.addEventListener("keyup", (event) => {
    const direction = keyDirections.get(event.key) || keyDirections.get(event.key.toLowerCase());
    if (direction) setDirection(direction, false);
  });

  window.addEventListener("blur", () => heldDirections.clear());

  document.querySelectorAll("[data-direction]").forEach((button) => {
    const direction = button.dataset.direction;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      setDirection(direction, true);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
      button.addEventListener(type, () => setDirection(direction, false));
    });
  });

  for (let index = 0; index < 20; index += 1) {
    const bubble = document.createElement("i");
    bubble.className = "drifting-bubble";
    bubble.style.setProperty("--bubble-x", `${Math.random() * 100}%`);
    bubble.style.setProperty("--bubble-size", `${4 + Math.random() * 10}px`);
    bubble.style.setProperty("--bubble-duration", `${8 + Math.random() * 12}s`);
    bubble.style.setProperty("--bubble-delay", `${-Math.random() * 20}s`);
    bubble.style.setProperty("--bubble-drift", `${-35 + Math.random() * 70}px`);
    bubbleLayer.append(bubble);
  }

  updateDiver();
  requestAnimationFrame(swim);
});
