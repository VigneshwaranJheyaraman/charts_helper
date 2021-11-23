import { checkIsDailyTicks } from "../feeds/utils";
import Publisher from "../pubsub/publisher";
import { Subscription, SubscriptionEvent } from "../pubsub/subscriber";
import ChartSymbol from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";
import MarketRule from "./rules";
import {
  checkIfHoliday,
  checkIfWeekDay,
  convertToMarketHour,
  extractHourMinFromRule,
  getCurrentDateRule,
  goBackPreviousDay,
  SessionTime,
} from "./utils";
/**
 * The function which should return the list of market rules based on the active symbol
 * @callback RulesFactory
 * @param {ChartSymbol} [symbol] - [optional] symbol passed
 * @returns {Array<MarketRule>}
 */
export declare type RulesFactory = (symbol?: ChartSymbol) => Array<MarketRule>;
/**
 * The properties which will be passed to MarketManagerProps
 * @interface
 * @property {Array<MarketRule>|RulesFactory} rules
 */
export interface MarketManageProps {
  rules: Array<MarketRule> | RulesFactory;
}
/**
 * The function which will publically accesible via the Market manger's API
 * @interface
 */
interface IMarketManager {
  /**
   * Returns a valid market day
   * @param {Date} date - date to convert it to a valid market day
   * @returns {Date}
   */
  getValidMarketDay(date: Date): Date;
  /**
   * Returns a flag indicating the provided date is a valid market day
   * @param {Date} date - date to check
   * @returns {boolean}
   */
  isMarketDay(date: Date): boolean;
  /**
   * Returns either true or false based on the date provided checking if the market is available and active for provided date
   * @param {Date} date - date to check
   * @returns {boolean}
   */
  isMarketOpen(date: Date): boolean;
  /**
   * Back tracks to a valid market date based on market timings to a specific amount of data
   * @param {Date} fromDate - date to start from
   * @param {number} numberOfTicks - the count of ticks to backtrack
   * @param {string} resolution - the active resolution
   * @returns {Date}
   */
  goBackANumberOfTicks(
    fromDate: Date,
    numberOfTicks: number,
    resolution: string
  ): Date;
}
/**
 * MarketManger which handles market and session management
 * @class MarketManager
 * @extends AbstractCompose<MarketManageProps>
 * @implements {IMarketManager}
 */
export default class MarketManager
  extends AbstractCompose<MarketManageProps>
  implements IMarketManager
{
  /**
   * The active symbol on chart
   * @private
   * @property {ChartSymbol} __activeSymbol
   */
  private __activeSymbol: ChartSymbol | null = null;
  /**
   * Token to subscribe to changes
   * @static
   * @property {string} MarketSubscriptionToken
   */
  static MarketSubscriptionToken: string = "MARKET_MANAGER_CHANGES";
  /**
   * The Publisher object which will publish changes to its subscribers
   * @private
   * @property {Publisher} __publisher
   */
  private __publisher: Publisher = new Publisher(
    MarketManager.MarketSubscriptionToken
  );
  constructor(props: MarketManageProps) {
    super(props);
    let symbolSubscription: Subscription = this.__subscription.subscribe(
      ChartSymbol.SubscriptionTopic,
      (changeEvent: SubscriptionEvent) => {
        if (changeEvent.data) {
          this.__activeSymbol = changeEvent.data;
        }
      }
    );
    window.addEventListener("beforeunload", () => {
      this.__subscription.unsubscribe(
        ChartSymbol.SubscriptionTopic,
        symbolSubscription
      );
    });
    this.__publisher.publish({ data: this });

    this.getValidMarketDay = this.getValidMarketDay.bind(this);
    this.isMarketDay = this.isMarketDay.bind(this);
    this.isMarketOpen = this.isMarketOpen.bind(this);
    this.goBackANumberOfTicks = this.goBackANumberOfTicks.bind(this);
  }
  /**
   * Returns a list of rule
   * @memberof MarketManager
   * @member {Array<MarketRule>} rules
   */
  get rules(): Array<MarketRule> {
    if (typeof this.__properties.rules === "function") {
      return this.__activeSymbol
        ? this.__properties.rules(this.__activeSymbol)
        : [];
    } else {
      return this.__properties.rules;
    }
  }
  /**
   * Returns boolean based on the current date is Week day or not
   * @memberof MarketManager
   * @member {boolean} isWeekDay
   */
  get isWeekDay(): boolean {
    return checkIfWeekDay(new Date(), this.rules).isValid;
  }
  /**
   * Returns boolean based on the current date is holiday or not
   * @memberof MarketManager
   * @member {boolean} isHoliday
   */
  get isHoliday(): boolean {
    return checkIfHoliday(new Date(), this.rules).isValid;
  }
  /**
   * @memberof MarketManager
   * @method getValidMarketDay
   * @description Returns a valid Market day
   * @param {Date} date - the requested date to check and convert to a valid market day
   * @returns {Date}
   */
  getValidMarketDay(date: Date): Date {
    date = new Date(date);
    while (!this.isMarketDay(date)) {
      date = goBackPreviousDay(date);
    }
    return new Date(convertToMarketHour.call(this, date));
  }
  /**
   * @memberof MarketManager
   * @method isMarketDay
   * @description Returns if the date specified is a valid market day without considering the market's active status
   * @param {Date} [date=new Date()] - optional date value which defaults current Date
   * @returns {boolean}
   */
  isMarketDay(date: Date = new Date()): boolean {
    return (
      checkIfWeekDay(date, this.rules) &&
      !checkIfHoliday(date, this.rules, true)
    );
  }
  /**
   * @memberof MarketManager
   * @method isMarketOpen
   * @description Returns boolean to check if the date is a valid market day and the time is a valid market session time
   * @param {Date} [date=new Date()] - optional date value which defaults to current Date
   * @returns {boolean}
   */
  isMarketOpen(date: Date = new Date()): boolean {
    if (this.isMarketDay(date)) {
      let currentDayRule: MarketRule = getCurrentDateRule(date, this.rules);
      if (currentDayRule.open && currentDayRule.close) {
        let openHrMin: SessionTime = extractHourMinFromRule(
            currentDayRule.open
          ),
          [currentMinute, currentHour] = [date.getMinutes(), date.getHours()],
          closeHrMin: SessionTime = extractHourMinFromRule(
            currentDayRule.close
          );
        return (
          (currentHour > openHrMin.hr ||
            (currentHour === openHrMin.hr &&
              currentMinute >= openHrMin.min)) /**market has started */ &&
          (currentHour < closeHrMin.hr ||
            (currentHour === closeHrMin.hr && currentMinute < closeHrMin.min))
        );
      }
    }
    return false;
  }
  /**
   * @memberof MarketManager
   * @method goBackANumberOfTicks
   * @description Backtrack to a valid market date from current date to a number of ticks
   * @param {Date} fromDate - date from which the backtracking starts
   * @param {number} numberOfTicks - the number of ticks to go back
   * @param {string} resolution - active resolution
   * @returns {Date}
   */
  goBackANumberOfTicks(
    fromDate: Date,
    numberOfTicks: number,
    resolution: string
  ): Date {
    fromDate = new Date(fromDate);
    while (numberOfTicks > 0) {
      if (checkIsDailyTicks(resolution)) {
        //daily ticks
        fromDate = this.getValidMarketDay(fromDate);
        numberOfTicks--;
      } else {
        //minute ticks
        let res: number = parseInt(resolution, 10),
          timeOffset: number = 1e3 * 60 * res;
        if (this.isMarketOpen(fromDate)) {
          fromDate = new Date(fromDate.getTime() - timeOffset);
        } else {
          fromDate = convertToMarketHour.call(this, fromDate);
        }
        numberOfTicks--;
      }
    }
    return new Date(fromDate);
  }
}
