import { Candle, checkIsDailyTicks } from "../feeds/utils";

/**
 * @category Chart-IQ-Utils
 * @method saveLayout
 * @description Function can be called inside saveLayout which will be called every time layout event listener
 * is triggered also, doesn't nullifies the setSpan property for the layout
 * @param {any} stx - Chart engine object which will passed inside saveLayout event callback function as a param
 * @param {any} localLayout - Local variable which handles the previous stored layout
 * @returns {any}
 */
export function saveLayout(stx: any, localLayout: any): any {
  localLayout = { ...localLayout };
  let newLayout = stx.exportLayout();
  if (
    newLayout &&
    newLayout.setSpan &&
    JSON.stringify(newLayout.setSpan) !== "{}"
  ) {
    localLayout = { ...newLayout };
  } else {
    return (localLayout = { ...newLayout, setSpan: localLayout.setSpan });
  }
  return localLayout;
}
/**
 * @category Chart-IQ-Utils
 * @method updateBroadcastCandleWithRealTimeChartUpdates
 * @description Updates the rela time candles on chart showing every second updates
 * @param {any} stx - Chart engine's object
 * @param {BroadcastCandle} broadCastCandle - Broadcast candle's format
 */
export function updateBroadcastCandleWithRealTimeChartUpdates(
  stx: any,
  broadCastCandle: ChartIQCandle
): void {
  stx.updateChartData(broadCastCandle, stx, {
    bypassGovernor: true,
  });
}
/**
 * @category Chart-IQ-Utils
 * @description Chart-IQ's candle structure
 * @interface ChartIQCandle
 * @property {Date} DT - Date
 * @property {number} Open - Open value
 * @property {number} Close - Close value
 * @property {number} High - High value
 * @property {number} Low - Low value
 * @property {number} [Volume] - Volume optional value
 */
export interface ChartIQCandle {
  DT: Date;
  Open: number;
  Close: number;
  Volume?: number;
  High: number;
  Low: number;
}
/**
 * @category Chart-IQ-Utils
 * @method convertCandleToChartIQCandle
 * @description Converts regular candle from API to Chart IQ's acceptable format
 * @param {Candle} candle - candle provided by API
 * @returns {ChartIQCandle}
 */
export function convertCandleToChartIQCandle(candle: Candle): ChartIQCandle {
  return {
    DT: candle.date || new Date(),
    Open: candle.open,
    Close: candle.close,
    High: candle.high,
    Low: candle.low,
    Volume: candle.volume,
  };
}
/**
 * @category Chart-IQ-Utils
 * @method changeSymbol
 * @param {any} stx - Chart Engine's object
 * @param {string|object} newSymbol - the new symbol's name or symbol Object to change
 * @param {string} resolution - the active resolution on chart
 * @param {string} timeFrame - active time frame on chart
 * @returns {Promise<any>}
 */
export function changeSymbol(
  stx: any,
  newSymbol: string | object,
  resolution: string,
  timeFrame: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const isDailyTicks: boolean = checkIsDailyTicks(resolution),
      span: object = convertTimeFrameToSpanForChartIQ(timeFrame);
    try {
      stx.loadChart(
        newSymbol,
        {
          chart: stx.chart,
          span: Object.assign({}, span, {
            periodicity: {
              interval: isDailyTicks ? 1 : parseInt(resolution, 10),
              period: 1,
              timeUnit: isDailyTicks ? "day" : "minute",
            },
          }),
        },
        (err: any) => {
          if (err) reject(err);
          resolve(newSymbol);
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
/**
 * @category Chart-IQ-Utils
 * @method convertTimeFrameToSpanForChartIQ
 * @description Method converts the time frame string into a span object which can be read by Chart-IQ
 * @param {string} timeFrame - The active time frame
 * @returns {object}
 */
export function convertTimeFrameToSpanForChartIQ(timeFrame: string): object {
  switch (timeFrame.toLowerCase()) {
    case "1d":
      return {
        base: "today",
        multiplier: 1,
      };
    case "5d":
      return {
        base: "day",
        multiplier: 5,
      };
    case "1m":
      return {
        base: "month",
        multiplier: 1,
      };
    case "3m":
      return {
        base: "month",
        multiplier: 3,
      };
    case "6m":
      return {
        base: "month",
        multiplier: 6,
      };
    case "1y":
      return {
        base: "year",
        multiplier: 1,
      };
    case "5y":
      return {
        base: "year",
        multiplier: 5,
      };
    case "ytd":
      return {
        base: "YTD",
        multiplier: 1,
      };
    default:
      return convertTimeFrameToSpanForChartIQ("1d");
  }
}
