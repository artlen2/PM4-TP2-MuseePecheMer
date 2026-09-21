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

  const canvas = document.createElement("canvas");
  const container = document.createElement("div");
  const context = canvas.getContext("2d");
  const bubbles = [];
  const header = document.querySelector(".site-header");
  const mouse = {
    x: null,
    y: null,
    radius: 120,
    vx: 0,
    vy: 0,
    lastX: null,
    lastY: null,
  };
  let width = 0;
  let height = 0;
  let animationFrame;

  function getHeaderBottom() {
    if (!header) {
      return 0;
    }

    return Math.max(0, Math.min(height, header.getBoundingClientRect().bottom));
  }

  container.style.position = "fixed";
  container.style.inset = "0";
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.pointerEvents = "none";
  container.style.zIndex = "0";
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "0";
  container.appendChild(canvas);
  document.body.appendChild(container);

  function resize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  class Bubble {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      const headerBottom = getHeaderBottom();
      this.y = initial
        ? headerBottom + Math.random() * Math.max(0, height - headerBottom)
        : height + 20;
      this.radius = Math.random() * 4.8 + 2.8;
      this.baseVx = (Math.random() - 0.5) * 0.18;
      this.baseVy = -(Math.random() * 0.2 + 0.12);
      this.vx = this.baseVx;
      this.vy = this.baseVy;
      this.angle = Math.random() * Math.PI * 2;
      this.frequency = 0.004 + Math.random() * 0.008;
      this.amplitude = 0.08 + Math.random() * 0.12;
      this.alpha = Math.random() * 0.18 + 0.16;
      this.color = `hsl(${195 + Math.random() * 24}, ${72 + Math.random() * 18}%, ${60 + Math.random() * 15}%)`;
    }

    update() {
      const headerBottom = getHeaderBottom();
      this.angle += this.frequency;
      this.vx = this.baseVx + Math.sin(this.angle) * this.amplitude * 0.05;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0 && distance < mouse.radius) {
          const force = 1 - distance / mouse.radius;
          this.vx -= (dx / distance) * force * 0.25 + mouse.vx * 0.02;
          this.vy -= (dy / distance) * force * 0.25 + mouse.vy * 0.02;
        }
      }

      this.vx += (this.baseVx - this.vx) * 0.03;
      this.vy += (this.baseVy - this.vy) * 0.03;
      this.x += this.vx;
      this.y += this.vy;

      if (
        this.y - this.radius < headerBottom ||
        this.x < -50 ||
        this.x > width + 50
      ) {
        this.reset();
      }
    }

    draw() {
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = this.color;
      context.shadowColor = this.color;
      context.shadowBlur = 16;
      context.globalAlpha = this.alpha;
      context.fill();
      context.shadowBlur = 0;
      context.globalAlpha = 1;
    }
  }

  function animate() {
    context.clearRect(0, 0, width, height);
    const headerBottom = getHeaderBottom();
    context.save();
    context.beginPath();
    context.rect(0, headerBottom, width, height - headerBottom);
    context.clip();
    bubbles.forEach((bubble) => {
      bubble.update();
      bubble.draw();
    });
    context.restore();
    mouse.vx *= 0.9;
    mouse.vy *= 0.9;
    animationFrame = requestAnimationFrame(animate);
  }

  resize();
  const particleCount = Math.max(72, Math.floor((width * height) / 12000));
  for (let index = 0; index < particleCount; index += 1) {
    bubbles.push(new Bubble());
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (event) => {
    if (mouse.lastX !== null && mouse.lastY !== null) {
      mouse.vx = (event.clientX - mouse.lastX) * 0.15;
      mouse.vy = (event.clientY - mouse.lastY) * 0.15;
    }
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.lastX = event.clientX;
    mouse.lastY = event.clientY;
  });
  window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
    mouse.vx = 0;
    mouse.vy = 0;
    mouse.lastX = null;
    mouse.lastY = null;
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cancelAnimationFrame(animationFrame);
  } else {
    animate();
  }

  const fish = document.createElement("div");
  let lastMoveTime = 0;

  document.body.style.cursor = "auto";
  fish.innerHTML = `<img id="fish-cursor" src="https://cdn-icons-png.flaticon.com/32/3065/3065416.png" alt="" style="position: fixed; pointer-events: none; width: 32px; height: 32px; transform: translate(-50%, -50%); z-index: 9999;">`;
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

    ripple.animate(
      [
        { width: "0px", height: "0px", opacity: 1 },
        { width: "90px", height: "90px", opacity: 0, borderColor: "rgba(255, 255, 255, 0)" },
      ],
      { duration: 700, easing: "ease-out", fill: "forwards" },
    ).finished.then(() => ripple.remove());
  }
});