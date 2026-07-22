import {
  _decorator,
  Component,
  ResolutionPolicy,
  UITransform,
  error as logError,
  log,
  view
} from "cc";
import {
  clearMountedGameClient,
  ensureChineseDefaultForDev,
  mountGameClient,
  setMountedGameClient
} from "../shared/game-client.mjs";
import { CityView } from "./CityView";
import { CompanyView } from "./CompanyView";
import { loadPlayableConfig } from "./loadPlayableConfig";
import { Overlays } from "./Overlays";
import { loadSpriteCatalog } from "./PlayableAssets";
import { RegionView } from "./RegionView";
import { TechView } from "./TechView";
import { renderFatalUi } from "./UiFactory";

const { ccclass } = _decorator;

type ViewMode = "city" | "company" | "tech" | "region";

@ccclass("CityPlayableRoot")
export class CityPlayableRoot extends Component {
  private viewMode: ViewMode = "city";
  private cityView: CityView | null = null;
  private companyView: CompanyView | null = null;
  private techView: TechView | null = null;
  private regionView: RegionView | null = null;
  private overlays: Overlays | null = null;

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
      const client = mountGameClient({ configRepo });
      setMountedGameClient(client);
      const cityScreen = client.app.screens.city("CITY-START");
      const companyScreen = client.app.screens.company;
      const techScreen = client.app.screens.tech;
      const regionScreen = client.app.screens.region("MAP-01");

      this.overlays = new Overlays({
        node: this.node,
        sprites,
        refresh: () => this.render(),
        openCompany: () => this.showCompany()
      });
      this.cityView = new CityView({
        node: this.node,
        sprites,
        cityScreen,
        techScreen,
        regionScreen,
        refresh: () => this.render(),
        openCompany: () => this.showCompany(true),
        openTech: () => this.showTech(),
        openRegion: () => this.showRegion(),
        switchCity: (cityId) => {
          const nextCityScreen = client.app.screens.city(cityId);
          if (!nextCityScreen.getSnapshot()) {
            this.overlays?.setToast("这座城市当前还不能经营");
            this.render();
            return;
          }
          this.cityView?.setCityScreen(nextCityScreen);
          this.render();
        },
        showToast: (message) => this.overlays!.setToast(message),
        clearToast: () => this.overlays!.clearToast(),
        clearReceipt: () => this.overlays!.clearReceipt(),
        setReceipt: (detail) => this.overlays!.setReceipt(detail),
        setLevelUpDetail: (detail) => this.overlays!.setLevelUpDetail(detail),
        setSettling: (settling) => this.overlays!.setSettling(settling),
        isSettling: () => this.overlays!.isSettling(),
        scheduleOnce: (callback, delaySeconds) => this.scheduleOnce(callback, delaySeconds)
      });
      this.companyView = new CompanyView({
        node: this.node,
        sprites,
        companyScreen,
        returnToCity: (toast) => this.showCity(toast)
      });
      this.techView = new TechView({
        node: this.node,
        sprites,
        techScreen,
        refresh: () => this.render(),
        showToast: (message) => this.overlays!.setToast(message),
        returnToCity: (toast) => this.showCity(toast)
      });
      this.regionView = new RegionView({
        node: this.node,
        sprites,
        regionScreen,
        refresh: () => this.render(),
        showToast: (message) => this.overlays!.setToast(message),
        returnToCity: (toast) => this.showCity(toast)
      });

      this.render();
      log("[PLAYABLE-CORE-04] ready v1: representative regional grid slice");
      console.warn("[PLAYABLE-CORE-04] ready v1");
    } catch (mountError) {
      const message = mountError instanceof Error ? mountError.message : String(mountError);
      logError("[PLAYABLE-CORE-01] mount failed", mountError);
      this.renderFatal(message);
    }
  }

  private showCity(toast = ""): void {
    this.viewMode = "city";
    this.overlays?.clearReceipt();
    this.overlays?.setToast(toast);
    this.render();
  }

  private showCompany(clearFeedback = false): void {
    this.viewMode = "company";
    if (clearFeedback) {
      this.overlays?.clearReceipt();
      this.overlays?.clearToast();
    }
    this.render();
  }

  private showTech(): void {
    this.viewMode = "tech";
    this.overlays?.clearReceipt();
    this.overlays?.clearToast();
    this.techView?.resetSelection();
    this.render();
  }

  private showRegion(): void {
    this.viewMode = "region";
    this.overlays?.clearReceipt();
    this.overlays?.clearToast();
    this.regionView?.resetSelection();
    this.render();
  }

  private render(): void {
    if (!this.cityView || !this.companyView || !this.techView || !this.regionView || !this.overlays) return;
    this.node.removeAllChildren();
    const size = view.getVisibleSize();
    const width = size.width;
    const height = size.height;
    this.node.getComponent(UITransform)?.setContentSize(width, height);

    if (this.viewMode === "company") {
      this.companyView.render(width, height);
      return;
    }
    if (this.viewMode === "tech") {
      this.techView.render(width, height);
      this.overlays.render(width, height, {
        receipt: false,
        toast: true,
        settling: false,
        levelUp: false
      });
      return;
    }
    if (this.viewMode === "region") {
      this.regionView.render(width, height);
      this.overlays.render(width, height, {
        receipt: false,
        toast: true,
        settling: false,
        levelUp: false
      });
      return;
    }

    const snapshot = this.cityView.getSnapshot();
    if (!snapshot) {
      this.renderFatal("当前城市不存在");
      return;
    }
    this.cityView.render(snapshot, width, height);
    this.overlays.render(width, height, {
      receipt: this.cityView.isSheetClosed(),
      toast: true,
      settling: true,
      levelUp: true
    });
  }

  private renderFatal(message: string): void {
    this.node.removeAllChildren();
    const size = view.getVisibleSize();
    renderFatalUi(this.node, message, size.width, size.height);
  }
}
