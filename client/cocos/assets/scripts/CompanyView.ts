import { Color, Graphics, Node } from "cc";
import type { SpriteCatalog } from "./PlayableAssets";
import { BLUE_TEXT, MUTED_TEXT, UiFactory, WHITE } from "./UiFactory";

export interface CompanyViewOptions {
  node: Node;
  sprites: SpriteCatalog;
  companyScreen: any;
  returnToCity: (toast: string) => void;
}

export class CompanyView extends UiFactory {
  private readonly companyScreen: any;
  private readonly returnToCity: (toast: string) => void;

  constructor(options: CompanyViewOptions) {
    super(options.node, options.sprites);
    this.companyScreen = options.companyScreen;
    this.returnToCity = options.returnToCity;
  }

  render(width: number, height: number): void {
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
      () => this.returnToCity(company.gridRegionalLit ? "区域地图入口已开放" : growth.level >= 3 ? "区域电网研发节点已开放" : growth.entries.technology.unlocked ? "科技入口已按公司 II 级刷新" : ""),
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
    this.addSprite(hero, this.sprites.companyExp, -20, 35, 34, 34);
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
    this.addLabel(unlock, growth.level >= 3 ? "III 级区域能力" : growth.level >= 2 ? "II 级已解锁" : "下一等级将解锁", 0, 53, width - 76, 28, 19, BLUE_TEXT, false, 0);
    if (growth.level >= 3) {
      this.addLabel(unlock, "✓ 区域电网研发节点", 0, 16, width - 76, 26, 17, new Color(18, 112, 105, 255), false, 0);
      this.addLabel(unlock, company.gridRegionalLit ? "✓ 区域地图与区内建线入口" : "○ 点亮区域电网后开放地图入口", 0, -17, width - 76, 26, 16, BLUE_TEXT, false, 0);
      this.addLabel(unlock, company.gridRegionalLit ? "下一步：返回城市，进入区域地图" : "下一步：返回城市，进入科技 → 电网技术", 0, -52, width - 76, 26, 16, MUTED_TEXT, false, 0);
    } else if (growth.level >= 2) {
      this.addLabel(unlock, "✓ 科技研发入口", 0, 16, width - 76, 26, 17, new Color(18, 112, 105, 255), false, 0);
      this.addLabel(unlock, "✓ 起始省新增 2 座可经营城市", 0, -17, width - 76, 26, 16, BLUE_TEXT, false, 0);
      this.addLabel(unlock, "下一步：返回城市，进入科技研发", 0, -52, width - 76, 26, 16, MUTED_TEXT, false, 0);
    } else {
      this.addLabel(unlock, "达到 1 EXP → 公司 II 级", 0, 10, width - 76, 28, 17, BLUE_TEXT, false, 0);
      this.addLabel(unlock, "继续经营城市并推进月份", 0, -27, width - 76, 28, 16, MUTED_TEXT, false, 0);
    }

    this.makePrimaryButton(
      this.node,
      company.gridRegionalLit ? "返回城市 · 打开区域地图" : growth.level >= 3 ? "返回城市 · 研发区域电网" : growth.entries.technology.unlocked ? "返回城市 · 查看已开放科技入口" : "返回城市继续经营",
      0,
      -height / 2 + 48,
      width - 38,
      58,
      true,
      () => {
        this.returnToCity(company.gridRegionalLit ? "区域地图入口已开放" : growth.level >= 3 ? "区域电网研发节点已开放" : growth.entries.technology.unlocked ? "科技研发入口已开放" : "");
        console.warn(
          `[PLAYABLE-CORE-02] company closed level=${growth.levelRoman} exp=${growth.expCurrent}`
        );
      }
    );
  }
}
