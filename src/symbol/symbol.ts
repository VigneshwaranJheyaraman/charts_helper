import MarketRule from "../market/rules";
import Publisher from "../pubsub/publisher";
import AbstractCompose from "../utils/abstract-composer";
import { updateUrlStateBasedOnCurrentSymbol } from "./utils";
/**
 * Properties which are consumed by the ChartSymbol's constructor
 * @interface
 * @property {string} symbolName - name of the symbol
 * @property {string} exchange - exchange of the symbol
 * @property {string} [ticker] -[optional] unique identifier for a symbol
 * @property {number} [lotSize] - [optional] the lot size for futures or options symbol
 * @property {string|number} symbolId - unique Id for the symbol
 * @property {string|number} [exchangeId] - [optional] unique identifier for Exchange
 * @property {boolean} [disableURLEncoding=false] - [optional] boolean to disable encoding on URL
 * @property {any} [symbolObject] - [optional] symbol object which can contain extra symbol details
 */
export interface ChartSymbolProps {
  symbolName: string;
  exchange: string;
  ticker?: string;
  lotSize?: number;
  symbolId: string | number;
  exchangeId?: string | number;
  disableURLEncoding?: boolean;
  symbolObject?: any;
}
/**
 * ChartSymbol's API
 * @class ChartSymbol
 * @extends AbstractCompose<ChartSymbolProps>
 */
export default class ChartSymbol extends AbstractCompose<ChartSymbolProps> {
  /**
   * Delimator which seperated every details while generating ticker
   * @static
   * @property {string} tickerDelimator
   */
  static tickerDelimator: string = "-";
  /**
   * @static
   * @property {string} SubscriptionTopic - Topic value for publishing events for subscribers
   */
  /**
   * @static
   * @property {string} URLQueryKey - The keyword which will be updated on URL as query param
   */
  static URLQueryKey: string = "symbol";
  static SubscriptionTopic: string = "CHART_SYMBOL";
  /**
   * @private
   * @property {Publisher} __publisher - Publisher's API which will publish events
   */
  private __publisher: Publisher = new Publisher(ChartSymbol.SubscriptionTopic);
  constructor(props: ChartSymbolProps) {
    super(props);
    this.generateTickerName = this.generateTickerName.bind(this);
    this.changeSymbol = this.changeSymbol.bind(this);
    this.toString = this.toString.bind(this);
    this.changeSymbol(props);
  }
  /**
   * Generate a ticker name
   * @private
   * @param {string} delimator - delimator to generate ticker
   * @returns {string}
   */
  private generateTickerName(delimator: string): string {
    return [
      this.__properties.symbolName,
      this.__properties.exchange,
      this.__properties.symbolId,
    ].join(delimator);
  }
  /**
   * @memberof ChartSymbol
   * @method changeSymbol
   * @description When changing to new symbol
   * @param {ChartSymbolProps} newSymbol - new properties for the new symbol
   */
  changeSymbol(newSymbol: ChartSymbolProps): void {
    this.updateProps({
      ...newSymbol,
      ticker: this.toString(),
    } as ChartSymbolProps);
    updateUrlStateBasedOnCurrentSymbol(this, !!this.props.disableURLEncoding);
    this.__publisher.publish({ data: this });
  }
  /**
   * @memberof ChartSymbol
   * @method toString
   * @description String representation fo ChartSymbol's instance
   * @returns {string}
   */
  toString(): string {
    return (
      this.__properties.ticker ||
      this.generateTickerName(ChartSymbol.tickerDelimator)
    );
  }
  /**
   * @memberof ChartSymbol
   * @method extractSymbolPropertiesFromURL
   * @description Extract the symbol properties from URL
   * @static
   * @param {boolean} [encodingEnabled=true] - [optional] Specify if the encoding is enabled by default its considered as true
   * @returns {ChartSymbolProps|undefined}
   */
  static extractSymbolPropertiesFromURL(
    encodingEnabled: boolean = true
  ): ChartSymbolProps | undefined {
    let urlSearchParams: URLSearchParams = new URLSearchParams(
      window.location.search
    );
    if (!urlSearchParams.has(ChartSymbol.URLQueryKey)) return undefined;
    try {
      let queryString: string =
        urlSearchParams.get(ChartSymbol.URLQueryKey) || "";
      return JSON.parse(encodingEnabled ? atob(queryString) : queryString);
    } catch (err) {
      console.error("Error parsing properties from URL", err);
      return undefined;
    }
  }
}
