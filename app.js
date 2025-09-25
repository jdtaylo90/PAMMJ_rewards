const dispensaries = [
  {
    id: "rise",
    name: "RISE Dispensary",
    logo: "https://i.postimg.cc/28bbBJmD/RISE-Cannabis.png",
    description: "1 point earned per $1 spent across Mechanicsburg, Steelton, and Carlisle.",
    locations: [
      {
        name: "Mechanicsburg",
        url: "https://risecannabis.com/dispensaries/pennsylvania/mechanicsburg/1550/medical-menu/",
      },
      {
        name: "Steelton",
        url: "https://risecannabis.com/dispensaries/pennsylvania/steelton/1544/medical-menu/",
      },
      {
        name: "Carlisle",
        url: "https://risecannabis.com/dispensaries/pennsylvania/carlisle/1547/medical-menu/",
      },
    ],
    initialPoints: 1637,
    redemptionOptions: Array.from({ length: 33 }, (_, i) => ({
      points: (i + 1) * 100,
      value: 3 * (i + 1),
    })),
    quickButtons: [100, 200, 300, 400, 500, 800, 1000, 1200, 1500, 2000, 2500, 3000],
    earnPoints({ amount }) {
      return Math.floor(amount);
    },
    calculateRewardValue(points) {
      return (points / 100) * 3;
    },
    validateRedemption(points) {
      return points % 100 === 0;
    },
    redemptionHint: "Redeem in 100 point steps ($3 value each).",
  },
  {
    id: "organic",
    name: "Organic Remedies",
    logo: "https://i.postimg.cc/05HKjvTn/Organic-Remedies.png",
    description: "1 point per $1 spent at any Organic Remedies location.",
    initialPoints: 0,
    redemptionOptions: [
      { points: 250, value: 15 },
      { points: 500, value: 30 },
      { points: 750, value: 45 },
      { points: 1000, value: 60 },
    ],
    quickButtons: [250, 500, 750, 1000],
    earnPoints({ amount }) {
      return Math.floor(amount);
    },
    calculateRewardValue(points) {
      return points * 0.06;
    },
    validateRedemption(points) {
      return points % 250 === 0;
    },
    redemptionHint: "Redeem in 250 point steps ($15 value each).",
  },
  {
    id: "fluent",
    name: "FLUENT",
    logo: "https://i.postimg.cc/5yGXR5BT/FLUENT.png",
    description: "Earn 1 point per $20 spent. Wednesday purchases earn triple points. Points redeem $1 each.",
    initialPoints: 0,
    redemptionOptions: [
      { points: 1, value: 1 },
    ],
    quickButtons: [],
    earnPoints({ amount, isWednesday }) {
      const base = Math.floor(amount / 20);
      return isWednesday ? base * 3 : base;
    },
    calculateRewardValue(points) {
      return points;
    },
    validateRedemption(points) {
      return Number.isInteger(points) && points >= 0;
    },
    redemptionHint: "Each point equals $1 off your order.",
  },
  {
    id: "trulieve",
    name: "Trulieve",
    logo: "https://i.postimg.cc/kX0VNcXt/Trulieve.png",
    description: "1 point earned per $1 spent. Redeem for tiered rewards.",
    initialPoints: 287,
    redemptionOptions: [
      { points: 100, value: 5 },
      { points: 250, value: 15 },
      { points: 500, value: 35 },
      { points: 1000, value: 75 },
      { points: 2000, value: 160 },
    ],
    quickButtons: [100, 250, 500, 1000, 2000],
    earnPoints({ amount }) {
      return Math.floor(amount);
    },
    calculateRewardValue(points) {
      const tier = this.redemptionOptions.find((option) => option.points === points);
      if (tier) return tier.value;
      // Interpolate for non-tier values by using the best lesser tier value per point.
      const eligible = this.redemptionOptions.filter((option) => option.points <= points);
      if (!eligible.length) return 0;
      const best = eligible.reduce((highest, option) => {
        const valuePerPoint = option.value / option.points;
        return valuePerPoint > highest.valuePerPoint ? { ...option, valuePerPoint } : highest;
      }, { valuePerPoint: 0, value: 0, points: 0 });
      return (points / best.points) * best.value;
    },
    validateRedemption(points) {
      return this.redemptionOptions.some((option) => option.points === points);
    },
    redemptionHint: "Redeem using one of the available reward tiers.",
  },
];

const storageKey = "rewards-tracker-state-v1";

function getInitialState() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return dispensaries.reduce((acc, dispensary) => {
        acc[dispensary.id] = {
          points: parsed[dispensary.id]?.points ?? dispensary.initialPoints,
          history: parsed[dispensary.id]?.history ?? [],
        };
        return acc;
      }, {});
    } catch (error) {
      console.warn("Failed to parse saved state", error);
    }
  }
  return dispensaries.reduce((acc, dispensary) => {
    acc[dispensary.id] = { points: dispensary.initialPoints, history: [] };
    return acc;
  }, {});
}

const state = getInitialState();

function persistState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isWednesday(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.getDay() === 3;
}

function renderGrid() {
  const grid = document.getElementById("dispensaryGrid");
  grid.innerHTML = "";

  dispensaries.forEach((dispensary) => {
    const card = document.createElement("article");
    card.className = "card";

    const logo = document.createElement("img");
    logo.className = "card-logo";
    logo.src = dispensary.logo;
    logo.alt = `${dispensary.name} logo`;

    const name = document.createElement("h2");
    name.className = "card-title";
    name.textContent = dispensary.name;

    const points = document.createElement("p");
    points.className = "card-points";
    points.textContent = `${state[dispensary.id].points.toLocaleString()} pts`;

    const meta = document.createElement("div");
    meta.className = "card-meta";
    const metaLeft = document.createElement("span");
    metaLeft.textContent = dispensary.description;
    meta.append(metaLeft);

    const button = document.createElement("button");
    button.className = "primary-btn";
    button.textContent = "Manage";
    button.addEventListener("click", () => openModal(dispensary));

    card.append(logo, name, points, meta, button);
    grid.append(card);
  });
}

function openModal(dispensary) {
  document.querySelectorAll(".modal").forEach((modal) => closeModal(modal));
  const modalTemplate = document.getElementById("modalTemplate");
  const modalFragment = modalTemplate.content.cloneNode(true);
  const modalElement = modalFragment.querySelector(".modal");
  const modalContent = modalFragment.querySelector(".modal-content");
  const closeButton = modalFragment.querySelector(".modal-close");
  const backdrop = document.getElementById("modalBackdrop");

  modalContent.dataset.dispensaryId = dispensary.id;
  modalFragment.querySelector(".modal-logo").src = dispensary.logo;
  modalFragment.querySelector(".modal-logo").alt = `${dispensary.name} logo`;
  modalFragment.querySelector(".modal-title").textContent = dispensary.name;
  modalFragment.querySelector(".modal-subtitle").textContent = dispensary.description;
  modalFragment.querySelector(".points-value").textContent = `${state[
    dispensary.id
  ].points.toLocaleString()} pts`;

  const helper = modalFragment.querySelector(".form-helper");
  helper.textContent = dispensary.redemptionHint;

  const tierContainer = modalFragment.querySelector(".tier-tags");
  tierContainer.innerHTML = "";
  (dispensary.redemptionOptions || []).forEach((option) => {
    const tag = document.createElement("span");
    tag.className = "tier-tag";
    const rewardValue = option.value ? formatCurrency(option.value) : `${option.points} pts`;
    tag.textContent = option.value
      ? `${option.points} pts → ${rewardValue}`
      : `${option.points} pts`;
    if (state[dispensary.id].points >= option.points) {
      tag.classList.add("active");
    }
    tierContainer.append(tag);
  });

  const locationContainer = modalFragment.querySelector(".location-links");
  locationContainer.innerHTML = "";
  if (dispensary.locations?.length) {
    dispensary.locations.forEach((location) => {
      const link = document.createElement("a");
      link.href = location.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.className = "location-link";
      link.textContent = location.name;
      locationContainer.append(link);
    });
  } else {
    locationContainer.remove();
  }

  const pointButtonsContainer = modalFragment.querySelector(".point-buttons");
  pointButtonsContainer.innerHTML = "";
  if (dispensary.quickButtons?.length) {
    dispensary.quickButtons.forEach((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "point-button";
      button.textContent = `${value.toLocaleString()} pts`;
      button.addEventListener("click", () => {
        const pointsInput = modalContent.querySelector('input[name="points"]');
        const available = state[dispensary.id].points;
        const safeValue = Math.min(value, available);
        pointsInput.value = safeValue;
        updateRedemptionHelper(dispensary, safeValue, helper);
      });
      pointButtonsContainer.append(button);
    });
    const maxButton = document.createElement("button");
    maxButton.type = "button";
    maxButton.className = "point-button";
    maxButton.textContent = "Max";
    maxButton.addEventListener("click", () => {
      const pointsInput = modalContent.querySelector('input[name="points"]');
      pointsInput.value = state[dispensary.id].points;
      updateRedemptionHelper(dispensary, state[dispensary.id].points, helper);
    });
    pointButtonsContainer.append(maxButton);
  } else {
    const note = document.createElement("span");
    note.className = "tier-tag";
    note.textContent = "Use the input to enter any amount";
    pointButtonsContainer.append(note);
  }

  const purchaseForm = modalFragment.querySelector(".purchase-form");
  const dateInput = purchaseForm.querySelector('input[name="date"]');
  const today = new Date();
  const isoDate = today.toISOString().split("T")[0];
  dateInput.value = isoDate;

  purchaseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(purchaseForm);
    const amount = Number(formData.get("amount"));
    const date = formData.get("date");
    const points = Number(formData.get("points"));

    if (!date) {
      helper.textContent = "Please select the purchase date.";
      helper.classList.add("error");
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      helper.textContent = "Enter a purchase amount greater than zero.";
      helper.classList.add("error");
      return;
    }

    if (points > state[dispensary.id].points) {
      helper.textContent = "You cannot redeem more points than you have.";
      helper.classList.add("error");
      return;
    }

    if (points < 0 || !dispensary.validateRedemption(points)) {
      helper.textContent = "Adjust the points to match the redemption rules.";
      helper.classList.add("error");
      return;
    }

    const earned = dispensary.earnPoints({ amount, isWednesday: isWednesday(date) });
    const discount = dispensary.calculateRewardValue(points);

    state[dispensary.id].points = state[dispensary.id].points + earned - points;
    state[dispensary.id].history.unshift({
      date,
      amount,
      pointsEarned: earned,
      pointsRedeemed: points,
      discount,
    });

    persistState();
    renderGrid();
    refreshModal(modalContent, dispensary);
    helper.textContent = `Added purchase. Earned ${earned} pts${
      points ? `, redeemed ${points} pts (${formatCurrency(discount)}).` : "."
    }`;
    helper.classList.remove("error");
    purchaseForm.reset();
    dateInput.value = isoDate;
    purchaseForm.querySelector('input[name="points"]').value = 0;
    updateRedemptionHelper(dispensary, 0, helper);
  });

  const pointsInput = modalFragment.querySelector('input[name="points"]');
  pointsInput.addEventListener("input", () => {
    const value = Number(pointsInput.value) || 0;
    if (value > state[dispensary.id].points) {
      pointsInput.value = state[dispensary.id].points;
    }
    updateRedemptionHelper(dispensary, Number(pointsInput.value) || 0, helper);
  });

  const calculatorForm = modalFragment.querySelector(".calculator-form");
  const calculatorResult = modalFragment.querySelector(".calculator-result");
  calculatorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(calculatorForm);
    const planAmount = Number(formData.get("planAmount"));
    let planPoints = Number(formData.get("planPoints"));

    if (Number.isNaN(planAmount) || planAmount <= 0) {
      calculatorResult.textContent = "Enter a valid purchase amount.";
      return;
    }

    if (planPoints > state[dispensary.id].points) {
      planPoints = state[dispensary.id].points;
    }

    if (planPoints < 0 || !dispensary.validateRedemption(planPoints)) {
      calculatorResult.textContent = "Adjust the points to match the redemption rules.";
      return;
    }

    const savings = dispensary.calculateRewardValue(planPoints);
    const finalCost = Math.max(planAmount - savings, 0);
    calculatorResult.innerHTML = `Using <strong>${planPoints.toLocaleString()} pts</strong> saves <strong>${formatCurrency(
      savings
    )}</strong>. Estimated total: <strong>${formatCurrency(finalCost)}</strong>.`;
  });

  renderHistory(modalFragment.querySelector(".history"), dispensary);

  closeButton.addEventListener("click", () => closeModal(modalElement));
  modalElement.addEventListener("click", (event) => {
    if (event.target === modalElement) {
      closeModal(modalElement);
    }
  });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeModal(modalElement);
      }
    },
    { once: true }
  );

  document.body.append(modalFragment);
  requestAnimationFrame(() => {
    backdrop.classList.remove("hidden");
    backdrop.classList.add("visible");
  });
}

function refreshModal(modalContent, dispensary) {
  modalContent.querySelector(".points-value").textContent = `${state[
    dispensary.id
  ].points.toLocaleString()} pts`;

  const tierContainer = modalContent.querySelector(".tier-tags");
  if (tierContainer) {
    tierContainer.querySelectorAll(".tier-tag").forEach((tag, index) => {
      const option = dispensary.redemptionOptions[index];
      if (!option) return;
      if (state[dispensary.id].points >= option.points) {
        tag.classList.add("active");
      } else {
        tag.classList.remove("active");
      }
    });
  }

  const historySection = modalContent.querySelector(".history");
  renderHistory(historySection, dispensary);
}

function renderHistory(historySection, dispensary) {
  const list = historySection.querySelector(".history-list");
  const empty = historySection.querySelector(".history-empty");
  list.innerHTML = "";
  const history = state[dispensary.id].history;
  if (!history.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  history.slice(0, 10).forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";
    const earnedText = `${entry.pointsEarned.toLocaleString()} pts earned`;
    const redeemedText = entry.pointsRedeemed
      ? `${entry.pointsRedeemed.toLocaleString()} pts used (${formatCurrency(entry.discount)})`
      : "No points used";

    item.innerHTML = `
      <span>${formatDate(entry.date)} · ${formatCurrency(entry.amount)}</span>
      <span>${earnedText}</span>
      <span>${redeemedText}</span>
    `;
    list.append(item);
  });
}

function updateRedemptionHelper(dispensary, points, helper) {
  if (!helper) return;
  if (points === 0) {
    helper.textContent = dispensary.redemptionHint;
    helper.classList.remove("error");
    return;
  }

  if (!dispensary.validateRedemption(points)) {
    helper.textContent = "This amount doesn't match the redemption rules.";
    helper.classList.add("error");
    return;
  }

  const discount = dispensary.calculateRewardValue(points);
  helper.textContent = `${points.toLocaleString()} pts ≈ ${formatCurrency(discount)} in savings.`;
  helper.classList.remove("error");
}

function closeModal(modalElement) {
  const backdrop = document.getElementById("modalBackdrop");
  modalElement?.remove();
  backdrop.classList.remove("visible");
  backdrop.classList.add("hidden");
}

renderGrid();
