import MarketManager from "../market/marketManager";
import { Subscription, SubscriptionEvent } from "../pubsub/subscriber";
import ChartSymbol from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";
import { Candle, checkIsDailyTicks, findLastCandleTime } from "./utils";
/**
 * @description The structure which the real time candles sent to the Broadcast-Handler must follow
 * @interface BroadcastCandle
 * @property {number} [open] - this is an optional value, which is considered only if sent and specifies the OPEN value
 * @property {number} close - this value, which is the Last traded price of the symbol
 * @property {number} [high] - this is an optional value, which is considered only if sent and specifies the HIGH value
 * @property {number} [low] - this is an optional value, which is considered only if sent and specified the LOW value
 * @property {number} [volume] - this is an optional value, which is considered only if sent and specifies the Total Traded Volume value
 * @property {Date} date - this value, which is the time of the streaming candle
 */
export interface BroadcastCandle {
  open?: number;
  close: number;
  high?: number;
  low?: number;
  volume?: number;
  date: Date;
}
/**
 * Constant which denotes an empty candle
 * @constant
 * @type {BroadcastHandler}
 */
const EMPTY_CANDLE: BroadcastHandlerCandle = {
  open: 0,
  close: 0,
  high: 0,
  low: 0,
  volume: 0,
  oldVolume: 0,
  date: null,
};
/**
 * @description Broadcast handler Candle, which will be used to calculate the volume using oldVolume
 * @interface BroadcastHandlerCandle
 * @extends {Candle}
 */
interface BroadcastHandlerCandle extends Candle {
  /**
   * @property {number} [oldVolume] - This value denotes the previous volume received to calculate the trade volume for minute candles
   */
  oldVolume?: number;
}
/**
 * @description The functions which will be utilized by BroadcastHandler's API publically.
 * @interface IBroadcastHandler
 */
export interface IBroadcastHandler {
  /**
   * Perform the streaming logic and return a new Candle or null
   * @param {BroadcastCandle} realTimeCandle - The real time candle
   * @param {string} resolution - The active resolution on charts
   * @returns {Candle|null}
   */
  stream(realTimeCandle: BroadcastCandle, resolution: string): Candle | null;
  /**
   * Initializes the broadcast candle with a new Candle
   * @param {Candle|undefined} lastCandle - The last candle which was received from API
   */
  init(lastCandle: Candle | undefined): void;
}
/**
 * @classdesc BroadcastHandler - handles all streaming related implementation and functions
 * @class
 * @name BroadcastHandler
 * @extends AbstractCompose
 * @implements {IBroadcastHandler}
 */
export default class BroadcastHandler
  extends AbstractCompose<undefined>
  implements IBroadcastHandler
{
  /**
   * The broadcast candle which is used internally by the handler to perform streaming related calculations
   * @private
   * @property {BroadcastHandlerCandle} __broadcastCandle
   */
  private __broadcastCandle: BroadcastHandlerCandle;
  /**
   * The active symbol on chart, which will be updated from subscription
   * @private
   * @property {ChartSymbol} __activeSymbol
   */
  private __activeSymbol: ChartSymbol | null = null;
  /**
   * The market manager which will handle are the market related check and manages the candles being plotted and requested
   * @private
   * @property {MarketManager} __marketManager;
   */
  private __marketManager: MarketManager | null = null;
  constructor(props: undefined = undefined) {
    super(props);
    this.__broadcastCandle = Object.assign({}, EMPTY_CANDLE);

    this.stream = this.stream.bind(this);
    this.__nullify = this.__nullify.bind(this);
    this.init = this.init.bind(this);
    this.updateLastCandleTime = this.updateLastCandleTime.bind(this);

    let symbolSubscription: Subscription = this.__subscription.subscribe(
        ChartSymbol.SubscriptionTopic,
        (event: SubscriptionEvent) => {
          if (event.data) {
            this.__activeSymbol = event.data;
          }
        }
      ),
      marketManagerSubscription: Subscription = this.__subscription.subscribe(
        MarketManager.MarketSubscriptionToken,
        (eve: SubscriptionEvent) => {
          if (eve.data) {
            this.__marketManager = eve.data;
          }
        }
      );
    window.addEventListener("beforeunload", () => {
      this.__subscription.unsubscribeList([
        {
          token: ChartSymbol.SubscriptionTopic,
          subscription: symbolSubscription,
        },
        {
          token: MarketManager.MarketSubscriptionToken,
          subscription: marketManagerSubscription,
        },
      ]);
    });
  }
  /**
   * @method init
   * @memberof BroadcastHandler
   * @description Initialize broadcast candle based on the last candle
   * @param {Candle|undefined} lastCandle - Last candle which will be updated as broadcast candle
   */
  init(lastCandle: Candle | undefined): void {
    if (lastCandle) {
      this.__broadcastCandle.date = lastCandle.date;
      this.__broadcastCandle.open = lastCandle.open;
      this.__broadcastCandle.close = lastCandle.close;
      this.__broadcastCandle.high = lastCandle.high;
      this.__broadcastCandle.low = lastCandle.low;
      this.__broadcastCandle.volume = lastCandle.volume || 0;
      this.__broadcastCandle.oldVolume = this.__broadcastCandle.volume;
    }
  }
  /**
   * Returns the current broadcast candle
   * @memberof BroadcastHandler
   * @member {Candle} broadCastCandle
   */
  get broadcastCandle(): Candle {
    return Object.assign({}, this.__broadcastCandle);
  }
  /**
   * @method stream
   * @memberof BroadcastHandler
   * @description Perform streaming calculation and return a real time candle with proper value
   * @param {BroadcastCandle} realTimeCandle - Candle received from Socket server
   * @param {string} resolution - active resolution
   * @returns {Candle|undefined}
   */
  stream(realTimeCandle: BroadcastCandle, resolution: string): Candle | null {
    var broadCastCandle: BroadcastHandlerCandle = this.broadcastCandle;
    if (broadCastCandle.date && this.__activeSymbol && this.__marketManager) {
      let newVolume: number =
        (realTimeCandle.volume ?? 0) - (broadCastCandle.volume || 0);
      newVolume = newVolume < 0 ? 0 : newVolume;
      this.updateLastCandleTime(
        findLastCandleTime(
          broadCastCandle.date,
          realTimeCandle.date,
          resolution,
          this.__marketManager
        ),
        resolution
      );
      broadCastCandle = this.broadcastCandle;
      if (checkIsDailyTicks(resolution)) {
        //daily candles
        newVolume = realTimeCandle.volume ?? 0;
      } else {
        newVolume = (broadCastCandle.volume ?? 0) + newVolume;
      }
      broadCastCandle.close = realTimeCandle.close;
      broadCastCandle.open =
        broadCastCandle.open || (realTimeCandle.open ?? realTimeCandle.close);
      broadCastCandle.low = Math.min(
        broadCastCandle.low || Infinity,
        realTimeCandle.low ?? realTimeCandle.close
      );
      broadCastCandle.high = Math.max(
        broadCastCandle.high,
        realTimeCandle.high ?? realTimeCandle.close
      );
      broadCastCandle.volume = newVolume;
      broadCastCandle.oldVolume = realTimeCandle.volume || 0;
      if(!!broadCastCandle.date) {
          this.__broadcastCandle = Object.assign({}, broadCastCandle);
          return Object.assign({}, broadCastCandle);
      }
      return null;
    }
    return null;
  }
  /**
   * Nullify the broadcast candle to initial state
   * @private
   */
  private __nullify(): void {
    this.__broadcastCandle = Object.assign({}, EMPTY_CANDLE);
  }
  /**
   * @method updateLastCandleTime
   * @memberof BroadcastHandler
   * @description Updates the broadcast candle time with a new time and if time changes nullify the broadcast candle
   * @param {Date} newCandleTime - new updated time
   * @param {string} resolution - active resolution on charts
   */
  updateLastCandleTime(newCandleTime: Date, resolution: string): void {
    if (this.broadcastCandle.date) {
      const checkIfTimeIsDifferent: boolean = checkIsDailyTicks(resolution)
        ? newCandleTime.toDateString() !==
          this.broadcastCandle.date?.toDateString()
        : newCandleTime.getTime() !== this.broadcastCandle.date?.getTime();
      if (checkIfTimeIsDifferent) {
        this.__nullify();
        this.__broadcastCandle.date = new Date(newCandleTime);
      }
    }
  }
}
