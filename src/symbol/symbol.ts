import MarketRule from "../market/rules";
import Publisher from "../pubsub/publisher";
import AbstractCompose from "../utils/abstract-composer";

export interface ChartSymbolProps{
    symbolName:string,
    exchange: string,
    ticker?:string,
    lotSize?:number,
    symbolId:string|number,
    exchangeId?:string|number,
    updateURL?:boolean
};

export default class ChartSymbol extends AbstractCompose<ChartSymbolProps>{

    static tickerDelimator:string = '-';
    static SubscriptionTopic:string = 'CHART_SYMBOL';
    private __publisher:Publisher = new Publisher(ChartSymbol.SubscriptionTopic);

    constructor(
        props:ChartSymbolProps
    ){
        super(props);
        this.generateTickerName = this.generateTickerName.bind(this);
        this.changeSymbol = this.changeSymbol.bind(this);
        this.toString = this.toString.bind(this);
        this.changeSymbol(props);
    }

    private generateTickerName(delimator:string=ChartSymbol.tickerDelimator):string{
        return [this.__properties.symbolName, this.__properties.exchange, this.__properties.symbolId].join(ChartSymbol.tickerDelimator);
    }

    changeSymbol(newSymbol:ChartSymbolProps){
        this.updateProps({
            ...newSymbol,
            ticker: this.toString(),
        } as ChartSymbolProps);
        this.__publisher.publish({data: this});
    }

    toString():string{
        return this.__properties.ticker || this.generateTickerName();
    }
}