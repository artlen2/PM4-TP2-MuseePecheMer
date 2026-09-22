document.addEventListener("DOMContentLoaded", () => {
  const steps = [
    {
      key: "planifier",
      label: "PLANIFIER",
      number: "01",
      section: document.getElementById("calendar"),
    },
    {
      key: "heure",
      label: "HEURE",
      number: "02",
      section: document.getElementById("hour"),
    },
    {
      key: "person",
      label: "INFORMATIONS",
      number: "03",
      section: document.getElementById("person"),
    },
    {
      key: "confirmation",
      label: "CONFIRMATION",
      number: "04",
      section: document.getElementById("confirmation"),
    },
  ];

  const progressSteps = document.querySelectorAll(".progress-step");
  const progressLines = document.querySelectorAll(".progress-line");
  const blocks = document.querySelectorAll(".reservation-block");
  const cartDate = document.getElementById("cart-date");
  const cartTime = document.getElementById("cart-time");
  const cartTotal = document.getElementById("cart-total");
  const cartTickets = document.getElementById("cart-tickets");
  const cartNumber = document.querySelector(".cart-number");
  const stepButtons = document.querySelectorAll(".reservation-step-button");

  const selection = {
    date: "21 septembre 2026",
    time: "13:00",
    tickets: {
      adult: 0,
      student: 0,
      child: 0,
    },
  };

  const prices = {
    adult: 8,
    student: 6,
    child: 4,
  };

  function setStep(index) {
    const safeIndex = Math.max(0, Math.min(index, steps.length - 1));

    progressSteps.forEach((step, stepIndex) => {
      const active = stepIndex === safeIndex;
      const completed = stepIndex < safeIndex;
      step.classList.toggle("active", active);
      step.classList.toggle("completed", completed);
      const number = step.querySelector("span");
      if (number) {
        if (completed) number.textContent = "✓";
        else if (stepIndex === 0) number.textContent = "01";
        else if (stepIndex === 1) number.textContent = "02";
        else if (stepIndex === 2) number.textContent = "03";
        else number.textContent = "04";
      }
    });

    progressLines.forEach((line, lineIndex) => {
      line.classList.toggle("completed", lineIndex < safeIndex);
    });

    blocks.forEach((block) => {
      const shouldShow = block.id === steps[safeIndex].section?.id;
      block.hidden = !shouldShow;
    });

    cartNumber.textContent = String(safeIndex + 1).padStart(2, "0");
  }

  function formatPrice(value) {
    return `${value.toFixed(2).replace(".", ",")} $`;
  }

  function updateCart() {
    const total =
      selection.tickets.adult * prices.adult +
      selection.tickets.student * prices.student +
      selection.tickets.child * prices.child;

    cartDate.textContent = selection.date;
    cartTime.textContent = selection.time;

    const entries = [];

    if (selection.tickets.adult > 0) {
      entries.push({
        label: `${selection.tickets.adult} × Adultes`,
        price: selection.tickets.adult * prices.adult,
      });
    }
    if (selection.tickets.student > 0) {
      entries.push({
        label: `${selection.tickets.student} × Étudiant`,
        price: selection.tickets.student * prices.student,
      });
    }
    if (selection.tickets.child > 0) {
      entries.push({
        label: `${selection.tickets.child} × Enfant`,
        price: selection.tickets.child * prices.child,
      });
    }

    if (entries.length === 0) {
      cartTickets.innerHTML =
        "<div><span>0 × Billets</span><strong>0,00 $</strong></div>";
    } else {
      cartTickets.innerHTML = entries
        .map(
          (entry) =>
            `<div><span>${entry.label}</span><strong>${formatPrice(entry.price)}</strong></div>`,
        )
        .join("");
    }

    cartTotal.textContent = formatPrice(total);
  }

  function bindDateSelection() {
    document.querySelectorAll(".calendar-days button").forEach((button) => {
      button.addEventListener("click", () => {
        document
          .querySelectorAll(".calendar-days button")
          .forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
        selection.date = `${button.textContent.trim()} septembre 2026`;
        updateCart();
      });
    });
  }

  function bindTimeSelection() {
    document.querySelectorAll(".time-slots button").forEach((button) => {
      button.addEventListener("click", () => {
        document
          .querySelectorAll(".time-slots button")
          .forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
        selection.time = button.textContent.trim();
        updateCart();
      });
    });
  }

  function bindTicketCounters() {
    document.querySelectorAll(".ticket-row").forEach((row) => {
      const ticketKey = row.dataset.ticket;
      const valueEl = row.querySelector("span");
      const buttons = row.querySelectorAll("button");

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const delta = button.dataset.action === "increase" ? 1 : -1;
          const nextValue = Math.max(0, selection.tickets[ticketKey] + delta);
          selection.tickets[ticketKey] = nextValue;
          valueEl.textContent = String(nextValue);
          updateCart();
        });
      });
    });
  }

  let currentStep = 0;

  function goToStep(index) {
    currentStep = index;
    setStep(currentStep);
  }

  progressSteps.forEach((step, index) => {
    step.addEventListener("click", () => goToStep(index));
  });

  stepButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (currentStep < steps.length - 1) {
        goToStep(currentStep + 1);
      } else {
        button.textContent = "RÉSERVATION CONFIRMÉE";
        button.disabled = true;
      }
    });
  });

  bindDateSelection();
  bindTimeSelection();
  bindTicketCounters();
  updateCart();
  setStep(0);
});
