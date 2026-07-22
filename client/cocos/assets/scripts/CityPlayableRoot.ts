import {
  _decorator,
  Button,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  ResolutionPolicy,
  Sprite,
  SpriteFrame,
  UITransform,
  Vec3,
  error as logError,
  log,
  resources,
  view
} from "cc";
import {
  clearMountedGameClient,
  ensureChineseDefaultForDev,
  mountGameClient
} from "../shared/game-client.mjs";
import { loadPlayableConfig } from "./loadPlayableConfig";

const { ccclass } = _decorator;

type FacilityId = "wind" | "solar" | "thermal";
type SheetMode = "closed" | "choose" | "confirm";
type ViewMode = "city" | "company";

interface SpriteCatalog {
  funds: SpriteFrame;
  energy: SpriteFrame;
  companyExp: SpriteFrame;
  calendar: SpriteFrame;
  turnIncome: SpriteFrame;
  build: SpriteFrame;
  confirm: SpriteFrame;
  clean: SpriteFrame;
  needsImprovement: SpriteFrame;
  windThumbnail: SpriteFrame;
  solarThumbnail: SpriteFrame;
  thermalThumbnail: SpriteFrame;
  windMaster: SpriteFrame;
  solarMaster: SpriteFrame;
  thermalMaster: SpriteFrame;
}

const FACILITY_NAME: Record<FacilityId, string> = {
  wind: "风电·I",
  solar: "光伏·I",
  thermal: "火电·I"
};

const SLOT_POSITIONS = [
  [-108, 175],
  [0, 202],
  [108, 162],
  [-102, 70],
  [4, 82],
  [108, 50],
  [0, -36]
] as const;

const BLUE_TEXT = new Color(20, 61, 113, 255);
const MUTED_TEXT = new Color(73, 103, 132, 255);
const WHITE = new Color(255, 255, 255, 255);
const CYAN = new Color(52, 211, 236, 255);
const YELLOW = new Color(255, 184, 39, 255);

function loadSpriteFrame(path: string): Promise<SpriteFrame> {
  return new Promise((resolve, reject) => {
    resources.load(`${path}/spriteFrame`, SpriteFrame, (loadError, asset) => {
      if (loadError || !asset) {
        reject(loadError ?? new Error(`sprite missing: ${path}`));
        return;
      }
      resolve(asset);
    });
  });
}

async function loadSpriteCatalog(): Promise<SpriteCatalog> {
  const [
    funds,
    energy,
    companyExp,
    calendar,
    turnIncome,
    build,
    confirm,
    clean,
    needsImprovement,
    windThumbnail,
    solarThumbnail,
    thermalThumbnail,
    windMaster,
    solarMaster,
    thermalMaster
  ] = await Promise.all([
    loadSpriteFrame("art/icons/funds"),
    loadSpriteFrame("art/icons/energy"),
    loadSpriteFrame("art/icons/company-exp"),
    loadSpriteFrame("art/icons/calendar"),
    loadSpriteFrame("art/icons/turn-income"),
    loadSpriteFrame("art/icons/build"),
    loadSpriteFrame("art/icons/confirm"),
    loadSpriteFrame("art/icons/clean"),
    loadSpriteFrame("art/icons/needs-improvement"),
    loadSpriteFrame("art/buildings/wind-thumbnail"),
    loadSpriteFrame("art/buildings/solar-thumbnail"),
    loadSpriteFrame("art/buildings/thermal-thumbnail"),
    loadSpriteFrame("art/buildings/wind-master"),
    loadSpriteFrame("art/buildings/solar-master"),
    loadSpriteFrame("art/buildings/thermal-master")
  ]);
  return {
    funds,
    energy,
    companyExp,
    calendar,
    turnIncome,
    build,
    confirm,
    clean,
    needsImprovement,
    windThumbnail,
    solarThumbnail,
    thermalThumbnail,
    windMaster,
    solarMaster,
    thermalMaster
  };
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

@ccclass("CityPlayableRoot")
export class CityPlayableRoot extends Component {
  private client: any = null;
  private cityScreen: any = null;
  private companyScreen: any = null;
  private sprites: SpriteCatalog | null = null;
  private viewMode: ViewMode = "city";
  private sheetMode: SheetMode = "closed";
  private selectedSlotId = "slot-5";
  private selectedFacilityId: FacilityId = "wind";
  private receipt: any = null;
  private levelUpDetail: any = null;
  private toast = "";
  private settling = false;

  onLoad(): void {
    view.setDesignResolutionSize(390, 844, ResolutionPolicy.FIXED_WIDTH);
    ensureChineseDefaultForDev();
    void this.mountPlayableSlice();
  }

  onDestroy(): void {
    clearMountedGameClient();
  }

  private async mountPlayableSlice(): Promise<void> {
    try {
      const [configRepo, sprites] = await Promise.all([
        loadPlayableConfig(),
        loadSpriteCatalog()
      ]);
      this.sprites = sprites;
      this.client = mountGameClient({ configRepo });
      this.cityScreen = this.client.app.screens.city("CITY-START");
      this.companyScreen = this.client.app.screens.company;
      this.render();
      log("[PLAYABLE-CORE-02] ready: company growth and unlock slice");
      console.warn("[PLAYABLE-CORE-02] ready");
    } catch (mountError) {
      const message = mountError instanceof Error ? mountError.message : String(mountError);
      logError("[PLAYABLE-CORE-01] mount failed", mountError);
      this.renderFatal(message);
    }
  }

  private renderFatal(message: string): void {
    this.node.removeAllChildren();
    const size = view.getVisibleSize();
    this.paintRect(this.node, 0, 0, size.width, size.height, new Color(27, 88, 139, 255));
    this.addLabel(this.node, "场景加载失败", 0, 36, size.width - 40, 36, 26, WHITE, true);
    this.addLabel(this.node, message, 0, -22, size.width - 48, 96, 16, WHITE, true);
  }

  private render(): void {
    if (!this.cityScreen || !this.sprites) return;
    this.node.removeAllChildren();
    const size = view.getVisibleSize();
    const width = size.width;
    const height = size.height;
    this.node.getComponent(UITransform)?.setContentSize(width, height);
    const snapshot = this.cityScreen.getSnapshot();
    if (!snapshot) {
      this.renderFatal("CITY-START 不存在");
      return;
    }
    if (this.viewMode === "company") {
      this.drawCompanyPage(width, height);
      return;
    }
    this.drawCityBackdrop(width, height);
    this.drawHud(snapshot, width, height);
    this.drawCityField(snapshot, width, height);
    if (this.receipt && this.sheetMode === "closed") this.drawMonthReceipt(this.receipt, width, height);
    if (this.sheetMode !== "closed") this.drawBuildSheet(snapshot, width, height);
    else {
      this.drawCityEntries(snapshot, width, height);
      this.drawNextMonthButton(width, height);
    }
    if (this.toast) this.drawToast(this.toast, width, height);
    if (this.settling) this.drawSettlingOverlay(width, height);
    if (this.levelUpDetail) this.drawLevelUpModal(this.levelUpDetail, width, height);
  }

  private drawCityBackdrop(width: number, height: number): void {
    const backdrop = this.layer("CityBackdrop", this.node, width, height, 0, 0);
    const g = backdrop.addComponent(Graphics);
    g.fillColor = new Color(75, 193, 241, 255);
    g.rect(-width / 2, 0, width, height / 2);
    g.fill();
    g.fillColor = new Color(35, 161, 214, 255);
    g.rect(-width / 2, -height / 2, width, height / 2);
    g.fill();

    g.fillColor = new Color(226, 250, 255, 220);
    g.circle(-118, height / 2 - 158, 38);
    g.circle(-76, height / 2 - 166, 52);
    g.circle(130, height / 2 - 176, 46);
    g.fill();

    g.fillColor = new Color(113, 204, 102, 255);
    g.ellipse(-width * 0.56, -height * 0.19, width * 1.12, height * 0.59);
    g.fill();
    g.fillColor = new Color(168, 226, 116, 255);
    g.ellipse(-width * 0.48, -height * 0.13, width * 0.96, height * 0.46);
    g.fill();

    g.strokeColor = new Color(225, 242, 231, 220);
    g.lineWidth = 14;
    g.moveTo(-170, 155);
    g.bezierCurveTo(-60, 100, 65, 120, 175, 48);
    g.moveTo(-145, 18);
    g.bezierCurveTo(-35, 72, 65, -30, 145, -78);
    g.stroke();
    g.strokeColor = new Color(133, 173, 158, 180);
    g.lineWidth = 2;
    g.moveTo(-170, 155);
    g.bezierCurveTo(-60, 100, 65, 120, 175, 48);
    g.moveTo(-145, 18);
    g.bezierCurveTo(-35, 72, 65, -30, 145, -78);
    g.stroke();

    this.paintRounded(
      backdrop,
      -96,
      250,
      166,
      36,
      16,
      new Color(241, 252, 255, 216),
      new Color(255, 255, 255, 235),
      1
    );
    this.addLabel(backdrop, "澄湾能源城", -96, 250, 148, 24, 18, BLUE_TEXT, true);
  }

  private drawHud(snapshot: any, width: number, height: number): void {
    const hudY = height / 2 - 82;
    const hud = this.layer("CityTopHud", this.node, width - 24, 112, 0, hudY);
    this.paintRounded(hud, 0, 0, width - 24, 112, 22, new Color(240, 251, 255, 232), new Color(255, 255, 255, 245), 2);
    this.paintRect(hud, 0, -1, width - 52, 1, new Color(111, 177, 207, 90));

    this.addStat(hud, this.sprites!.funds, `${snapshot.funds}`, -119, 25, 92);
    this.addStat(
      hud,
      this.sprites!.turnIncome,
      `${signed(snapshot.recurringFundsDeltaEstimate)} / 回合`,
      0,
      25,
      132,
      16
    );
    this.addStat(hud, this.sprites!.calendar, `${snapshot.month}月`, 126, 25, 86);

    this.addSprite(hud, this.sprites!.energy, -149, -31, 28, 28);
    this.addLabel(hud, "供能", -120, -31, 44, 26, 15, BLUE_TEXT, true);
    const barX = -91;
    const barWidth = 206;
    this.paintRounded(hud, barX + barWidth / 2, -31, barWidth, 24, 12, new Color(209, 231, 237, 255));
    const fillWidth = Math.max(0, Math.min(barWidth, barWidth * snapshot.supplyRatio));
    if (fillWidth > 1) {
      this.paintRounded(hud, barX + fillWidth / 2, -31, fillWidth, 24, 12, new Color(55, 205, 212, 255));
    }
    this.addLabel(
      hud,
      `${snapshot.effectiveSupplyMw} / ${snapshot.demandMw} MW`,
      barX + barWidth / 2,
      -31,
      barWidth,
      24,
      14,
      BLUE_TEXT,
      true
    );
    this.addSprite(
      hud,
      snapshot.cityFullyEcoSupply ? this.sprites!.clean : this.sprites!.needsImprovement,
      148,
      -31,
      32,
      32
    );
  }

  private drawCityField(snapshot: any, _width: number, _height: number): void {
    const occupied = new Map<string, any>();
    for (const facility of snapshot.facilities) occupied.set(facility.slotId, { ...facility, kind: "facility" });
    for (const project of snapshot.constructionProjects) occupied.set(project.slotId, { ...project, kind: "project" });

    SLOT_POSITIONS.forEach(([x, y], index) => {
      const slotId = `slot-${index + 1}`;
      const slot = this.layer(`BuildSlot-${index + 1}`, this.node, 76, 76, x, y);
      const content = occupied.get(slotId);
      const selected = this.sheetMode !== "closed" && this.selectedSlotId === slotId;
      this.paintRounded(
        slot,
        0,
        0,
        70,
        58,
        18,
        content ? new Color(223, 242, 229, 215) : new Color(223, 236, 233, 220),
        selected ? new Color(57, 225, 244, 255) : new Color(255, 255, 255, 225),
        selected ? 4 : 2
      );

      if (!content) {
        this.addLabel(slot, "+", 0, 1, 54, 54, 34, selected ? CYAN : new Color(48, 187, 211, 255), true);
        this.makeHitTarget(slot, () => this.openBuildSheet(slotId));
        return;
      }
      const facilityId = content.facilityId as FacilityId;
      const frame = content.kind === "facility"
        ? this.masterSprite(facilityId)
        : this.thumbnailSprite(facilityId);
      const spriteNode = this.addSprite(slot, frame, 0, 21, facilityId === "wind" ? 82 : 92, facilityId === "wind" ? 112 : 92);
      if (content.kind === "project") {
        spriteNode.getComponent(Sprite)!.color = new Color(255, 255, 255, 132);
        this.addSprite(slot, this.sprites!.build, -20, -23, 28, 28);
        this.addLabel(slot, `${content.monthsRemaining}月`, 15, -23, 44, 26, 16, BLUE_TEXT, true);
      } else {
        this.paintRounded(slot, 0, -27, 58, 22, 11, new Color(33, 153, 133, 236));
        this.addLabel(slot, "运行中", 0, -27, 56, 22, 14, WHITE, true);
      }
    });
  }

  private openBuildSheet(slotId: string): void {
    if (this.settling) return;
    const choice = this.cityScreen.getBuildChoice(slotId);
    if (!choice.ok) {
      this.toast = "这个建设位当前不可用";
      this.render();
      return;
    }
    this.selectedSlotId = slotId;
    this.selectedFacilityId = (choice.value.candidates[0]?.facilityId ?? "wind") as FacilityId;
    this.sheetMode = "choose";
    this.receipt = null;
    this.toast = "";
    this.render();
    console.warn(`[PLAYABLE-CORE-01] slot selected ${slotId}`);
  }

  private drawBuildSheet(snapshot: any, width: number, height: number): void {
    const sheetHeight = 356;
    const bottom = -height / 2 + 8;
    const centerY = bottom + sheetHeight / 2;
    const top = bottom + sheetHeight;
    const sheet = this.layer("BottomContextSheet", this.node, width - 12, sheetHeight, 0, centerY);
    this.paintRounded(
      sheet,
      0,
      0,
      width - 12,
      sheetHeight,
      26,
      new Color(240, 249, 252, 247),
      new Color(255, 255, 255, 255),
      2
    );
    this.paintRounded(sheet, 0, sheetHeight / 2 - 10, 54, 5, 3, new Color(102, 170, 199, 155));
    const localTop = sheetHeight / 2;
    const choice = this.cityScreen.getBuildChoice(this.selectedSlotId);
    if (!choice.ok) return;
    const candidate = choice.value.candidates.find((item: any) => item.facilityId === this.selectedFacilityId);
    if (!candidate) return;

    if (this.sheetMode === "choose") {
      this.addLabel(sheet, "在这里建设", -108, localTop - 35, 158, 28, 22, BLUE_TEXT, false, 0);
      this.addLabel(
        sheet,
        `在建 ${choice.value.queueActive}/${choice.value.queueMax} · 建设位 ${choice.value.buildSlotsOccupied}/${choice.value.buildSlotsMax}`,
        -36,
        localTop - 61,
        260,
        22,
        15,
        MUTED_TEXT,
        false,
        0
      );
      this.makeTextButton(sheet, "×", 157, localTop - 38, 48, 48, new Color(223, 235, 246, 255), BLUE_TEXT, () => {
        this.sheetMode = "closed";
        this.render();
      }, 25);
      choice.value.candidates.forEach((item: any, index: number) => {
        const facilityId = item.facilityId as FacilityId;
        const x = -114 + index * 114;
        const selected = facilityId === this.selectedFacilityId;
        const card = this.layer(`Candidate-${facilityId}`, sheet, 104, 105, x, localTop - 121);
        this.paintRounded(
          card,
          0,
          0,
          102,
          103,
          17,
          selected ? new Color(211, 245, 252, 255) : new Color(250, 253, 255, 255),
          selected ? CYAN : new Color(175, 205, 220, 255),
          selected ? 3 : 1
        );
        this.addSprite(card, this.thumbnailSprite(facilityId), 0, 15, 63, 63);
        this.addLabel(card, FACILITY_NAME[facilityId], 0, -32, 96, 25, 16, BLUE_TEXT, true);
        this.makeHitTarget(card, () => {
          this.selectedFacilityId = facilityId;
          this.render();
          console.warn(`[PLAYABLE-CORE-01] candidate selected ${facilityId}`);
        });
      });
      this.addLabel(
        sheet,
        `预计补充 ${candidate.effectiveOutputMw} MW   ·   工期 ${candidate.buildMonths}月`,
        0,
        localTop - 194,
        width - 46,
        24,
        16,
        BLUE_TEXT,
        true
      );
      this.addLabel(
        sheet,
        `确认后扣 ${candidate.buildCost}   ·   每月运维 ${candidate.monthlyOpex}`,
        0,
        localTop - 221,
        width - 46,
        24,
        16,
        MUTED_TEXT,
        true
      );
      const label = candidate.enabled
        ? `继续：${FACILITY_NAME[this.selectedFacilityId]}`
        : this.disabledReason(candidate.disabledReasonKey, snapshot.funds, candidate.buildCost);
      this.makePrimaryButton(sheet, label, 0, -sheetHeight / 2 + 37, width - 44, 58, candidate.enabled, () => {
        if (!candidate.enabled) return;
        this.sheetMode = "confirm";
        this.render();
      });
      return;
    }

    this.makeTextButton(sheet, "‹", -157, localTop - 44, 48, 48, new Color(223, 235, 246, 255), BLUE_TEXT, () => {
      this.sheetMode = "choose";
      this.render();
    }, 32);
    this.addLabel(
      sheet,
      `确认建设：${FACILITY_NAME[this.selectedFacilityId]}`,
      15,
      localTop - 44,
      width - 110,
      32,
      22,
      BLUE_TEXT,
      true
    );
    const rows = [
      ["资金", `${snapshot.funds}  →  ${snapshot.funds - candidate.buildCost}`],
      ["在建队列", `${choice.value.queueActive}/${choice.value.queueMax}  →  ${choice.value.queueActive + 1}/${choice.value.queueMax}`],
      ["施工", `${candidate.buildMonths} 个月`]
    ];
    rows.forEach(([key, value], index) => {
      const y = localTop - 91 - index * 47;
      this.paintRounded(sheet, 0, y, width - 54, 39, 12, new Color(225, 240, 247, 225));
      this.addLabel(sheet, key, -112, y, 90, 28, 16, MUTED_TEXT, false, 0);
      this.addLabel(sheet, value, 91, y, 138, 28, 18, BLUE_TEXT, false, 2);
    });
    this.paintRounded(sheet, 0, localTop - 237, width - 54, 44, 13, new Color(232, 249, 246, 242));
    this.addLabel(
      sheet,
      `完工当月即参与供能 · 预计 ${candidate.effectiveOutputMw} MW`,
      0,
      localTop - 237,
      width - 70,
      30,
      16,
      BLUE_TEXT,
      true
    );
    this.makePrimaryButton(
      sheet,
      `确认建设 · 扣 ${candidate.buildCost}`,
      0,
      -sheetHeight / 2 + 37,
      width - 44,
      58,
      candidate.enabled,
      () => this.confirmBuild(candidate)
    );
  }

  private confirmBuild(candidate: any): void {
    const result = this.cityScreen.queueConstruction(
      candidate.facilityId,
      candidate.tier,
      this.selectedSlotId
    );
    if (!result.ok || !result.value.result.ok) {
      this.toast = "建设失败：请检查资金与建设队列";
      this.sheetMode = "choose";
      this.render();
      return;
    }
    this.sheetMode = "closed";
    this.toast = `${FACILITY_NAME[this.selectedFacilityId]} 已开工 · ${candidate.buildMonths}月`;
    this.render();
    const queuedProject = result.value.after.constructionProjects.find(
      (project: any) => project.facilityId === candidate.facilityId
    );
    console.warn(
      `[PLAYABLE-CORE-01] construction queued ${candidate.facilityId} requested=${this.selectedSlotId} actual=${queuedProject?.slotId ?? "missing"}`
    );
  }

  private drawCityEntries(snapshot: any, _width: number, height: number): void {
    const y = -height / 2 + 48;
    this.makeTextButton(
      this.node,
      "公司",
      -145,
      y,
      70,
      58,
      new Color(236, 247, 252, 248),
      BLUE_TEXT,
      () => {
        this.viewMode = "company";
        this.receipt = null;
        this.toast = "";
        this.render();
        console.warn("[PLAYABLE-CORE-02] company entry opened");
      },
      17
    );
    const technologyUnlocked = snapshot.companyLevel >= 2;
    this.makeTextButton(
      this.node,
      technologyUnlocked ? "科技 · 已开放" : "科技 · II级",
      -59,
      y,
      92,
      58,
      technologyUnlocked
        ? new Color(205, 247, 244, 250)
        : new Color(207, 218, 224, 245),
      technologyUnlocked ? new Color(18, 112, 105, 255) : MUTED_TEXT,
      () => {
        this.toast = technologyUnlocked
          ? "科技研发入口已开放"
          : "公司达到 II 级后开放科技研发";
        this.render();
        console.warn(
          `[PLAYABLE-CORE-02] technology entry ${technologyUnlocked ? "unlocked" : "locked"}`
        );
      },
      14
    );
  }

  private drawCompanyPage(width: number, height: number): void {
    const company = this.companyScreen.getSnapshot();
    const growth = company.growth;
    const top = height / 2;

    this.paintRect(this.node, 0, 0, width, height, new Color(38, 145, 194, 255));
    const wash = this.layer("CompanyBackdrop", this.node, width, height, 0, 0);
    const g = wash.addComponent(Graphics);
    g.fillColor = new Color(97, 211, 224, 255);
    g.circle(-width * 0.34, top - 170, 190);
    g.fill();
    g.fillColor = new Color(60, 174, 203, 255);
    g.circle(width * 0.38, -height * 0.28, 260);
    g.fill();

    this.makeTextButton(
      this.node,
      "‹",
      -width / 2 + 42,
      top - 43,
      48,
      48,
      new Color(236, 248, 252, 248),
      BLUE_TEXT,
      () => {
        this.viewMode = "city";
        this.toast = growth.entries.technology.unlocked
          ? "科技入口已按公司 II 级刷新"
          : "";
        this.render();
      },
      31
    );
    this.addLabel(this.node, "公司成长", -38, top - 43, 150, 36, 25, WHITE, false, 0);
    this.addLabel(this.node, `第 ${company.month} 月快照`, width / 2 - 96, top - 43, 150, 28, 15, WHITE, false, 2);

    const heroY = top - 132;
    const hero = this.layer("CompanyGrowthHero", this.node, width - 32, 130, 0, heroY);
    this.paintRounded(hero, 0, 0, width - 32, 130, 24, new Color(245, 251, 255, 248), new Color(255, 255, 255, 255), 2);
    this.addLabel(hero, "公司 Lv", -135, 35, 72, 28, 17, MUTED_TEXT, false, 0);
    this.paintRounded(hero, -75, 35, 45, 45, 14, new Color(88, 102, 191, 255));
    this.addLabel(hero, growth.levelRoman, -75, 35, 42, 40, 23, WHITE, true);
    this.addSprite(hero, this.sprites!.companyExp, -20, 35, 34, 34);
    const thresholdText = growth.nextThreshold === null ? "MAX" : `${growth.expCurrent} / ${growth.nextThreshold} EXP`;
    const barWidth = width - 92;
    this.paintRounded(hero, 0, -25, barWidth, 31, 15, new Color(221, 225, 239, 255));
    const fillWidth = Math.max(2, barWidth * growth.progressRatio);
    this.paintRounded(hero, -barWidth / 2 + fillWidth / 2, -25, fillWidth, 31, 15, new Color(205, 77, 181, 255));
    this.addLabel(hero, thresholdText, 0, -25, barWidth, 30, 16, BLUE_TEXT, true);

    const ruleY = top - 244;
    const rule = this.layer("ExpRule", this.node, width - 32, 74, 0, ruleY);
    this.paintRounded(rule, 0, 0, width - 32, 74, 18, new Color(242, 250, 253, 244));
    this.addLabel(rule, "每月按供能与环保结果覆盖重算 EXP", 0, 16, width - 62, 24, 16, BLUE_TEXT, true);
    this.addLabel(rule, "EXP 可下降；公司等级与已解锁内容不回退", 0, -14, width - 62, 24, 15, MUTED_TEXT, true);

    const breakdownY = top - 350;
    const breakdown = this.layer("ExpBreakdown", this.node, width - 32, 116, 0, breakdownY);
    this.paintRounded(breakdown, 0, 0, width - 32, 116, 18, new Color(240, 248, 252, 246));
    this.addLabel(breakdown, "本月 EXP 从哪里来", 0, 38, width - 76, 27, 18, BLUE_TEXT, false, 0);
    const city = growth.cityBreakdown[0];
    if (city) {
      this.addLabel(
        breakdown,
        `${city.displayName.replace("（负荷中心，占位）", "")}  ·  ${city.exp} EXP`,
        0,
        4,
        width - 76,
        25,
        17,
        BLUE_TEXT,
        false,
        0
      );
      this.addLabel(
        breakdown,
        `供能 ${city.effectiveSupplyMw}/${city.demandMw} MW  ·  ${city.fullyEco ? "全环保 ×1.0" : "待改善 ×0.8"}`,
        0,
        -29,
        width - 76,
        24,
        15,
        MUTED_TEXT,
        false,
        0
      );
    }

    const unlockY = top - 500;
    const unlock = this.layer("CurrentUnlocks", this.node, width - 32, 158, 0, unlockY);
    this.paintRounded(unlock, 0, 0, width - 32, 158, 20, new Color(239, 250, 247, 248), new Color(138, 231, 211, 255), 2);
    this.addLabel(unlock, growth.level >= 2 ? "II 级已解锁" : "下一等级将解锁", 0, 53, width - 76, 28, 19, BLUE_TEXT, false, 0);
    if (growth.level >= 2) {
      this.addLabel(unlock, "✓ 科技研发入口", 0, 16, width - 76, 26, 17, new Color(18, 112, 105, 255), false, 0);
      this.addLabel(unlock, "✓ 起始省新增 2 座可经营城市", 0, -17, width - 76, 26, 16, BLUE_TEXT, false, 0);
      this.addLabel(unlock, "下一步：返回城市，进入科技研发", 0, -52, width - 76, 26, 16, MUTED_TEXT, false, 0);
    } else {
      this.addLabel(unlock, "达到 1 EXP → 公司 II 级", 0, 10, width - 76, 28, 17, BLUE_TEXT, false, 0);
      this.addLabel(unlock, "继续经营城市并推进月份", 0, -27, width - 76, 28, 16, MUTED_TEXT, false, 0);
    }

    this.makePrimaryButton(
      this.node,
      growth.entries.technology.unlocked ? "返回城市 · 查看已开放科技入口" : "返回城市继续经营",
      0,
      -height / 2 + 48,
      width - 38,
      58,
      true,
      () => {
        this.viewMode = "city";
        this.toast = growth.entries.technology.unlocked ? "科技研发入口已开放" : "";
        this.render();
        console.warn(
          `[PLAYABLE-CORE-02] company closed level=${growth.levelRoman} exp=${growth.expCurrent}`
        );
      }
    );
  }

  private drawLevelUpModal(detail: any, width: number, height: number): void {
    const blocker = this.layer("CompanyLevelUpBlocker", this.node, width, height, 0, 0);
    this.paintRect(blocker, 0, 0, width, height, new Color(20, 63, 94, 128));
    this.makeHitTarget(blocker, () => {});

    const modal = this.layer("CompanyLevelUpModal", this.node, width - 32, 430, 0, 8);
    this.paintRounded(modal, 0, 0, width - 32, 430, 28, new Color(246, 252, 255, 255), new Color(134, 239, 226, 255), 3);
    this.addSprite(modal, this.sprites!.companyExp, 0, 163, 48, 48);
    this.addLabel(modal, "公司升级", 0, 119, width - 70, 38, 27, BLUE_TEXT, true);
    this.addLabel(
      modal,
      `${this.levelRoman(detail.growth.levelBefore)}  →  ${this.levelRoman(detail.growth.levelAfter)}`,
      0,
      78,
      width - 80,
      36,
      27,
      new Color(119, 71, 177, 255),
      true
    );
    this.paintRounded(modal, 0, 23, width - 74, 74, 17, new Color(239, 244, 252, 255));
    this.addLabel(modal, "为何升级", 0, 41, width - 76, 24, 16, MUTED_TEXT, false, 0);
    this.addLabel(
      modal,
      `M9 EXP ${detail.growth.expBefore} → ${detail.growth.expAfter} · 达到门槛 ${detail.growth.reachedThreshold}`,
      0,
      10,
      width - 76,
      26,
      16,
      BLUE_TEXT,
      false,
      0
    );
    this.addLabel(modal, "本次解锁", 0, -35, width - 76, 26, 18, BLUE_TEXT, false, 0);
    this.addLabel(modal, "✓ 科技研发入口", 0, -70, width - 76, 25, 17, new Color(18, 112, 105, 255), false, 0);
    this.addLabel(modal, "✓ 起始省新增 2 座可经营城市", 0, -103, width - 76, 25, 16, BLUE_TEXT, false, 0);
    this.addLabel(modal, "等级与这些解锁不会因 EXP 回落而失去", 0, -140, width - 72, 24, 15, MUTED_TEXT, true);
    this.makePrimaryButton(
      modal,
      "查看公司成长与下一步",
      0,
      -184,
      width - 74,
      58,
      true,
      () => {
        this.levelUpDetail = null;
        this.receipt = null;
        this.viewMode = "company";
        this.render();
        console.warn("[PLAYABLE-CORE-02] level-up acknowledged and company opened");
      }
    );
  }

  private levelRoman(level: number): string {
    return ["0", "I", "II", "III", "IV", "V"][level] ?? `${level}`;
  }

  private drawNextMonthButton(width: number, height: number): void {
    this.makePrimaryButton(
      this.node,
      this.settling ? "结算中…" : "下一月  →",
      width / 2 - 104,
      -height / 2 + 48,
      178,
      58,
      !this.settling,
      () => this.advanceMonth()
    );
  }

  private advanceMonth(): void {
    if (this.settling) return;
    this.settling = true;
    this.toast = "";
    this.receipt = null;
    const result = this.cityScreen.advanceOneMonth();
    this.render();
    this.scheduleOnce(() => {
      this.settling = false;
      if (!result.ok) {
        this.toast = "月结失败，请重试";
      } else {
        this.receipt = result.value;
        if (result.value.growth.levelsGained > 0) {
          this.levelUpDetail = result.value;
        }
        const completion = result.value.projectUpdates.find((update: any) => update.state === "completed");
        console.warn(
          `[PLAYABLE-CORE-02] month ${result.value.monthTo} settled funds=${signed(result.value.delta.funds)} supply=${signed(result.value.delta.effectiveSupplyMw)} exp=${result.value.growth.expBefore}->${result.value.growth.expAfter} level=${result.value.growth.levelBefore}->${result.value.growth.levelAfter} completion=${completion?.facilityId ?? "none"}`
        );
      }
      this.render();
    }, 0.34);
  }

  private drawMonthReceipt(detail: any, width: number, height: number): void {
    const hudY = height / 2 - 82;
    const receipt = this.layer("MonthReceipt", this.node, width - 32, 112, 0, hudY - 126);
    this.paintRounded(receipt, 0, 0, width - 32, 112, 19, new Color(243, 251, 255, 247), new Color(255, 255, 255, 255), 2);
    const update = detail.projectUpdates[0];
    const projectText = update
      ? update.state === "completed"
        ? `${FACILITY_NAME[update.facilityId as FacilityId]} 已完工 · 当月供能生效`
        : `${FACILITY_NAME[update.facilityId as FacilityId]} 施工中 · 剩 ${update.monthsLeft}月`
      : "经营稳定";
    this.addLabel(receipt, `第${detail.monthTo}月速报`, -62, 35, 132, 24, 17, BLUE_TEXT, false, 0);
    this.addLabel(receipt, projectText, 26, 8, width - 82, 24, 16, BLUE_TEXT, false, 0);
    this.addLabel(
      receipt,
      `资金 ${signed(detail.delta.funds)} · 每回合 ${signed(detail.after.recurringFundsDeltaEstimate)}`,
      26,
      -18,
      width - 82,
      23,
      15,
      MUTED_TEXT,
      false,
      0
    );
    this.addSprite(receipt, this.sprites!.companyExp, -144, -42, 25, 25);
    this.addLabel(
      receipt,
      `供能 ${detail.before.effectiveSupplyMw} → ${detail.after.effectiveSupplyMw} MW · 公司 EXP ${detail.before.socialValue} → ${detail.after.socialValue} (${signed(detail.delta.socialValue)})`,
      36,
      -42,
      width - 66,
      23,
      14,
      BLUE_TEXT,
      false,
      0
    );
    this.makeTextButton(receipt, "×", width / 2 - 42, 35, 48, 48, new Color(225, 238, 246, 240), BLUE_TEXT, () => {
      this.receipt = null;
      this.render();
    }, 23);
  }

  private drawToast(message: string, width: number, height: number): void {
    const y = -height / 2 + 126;
    const toast = this.layer("ActionToast", this.node, width - 70, 46, 0, y);
    this.paintRounded(toast, 0, 0, width - 70, 46, 23, new Color(29, 91, 124, 235), new Color(112, 234, 231, 255), 1);
    this.addLabel(toast, message, 0, 0, width - 88, 30, 16, WHITE, true);
  }

  private drawSettlingOverlay(width: number, height: number): void {
    const overlay = this.layer("MonthSettling", this.node, width, height, 0, 0);
    this.paintRect(overlay, 0, 0, width, height, new Color(211, 244, 252, 56));
    this.paintRounded(overlay, 0, 12, width - 76, 74, 20, new Color(238, 250, 254, 248), new Color(255, 255, 255, 255), 2);
    this.addLabel(overlay, "项目推进  →  供能重算  →  经营结算", 0, 20, width - 96, 28, 17, BLUE_TEXT, true);
    this.addLabel(overlay, "正在推进月份…", 0, -10, width - 96, 22, 14, MUTED_TEXT, true);
  }

  private disabledReason(reason: string | undefined, funds: number, cost: number): string {
    if (reason === "insufficient_funds") return `资金不足 · 还差 ${Math.max(0, cost - funds)}`;
    if (reason === "queue_full") return "在建队列已满";
    if (reason === "slot_occupied") return "这个建设位已占用";
    if (reason === "slots_full") return "城市建设位已满";
    return "结算中";
  }

  private thumbnailSprite(facilityId: FacilityId): SpriteFrame {
    if (facilityId === "wind") return this.sprites!.windThumbnail;
    if (facilityId === "solar") return this.sprites!.solarThumbnail;
    return this.sprites!.thermalThumbnail;
  }

  private masterSprite(facilityId: FacilityId): SpriteFrame {
    if (facilityId === "wind") return this.sprites!.windMaster;
    if (facilityId === "solar") return this.sprites!.solarMaster;
    return this.sprites!.thermalMaster;
  }

  private layer(name: string, parent: Node, width: number, height: number, x: number, y: number): Node {
    const node = new Node(name);
    node.layer = parent.layer;
    parent.addChild(node);
    node.setPosition(new Vec3(x, y, 0));
    node.addComponent(UITransform).setContentSize(width, height);
    return node;
  }

  private paintRect(parent: Node, x: number, y: number, width: number, height: number, fill: Color): void {
    const node = this.layer("Rect", parent, width, height, x, y);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fill;
    graphics.rect(-width / 2, -height / 2, width, height);
    graphics.fill();
  }

  private paintRounded(
    parent: Node,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill: Color,
    stroke?: Color,
    lineWidth = 0
  ): Node {
    const node = this.layer("Panel", parent, width, height, x, y);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = fill;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.fill();
    if (stroke && lineWidth > 0) {
      graphics.strokeColor = stroke;
      graphics.lineWidth = lineWidth;
      graphics.roundRect(-width / 2, -height / 2, width, height, radius);
      graphics.stroke();
    }
    return node;
  }

  private addLabel(
    parent: Node,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color: Color,
    centered: boolean,
    horizontalAlign = 1
  ): Node {
    const node = this.layer("Label", parent, width, height, x, y);
    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = Math.max(fontSize + 4, height - 2);
    label.color = color;
    label.useSystemFont = true;
    label.fontFamily = "Microsoft YaHei";
    label.overflow = Label.Overflow.CLAMP;
    label.horizontalAlign = centered
      ? Label.HorizontalAlign.CENTER
      : horizontalAlign === 2
        ? Label.HorizontalAlign.RIGHT
        : Label.HorizontalAlign.LEFT;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.enableWrapText = false;
    return node;
  }

  private addSprite(
    parent: Node,
    frame: SpriteFrame,
    x: number,
    y: number,
    width: number,
    height: number
  ): Node {
    const node = this.layer("Sprite", parent, width, height, x, y);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = frame;
    node.getComponent(UITransform)!.setContentSize(width, height);
    return node;
  }

  private addStat(
    parent: Node,
    icon: SpriteFrame,
    text: string,
    x: number,
    y: number,
    width: number,
    fontSize = 18
  ): void {
    this.addSprite(parent, icon, x - width / 2 + 18, y, 29, 29);
    this.addLabel(parent, text, x + 13, y, width - 30, 29, fontSize, BLUE_TEXT, true);
  }

  private makeHitTarget(node: Node, onTap: () => void): void {
    const button = node.addComponent(Button);
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.96;
    node.on(Node.EventType.TOUCH_END, onTap, this);
  }

  private makeTextButton(
    parent: Node,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: Color,
    textColor: Color,
    onTap: () => void,
    fontSize = 18
  ): Node {
    const node = this.paintRounded(parent, x, y, width, height, Math.min(width, height) / 2, fill, new Color(255, 255, 255, 235), 2);
    this.addLabel(node, text, 0, 0, width - 8, height - 4, fontSize, textColor, true);
    this.makeHitTarget(node, onTap);
    return node;
  }

  private makePrimaryButton(
    parent: Node,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    enabled: boolean,
    onTap: () => void
  ): Node {
    const node = this.paintRounded(
      parent,
      x,
      y,
      width,
      height,
      22,
      enabled ? YELLOW : new Color(190, 202, 204, 255),
      enabled ? new Color(255, 241, 157, 255) : new Color(224, 231, 232, 255),
      3
    );
    this.addLabel(node, text, 0, 0, width - 22, height - 8, 20, enabled ? new Color(87, 56, 9, 255) : MUTED_TEXT, true);
    const button = node.addComponent(Button);
    button.interactable = enabled;
    button.transition = Button.Transition.SCALE;
    button.zoomScale = 0.97;
    if (enabled) node.on(Node.EventType.TOUCH_END, onTap, this);
    return node;
  }
}
