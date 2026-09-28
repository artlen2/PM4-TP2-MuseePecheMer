document.addEventListener("DOMContentLoaded", () => {
  const field = document.querySelector("#diveField");
  const diver = document.querySelector("#diver");
  const diverImage = diver?.querySelector("img");
  const bubbleLayer = document.querySelector("#diveBubbles");
  const photoFrame = document.querySelector("#photoFrame");
  const photoFlash = document.querySelector("#photoFlash");
  const photoModal = document.querySelector("#photoModal");
  const photoTitle = document.querySelector("#photoTitle");
  const photoImage = document.querySelector("#photoImage");
  const photoDescription = document.querySelector("#photoDescription");

  if (!field || !diver || !diverImage || !bubbleLayer || !photoFrame || !photoFlash || !photoModal) return;

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
  const roamers = [];
  const animals = [];
  const floorContours = [
    [0, 0.27], [0.12, 0.18], [0.25, 0.24], [0.39, 0.13],
    [0.51, 0.22], [0.66, 0.12], [0.79, 0.2], [0.91, 0.11], [1, 0.17],
  ];
  let framedAnimal = null;
  let pendingPhotoTimer = 0;

  function setFrame(frame) {
    if (!spritesAvailable) return;
    diverImage.src = `./assets/images/jeu/diver${frame + 1}.png`;
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

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function floorSurfaceY(xRatio, height, floorHeight) {
    const segment = floorContours.findIndex(([ratio]) => ratio >= xRatio);
    const nextIndex = Math.max(1, segment);
    const [leftRatio, leftHeight] = floorContours[nextIndex - 1];
    const [rightRatio, rightHeight] = floorContours[nextIndex];
    const progress = (xRatio - leftRatio) / (rightRatio - leftRatio);
    return height - floorHeight + floorHeight * (leftHeight + (rightHeight - leftHeight) * progress);
  }

  function chooseInsideTarget(roamer, width, height) {
    const padding = roamer.padding;
    roamer.targetX = randomBetween(padding, Math.max(padding, width - padding));
    roamer.targetY = roamer.kind === "bubble"
      ? Math.max(-padding, roamer.y - randomBetween(height * 0.12, height * 0.32))
      : randomBetween(height * 0.12, height * 0.76);
  }

  function moveRoamer(roamer, delta, timestamp, width) {
    const height = bubbleLayer.clientHeight;
    const dx = roamer.targetX - roamer.x;
    const dy = roamer.targetY - roamer.y;
    const distance = Math.hypot(dx, dy);
    const step = roamer.speed * delta;

    if (distance > 0) {
      const ratio = Math.min(1, step / distance);
      roamer.x += dx * ratio;
      roamer.y += dy * ratio;
      if (roamer.kind === "creature" && Math.abs(dx) > 0.5) {
        roamer.node.classList.toggle("faces-left", dx < 0);
      }
    }

    if (distance <= step + 1) {
      if (roamer.mode === "inside") {
        if (roamer.kind === "bubble" && roamer.y <= -roamer.padding) {
          roamer.y = height + roamer.padding;
        }
        chooseInsideTarget(roamer, width, height);
      } else if (roamer.mode === "leaving") {
        roamer.mode = "outside";
        roamer.waitUntil = timestamp + randomBetween(1400, 7000);
      } else if (roamer.mode === "returning") {
        roamer.mode = "inside";
        roamer.stayUntil = timestamp + randomBetween(3500, 11000);
        chooseInsideTarget(roamer, width, height);
      }
    }
  }

  function updateRoamers(delta, timestamp) {
    const width = bubbleLayer.clientWidth;
    const height = bubbleLayer.clientHeight;

    roamers.forEach((roamer) => {
      if (roamer.kind === "ground-creature") {
        const floorHeight = document.querySelector(".dive-floor").getBoundingClientRect().height;
        const minX = roamer.padding + width * 0.04;
        const maxX = width - roamer.padding - width * 0.04;
        roamer.x += roamer.direction * roamer.speed * delta;

        if (roamer.x <= minX || roamer.x >= maxX) {
          roamer.x = Math.max(minX, Math.min(maxX, roamer.x));
          roamer.direction *= -1;
        }

        const xRatio = roamer.x / width;
        const imageHeight = roamer.node.naturalWidth
          ? roamer.width * roamer.node.naturalHeight / roamer.node.naturalWidth
          : roamer.width * 0.65;
        roamer.y = floorSurfaceY(xRatio, height, floorHeight) - imageHeight / 2;
        roamer.node.style.left = `${roamer.x}px`;
        roamer.node.style.top = `${roamer.y}px`;
        roamer.node.classList.toggle("faces-left", roamer.direction > 0);
        return;
      }

      if (roamer.mode === "inside" && timestamp >= roamer.stayUntil) {
        roamer.mode = "leaving";
        roamer.exitSide = Math.random() < 0.5 ? -1 : 1;
        roamer.targetX = roamer.exitSide < 0 ? -roamer.padding : width + roamer.padding;
        roamer.targetY = roamer.kind === "bubble"
          ? Math.max(height * 0.12, roamer.y - randomBetween(height * 0.08, height * 0.18))
          : randomBetween(height * 0.18, height * 0.72);
      } else if (roamer.mode === "outside" && timestamp >= roamer.waitUntil) {
        roamer.mode = "returning";
        roamer.targetX = randomBetween(width * 0.18, width * 0.82);
        roamer.targetY = roamer.kind === "bubble"
          ? randomBetween(height * 0.72, height + roamer.padding)
          : randomBetween(height * 0.18, height * 0.72);
      }

      if (roamer.mode === "inside" || roamer.mode === "leaving" || roamer.mode === "returning") {
        moveRoamer(roamer, delta, timestamp, width);
      }

      const bob = Math.sin(timestamp * 0.0015 + roamer.phase) * (roamer.kind === "bubble" ? 3 : 5);
      roamer.node.style.left = `${roamer.x}px`;
      roamer.node.style.top = `${roamer.y + bob}px`;
    });
  }

  function updatePhotoTarget() {
    const diverBounds = diver.getBoundingClientRect();
    const diverX = diverBounds.left + diverBounds.width / 2;
    const diverY = diverBounds.top + diverBounds.height / 2;
    let closestAnimal = null;
    let closestAnimalElement = null;
    let closestDistance = 120;

    animals.forEach((animal) => {
      const bounds = animal.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const distance = Math.hypot(
        diverX - (bounds.left + bounds.width / 2),
        diverY - (bounds.top + bounds.height / 2),
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestAnimal = bounds;
        closestAnimalElement = animal;
      }
    });

    if (!closestAnimal) {
      framedAnimal = null;
      photoFrame.hidden = true;
      return;
    }

    framedAnimal = closestAnimalElement;
    const worldBounds = bubbleLayer.getBoundingClientRect();
    const side = Math.max(closestAnimal.width, closestAnimal.height) + 18;
    photoFrame.hidden = false;
    photoFrame.style.width = `${side}px`;
    photoFrame.style.height = `${side}px`;
    photoFrame.style.left = `${closestAnimal.left + closestAnimal.width / 2 - worldBounds.left - side / 2}px`;
    photoFrame.style.top = `${closestAnimal.top + closestAnimal.height / 2 - worldBounds.top - side / 2}px`;
  }

  function triggerPhotoFlash() {
    if (photoModal.getAttribute("aria-hidden") === "false") return;

    photoFlash.classList.remove("photo-flash-active");
    void photoFlash.offsetWidth;
    photoFlash.classList.add("photo-flash-active");

    if (!framedAnimal) return;

    const photo = {
      src: framedAnimal.currentSrc || framedAnimal.src,
      title: framedAnimal.dataset.title,
      description: framedAnimal.dataset.description,
    };
    window.clearTimeout(pendingPhotoTimer);
    pendingPhotoTimer = window.setTimeout(() => openPhoto(photo), 180);
  }

  function openPhoto(photo) {
    photoImage.src = photo.src;
    photoImage.alt = photo.title;
    photoTitle.textContent = photo.title;
    photoDescription.textContent = photo.description;
    photoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("photo-modal-open");
    photoModal.querySelector(".photo-modal-close").focus();
  }

  function closePhoto() {
    if (photoModal.getAttribute("aria-hidden") !== "false") return;
    photoModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("photo-modal-open");
    photoImage.removeAttribute("src");
    field.focus({ preventScroll: true });
  }

  function addRoamer(node, kind, width) {
    const fieldWidth = bubbleLayer.clientWidth;
    const fieldHeight = bubbleLayer.clientHeight;
    const padding = width / 2;
    const x = randomBetween(padding, Math.max(padding, fieldWidth - padding));
    const y = kind === "bubble"
      ? randomBetween(fieldHeight * 0.72, fieldHeight + padding)
      : randomBetween(fieldHeight * 0.12, fieldHeight * 0.76);

    node.style.width = `${width}px`;
    if (kind === "bubble") node.style.height = `${width}px`;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    bubbleLayer.append(node);
    const roamer = {
      node,
      kind,
      x,
      y,
      targetX: x,
      targetY: y,
      padding,
      speed: kind === "bubble" ? randomBetween(42, 64) : randomBetween(32, 58),
      phase: Math.random() * Math.PI * 2,
      mode: "inside",
      stayUntil: performance.now() + randomBetween(2500, 10000),
    };
    chooseInsideTarget(roamer, fieldWidth, fieldHeight);
    roamers.push(roamer);
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
      position.x += (dx / length) * delta * 15;
      position.y += (dy / length) * delta * 17;
      position.x = Math.max(6, Math.min(94, position.x));
      position.y = Math.max(10, Math.min(90, position.y));
      if (dx !== 0) facing = dx < 0 ? "left" : "right";
    }

    updateRoamers(delta, timestamp);
    updateDiver();
    updatePhotoTarget();
    requestAnimationFrame(swim);
  }

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (!event.repeat) triggerPhotoFlash();
      return;
    }

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

  for (let index = 0; index < 16; index += 1) {
    const bubble = document.createElement("i");
    bubble.className = "drifting-bubble";
    const size = randomBetween(4, 12);
    bubble.style.setProperty("--bubble-x", `${randomBetween(0, 100)}%`);
    bubble.style.setProperty("--bubble-size", `${size}px`);
    bubble.style.setProperty("--bubble-duration", `${randomBetween(7, 14)}s`);
    bubble.style.setProperty("--bubble-delay", `${-randomBetween(0, 14)}s`);
    bubble.style.setProperty("--bubble-drift", `${randomBetween(-34, 34)}px`);
    bubbleLayer.append(bubble);
  }

  [
    ["crabe.png", 62],
    ["crevette.png", 33],
    ["homard.png", 74],
    ["fletan.png", 108],
  ].forEach(([filename, width]) => {
    const creature = document.createElement("img");
    creature.className = "marine-creature";
    creature.src = `./assets/images/jeu/${filename}`;
    creature.alt = "";
    creature.draggable = false;
    creature.setAttribute("aria-hidden", "true");
    creature.dataset.title = {
      "crabe.png": "Crabe des neiges",
      "crevette.png": "Crevette nordique",
      "homard.png": "Homard gaspésien",
      "fletan.png": "Flétan de l'Atlantique",
    }[filename];
    creature.dataset.description = {
      "crabe.png": "Reconnaissable à ses longues pattes fines et sa carapace beige rosé, il vit dans les eaux froides et profondes du golfe. C'est l'une des pêches commerciales les plus importantes de la Gaspésie, récoltée surtout au printemps.",
      "crevette.png": "Uniquement pêchée à l'état sauvage dans les eaux froides du Saint-Laurent, elle se distingue par son goût raffiné, légèrement sucré et une chair plus tendre que toute autre espèce.",
      "homard.png": "Reconnu à travers le monde, le homard de la Gaspésie est recherché pour la qualité supérieure de sa chair. C'est en raison de sa carapace dure que sa chair, bien protégée des eaux froides et des fonds rocailleux du Saint-Laurent, est si blanche et abondante.",
      "fletan.png": "Le géant des poissons plats, capable de dépasser 100 kg. Il vit couché sur le fond marin, camouflé dans le sable, et se nourrit d'autres poissons. Sa chair blanche et dense en fait un poisson très prisé, mais sa croissance lente le rend vulnérable à la surpêche.",
    }[filename];
    addRoamer(creature, "creature", width);
    animals.push(creature);
  });

  const whelk = document.createElement("img");
  const whelkWidth = 62;
  const worldWidth = bubbleLayer.clientWidth;
  const worldHeight = bubbleLayer.clientHeight;
  const floorHeight = document.querySelector(".dive-floor").getBoundingClientRect().height;
  const whelkX = randomBetween(worldWidth * 0.12, worldWidth * 0.88);
  whelk.className = "marine-creature";
  whelk.src = "./assets/images/jeu/bourgot.png";
  whelk.alt = "";
  whelk.draggable = false;
  whelk.setAttribute("aria-hidden", "true");
  whelk.dataset.title = "Bourgot";
  whelk.dataset.description = "Aussi appelé buccin, ce mollusque à coquille en spirale vit sur les fonds rocheux du golfe du Saint-Laurent. Sa chair ferme et légèrement caoutchouteuse est traditionnellement pêchée à la trappe, un peu comme le homard.";
  whelk.style.width = `${whelkWidth}px`;
  bubbleLayer.append(whelk);
  roamers.push({
    node: whelk,
    kind: "ground-creature",
    x: whelkX,
    y: 0,
    width: whelkWidth,
    padding: whelkWidth / 2,
    speed: randomBetween(4, 8),
    direction: Math.random() < 0.5 ? -1 : 1,
  });
  animals.push(whelk);

  const oyster = document.createElement("img");
  const oysterWidth = 56;
  oyster.className = "marine-creature";
  oyster.src = "./assets/images/jeu/hu%C3%AEtre.png";
  oyster.alt = "";
  oyster.draggable = false;
  oyster.setAttribute("aria-hidden", "true");
  oyster.dataset.title = "Huître";
  oyster.dataset.description = "Ce mollusque bivalve filtre l'eau pour se nourrir de plancton, jouant un rôle important dans la santé des écosystèmes côtiers. Moins commune dans les eaux froides du golfe que dans les Maritimes, elle reste appréciée pour sa fraîcheur iodée.";
  oyster.style.width = `${oysterWidth}px`;

  const oysterXRatio = randomBetween(0.08, 0.92);
  function placeOysterOnFloor() {
    const width = bubbleLayer.clientWidth;
    const height = bubbleLayer.clientHeight;
    const floorHeight = document.querySelector(".dive-floor").getBoundingClientRect().height;
    const xRatio = Math.max(oysterWidth / width, Math.min(1 - oysterWidth / width, oysterXRatio));
    const surface = floorSurfaceY(xRatio, height, floorHeight);
    const imageHeight = oyster.naturalWidth ? oysterWidth * oyster.naturalHeight / oyster.naturalWidth : oysterWidth * 0.7;

    oyster.style.left = `${width * xRatio}px`;
    oyster.style.top = `${surface - imageHeight / 2}px`;
  }

  oyster.addEventListener("load", placeOysterOnFloor);
  oyster.addEventListener("load", () => {
    updatePhotoTarget();
  });
  bubbleLayer.append(oyster);
  animals.push(oyster);
  placeOysterOnFloor();
  window.addEventListener("resize", placeOysterOnFloor);

  photoModal.querySelectorAll("[data-photo-close]").forEach((element) => {
    element.addEventListener("click", closePhoto);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePhoto();
  });

  updateDiver();
  requestAnimationFrame(swim);
});
