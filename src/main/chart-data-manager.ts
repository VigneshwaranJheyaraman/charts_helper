import ApiRequestor, { ApiRequestorProps } from "../feeds/apiRequestor";
import BroadcastHandler, { BroadcastCandle } from "../feeds/broadcast-handler";
import { Candle } from "../feeds/utils";
import { MarketManageProps } from "../market/marketManager";
import ChartSymbol, { ChartSymbolProps } from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";
import Queue from "../utils/queue";

/**!
 * This is the props which is passed along the constructor of ChartDataManager
 * @interface DataManagerProps
 * @property {ChartSymbolProps} symbol - The symbol related basic properties to be passed
 * @property {ApiRequestorProps} api - The constructor properties that has to be passed to initialize APIRequestor
 * @property {MarketManageProps} market - The rules which will be made use by MarketManager to handle market scenario
 */
interface DataManagerProps {
    symbol:ChartSymbolProps,
    api:ApiRequestorProps,
    market:MarketManageProps
};
/**
 * All api methods with public access for ChartDataManager interface
 * @interface IChartDataManager
 */
interface IChartDataManager{
    /**
     * Tries to fetch the initial Data i.e., the set of chart candles from a API Data source,
     * which will initially fill up the visible range on charts
     * @method getInitialData
     * @param {string} resolution - The resolution which needs to be requested either 1,2,3,etc., mins or 1D, 1W or 1M
     * D|W|M - specifies the Day|Week|Month;
     * @param {string} requestBody - The stringified JSON object which will be posted to the API using the fetch API, must contain {fromDate & toDate} range.
     * @param {HeadersInit|undefined} [headers] - The optional parameter which contains the header object which will sent across the API request headers.
     * @param {string} [method="POST"] - Optional paramter which defaults to POST
     * @returns {Promise<any>} - Fetch API promise is returned.
     */
    getInitialData(resolution:string, requestBody:string, headers:HeadersInit|undefined, method:string):Promise<any>;
    /**
     * Tries to fetch the initial Data i.e., the set of chart candles from a API Data source,
     * which will request for the data candles from API for the historic/ previous date range
     * @method getInitialData
     * @param {string} resolution - The resolution which needs to be requested either 1,2,3,etc., mins or 1D, 1W or 1M
     * D|W|M - specifies the Day|Week|Month;
     * @param {string} requestBody - The stringified JSON object which will be posted to the API using the fetch API, must contain {fromDate & toDate} range.
     * @param {HeadersInit|undefined} [headers] - The optional parameter which contains the header object which will sent across the API request headers.
     * @param {string} [method="POST"] - Optional paramter which defaults to POST
     * @returns {Promise<any>} - Fetch API promise is returned.
     */
    getHistoricData(resolution:string, requestBody:string, headers:HeadersInit|undefined, method:string):Promise<any>;
    /**
     * Updates the broadcast or real time candles on chart, with performing the streaming logic to 
     * manipulate the OHLCV values
     * @method updateRealTime
     * @param {string} resolution - The resolution which is currently active on chart
     * @param {BroadcastCandle} realTimeBroadcastCandle - The broadcast candle with only Close/LTP and the Full-Traded-Volume is enough also will accept other properties like Open, High and Low
     * @returns {Candle|null}
     */
    updateRealTime(resolution:string, realTimeBroadcastCandle:BroadcastCandle):Candle|null;
    /**
     * Returns an array of candles which will be contain all the candles that where received when
     * we trying to fetch the intial data from API and empties the queue.
     * @returns {Array<BroadcastQueue>}
     */
    emptyBroadcastQueue():Array<BroadcastQueue>;
    /**
     * Will automatically update the pending candles which are available on Queue based on the 
     * active symbol selected and empties the queue
     */
    updatePendingBroadcastCandles():void;
};

/**
 * Structure of the Queue Item which holds the Broadcast queue when we receive streaming data 
 * but still we are fetching the INITIAL data from API
 * @interface BroadcastQueue
 */
interface BroadcastQueue{
    /**
     * @property {BroadcastCandle} realTimeCandle - The broadcast candle which is received from the streaming socket
     * @property {string} ticker - The unique identifier for active symbol on chart generated for mapping respective candles based on active symbol
     * to avoid data mismatch for wrong symbols
     * @property {string} resolution - The active resolution on chart
     */
    realTimeCandle:BroadcastCandle;
    ticker:string;
    resolution:string;
};

/**
 * The Manager class which allows api access to API, Broadcast, Market and Symbol's manager.
 * @class ChartDataManager
 * @extends AbstractCompose<DataManagerProps>
 * @implements {IChartDataManager}
 */
export default class ChartDataManager extends AbstractCompose<DataManagerProps> implements IChartDataManager{
    private __activeSymbol:ChartSymbol;
    private __apiRequestor:ApiRequestor;
    private __broadcastHandler:BroadcastHandler;
    private __isStreaming:boolean;
    private __broadcastCandleQueue:Queue<BroadcastQueue>;
    /**
     * Creates a manager object based on the properties passed along the constructor
     * @param {DataManagerProps} props - all properties to initate API, Broadcast, Market and Symbol handlers.
     */
    constructor(props:DataManagerProps){
        super(props);
        this.__activeSymbol = new ChartSymbol(props.symbol);
        this.__apiRequestor = new ApiRequestor(props.api);
        this.__broadcastHandler = new BroadcastHandler();
        this.__isStreaming= false;
        this.__broadcastCandleQueue = new Queue<BroadcastQueue>();

        this.getInitialData = this.getInitialData.bind(this);
        this.getHistoricData = this.getHistoricData.bind(this);
        this.updateRealTime = this.updateRealTime.bind(this);
        this.emptyBroadcastQueue = this.emptyBroadcastQueue.bind(this);
        this.updatePendingBroadcastCandles = this.updatePendingBroadcastCandles.bind(this);
    }
    /**
     * Returns the active symbol on Chart
     * @returns {ChartSymbol}
     */
    get symbol():ChartSymbol{
        return this.__activeSymbol;
    }
    /**
     * Returns the API Requestor's API to access their utilites
     * @returns {ApiRequestor}
     */
    get apiHandler():ApiRequestor{
        return this.__apiRequestor;
    }
    /**
     * Returns the broadcast handler's API for streaming / real-time-updates related functions
     * @returns {BroadcastHandler}
     */
    get broadcastHandler():BroadcastHandler{
        return this.__broadcastHandler;
    }
    /**
     * Returns whether the streaming is currently enabled or not
     * @returns {boolean}
     */
    get isStreaming():boolean{
        return this.__isStreaming;
    }
    /**
     * Updates the status of isStreaming
     * @private
     * @method __updateStreamingStatus
     * @param {boolean} isStreaming - The value to be updated
     */
    private __updateStreamingStatus(isStreaming:boolean):void{
        this.__isStreaming = isStreaming;
    }

    getInitialData(resolution: string, requestBody: string, headers:HeadersInit|undefined=undefined, method:string="POST"): Promise<any> {
        this.__updateStreamingStatus(false);
        return (
            this.__apiRequestor.request(
                resolution,
                requestBody,
                true,
                headers,
                method
            ).then((res:Response) => {
                this.__updateStreamingStatus(true);
                return res;
            })
        );
    }
    getHistoricData(resolution: string, requestBody: string, headers:HeadersInit|undefined=undefined, method:string="POST"): Promise<any> {
        return (
            this.__apiRequestor.request(
                resolution,
                requestBody,
                false,
                headers,
                method
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