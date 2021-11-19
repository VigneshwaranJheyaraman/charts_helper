import MarketManager from "../market/marketManager";
import { convertToMarketHour } from "../market/utils";
/**
 * @category Feed-Utils
 * @method checkEverySecond
 * @description Wait for a function to call and try checking for every interval
 * @param {Function} callback - The function which will be called when the condition is satisfied
 * @param {boolean} checkCondition - The condition to check frequently until it is satisfied
 * @param {number} [timeOutMs=1000] - The optional value which will specify the time to call the function
 */
export function checkEverySecond(
  callback: () => void,
  checkCondition: boolean,
  timeOutMs: number = 1e3
): void {
  let timeOut: number = setTimeout(() => {
    if (checkCondition) {
      callback();
    } else {
      checkEverySecond(callback, checkCondition, timeOutMs);
      clearTimeout(timeOut);
    }
  }, timeOutMs);
}
/**
 * JSON structure of A regular candle plotted on chart
 * @interface
 * @property {Date|null} date - Date of candle
 * @property {number} open - Open value of the candle
 * @property {number} close - Price/ Close value of the candle
 * @property {number} low - Low value of the candle
 * @property {number} high - High value of the candle
 * @property {number} [volume] - Optional Volume value of the candle
 */
export interface Candle {
  date: Date | null;
  open: number;
  close: number;
  low: number;
  high: number;
  volume?: number;
}
/**
 * @category Feed-Utils
 * @method checkIsDailyTicks
 * @description Checks if the provided resolution is Daily candles like (Day, Week or Month) else minute candles like (1,2,3 min etc.,)
 * @param {string} resolution - the resolution to check
 * @returns {boolean}
 */
export function checkIsDailyTicks(resolution: string): boolean {
  return /[DWM]/.test(resolution);
}
/**
 * @category Feed-Utils
 * @method normalizeMinutes
 * @description Function will convert the date to the nearby candle time based on resolution
 * @param {Date} date - date to convert
 * @param {string} resolution - resolution to check
 * @returns {Date}
 */
export function normalizeMinutes(date: Date, resolution: string): Date {
  date = new Date(date);
  if (checkIsDailyTicks(resolution)) {
    return new Date(date.setHours(5, 30, 0, 0));
  } else {
    let res: number = parseInt(resolution, 10);
    if (date.getMinutes() % res === 0) {
      date.setSeconds(0, 0);
    } else {
      date.setMinutes(Math.floor(date.getMinutes() / res) * res, 0, 0);
    }
    return new Date(date);
  }
}
/**
 * @category Feed-Utils
 * @method findLastCandleTime
 * @description Determines the last candle to be plotted on chart based on the last plotted candle
 * @param {Date} lastCandleTime - last plotted candle's time
 * @param {Date} broadCastCandleTime - the broadcast candle's time
 * @param {string} resolution - active resolution on chart
 * @param {MarketManager} marketManager - market manager
 * @returns {Date}
 */
export function findLastCandleTime(
  lastCandleTime: Date,
  broadCastCandleTime: Date,
  resolution: string,
  marketManager: MarketManager
): Date {
  broadCastCandleTime = new Date(broadCastCandleTime);
  lastCandleTime = new Date(lastCandleTime);
  let normalizedTime: Date = normalizeMinutes(broadCastCandleTime, resolution);
  if (checkIsDailyTicks(resolution)) {
    return new Date(lastCandleTime.setHours(5, 30, 0, 0));
  } else {
    if (broadCastCandleTime.toDateString() === lastCandleTime.toDateString()) {
      let res: number = parseInt(resolution, 10),
        resolutionInMilliSecond: number = res * 1e3 * 60,
        timeDifferenceBetweenLastCandleAndBroadcastCandle: number =
          broadCastCandleTime.getTime() - lastCandleTime.getTime(),
        candlesDifferenceBetweenLastCandleAndBroadcastCandle: number =
          Math.floor(
            timeDifferenceBetweenLastCandleAndBroadcastCandle /
              resolutionInMilliSecond
          ),
        nextCandleTime: Date = new Date(
          lastCandleTime.getTime() + resolutionInMilliSecond
        ),
        newLastCandleTime: Date = new Date(nextCandleTime);
      if (candlesDifferenceBetweenLastCandleAndBroadcastCandle > 1) {
        nextCandleTime = new Date(
          lastCandleTime.getTime() +
            resolutionInMilliSecond *
              candlesDifferenceBetweenLastCandleAndBroadcastCandle
        );
      }
      newLastCandleTime = new Date(
        broadCastCandleTime.getTime() >= lastCandleTime.getTime()
          ? nextCandleTime
          : lastCandleTime
      );
      if (marketManager.isMarketOpen(newLastCandleTime)) {
        return newLastCandleTime;
      } else {
        return convertToMarketHour.call(marketManager, newLastCandleTime);
      }
    }
    return normalizedTime;
  }
}
