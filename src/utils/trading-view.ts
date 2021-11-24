import { Candle } from "../feeds/utils";
import MarketRule from "../market/rules";
/**
 * @category Trading-View-Utils
 * @method getSessionTimeFromCurrentRule
 * @description Returns a session timing acceptable by Trading-View for provided market rule
 * For default session pass the rules list's first rule
 * @param {MarketRule} rule - rule to generate the session for
 * @returns {string}
 */
export function getSessionTimeFromCurrentRule(rule: MarketRule): string {
  if (rule.open && rule.close) {
    return `${rule.open.replace(/:/g, "")}:${rule.close.replace(/:/g, "")}`;
  }
  return "";
}
/**
 * @category Trading-View-Utils
 * @method getHolidaySessionFromMarketRules
 * @description Returns a string which will passed to corrections inside resolveSymbol for Trading-View
 * Specifies the valid session time for holiday
 * @param {Array<MarketRules>} rules - list of rules
 * @returns {string}
 */
export function getHolidaySessionFromMarketRules(
  rules: Array<MarketRule>
): string {
  return rules
    .filter((rule: MarketRule) => !rule.dayofweek)
    .filter((rule: MarketRule) => !rule.name)
    .filter((rule: MarketRule) => rule.open && rule.close)
    .map(
      (rule: MarketRule) =>
        `${getSessionTimeFromCurrentRule(rule)}:${rule.date?.replace(/-/g, "")}`
    )
    .join(";");
}
/**
 * @category Trading-View-Utils
 * @method getHolidaysStringFromMarketRules
 * @description Returns the list of holidays, So the trading view's chart doesn't plot those dates on chart
 * @param {Array<MarketRule>} rules - list of rules
 * @returns {string}
 */
export function getHolidaysStringFromMarketRules(
  rules: Array<MarketRule>
): string {
  return rules
    .filter(
      (rule: MarketRule) => rule.date && rule.name && !rule.open && !rule.close
    )
    .map((rule: MarketRule) => rule.date?.replace(/-/g, ""))
    .join(",");
}
/**
 * @category Trading-View-Utils
 * @description Trading View's candle format
 * @interface TradingViewCandle
 * @property {number} time - current time in millisecond
 * @property {number} open - open
 * @property {number} close - close
 * @property {number} low - low
 * @property {number} high - high
 * @property {number} [volume] - volume optional
 */
export interface TradingViewCandle {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
}
/**
 * @category Trading-View-Utils
 * @method convertCandleToTradingViewCandle
 * @description Converts regular candle into Trading-view' acceptable format
 * @param {Candle} candle - candle provide by API
 * @returns {TradingViewCandle}
 */
export function convertCandleToTradingViewCandle(
  candle: Candle
): TradingViewCandle {
  return {
    time: candle.date?.getTime() || Date.now(),
    open: candle.open,
    close: candle.close,
    high: candle.high,
    low: candle.low,
    volume: candle.volume,
  };
}
