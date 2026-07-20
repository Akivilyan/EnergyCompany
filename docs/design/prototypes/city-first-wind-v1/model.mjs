export const candidates = {
  wind: {
    id: "wind",
    name: "风电·I",
    cost: 12,
    months: 2,
    output: 42,
    opex: 1,
    supplyPercent: 3,
    thumbnail: "/docs/design/ui/assets/buildings/representative-v1/thumbnail/building-wind-tier1-thumbnail-v1.png",
    master: "/docs/design/ui/assets/buildings/representative-v1/master/building-wind-tier1-master-v1.png",
  },
  solar: {
    id: "solar",
    name: "光伏·I",
    cost: 10,
    months: 2,
    output: 38,
    opex: 1,
    supplyPercent: 3,
    thumbnail: "/docs/design/ui/assets/buildings/representative-v1/thumbnail/building-solar-tier1-thumbnail-v1.png",
    master: "/docs/design/ui/assets/buildings/representative-v1/master/building-solar-tier1-master-v1.png",
  },
  thermal: {
    id: "thermal",
    name: "火电·I",
    cost: 28,
    months: 3,
    output: 220,
    opex: 6,
    supplyPercent: 17,
    thumbnail: "/docs/design/ui/assets/buildings/representative-v1/thumbnail/building-thermal-tier1-thumbnail-v1.png",
    master: "/docs/design/ui/assets/buildings/representative-v1/master/building-thermal-tier1-master-v1.png",
  },
};

export function createInitialState() {
  return {
    phase: "browse",
    selectedCandidateId: "wind",
    projectStatus: "none",
    monthsLeft: 0,
    funds: 203,
    month: 1,
    supplyPercent: 0,
    receipt: undefined,
  };
}

export function transition(state, action) {
  const selected = candidates[state.selectedCandidateId];
  switch (action.type) {
    case "RESET":
      return createInitialState();
    case "SELECT_SLOT":
      return state.projectStatus === "none" ? { ...state, phase: "select", receipt: undefined } : state;
    case "SELECT_CANDIDATE":
      return candidates[action.candidateId]
        ? { ...state, selectedCandidateId: action.candidateId }
        : state;
    case "CONTINUE":
      return state.phase === "select" ? { ...state, phase: "confirm" } : state;
    case "BACK":
      if (state.phase === "confirm") return { ...state, phase: "select" };
      if (state.phase === "select") return { ...state, phase: "browse" };
      return state;
    case "CONFIRM_BUILD":
      if (state.phase !== "confirm" || state.funds < selected.cost) return state;
      return {
        ...state,
        phase: "browse",
        projectStatus: "building",
        monthsLeft: selected.months,
        funds: state.funds - selected.cost,
        receipt: `${selected.name} 已开工 · 剩 ${selected.months} 月`,
      };
    case "NEXT_MONTH": {
      if (state.projectStatus === "none") {
        return {
          ...state,
          month: state.month + 1,
          funds: state.funds + 38,
          receipt: `第 ${state.month + 1} 月经营稳定 · 本月净变化 +38`,
        };
      }
      if (state.projectStatus === "building") {
        const monthsLeft = Math.max(0, state.monthsLeft - 1);
        const complete = monthsLeft === 0;
        return {
          ...state,
          month: state.month + 1,
          funds: state.funds + 38,
          monthsLeft,
          projectStatus: complete ? "operational" : "building",
          supplyPercent: complete ? selected.supplyPercent : state.supplyPercent,
          receipt: complete
            ? `${selected.name} 已完工 · 供能 ${state.supplyPercent}% → ${selected.supplyPercent}%`
            : `${selected.name} 施工推进 · 剩 ${monthsLeft} 月`,
        };
      }
      return {
        ...state,
        month: state.month + 1,
        funds: state.funds + 38,
        receipt: `第 ${state.month + 1} 月经营稳定 · 本月净变化 +38`,
      };
    }
    case "CLOSE_RECEIPT":
      return { ...state, receipt: undefined };
    default:
      return state;
  }
}
