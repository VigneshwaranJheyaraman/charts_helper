import MarketRule from "../market/rules";
import Publisher from "../pubsub/publisher";
import AbstractCompose from "../utils/abstract-composer";
/**
 * Properties which are consumed by the ChartSymbol's constructor
 * @interface
 * @property {string} symbolName - name of the symbol
 * @property {string} exchange - exchange of the symbol
 * @property {string} [ticker] -[optional] unique identifier for a symbol
 * @property {number} [lotSize] - [optional] the lot size for futures or options symbol
 * @property {string|number} symbolId - unique Id for the symbol 
 * @property {string|number} [exchangeId] - [optional] unique identifier for Exchange
 */
export interface ChartSymbolProps{
    symbolName:string,
    exchange: string,
    ticker?:string,
    lotSize?:number,
    symbolId:string|number,
    exchangeId?:string|number,
};
/**
 * ChartSymbol's API
 * @class ChartSymbol
 * @extends AbstractCompose<ChartSymbolProps>
 */
export default class ChartSymbol extends AbstractCompose<ChartSymbolProps>{
    /**
     * Delimator which seperated every details while generating ticker
     * @static
     * @property {string} tickerDelimator
     */
    static tickerDelimator:string = '-';
    /**
     * @static
     * @property {string} SubscriptionTopic - Topic value for publishing events for subscribers
     */
    static SubscriptionTopic:string = 'CHART_SYMBOL';
    /**
     * @private
     * @property {Publisher} __publisher - Publisher's API which will publish events
     */
    private __publisher:Publisher = new Publisher(ChartSymbol.SubscriptionTopic);
    /**
     * Returns ChartSymbol's instance
     * @param {ChartSymbol} props - properties for constructor
     */
    constructor(
        props:ChartSymbolProps
    ){
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
    private generateTickerName(delimator:string):string{
        return [this.__properties.symbolName, this.__properties.exchange, this.__properties.symbolId].join(delimator);
    }
    /**
     * When changing to new symbol
     * @param {ChartSymbolProps} newSymbol - new properties for the new symbol
     */
    changeSymbol(newSymbol:ChartSymbolProps):void{
        this.updateProps({
            ...newSymbol,
            ticker: this.toString(),
        } as ChartSymbolProps);
        this.__publisher.publish({data: this});
    }
    /**
     * String representation fo ChartSymbol's instance
     * @returns {string}
     */
    toString():string{
        return this.__properties.ticker || this.generateTickerName(ChartSymbol.tickerDelimator);
    }
}