import MarketManager, { MarketManageProps } from "../market/marketManager";
import { Subscription, SubscriptionEvent } from "../pubsub/subscriber";
import ChartSymbol from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";
/**
 * Range object which will contain two properties from and to
 * @interface Range
 * @property {Date|null} from - from date
 * @property {Date|null} to - to date
 */
export interface Range {
  from: Date | null;
  to: Date | null;
}
/**
 * RequestRange which is an obejct that contains the range for a specific resolution
 * @interface RequestRange
 */
interface RequestRange {
  [resolution: string]: Range;
}
/**
 * Properties which will be passed to the RangeManager constructor
 * @interface RangeManagerProps
 * @extends MarketManageProps
 * @property {number} [rangeSize] - the rangeSize, which will specify the maximum number of candles difference between from and to range
 */
export interface RangeManagerProps extends MarketManageProps {
  rangeSize?: number;
}
/**
 * @classdesc Manages the range and provides API to generate range for specified resolution considering all market scenario
 * @class
 * @name RangeManager
 */
export default class RangeManager extends AbstractCompose<RangeManagerProps> {
  /**
   * The range object which will map every resolution to their range
   * @private
   * @member {RequestRange} __requestRange
   */
  private __requestRange: RequestRange;
  /**
   * Market Manager which handles all market scenarios and checking
   * @private
   * @member {MarketManager} __marketManager
   */
  private __marketManager: MarketManager;
  /**
   * Token to subscribe for the change on Market Manager
   * @static
   * @property {string} RangeChangeToken
   */
  static RangeChangeToken: string = "RANGE_CHANGE_TOKEN";
  constructor(props: RangeManagerProps) {
    super(props);

    this.__requestRange = {};
    this.__marketManager = new MarketManager({
      rules: props.rules,
    });

    this.getRange = this.getRange.bind(this);
    this.initRange = this.initRange.bind(this);
    this.clearAll = this.clearAll.bind(this);

    let symbolSubscription: Subscription = this.__subscription.subscribe(
      ChartSymbol.SubscriptionTopic,
      (e: SubscriptionEvent) => {
        if (e.data) {
          this.clearAll();
        }
      }
    );

    window.addEventListener("beforeunload", () => {
      this.__subscription.unsubscribe(
        ChartSymbol.SubscriptionTopic,
        symbolSubscription
      );
    });
  }
  /**
   * Returns the range size for the requestor
   * @memberof RangeManager
   * @member {number} rangeSize
   */
  get rangeSize(): number {
    return this.__properties.rangeSize || 500;
  }
  /**
   * @memberof RangeManager
   * @method getRange
   * @description Returns a range for the specified symbol in a descending sequential order
   * @param {string} resolution - the active resolution on chart
   * @returns {Range}
   */
  getRange(resolution: string): Range {
    let newRange: Range = {
      from: null,
      to: null,
    };
    if (resolution in this.__requestRange) {
      newRange = this.__requestRange[resolution];
    }
    let toDate: Date = newRange.from || new Date(),
      fromDate: Date | null = newRange.from;
    if (!fromDate) {
      fromDate = this.__marketManager.goBackANumberOfTicks(
        toDate,
        this.rangeSize,
        resolution
      );
    }
    newRange = {
      from: fromDate,
      to: toDate,
    };
    this.__requestRange[resolution] = Object.assign({}, newRange);
    return { ...newRange };
  }
  /**
   * @memberof RangeManager
   * @method initRange
   * @description Initialize the range for a specific resolution
   * @param {string} resolution - the active resolution on charts
   */
  initRange(resolution: string) {
    if (resolution in this.__requestRange) {
      this.__requestRange[resolution] = {
        to: null,
        from: null,
      };
    }
  }
  /**
   * @memberof RangeManager
   * @method clearAll
   * @description Clear all range initialized before
   */
  clearAll() {
    this.__requestRange = {};
  }
}
