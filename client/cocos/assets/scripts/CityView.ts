import { Color, Graphics, Node, Sprite } from "cc";
import type { FacilityId, SpriteCatalog } from "./PlayableAssets";
import { BLUE_TEXT, CYAN, MUTED_TEXT, signed, UiFactory, WHITE } from "./UiFactory";

type SheetMode = "closed" | "choose";

const SLOT_POSITIONS = [
  [-108, 175],
  [0, 202],
  [108, 162],
  [-102, 70],
  [4, 82],
  [108, 50],
  [0, -36]
] as const;

export interface CityViewOptions {
  node: Node;
  sprites: SpriteCatalog;
  cityScreen: any;
  techScreen: any;
  regionScreen: any;
  refresh: () => void;
  openCompany: () => void;
  openTech: () => void;
  openRegion: () => void;
  switchCity: (cityId: string) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  clearReceipt: () => void;
  setReceipt: (detail: any) => void;
  setLevelUpDetail: (detail: any) => void;
  setSettling: (settling: boolean) => void;
  isSettling: () => boolean;
  scheduleOnce: (callback: () => void, delaySeconds: number) => void;
}

export class CityView extends UiFactory {
  private cityScreen: any;
  private readonly techScreen: any;
  private readonly regionScreen: any;
  private readonly refresh: () => void;
  private readonly openCompany: () => void;
  private readonly openTech: () => void;
  private readonly openRegion: () => void;
  private readonly switchCity: (cityId: string) => void;
  private readonly showToast: (message: string) => void;
  private readonly clearToast: () => void;
  private readonly clearReceipt: () => void;
  private readonly setReceipt: (detail: any) => void;
  private readonly setLevelUpDetail: (detail: any) => void;
  private readonly setSettling: (settling: boolean) => void;
  private readonly isSettling: () => boolean;
  private readonly scheduleOnce: (callback: () => void, delaySeconds: number) => void;
  private sheetMode: SheetMode = "closed";
  private selectedSlotId = "slot-5";
  private selectedFacilityId: FacilityId = "wind";

  constructor(options: CityViewOptions) {
    super(options.node, options.sprites);
    this.cityScreen = options.cityScreen;
    this.techScreen = options.techScreen;
    this.regionScreen = options.regionScreen;
    this.refresh = options.refresh;
    this.openCompany = options.openCompany;
    this.openTech = options.openTech;
    this.openRegion = options.openRegion;
    this.switchCity = options.switchCity;
    this.showToast = options.showToast;
    this.clearToast = options.clearToast;
    this.clearReceipt = options.clearReceipt;
    this.setReceipt = options.setReceipt;
    this.setLevelUpDetail = options.setLevelUpDetail;
    this.setSettling = options.setSettling;
    this.isSettling = options.isSettling;
    this.scheduleOnce = options.scheduleOnce;
  }

  getSnapshot(): any {
    return this.cityScreen.getSnapshot();
  }

  setCityScreen(cityScreen: any): void {
    this.cityScreen = cityScreen;
    this.sheetMode = "closed";
  }

  isSheetClosed(): boolean {
    return this.sheetMode === "closed";
  }

  render(snapshot: any, width: number, height: number): void {
    this.drawCityBackdrop(snapshot, width, height);
    this.drawHud(snapshot, width, height);
    this.drawCityField(snapshot, width, height);
    if (this.sheetMode !== "closed") this.drawBuildSheet(snapshot, width, height);
    else {
      this.drawCapacityStatus(snapshot, width, height);
      this.drawCityEntries(snapshot, height);
      this.drawNextMonthButton(width, height);
    }
  }

  private drawCityBackdrop(snapshot: any, width: number, height: number): void {
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

    this.drawCitySelector(backdrop, snapshot, width);
  }

  private drawCitySelector(parent: Node, snapshot: any, width: number): void {
    const region = this.regionScreen.getSnapshot();
    const cities = region.cities.filter((city: any) => city.operable);
    const currentIndex = Math.max(0, cities.findIndex((city: any) => city.cityId === snapshot.cityId));
    const current = cities[currentIndex];
    const selectorWidth = Math.min(width - 34, 340);
    const selector = this.layer("CitySelector", parent, selectorWidth, 48, 0, 250);
    this.paintRounded(selector, 0, 0, selectorWidth, 46, 18, new Color(241, 252, 255, 232), new Color(255, 255, 255, 245), 2);
    const name = this.cityDisplayName(snapshot.cityId, current?.displayName);
    this.addLabel(
      selector,
      cities.length > 1 ? `${name}  ·  ${currentIndex + 1}/${cities.length}` : name,
      0,
      0,
      selectorWidth - (cities.length > 1 ? 104 : 20),
      28,
      17,
      BLUE_TEXT,
      true
    );
    if (cities.length <= 1) return;
    const arrowX = selectorWidth / 2 - 26;
    this.makeTextButton(selector, "‹", -arrowX, 0, 48, 48, new Color(220, 244, 248, 250), BLUE_TEXT, () => {
      this.switchRelativeCity(cities, currentIndex, -1);
    }, 29);
    this.makeTextButton(selector, "›", arrowX, 0, 48, 48, new Color(220, 244, 248, 250), BLUE_TEXT, () => {
      this.switchRelativeCity(cities, currentIndex, 1);
    }, 29);
  }

  private switchRelativeCity(cities: any[], currentIndex: number, offset: number): void {
    if (cities.length <= 1 || this.isSettling()) return;
    const nextIndex = (currentIndex + offset + cities.length) % cities.length;
    const next = cities[nextIndex];
    if (!next) return;
    this.sheetMode = "closed";
    this.clearToast();
    this.clearReceipt();
    this.switchCity(next.cityId);
    console.warn(`[PLAYABLE-CORE-04] city switched ${next.cityId}`);
  }

  private cityDisplayName(cityId: string, fallback?: string): string {
    if (cityId === "CITY-START") return "澄湾能源城";
    if (cityId === "CITY-MAP01-02") return "晴湾光伏城";
    if (cityId === "CITY-MAP01-03") return "青岚风电城";
    return fallback?.replace(/（.*）/, "") ?? cityId;
  }

  private drawHud(snapshot: any, width: number, height: number): void {
    const hudY = height / 2 - 82;
    const hud = this.layer("CityTopHud", this.node, width - 24, 112, 0, hudY);
    this.paintRounded(hud, 0, 0, width - 24, 112, 22, new Color(240, 251, 255, 232), new Color(255, 255, 255, 245), 2);
    this.paintRect(hud, 0, -1, width - 52, 1, new Color(111, 177, 207, 90));

    this.addStat(hud, this.sprites.funds, `${snapshot.funds}`, -119, 25, 92);
    this.addStat(hud, this.sprites.turnIncome, `${signed(snapshot.recurringFundsDeltaEstimate)} / 回合`, 0, 25, 132, 16);
    this.addStat(hud, this.sprites.calendar, `${snapshot.month}月`, 126, 25, 86);

    this.addSprite(hud, this.sprites.energy, -149, -31, 28, 28);
    this.addLabel(hud, "供能", -120, -31, 44, 26, 15, BLUE_TEXT, true);
    const barX = -91;
    const barWidth = 206;
    this.paintRounded(hud, barX + barWidth / 2, -31, barWidth, 24, 12, new Color(209, 231, 237, 255));
    const fillWidth = Math.max(0, Math.min(barWidth, barWidth * snapshot.supplyRatio));
    if (fillWidth > 1) this.paintRounded(hud, barX + fillWidth / 2, -31, fillWidth, 24, 12, new Color(55, 205, 212, 255));
    this.addLabel(hud, `${snapshot.effectiveSupplyMw} / ${snapshot.demandMw} MW`, barX + barWidth / 2, -31, barWidth, 24, 14, BLUE_TEXT, true);
    this.addSprite(hud, snapshot.cityFullyEcoSupply ? this.sprites.clean : this.sprites.needsImprovement, 148, -31, 32, 32);
  }

  private drawCityField(snapshot: any, _width: number, _height: number): void {
    const occupied = new Map<string, any>();
    for (const facility of snapshot.facilities) occupied.set(facility.slotId, { ...facility, kind: "facility" });
    for (const project of snapshot.constructionProjects) occupied.set(project.slotId, { ...project, kind: "project" });

    const currentCity = this.regionScreen.getSnapshot().cities.find((city: any) => city.cityId === snapshot.cityId);
    const slotCount = currentCity?.buildSlotCount ?? SLOT_POSITIONS.length;
    SLOT_POSITIONS.slice(0, slotCount).forEach(([x, y], index) => {
      const slotId = `slot-${index + 1}`;
      const slot = this.layer(`BuildSlot-${index + 1}`, this.node, 76, 76, x, y);
      const content = occupied.get(slotId);
      const selected = this.sheetMode !== "closed" && this.selectedSlotId === slotId;
      this.paintRounded(slot, 0, 0, 70, 58, 18, content ? new Color(223, 242, 229, 215) : new Color(223, 236, 233, 220), selected ? new Color(57, 225, 244, 255) : new Color(255, 255, 255, 225), selected ? 4 : 2);

      if (!content) {
        this.addLabel(slot, "+", 0, 1, 54, 54, 34, selected ? CYAN : new Color(48, 187, 211, 255), true);
        this.makeHitTarget(slot, () => this.openBuildSheet(slotId));
        return;
      }
      const facilityId = content.facilityId as FacilityId;
      const frame = content.kind === "facility" ? this.masterSprite(facilityId) : this.thumbnailSprite(facilityId);
      const spriteNode = this.addSprite(slot, frame, 0, 21, facilityId === "wind" ? 82 : 92, facilityId === "wind" ? 112 : 92);
      if (content.kind === "project") {
        spriteNode.getComponent(Sprite)!.color = new Color(255, 255, 255, 132);
        this.addSprite(slot, this.sprites.build, -20, -23, 28, 28);
        this.addLabel(slot, `${content.monthsRemaining}月`, 15, -23, 44, 26, 16, BLUE_TEXT, true);
      } else {
        this.paintRounded(slot, 0, -27, 58, 22, 11, new Color(33, 153, 133, 236));
        this.addLabel(slot, content.tier > 1 ? `${this.levelRoman(content.tier)} · 运行` : "运行中", 0, -27, 56, 22, 14, WHITE, true);
      }
    });
  }

  private drawCapacityStatus(snapshot: any, width: number, height: number): void {
    const y = -height / 2 + 158;
    const gap = 8;
    const chipWidth = (width - 46 - gap) / 2;
    const queueFull = snapshot.globalConstructionQueueActive >= snapshot.globalConstructionQueueMax;
    const slotsFull = snapshot.buildSlotsOccupied >= snapshot.buildSlotsMax;
    const queue = this.layer("GlobalConstructionStatus", this.node, chipWidth, 40, -chipWidth / 2 - gap / 2, y);
    const slots = this.layer("CityBuildSlotStatus", this.node, chipWidth, 40, chipWidth / 2 + gap / 2, y);
    this.paintRounded(queue, 0, 0, chipWidth, 40, 14, queueFull ? new Color(255, 231, 190, 246) : new Color(239, 249, 251, 244), new Color(255, 255, 255, 245), 2);
    this.paintRounded(slots, 0, 0, chipWidth, 40, 14, slotsFull ? new Color(255, 231, 190, 246) : new Color(239, 249, 251, 244), new Color(255, 255, 255, 245), 2);
    this.addLabel(queue, `公司工程队 ${snapshot.globalConstructionQueueActive}/${snapshot.globalConstructionQueueMax}`, 0, 0, chipWidth - 12, 26, 15, queueFull ? new Color(145, 91, 15, 255) : BLUE_TEXT, true);
    this.addLabel(slots, `本城建设位 ${snapshot.buildSlotsOccupied}/${snapshot.buildSlotsMax}`, 0, 0, chipWidth - 12, 26, 15, slotsFull ? new Color(145, 91, 15, 255) : BLUE_TEXT, true);
  }

  private openBuildSheet(slotId: string): void {
    if (this.isSettling()) return;
    const choice = this.cityScreen.getBuildChoice(slotId);
    if (!choice.ok) {
      this.showToast("这个建设位当前不可用");
      this.refresh();
      return;
    }
    this.selectedSlotId = slotId;
    this.selectedFacilityId = (choice.value.candidates[0]?.facilityId ?? "wind") as FacilityId;
    this.sheetMode = "choose";
    this.clearReceipt();
    this.clearToast();
    this.refresh();
    console.warn(`[PLAYABLE-CORE-01] slot selected ${slotId}`);
  }

  private drawBuildSheet(snapshot: any, width: number, height: number): void {
    const sheetHeight = 356;
    const bottom = -height / 2 + 8;
    const centerY = bottom + sheetHeight / 2;
    const sheet = this.layer("BottomContextSheet", this.node, width - 12, sheetHeight, 0, centerY);
    this.paintRounded(sheet, 0, 0, width - 12, sheetHeight, 26, new Color(240, 249, 252, 247), new Color(255, 255, 255, 255), 2);
    this.paintRounded(sheet, 0, sheetHeight / 2 - 10, 54, 5, 3, new Color(102, 170, 199, 155));
    const localTop = sheetHeight / 2;
    const choice = this.cityScreen.getBuildChoice(this.selectedSlotId);
    if (!choice.ok) return;
    const candidate = choice.value.candidates.find((item: any) => item.facilityId === this.selectedFacilityId);
    if (!candidate) return;

    this.addLabel(sheet, "选择能源设施", -98, localTop - 35, 184, 28, 22, BLUE_TEXT, false, 0);
    this.makeTextButton(sheet, "×", 157, localTop - 38, 48, 48, new Color(223, 235, 246, 255), BLUE_TEXT, () => {
      this.sheetMode = "closed";
      this.refresh();
    }, 25);
    choice.value.candidates.forEach((item: any, index: number) => {
      const facilityId = item.facilityId as FacilityId;
      const x = -114 + index * 114;
      const selected = facilityId === this.selectedFacilityId;
      const card = this.layer(`Candidate-${facilityId}`, sheet, 104, 105, x, localTop - 111);
      this.paintRounded(card, 0, 0, 102, 103, 17, selected ? new Color(211, 245, 252, 255) : new Color(250, 253, 255, 255), selected ? CYAN : new Color(175, 205, 220, 255), selected ? 3 : 1);
      this.addSprite(card, this.thumbnailSprite(facilityId), 0, 15, 63, 63);
      this.addLabel(card, this.facilityName(facilityId, item.tier), 0, -32, 96, 25, 16, BLUE_TEXT, true);
      this.makeHitTarget(card, () => {
        this.selectedFacilityId = facilityId;
        this.refresh();
        console.warn(`[PLAYABLE-CORE-01] candidate selected ${facilityId}`);
      });
    });
    const detail = this.layer("SelectedFacilityDetail", sheet, width - 44, 78, 0, localTop - 221);
    this.paintRounded(detail, 0, 0, width - 44, 78, 16, new Color(226, 243, 248, 242));
    this.addLabel(detail, `发电量  ${candidate.effectiveOutputMw} MW`, -86, 18, 150, 24, 16, BLUE_TEXT, false, 0);
    this.addLabel(detail, `建设资金  ${candidate.buildCost}`, 86, 18, 150, 24, 16, BLUE_TEXT, false, 0);
    this.addLabel(detail, `工期  ${candidate.buildMonths} 月`, -86, -18, 150, 24, 16, MUTED_TEXT, false, 0);
    this.addLabel(detail, `每月运维  ${candidate.monthlyOpex}`, 86, -18, 150, 24, 16, MUTED_TEXT, false, 0);
    const label = candidate.enabled
      ? `开工：${this.facilityName(this.selectedFacilityId, candidate.tier)} · 扣 ${candidate.buildCost}`
      : this.disabledReason(candidate.disabledReasonKey, snapshot.funds, candidate.buildCost, choice.value.queueActive, choice.value.queueMax);
    this.makePrimaryButton(sheet, label, 0, -sheetHeight / 2 + 37, width - 44, 58, candidate.enabled, () => this.confirmBuild(candidate));
  }

  private confirmBuild(candidate: any): void {
    const result = this.cityScreen.queueConstruction(candidate.facilityId, candidate.tier, this.selectedSlotId);
    if (!result.ok || !result.value.result.ok) {
      this.showToast(this.buildFailureMessage(result, candidate));
      this.sheetMode = "choose";
      this.refresh();
      return;
    }
    this.sheetMode = "closed";
    this.showToast(`${this.facilityName(this.selectedFacilityId, candidate.tier)} 已开工 · ${candidate.buildMonths}月`);
    this.refresh();
    const queuedProject = result.value.after.constructionProjects.find((project: any) => project.facilityId === candidate.facilityId);
    console.warn(`[PLAYABLE-CORE-01] construction queued ${candidate.facilityId} requested=${this.selectedSlotId} actual=${queuedProject?.slotId ?? "missing"}`);
  }

  private drawCityEntries(snapshot: any, height: number): void {
    const y = -height / 2 + 104;
    this.makeTextButton(this.node, "公司", -122, y, 104, 48, new Color(236, 247, 252, 248), BLUE_TEXT, () => {
      this.openCompany();
      console.warn("[PLAYABLE-CORE-02] company entry opened");
    }, 16);
    const technologyUnlocked = snapshot.companyLevel >= 2;
    const technology = this.techScreen.getSnapshot();
    const thermal2 = technology.technologies.find((item: any) => item.techId === "thermal_2");
    const regionalTech = technology.technologies.find((item: any) => item.techId === "grid_regional");
    const techEntryLabel = technology.activeResearch
      ? `${technology.activeResearch.techId === "grid_regional" ? "电网" : "科技"} · ${technology.activeResearch.monthsRemaining}月`
      : regionalTech?.status === "lit"
        ? "科技 · 电网"
        : thermal2?.status === "lit"
        ? "科技 · 火电II"
        : technologyUnlocked
          ? "科技 · 已开放"
          : "科技 · II级";
    this.makeTextButton(
      this.node,
      techEntryLabel,
      0,
      y,
      104,
      48,
      technologyUnlocked ? new Color(205, 247, 244, 250) : new Color(207, 218, 224, 245),
      technologyUnlocked ? new Color(18, 112, 105, 255) : MUTED_TEXT,
      () => {
        if (technologyUnlocked) this.openTech();
        else {
          this.showToast("公司达到 II 级后开放科技研发");
          this.refresh();
        }
        console.warn(`[PLAYABLE-CORE-03] technology entry ${technologyUnlocked ? "opened" : "locked"}`);
      },
      14
    );
    const region = this.regionScreen.getSnapshot();
    const regionalLink = region.gridLinks.find((item: any) => item.linkType === "region");
    const regionLabel = regionalLink?.status === "finished"
      ? "区域 · 已并网"
      : regionalLink?.status === "building"
        ? "区域 · 施工中"
        : region.canOpen
          ? "区域 · 已开放"
          : snapshot.companyLevel < 3
            ? "区域 · III级"
            : "区域 · 待研发";
    this.makeTextButton(
      this.node,
      regionLabel,
      122,
      y,
      104,
      48,
      region.canOpen ? new Color(205, 247, 244, 250) : new Color(207, 218, 224, 245),
      region.canOpen ? new Color(18, 112, 105, 255) : MUTED_TEXT,
      () => {
        if (region.canOpen) {
          this.openRegion();
        } else {
          this.showToast(region.entryGate === "company_level_3" ? "公司达到 III 级后开放区域电网研发" : "请先在科技页点亮区域电网");
          this.refresh();
        }
        console.warn(`[PLAYABLE-CORE-04] region entry ${region.canOpen ? "opened" : region.entryGate}`);
      },
      14
    );
  }

  private drawNextMonthButton(width: number, height: number): void {
    this.makePrimaryButton(this.node, this.isSettling() ? "结算中…" : "下一月  →", 0, -height / 2 + 44, width - 38, 54, !this.isSettling(), () => this.advanceMonth());
  }

  private advanceMonth(): void {
    if (this.isSettling()) return;
    this.setSettling(true);
    this.clearToast();
    this.clearReceipt();
    const result = this.cityScreen.advanceOneMonth();
    this.refresh();
    this.scheduleOnce(() => {
      this.setSettling(false);
      if (!result.ok) {
        this.showToast("月结失败，请重试");
      } else {
        this.setReceipt(result.value);
        if (result.value.growth.levelsGained > 0) this.setLevelUpDetail(result.value);
        const completion = result.value.projectUpdates.find((update: any) => update.state === "completed");
        const researchCompletion = result.value.research.completed[0];
        const tierChange = result.value.research.facilityTierChanges[0];
        console.warn(`[PLAYABLE-CORE-03] month ${result.value.monthTo} settled funds=${signed(result.value.delta.funds)} supply=${result.value.before.effectiveSupplyMw}->${result.value.after.effectiveSupplyMw} exp=${result.value.growth.expBefore}->${result.value.growth.expAfter} level=${result.value.growth.levelBefore}->${result.value.growth.levelAfter} construction=${completion?.facilityId ?? "none"} research=${researchCompletion?.techId ?? "none"} tier=${tierChange ? `${tierChange.tierBefore}->${tierChange.tierAfter}` : "none"}`);
      }
      this.refresh();
    }, 0.34);
  }

  private disabledReason(reason: string | undefined, funds: number, cost: number, queueActive = 0, queueMax = 0): string {
    if (reason === "insufficient_funds") return `资金不足 · 还差 ${Math.max(0, cost - funds)}`;
    if (reason === "queue_full") return `公司工程队已满 · ${queueActive}/${queueMax}`;
    if (reason === "slot_occupied") return "本建设位已被占用";
    if (reason === "slots_full") return "本城建设位已满";
    return "结算中";
  }

  private buildFailureMessage(action: any, candidate: any): string {
    const result = action?.value?.result;
    if (result?.error === "insufficient_funds") {
      const snapshot = this.cityScreen.getSnapshot();
      return `资金不足 · 还差 ${Math.max(0, candidate.buildCost - (snapshot?.funds ?? 0))}`;
    }
    if (result?.error === "conflict_in_progress" && result.message === "global construction queue full") {
      return `公司工程队已满 · ${result.context?.queue_active ?? 3}/${result.context?.queue_max ?? 3}`;
    }
    if (result?.error === "conflict_in_progress" && result.message === "city build slots full") return "本城建设位已满";
    if (result?.error === "conflict_in_progress") return "该设施当前不能重复建设";
    if (result?.error === "not_unlocked") return "设施或科技尚未解锁";
    if (result?.error === "invalid_command_payload") return "本建设位当前不可用";
    return "建设失败，请稍后重试";
  }
}
