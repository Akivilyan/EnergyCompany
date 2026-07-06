export interface ClientHudDisplay {
  /** 首行摘要，供 CLI/冒烟断言。 */
  statusLine: string;
  detailLine: string;
  /** 多行状态，供 Cocos 开发 HUD 展示。 */
  statusLines: string[];
  detailLines: string[];
}
