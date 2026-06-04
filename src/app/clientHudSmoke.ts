import type { GameBootstrap } from "./gameBootstrap.js";
import {
  cityHudAdvanceMonth,
  cityHudBuildWind,
  formatCityHudStatus,
  readCityHudViewModel
} from "./cityHudController.js";
import { eventsAcknowledgeNextPending } from "./eventsHudController.js";
import { companyApplyFirstUnlockedLoan } from "./companyHudController.js";
import {
  techEnsureLevelIIForDev,
  techSpeedupResearchByAd,
  techStartDefaultResearch
} from "./techHudController.js";
import {
  clientNavBack,
  clientNavOpenCompany,
  clientNavOpenRegion,
  clientNavOpenTechTree,
  formatClientNavHint
} from "./screenNavController.js";
import { regionQueueDefaultLink } from "./regionHudController.js";

export interface ClientHudSmokeStep {
  id: string;
  ok: boolean;
  detail: string;
}

function step(id: string, ok: boolean, detail: string): ClientHudSmokeStep {
  return { id, ok, detail };
}

/** 不打开 Cocos 编辑器，验证开发 HUD 全屏导航与关键操作（T50-01~07 + T49 存档）。 */
export function runClientHudSmoke(boot: GameBootstrap): ClientHudSmokeStep[] {
  const steps: ClientHudSmokeStep[] = [];

  steps.push(
    step("t50-01-mount", true, formatCityHudStatus(readCityHudViewModel(boot)))
  );

  const build = cityHudBuildWind(boot);
  steps.push(
    step(
      "t50-01-build",
      build.ok,
      build.ok ? "wind queued" : (build.errorCode ?? "unknown")
    )
  );
  if (!build.ok) return steps;

  const month = cityHudAdvanceMonth(boot);
  steps.push(
    step(
      "t50-01-advance",
      month.ok,
      month.ok ? formatCityHudStatus(month.view) : (month.errorCode ?? "unknown")
    )
  );
  if (!month.ok) return steps;

  const company = clientNavOpenCompany(boot);
  steps.push(
    step(
      "t50-03-nav-company",
      company.ok,
      formatClientNavHint(company.view, company.navigation.stack.length)
    )
  );
  const loan = companyApplyFirstUnlockedLoan(boot);
  steps.push(
    step(
      "t50-04-loan",
      loan.ok,
      loan.ok
        ? `loan=${boot.app.screens.company.getSnapshot().activeLoan?.loanId ?? "none"}`
        : (loan.uiErrorCode ?? "unknown")
    )
  );
  if (!loan.ok) return steps;

  clientNavBack(boot);
  const levelReady = techEnsureLevelIIForDev(boot);
  steps.push(
    step("t50-05-level-ii", levelReady.ok, `companyLevel=${levelReady.level}`)
  );
  if (!levelReady.ok) return steps;

  const techNav = clientNavOpenTechTree(boot);
  steps.push(
    step(
      "t50-05-nav-tech",
      techNav.ok,
      formatClientNavHint(techNav.view, techNav.navigation.stack.length)
    )
  );
  const techStart = techStartDefaultResearch(boot);
  steps.push(
    step(
      "t50-05-start-research",
      techStart.ok,
      techStart.ok ? "research started" : (techStart.uiErrorCode ?? "unknown")
    )
  );
  if (!techStart.ok) return steps;

  const techSpeed = techSpeedupResearchByAd(boot);
  const lit = boot.app.screens.tech.getSnapshot().litTechIds;
  steps.push(
    step(
      "t50-05-ad-speedup",
      techSpeed.ok,
      techSpeed.ok
        ? `lit_storage=${lit.includes("storage_system_1")}`
        : (techSpeed.uiErrorCode ?? "unknown")
    )
  );
  if (!techSpeed.ok) return steps;

  clientNavBack(boot);
  const regionNav = clientNavOpenRegion(boot);
  steps.push(
    step(
      "t50-07-nav-region",
      regionNav.ok,
      formatClientNavHint(regionNav.view, regionNav.navigation.stack.length)
    )
  );
  const regionLink = regionQueueDefaultLink(boot);
  const linkId = "CITY-MAP01-02::CITY-START";
  const queued = boot.app.screens.region.getSnapshot().gridLinks.find((l) => l.linkId === linkId);
  steps.push(
    step(
      "t50-07-queue-link",
      regionLink.ok,
      regionLink.ok ? `status=${queued?.status ?? "missing"}` : (regionLink.errorCode ?? "unknown")
    )
  );
  if (!regionLink.ok) return steps;

  clientNavBack(boot);
  boot.app.controller.state.funds = 10000;
  while (boot.app.controller.state.currentMonth < 23 && boot.app.controller.state.runResult === null) {
    const advance = cityHudAdvanceMonth(boot);
    if (!advance.ok) {
      steps.push(
        step(
          "t50-06-events-advance",
          false,
          `failed@M${boot.app.controller.state.currentMonth}: ${advance.errorCode ?? "unknown"}`
        )
      );
      return steps;
    }
  }
  const pending = boot.app.screens.events.getSnapshot().pendingFullscreen?.seq ?? "none";
  steps.push(step("t50-06-pending", pending !== "none", `seq=${pending}`));

  const ack = eventsAcknowledgeNextPending(boot);
  steps.push(
    step(
      "t50-06-ack",
      ack.ok,
      ack.ok
        ? `active=${boot.app.screens.events.getSnapshot().active.length}`
        : (ack.uiErrorCode ?? "unknown")
    )
  );

  return steps;
}
