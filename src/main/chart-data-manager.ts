import ApiRequestor, { ApiRequestorProps } from "../feeds/apiRequestor";
import BroadcastHandler, { BroadcastCandle } from "../feeds/broadcast--handler";
import { Candle } from "../feeds/utils";
import MarketManager, { MarketManageProps } from "../market/marketManager";
import ChartSymbol, { ChartSymbolProps } from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";
import Queue from "../utils/queue";

/**!
 * @interface DataManagerProps
 * This is the props which is passed along the constructor of ChartDataManager
 * @property {ChartSymbolProps} symbol - The symbol related basic properties to be passed
 * @property {ApiRequestorProps} api - The constructor properties that has to be passed to initialize APIRequestor
 * @property {MarketManageProps} market - The rules which will be made use by MarketManager to handle market scenario
 */
interface DataManagerProps {
    symbol:ChartSymbolProps,
    api:ApiRequestorProps,
    market:MarketManageProps
};
/**!
 * @interface IChartDataManager
 * @method getInitialData
 */
interface IChartDataManager{
    getInitialData(resolution:string, requestBody:string, headers:HeadersInit|undefined):Promise<any>;

    getHistoricData(resolution:string, requestBody:string, headers:HeadersInit|undefined):Promise<any>;

    updateRealTime(resolution:string, realTimeBroadcastCandle:BroadcastCandle):Candle|null;

    emptyBroadcastQueue():Array<BroadcastQueue>;

    updatePendingBroadcastCandles():void;
};

interface BroadcastQueue{
    realTimeCandle:BroadcastCandle;
    ticker:string;
    resolution:string;
};

export default class ChartDataManager extends AbstractCompose<DataManagerProps> implements IChartDataManager{
    private __activeSymbol:ChartSymbol;
    private __apiRequestor:ApiRequestor;
    private __broadcastHandler:BroadcastHandler;
    private __marketManager:MarketManager;
    private __isStreaming:boolean;
    private __broadcastCandleQueue:Queue<BroadcastQueue>;
    constructor(props:DataManagerProps){
        super(props);
        this.__activeSymbol = new ChartSymbol(props.symbol);
        this.__apiRequestor = new ApiRequestor(props.api);
        this.__broadcastHandler = new BroadcastHandler();
        this.__marketManager = new MarketManager(props.market);
        this.__isStreaming= false;
        this.__broadcastCandleQueue = new Queue<BroadcastQueue>();

        this.getInitialData = this.getInitialData.bind(this);
        this.getHistoricData = this.getHistoricData.bind(this);
        this.updateRealTime = this.updateRealTime.bind(this);
        this.emptyBroadcastQueue = this.emptyBroadcastQueue.bind(this);
        this.updatePendingBroadcastCandles = this.updatePendingBroadcastCandles.bind(this);
    }

    get symbol():ChartSymbol{
        return this.__activeSymbol;
    }

    get apiHandler():ApiRequestor{
        return this.__apiRequestor;
    }

    get broadcastHandler():BroadcastHandler{
        return this.__broadcastHandler;
    }

    get marketHandler():MarketManager{
        return this.__marketManager;
    }

    get isStreaming():boolean{
        return this.__isStreaming;
    }

    private __updateStreamingStatus(isStreaming:boolean):void{
        this.__isStreaming = isStreaming;
    }

    getInitialData(resolution: string, requestBody: string, headers:HeadersInit|undefined=undefined): Promise<any> {
        this.__updateStreamingStatus(false);
        return (
            this.__apiRequestor.request(
                resolution,
                requestBody,
                true,
                headers
            ).then((res:Response) => {
                this.__updateStreamingStatus(true);
                return res;
            })
        );
    }
    getHistoricData(resolution: string, requestBody: string, headers:HeadersInit|undefined=undefined): Promise<any> {
        return (
            this.__apiRequestor.request(
                resolution,
                requestBody,
                false,
                headers,
            )
        );
    }
    updateRealTime(resolution: string, realTimeBroadcastCandle: BroadcastCandle):Candle|null {
        if(this.__isStreaming){
            return this.__broadcastHandler.stream(
                realTimeBroadcastCandle,
                resolution
            );
        }
        else{
            this.__broadcastCandleQueue.enqueue({
                realTimeCandle:realTimeBroadcastCandle,
                ticker:this.symbol.toString(),
                resolution:resolution
            });
            return null;
        }
    }
    
    emptyBroadcastQueue():Array<BroadcastQueue>{
        return this.__broadcastCandleQueue.emptyAll();
    }

    updatePendingBroadcastCandles(): void {
        this.emptyBroadcastQueue().forEach((queueItem:BroadcastQueue) => {
            this.updateRealTime(queueItem.resolution, queueItem.realTimeCandle);
        });
    }
}