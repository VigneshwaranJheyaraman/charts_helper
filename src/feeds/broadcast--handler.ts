import MarketManager from "../market/marketManager";
import { Subscription, SubscriptionEvent } from "../pubsub/subscriber";
import ChartSymbol from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";
import { Candle, checkIsDailyTicks, findLastCandleTime } from "./utils";

export interface BroadcastCandle{
    open?:number;
    close:number;
    high?:number;
    low?:number;
    volume?:number;
    date:Date;
};

const EMPTY_CANDLE:BroadcastHandlerCandle = {
    open:0,
    close:0,
    high:0,
    low:0,
    volume:0,
    oldVolume:0,
    date:null
};

interface BroadcastHandlerCandle extends Candle{
    oldVolume?:number;
}

export interface IBroadcastHandler{
    stream(realTimeCandle:BroadcastCandle, resolution:string): Candle|null;

    init(lastCandle:Candle|undefined):void;
}

export default class BroadcastHandler extends AbstractCompose<undefined> implements IBroadcastHandler{
    private __broacastCandle:BroadcastHandlerCandle;
    private __activeSymbol:ChartSymbol|null = null;
    private __marketManager:MarketManager|null =null;

    constructor(props:undefined=undefined){
        super(props);
        this.__broacastCandle = Object.assign({}, EMPTY_CANDLE);

        this.stream = this.stream.bind(this);
        this.__nullify = this.__nullify.bind(this);
        this.init = this.init.bind(this);
        this.updateLastCandleTime = this.updateLastCandleTime.bind(this);

        let symbolSubscription:Subscription = this.__subscription.subscribe(ChartSymbol.SubscriptionTopic, (event:SubscriptionEvent) => {
            if(event.data){
                this.__activeSymbol = event.data
            }
        }),
            marketManagerSubscription:Subscription = this.__subscription.subscribe(MarketManager.MarketSubscriptionToken, (eve:SubscriptionEvent) => {
                if(eve.data){
                    this.__marketManager = eve.data;
                }
            });
        window.addEventListener("beforeunload", () => {
            this.__subscription.unsubscribeList([
                {token:ChartSymbol.SubscriptionTopic, subscription:symbolSubscription},
                {token:MarketManager.MarketSubscriptionToken, subscription:marketManagerSubscription}
            ]);
        })
    }

    init(lastCandle: Candle | undefined): void {
        if(lastCandle){
            this.__broacastCandle = {...lastCandle};
        }
    }

    get broadcastCandle():Candle{
        return Object.assign({},this.__broacastCandle);
    }

    stream(realTimeCandle: BroadcastCandle, resolution:string): Candle|null {
        var broadCastCandle:BroadcastHandlerCandle = this.broadcastCandle;
        if(broadCastCandle.date && this.__activeSymbol && this.__marketManager){
            let newVolume:number = (realTimeCandle.volume ?? 0) - (broadCastCandle.volume || 0);
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
            if(checkIsDailyTicks(resolution)){
                //daily candles
                newVolume = realTimeCandle.volume ?? 0;
            }else{
                newVolume = (broadCastCandle.volume ?? 0) + (newVolume);
            }
            broadCastCandle.close = realTimeCandle.close;
            broadCastCandle.open = broadCastCandle.open || (realTimeCandle.open ?? realTimeCandle.close);
            broadCastCandle.low = Math.min(Infinity, broadCastCandle.low, (realTimeCandle.low ?? realTimeCandle.close));
            broadCastCandle.high = Math.max(0, broadCastCandle.high, (realTimeCandle.high ?? realTimeCandle.close));
            broadCastCandle.volume = newVolume;
            broadCastCandle.oldVolume = realTimeCandle.volume || 0;
            this.__broacastCandle = Object.assign({}, broadCastCandle);
            return Object.assign({}, broadCastCandle);
        }
        return null;
    }

    private __nullify():void{
        this.__broacastCandle = Object.assign({}, EMPTY_CANDLE);
    }

    updateLastCandleTime(newCandleTime:Date, resolution:string):void{
        if(this.broadcastCandle.date){
            const checkIfTimeIsDifferent:boolean = (
                checkIsDailyTicks(resolution) ? 
                newCandleTime.toDateString() !== this.broadcastCandle.date?.toDateString() :
                newCandleTime.getTime() !== this.broadcastCandle.date?.getTime()
            );
            if(checkIfTimeIsDifferent){
                this.__nullify();
                this.__broacastCandle.date = new Date(newCandleTime);
            }
        }
    }

}