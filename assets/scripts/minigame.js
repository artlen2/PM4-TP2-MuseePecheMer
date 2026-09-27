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
  const roamers = [];

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

  for (let index = 0; index < 16; index += 1) {
    const bubble = document.createElement("i");
    bubble.className = "drifting-bubble";
    const size = randomBetween(4, 12);
    addRoamer(bubble, "bubble", size);
  }

  [
    ["crabe.png", 62],
    ["crevette.png", 33],
    ["homard.png", 74],
  ].forEach(([filename, width]) => {
    const creature = document.createElement("img");
    creature.className = "marine-creature";
    creature.src = `./assets/images/jeu/${filename}`;
    creature.alt = "";
    creature.draggable = false;
    creature.setAttribute("aria-hidden", "true");
    addRoamer(creature, "creature", width);
  });

  const oyster = document.createElement("img");
  const oysterWidth = 56;
  const oysterContours = [
    [0, 0.27], [0.12, 0.18], [0.25, 0.24], [0.39, 0.13],
    [0.51, 0.22], [0.66, 0.12], [0.79, 0.2], [0.91, 0.11], [1, 0.17],
  ];
  oyster.className = "marine-creature";
  oyster.src = "./assets/images/jeu/hu%C3%AEtre.png";
  oyster.alt = "";
  oyster.draggable = false;
  oyster.setAttribute("aria-hidden", "true");
  oyster.style.width = `${oysterWidth}px`;

  const oysterXRatio = randomBetween(0.08, 0.92);
  function placeOysterOnFloor() {
    const width = bubbleLayer.clientWidth;
    const height = bubbleLayer.clientHeight;
    const floorHeight = document.querySelector(".dive-floor").getBoundingClientRect().height;
    const xRatio = Math.max(oysterWidth / width, Math.min(1 - oysterWidth / width, oysterXRatio));
    const segment = oysterContours.findIndex(([ratio]) => ratio >= xRatio);
    const nextIndex = Math.max(1, segment);
    const [leftRatio, leftHeight] = oysterContours[nextIndex - 1];
    const [rightRatio, rightHeight] = oysterContours[nextIndex];
    const progress = (xRatio - leftRatio) / (rightRatio - leftRatio);
    const surface = height - floorHeight + floorHeight * (leftHeight + (rightHeight - leftHeight) * progress);
    const imageHeight = oyster.naturalWidth ? oysterWidth * oyster.naturalHeight / oyster.naturalWidth : oysterWidth * 0.7;

    oyster.style.left = `${width * xRatio}px`;
    oyster.style.top = `${surface - imageHeight / 2}px`;
  }

  oyster.addEventListener("load", placeOysterOnFloor);
  bubbleLayer.append(oyster);
  placeOysterOnFloor();
  window.addEventListener("resize", placeOysterOnFloor);

  updateDiver();
  requestAnimationFrame(swim);
});
