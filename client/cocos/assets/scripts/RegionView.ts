import { Color, Graphics, Node } from "cc";
import type { SpriteCatalog } from "./PlayableAssets";
import { BLUE_TEXT, CYAN, MUTED_TEXT, UiFactory, WHITE, YELLOW } from "./UiFactory";

const REPRESENTATIVE_CITY_IDS = ["CITY-START", "CITY-MAP01-02"] as const;

export interface RegionViewOptions {
  node: Node;
  sprites: SpriteCatalog;
  regionScreen: any;
  refresh: () => void;
  showToast: (message: string) => void;
  returnToCity: (toast: string) => void;
}

export class RegionView extends UiFactory {
  private readonly regionScreen: any;
  private readonly refresh: () => void;
  private readonly showToast: (message: string) => void;
  private readonly returnToCity: (toast: string) => void;
  private selectedCityIds: string[] = [];

  constructor(options: RegionViewOptions) {
    super(options.node, options.sprites);
    this.regionScreen = options.regionScreen;
    this.refresh = options.refresh;
    this.showToast = options.showToast;
    this.returnToCity = options.returnToCity;
  }

  resetSelection(): void {
    this.selectedCityIds = [];
  }

  render(width: number, height: number): void {
    const snapshot = this.regionScreen.getSnapshot();
    const cities = REPRESENTATIVE_CITY_IDS
      .map((cityId) => snapshot.cities.find((city: any) => city.cityId === cityId))
      .filter(Boolean);
    const link = snapshot.gridLinks.find((item: any) =>
      item.linkType === "region" &&
      REPRESENTATIVE_CITY_IDS.includes(item.fromCityId) &&
      REPRESENTATIVE_CITY_IDS.includes(item.toCityId)
    );
    const candidate = snapshot.linkCandidates.find((item: any) =>
      item.linkType === "region" &&
      REPRESENTATIVE_CITY_IDS.includes(item.fromCityId) &&
      REPRESENTATIVE_CITY_IDS.includes(item.toCityId)
    );
    const top = height / 2;

    this.drawBackdrop(width, height);
    this.makeTextButton(
      this.node,
      "‹",
      -width / 2 + 42,
      top - 43,
      48,
      48,
      new Color(236, 248, 252, 248),
      BLUE_TEXT,
      () => this.returnToCity(""),
      31
    );
    this.addLabel(this.node, "澄湾区域电网", -16, top - 43, 212, 36, 24, WHITE, false, 0);
    this.addLabel(this.node, `第 ${snapshot.month} 月 · 资金 ${snapshot.funds}`, width / 2 - 104, top - 79, 180, 26, 15, WHITE, false, 2);

    const goal = this.layer("RegionGoal", this.node, width - 32, 62, 0, top - 125);
    this.paintRounded(goal, 0, 0, width - 32, 62, 18, new Color(241, 251, 253, 246), new Color(255, 255, 255, 255), 2);
    this.addLabel(goal, link?.status === "finished" ? "目标完成 · 两城已并网调剂" : "当前目标 · 选择两城并建设区域线", 0, 13, width - 64, 25, 17, BLUE_TEXT, true);
    this.addLabel(goal, "区域页不推进时间 · 线路开工后返回城市进入下一月", 0, -14, width - 64, 23, 14, MUTED_TEXT, true);

    const map = this.layer("RepresentativeRegionMap", this.node, width - 32, 304, 0, top - 318);
    this.paintRounded(map, 0, 0, width - 32, 304, 24, new Color(229, 248, 243, 246), new Color(138, 231, 211, 230), 2);
    this.drawTerrain(map, width - 32);
    this.drawGridLine(map, link);
    cities.forEach((city: any, index: number) => this.drawCityNode(map, city, index, !!link));
    this.drawMapStatus(map, link, candidate, width - 32);

    this.drawDetail(snapshot, cities, link, candidate, width, height);
  }

  private drawBackdrop(width: number, height: number): void {
    this.paintRect(this.node, 0, 0, width, height, new Color(23, 119, 151, 255));
    const backdrop = this.layer("RegionBackdrop", this.node, width, height, 0, 0);
    const g = backdrop.addComponent(Graphics);
    g.fillColor = new Color(37, 161, 174, 255);
    g.circle(-width * 0.42, height * 0.24, 210);
    g.fill();
    g.fillColor = new Color(24, 100, 143, 255);
    g.circle(width * 0.5, -height * 0.34, 290);
    g.fill();
  }

  private drawTerrain(parent: Node, width: number): void {
    const terrain = this.layer("RegionTerrain", parent, width - 20, 278, 0, 0);
    const g = terrain.addComponent(Graphics);
    g.fillColor = new Color(149, 220, 161, 96);
    g.ellipse(-56, 35, width * 0.72, 210);
    g.fill();
    g.fillColor = new Color(86, 190, 178, 70);
    g.ellipse(104, -26, width * 0.48, 156);
    g.fill();
  }

  private drawGridLine(parent: Node, link: any): void {
    const line = this.layer("RegionalGridLine", parent, 226, 36, 0, 55);
    const g = line.addComponent(Graphics);
    const finished = link?.status === "finished";
    const building = link?.status === "building";
    g.strokeColor = finished ? CYAN : building ? YELLOW : new Color(96, 137, 151, 180);
    g.lineWidth = finished ? 8 : 6;
    if (finished) {
      g.moveTo(-86, 0);
      g.lineTo(86, 0);
      g.stroke();
      return;
    }
    for (let x = -86; x < 86; x += 24) {
      g.moveTo(x, 0);
      g.lineTo(Math.min(x + 13, 86), 0);
    }
    g.stroke();
  }

  private drawCityNode(parent: Node, city: any, index: number, linkExists: boolean): void {
    const x = index === 0 ? -104 : 104;
    const selectedIndex = this.selectedCityIds.indexOf(city.cityId);
    const selected = selectedIndex >= 0;
    const card = this.layer(`RegionCity-${city.cityId}`, parent, 126, 154, x, 48);
    this.paintRounded(
      card,
      0,
      0,
      120,
      148,
      22,
      selected ? new Color(218, 249, 248, 255) : new Color(247, 253, 253, 250),
      selected ? CYAN : new Color(255, 255, 255, 255),
      selected ? 4 : 2
    );
    const marker = this.layer("CityMarker", card, 64, 64, 0, 29);
    const g = marker.addComponent(Graphics);
    g.fillColor = index === 0 ? new Color(38, 145, 194, 255) : new Color(28, 166, 139, 255);
    g.circle(0, 0, 29);
    g.fill();
    g.strokeColor = WHITE;
    g.lineWidth = 3;
    g.circle(0, 0, 29);
    g.stroke();
    this.addLabel(marker, index === 0 ? "中心" : "光伏", 0, 0, 56, 26, 15, WHITE, true);
    this.addLabel(card, index === 0 ? "澄湾能源城" : "晴湾光伏城", 0, -18, 112, 24, 16, BLUE_TEXT, true);
    this.addLabel(card, `供能 ${city.effectiveSupplyMw}/${city.demandMw}`, 0, -43, 112, 22, 14, MUTED_TEXT, true);
    this.addLabel(
      card,
      linkExists ? this.flowText(city.netImportMw) : selected ? (selectedIndex === 0 ? "起点" : "终点") : "点选城市",
      0,
      -65,
      110,
      21,
      14,
      selected ? new Color(18, 112, 105, 255) : MUTED_TEXT,
      true
    );
    if (!linkExists) this.makeHitTarget(card, () => this.selectCity(city.cityId));
  }

  private drawMapStatus(parent: Node, link: any, candidate: any, width: number): void {
    const text = link?.status === "finished"
      ? `✓ 已并网 · 固定线损 ${link.lossMw} MW`
      : link?.status === "building"
        ? `施工中 · 剩 ${link.monthsRemaining} 月 · 尚未连通`
        : this.selectedCityIds.length === 2
          ? `方案就绪 · 成本 ${candidate?.cost ?? 0} · 工期 1 月 · 线损 ${candidate?.lossMw ?? 0} MW`
          : this.selectedCityIds.length === 1
            ? "已选起点 · 请再选择一座城市"
            : "依次点选两座城市，线路方案会在下方展开";
    this.paintRounded(parent, 0, -111, width - 42, 48, 15, new Color(239, 249, 251, 246));
    this.addLabel(parent, text, 0, -111, width - 58, 30, 15, BLUE_TEXT, true);
  }

  private drawDetail(snapshot: any, cities: any[], link: any, candidate: any, width: number, height: number): void {
    const detailY = -height / 2 + 190;
    const detail = this.layer("RegionActionDetail", this.node, width - 32, 220, 0, detailY);
    this.paintRounded(detail, 0, 0, width - 32, 220, 22, new Color(245, 251, 255, 250), new Color(142, 232, 222, 255), 2);

    if (link?.status === "finished") {
      const totalLocal = cities.reduce((sum, city) => sum + city.localSupplyMw, 0);
      const ratio = Math.round((cities[0]?.supplyRatio ?? 0) * 100);
      this.addLabel(detail, "并网调剂已生效", 0, 83, width - 72, 30, 21, BLUE_TEXT, false, 0);
      this.addLabel(detail, `可用电力：本地 ${totalLocal} - 线损 ${link.lossMw} = ${Math.max(0, totalLocal - link.lossMw)} MW`, 0, 48, width - 72, 26, 16, MUTED_TEXT, false, 0);
      this.paintRounded(detail, 0, 6, width - 68, 54, 15, new Color(225, 247, 242, 255));
      this.addLabel(detail, `两城统一满足率 ${ratio}% · 按需求比例分配`, 0, 6, width - 84, 31, 18, new Color(18, 112, 105, 255), true);
      this.addLabel(detail, `${this.cityAllocationText(cities[0], "澄湾")}   ·   ${this.cityAllocationText(cities[1], "晴湾")}`, 0, -39, width - 72, 25, 15, BLUE_TEXT, true);
      this.addLabel(detail, "线路先扣固定损耗；调入/外送由同一并网岛自动计算", 0, -72, width - 72, 24, 14, MUTED_TEXT, true);
      this.makePrimaryButton(this.node, "返回城市 · 继续经营", 0, -height / 2 + 48, width - 38, 58, true, () => this.returnToCity("区域线已完工 · 两城供能按统一满足率调剂"));
      return;
    }

    if (link?.status === "building") {
      this.addLabel(detail, "区域线施工中", 0, 82, width - 72, 30, 21, BLUE_TEXT, false, 0);
      this.addLabel(detail, `已扣 ${link.buildCost ?? candidate?.cost ?? 0} 资金 · 剩 ${link.monthsRemaining} 月`, 0, 47, width - 72, 26, 17, BLUE_TEXT, false, 0);
      this.paintRounded(detail, 0, 3, width - 68, 54, 15, new Color(255, 242, 205, 255));
      this.addLabel(detail, "在建线路不连通、不计线损、不参与供能", 0, 3, width - 82, 31, 17, new Color(111, 76, 16, 255), true);
      this.addLabel(detail, "返回城市推进下一月：M2 完工 → M4 供能重算", 0, -47, width - 72, 25, 15, MUTED_TEXT, true);
      this.addLabel(detail, "完成后再打开区域地图查看两城调剂结果", 0, -76, width - 72, 23, 14, MUTED_TEXT, true);
      this.makePrimaryButton(this.node, "返回城市 · 推进下一月", 0, -height / 2 + 48, width - 38, 58, true, () => this.returnToCity("区域线施工中 · 下一月完工并参与调剂"));
      return;
    }

    this.addLabel(detail, this.selectedCityIds.length === 2 ? "确认区域线方案" : "选择两座城市", 0, 82, width - 72, 30, 21, BLUE_TEXT, false, 0);
    this.addLabel(detail, "门槛  公司 III 级 + 区域电网科技", 0, 49, width - 72, 24, 15, MUTED_TEXT, false, 0);
    const rows = [
      ["建设成本", `${snapshot.funds} → ${snapshot.funds - (candidate?.cost ?? 0)}`],
      ["建设工期", "1 个月"],
      ["固定线损", `${candidate?.lossMw ?? 0} MW`]
    ];
    rows.forEach(([label, value], index) => {
      const x = -112 + index * 112;
      this.paintRounded(detail, x, 2, 100, 58, 14, new Color(231, 244, 249, 255));
      this.addLabel(detail, label, x, 16, 92, 22, 14, MUTED_TEXT, true);
      this.addLabel(detail, value, x, -8, 94, 24, 16, BLUE_TEXT, true);
    });
    this.addLabel(detail, "完工后的 M4 才会按相同满足率调剂可用电力", 0, -52, width - 72, 24, 15, BLUE_TEXT, true);
    this.addLabel(detail, "在建期间两城保持独立供能", 0, -79, width - 72, 22, 14, MUTED_TEXT, true);

    const canConfirm = this.selectedCityIds.length === 2 && !!candidate?.available && snapshot.funds >= (candidate?.cost ?? 0);
    const buttonLabel = this.selectedCityIds.length < 2
      ? "先在地图上选择两座城市"
      : snapshot.funds < (candidate?.cost ?? 0)
        ? `资金不足 · 还差 ${(candidate?.cost ?? 0) - snapshot.funds}`
        : `确认建设 · 扣 ${candidate?.cost ?? 0}`;
    this.makePrimaryButton(this.node, buttonLabel, 0, -height / 2 + 48, width - 38, 58, canConfirm, () => this.confirmLink(candidate));
  }

  private selectCity(cityId: string): void {
    if (this.selectedCityIds.length === 0) {
      this.selectedCityIds = [cityId];
    } else if (this.selectedCityIds.length === 1) {
      this.selectedCityIds = this.selectedCityIds[0] === cityId ? [] : [this.selectedCityIds[0], cityId];
    } else {
      this.selectedCityIds = [cityId];
    }
    this.refresh();
    console.warn(`[PLAYABLE-CORE-04] region city selected ids=${this.selectedCityIds.join(",") || "none"}`);
  }

  private confirmLink(candidate: any): void {
    if (!candidate?.available) return;
    const action = this.regionScreen.queueGridLink(candidate.fromCityId, candidate.toCityId, "region");
    if (!action.result.ok) {
      this.showToast(action.result.error === "insufficient_funds" ? "资金不足，无法建设区域线" : "当前不能建设这条区域线");
      this.refresh();
      return;
    }
    this.showToast("");
    this.refresh();
    console.warn(`[PLAYABLE-CORE-04] regional link queued id=${action.after.gridLinks[0]?.linkId ?? "missing"} funds=${action.before.funds}->${action.after.funds}`);
  }

  private flowText(netImportMw: number): string {
    if (netImportMw > 0) return `调入 ${netImportMw} MW`;
    if (netImportMw < 0) return `外送 ${Math.abs(netImportMw)} MW`;
    return "本地平衡";
  }

  private cityAllocationText(city: any, label: string): string {
    if (!city) return `${label} --`;
    return `${label} ${city.effectiveSupplyMw}/${city.demandMw} MW`;
  }
}
