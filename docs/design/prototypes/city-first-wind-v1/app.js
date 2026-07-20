import { candidates, createInitialState, transition } from "./model.mjs";

let state = createInitialState();
let settling = false;

const root = document.querySelector("#game-root");
const phone = document.querySelector('[data-testid="prototype-phone"]');

const byTestId = (id) => document.querySelector(`[data-testid="${id}"]`);

function selectedCandidate() {
  return candidates[state.selectedCandidateId];
}

function render() {
  const selected = selectedCandidate();
  const sheetOpen = state.phase === "select" || state.phase === "confirm";
  const selecting = state.phase === "select";
  const slot = byTestId("build-slot-primary");
  const slotBuilding = byTestId("slot-building");
  const marker = byTestId("construction-marker");
  const receipt = byTestId("month-receipt");

  byTestId("funds-value").textContent = String(state.funds);
  byTestId("month-value").textContent = String(state.month);
  byTestId("supply-value").textContent = `${state.supplyPercent}%`;
  byTestId("supply-bar").style.width = `${Math.max(4, state.supplyPercent)}%`;
  byTestId("funds-delta").textContent = state.projectStatus === "building" && state.month === 1 ? `-${selected.cost}` : "";

  slot.classList.toggle("selected", sheetOpen);
  slot.classList.toggle("building", state.projectStatus === "building");
  slot.classList.toggle("operational", state.projectStatus === "operational");
  slot.disabled = state.projectStatus !== "none";
  slot.querySelector(".slot-plus").hidden = state.projectStatus !== "none" || sheetOpen;

  const showBuilding = state.projectStatus === "operational" || sheetOpen;
  slotBuilding.hidden = !showBuilding;
  if (showBuilding) {
    slotBuilding.src = selected.master;
    slotBuilding.alt = state.projectStatus === "operational" ? selected.name : `${selected.name} 建设预览`;
    slotBuilding.classList.toggle("ghost", state.projectStatus !== "operational");
  }

  marker.hidden = state.projectStatus !== "building";
  byTestId("months-left").textContent = `${state.monthsLeft}月`;

  byTestId("build-sheet").hidden = !sheetOpen;
  byTestId("candidate-view").hidden = !selecting;
  byTestId("confirm-view").hidden = selecting;
  document.querySelector(".sheet-back").hidden = selecting;
  document.querySelector(".sheet-close").hidden = !selecting;
  byTestId("sheet-kicker").textContent = selecting ? "在这里建设" : "不可逆后果";
  byTestId("sheet-title").textContent = selecting ? "选择设施" : `确认建设：${selected.name}`;

  for (const button of document.querySelectorAll("[data-candidate]")) {
    const active = button.dataset.candidate === state.selectedCandidateId;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-selected", String(active));
  }

  byTestId("detail-output").textContent = `${selected.output}MW`;
  byTestId("detail-months").textContent = `${selected.months}月`;
  byTestId("detail-cost").textContent = String(selected.cost);
  byTestId("detail-opex").textContent = String(selected.opex);
  byTestId("continue-build").textContent = `继续：${selected.name}`;
  byTestId("confirm-funds").textContent = `${state.funds} → ${state.funds - selected.cost}`;
  byTestId("confirm-months").textContent = `施工 ${selected.months} 个月`;
  byTestId("completion-copy").textContent = `完成后预计补充 ${selected.output}MW · 月运维 ${selected.opex}`;
  byTestId("confirm-build").textContent = `确认建设 · 扣 ${selected.cost}`;

  receipt.hidden = !state.receipt;
  if (state.receipt) {
    byTestId("receipt-title").textContent = `第 ${state.month} 月速报`;
    byTestId("receipt-copy").textContent = state.receipt;
  }

  byTestId("settling-overlay").hidden = !settling;
  byTestId("next-month").hidden = sheetOpen;
  byTestId("next-month").disabled = settling || sheetOpen;
  root.dataset.phase = state.phase;
  root.dataset.project = state.projectStatus;
  root.dataset.month = String(state.month);
}

function dispatch(action) {
  state = transition(state, action);
  render();
}

async function advanceMonth() {
  if (settling || state.phase !== "browse") return;
  settling = true;
  render();
  await new Promise((resolve) => window.setTimeout(resolve, 360));
  state = transition(state, { type: "NEXT_MONTH" });
  settling = false;
  render();
}

document.addEventListener("click", (event) => {
  const candidateButton = event.target.closest("[data-candidate]");
  if (candidateButton) {
    dispatch({ type: "SELECT_CANDIDATE", candidateId: candidateButton.dataset.candidate });
    return;
  }

  const frameButton = event.target.closest("[data-frame]");
  if (frameButton) {
    const width = Number(frameButton.dataset.frame);
    phone.style.setProperty("--phone-width", `${width}px`);
    phone.style.setProperty("--phone-height", width === 390 ? "844px" : "932px");
    document.querySelectorAll("[data-frame]").forEach((button) => button.classList.toggle("active", button === frameButton));
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  switch (actionButton.dataset.action) {
    case "select-slot":
      dispatch({ type: "SELECT_SLOT" });
      break;
    case "continue":
      dispatch({ type: "CONTINUE" });
      break;
    case "back":
    case "close-sheet":
      dispatch({ type: "BACK" });
      break;
    case "confirm":
      dispatch({ type: "CONFIRM_BUILD" });
      break;
    case "next-month":
      void advanceMonth();
      break;
    case "close-receipt":
      dispatch({ type: "CLOSE_RECEIPT" });
      break;
    case "reset":
      dispatch({ type: "RESET" });
      break;
  }
});

render();
