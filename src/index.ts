import ChartDataManager from "./main/chart-data-manager";
import LocalStore from "./local-store/store";
import Queue from "./utils/queue";
import {
  getSessionTimeFromCurrentRule,
  getHolidaySessionFromMarketRules,
  getHolidaysStringFromMarketRules,
  TradingViewCandle,
  convertCandleToTradingViewCandle,
  convertTradingViewCandleToCandle,
} from "./utils/trading-view";
import {
  saveLayout,
  convertCandleToChartIQCandle,
  ChartIQCandle,
  updateBroadcastCandleWithRealTimeChartUpdates,
  changeSymbol,
  convertTimeFrameToSpanForChartIQ,
  convertPeriodAndIntervalToResolution,
  convertChartIQCandleToCandle,
} from "./utils/chartiq";
import { updateURLState, convertObjectToURLString } from "./utils/url";
import {
  getBasicWebpackConfigForChartIQ,
  getBasicWebpackConfigForTradingView,
} from "./config/webpack";
import MarketRule from "./market/rules";
import ApiRequestor from "./feeds/apiRequestor";

//Main exports
export { ChartDataManager, LocalStore, Queue, MarketRule, ApiRequestor };
//Trading view utils export
export {
  getHolidaysStringFromMarketRules,
  getSessionTimeFromCurrentRule,
  getHolidaySessionFromMarketRules,
  TradingViewCandle,
  convertCandleToTradingViewCandle,
  convertTradingViewCandleToCandle,
};
//Chartiq utils export
export {
  saveLayout,
  updateBroadcastCandleWithRealTimeChartUpdates,
  ChartIQCandle,
  convertCandleToChartIQCandle,
  changeSymbol,
  convertTimeFrameToSpanForChartIQ,
  convertPeriodAndIntervalToResolution,
  convertChartIQCandleToCandle,
};
//URL's related utilities
export { updateURLState, convertObjectToURLString };
//Configuration related exports
export { getBasicWebpackConfigForChartIQ, getBasicWebpackConfigForTradingView };
