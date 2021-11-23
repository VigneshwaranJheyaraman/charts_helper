import DeviceInterface, {
  DeviceInterfaceProps,
} from "../device-interface/device-interface";
import ApiRequestor, { ApiRequestorProps } from "../feeds/apiRequestor";
import BroadcastHandler, { BroadcastCandle } from "../feeds/broadcast-handler";
import { Candle } from "../feeds/utils";
import ChartSymbol, { ChartSymbolProps } from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";
import Queue from "../utils/queue";

/**!
 * This is the props which is passed along the constructor of ChartDataManager
 * @interface DataManagerProps
 * @property {ChartSymbolProps} symbol - The symbol related basic properties to be passed
 * @property {ApiRequestorProps} api - The constructor properties that has to be passed to initialize APIRequestor
 */
interface DataManagerProps {
  symbol: ChartSymbolProps;
  api: ApiRequestorProps;
  deviceInterface: DeviceInterfaceProps;
}
/**
 * All api methods with public access for ChartDataManager interface
 * @interface IChartDataManager
 */
interface IChartDataManager {
  /**
   * Tries to fetch the initial Data i.e., the set of chart candles from a API Data source,
   * which will initially fill up the visible range on charts
   * @method getInitialData
   * @param {string} resolution - The resolution which needs to be requested either 1,2,3,etc., mins or 1D, 1W or 1M
   * D|W|M - specifies the Day|Week|Month;
   * @param {string} requestBody - The stringified JSON object which will be posted to the API using the fetch API, must contain {fromDate & toDate} range.
   * @param {HeadersInit|undefined} [headers] - The optional parameter which contains the header object which will sent across the API request headers.
   * @param {string} [method="POST"] - Optional paramter which defaults to POST
   * @returns {Promise<Response>} - Fetch API promise is returned.
   */
  getInitialData(
    resolution: string,
    requestBody: string,
    headers: HeadersInit | undefined,
    method: string
  ): Promise<Response>;
  /**
   * Tries to fetch the initial Data i.e., the set of chart candles from a API Data source,
   * which will request for the data candles from API for the historic/ previous date range
   * @method getInitialData
   * @param {string} resolution - The resolution which needs to be requested either 1,2,3,etc., mins or 1D, 1W or 1M
   * D|W|M - specifies the Day|Week|Month;
   * @param {string} requestBody - The stringified JSON object which will be posted to the API using the fetch API, must contain {fromDate & toDate} range.
   * @param {HeadersInit|undefined} [headers] - The optional parameter which contains the header object which will sent across the API request headers.
   * @param {string} [method="POST"] - Optional paramter which defaults to POST
   * @returns {Promise<Response>} - Fetch API promise is returned.
   */
  getHistoricData(
    resolution: string,
    requestBody: string,
    headers: HeadersInit | undefined,
    method: string
  ): Promise<Response>;
  /**
   * Updates the broadcast or real time candles on chart, with performing the streaming logic to
   * manipulate the OHLCV values
   * @method updateRealTime
   * @param {string} resolution - The resolution which is currently active on chart
   * @param {BroadcastCandle} realTimeBroadcastCandle - The broadcast candle with only Close/LTP and the Full-Traded-Volume is enough also will accept other properties like Open, High and Low
   * @returns {Candle|null}
   */
  updateRealTime(
    resolution: string,
    realTimeBroadcastCandle: BroadcastCandle
  ): Candle | null;
  /**
   * Returns an array of candles which will be contain all the candles that where received when
   * we trying to fetch the intial data from API and empties the queue.
   * @method emptyBroadcastQueue
   * @returns {Array<BroadcastQueue>}
   */
  emptyBroadcastQueue(): Array<BroadcastQueue>;
  /**
   * @method updatePendingBroadcastCandles
   * Will automatically update the pending candles which are available on Queue based on the
   * active symbol selected and empties the queue
   */
  updatePendingBroadcastCandles(): void;
}

/**
 * Structure of the Queue Item which holds the Broadcast queue when we receive streaming data
 * but still we are fetching the INITIAL data from API
 * @interface BroadcastQueue
 * @property {BroadcastCandle} realTimeCandle - The broadcast candle which is received from the streaming socket
 * @property {string} ticker - The unique identifier for active symbol on chart generated for mapping respective candles based on active symbol to avoid data mismatch for wrong symbols
 * @property {string} resolution - The active resolution on chart
 */
interface BroadcastQueue {
  realTimeCandle: BroadcastCandle;
  ticker: string;
  resolution: string;
}

/**
 * The Manager class which allows api access to API, Broadcast, Market and Symbol's manager.
 * @class ChartDataManager
 * @extends AbstractCompose<DataManagerProps>
 * @implements {IChartDataManager}
 */
export default class ChartDataManager
  extends AbstractCompose<DataManagerProps>
  implements IChartDataManager
{
  private __activeSymbol: ChartSymbol;
  private __apiRequestor: ApiRequestor;
  private __broadcastHandler: BroadcastHandler;
  private __isStreaming: boolean;
  private __broadcastCandleQueue: Queue<BroadcastQueue>;
  private __deviceInterface: DeviceInterface;
  constructor(props: DataManagerProps) {
    super(props);
    this.__activeSymbol = new ChartSymbol(props.symbol);
    this.__apiRequestor = new ApiRequestor(props.api);
    this.__broadcastHandler = new BroadcastHandler();
    this.__deviceInterface = new DeviceInterface(props.deviceInterface);
    this.__isStreaming = false;
    this.__broadcastCandleQueue = new Queue<BroadcastQueue>();

    this.getInitialData = this.getInitialData.bind(this);
    this.getHistoricData = this.getHistoricData.bind(this);
    this.updateRealTime = this.updateRealTime.bind(this);
    this.emptyBroadcastQueue = this.emptyBroadcastQueue.bind(this);
    this.updatePendingBroadcastCandles =
      this.updatePendingBroadcastCandles.bind(this);
  }
  /**
   * Returns the active symbol on Chart
   * @memberof ChartDataManager
   * @member {ChartSymbol} symbol
   */
  get symbol(): ChartSymbol {
    return this.__activeSymbol;
  }
  /**
   * Returns the API Requestor's API to access their utilites
   * @memberof ChartDataManager
   * @member {ApiRequestor} apiHandler
   */
  get apiHandler(): ApiRequestor {
    return this.__apiRequestor;
  }
  /**
   * Returns the broadcast handler's API for streaming / real-time-updates related functions
   * @memberof ChartDataManager
   * @member {BroadcastHandler} broadcastHandler
   */
  get broadcastHandler(): BroadcastHandler {
    return this.__broadcastHandler;
  }
  /**
   * Returns whether the streaming is currently enabled or not
   * @memberof ChartDataManager
   * @member {boolean} isStreaming
   */
  get isStreaming(): boolean {
    return this.__isStreaming;
  }
  /**
   * Returns the device Interface's instance
   * @memberof ChartDataManager
   * @member {DeviceInterface} deviceInterface
   */
  get deviceInterface(): DeviceInterface {
    return this.__deviceInterface;
  }
  /**
   * Updates the status of isStreaming
   * @private
   * @method __updateStreamingStatus
   * @param {boolean} isStreaming - The value to be updated
   */
  private __updateStreamingStatus(isStreaming: boolean): void {
    this.__isStreaming = isStreaming;
  }
  /**
   * @memberof ChartDataManager
   * @description Tries to fetch the initial Data i.e., the set of chart candles from a API Data source,
   * which will initially fill up the visible range on charts
   * @method getInitialData
   * @param {string} resolution - The resolution which needs to be requested either 1,2,3,etc., mins or 1D, 1W or 1M
   * D|W|M - specifies the Day|Week|Month;
   * @param {string} requestBody - The stringified JSON object which will be posted to the API using the fetch API, must contain {fromDate & toDate} range.
   * @param {HeadersInit|undefined} [headers] - The optional parameter which contains the header object which will sent across the API request headers.
   * @param {string} [method="POST"] - Optional paramter which defaults to POST
   * @returns {Promise<Response>} - Fetch API promise is returned.
   */
  getInitialData(
    resolution: string,
    requestBody: string,
    headers: HeadersInit | undefined = undefined,
    method: string = "POST"
  ): Promise<Response> {
    this.__updateStreamingStatus(false);
    return this.__apiRequestor
      .request(resolution, requestBody, true, headers, method)
      .then((res: Response) => {
        this.__updateStreamingStatus(true);
        return res;
      });
  }
  /**
   * @memberof ChartDataManager
   * @description Tries to fetch the initial Data i.e., the set of chart candles from a API Data source,
   * which will request for the data candles from API for the historic/ previous date range
   * @method getHistoricData
   * @param {string} resolution - The resolution which needs to be requested either 1,2,3,etc., mins or 1D, 1W or 1M
   * D|W|M - specifies the Day|Week|Month;
   * @param {string} requestBody - The stringified JSON object which will be posted to the API using the fetch API, must contain {fromDate & toDate} range.
   * @param {HeadersInit|undefined} [headers] - The optional parameter which contains the header object which will sent across the API request headers.
   * @param {string} [method="POST"] - Optional paramter which defaults to POST
   * @returns {Promise<Response>} - Fetch API promise is returned.
   */
  getHistoricData(
    resolution: string,
    requestBody: string,
    headers: HeadersInit | undefined = undefined,
    method: string = "POST"
  ): Promise<any> {
    return this.__apiRequestor.request(
      resolution,
      requestBody,
      false,
      headers,
      method
    );
  }
  /**
   * @memberof ChartDataManager
   * @description Updates the broadcast or real time candles on chart, with performing the streaming logic to
   * manipulate the OHLCV values
   * @method updateRealTime
   * @param {string} resolution - The resolution which is currently active on chart
   * @param {BroadcastCandle} realTimeBroadcastCandle - The broadcast candle with only Close/LTP and the Full-Traded-Volume is enough also will accept other properties like Open, High and Low
   * @returns {Candle|null}
   */
  updateRealTime(
    resolution: string,
    realTimeBroadcastCandle: BroadcastCandle
  ): Candle | null {
    if (this.__isStreaming) {
      return this.__broadcastHandler.stream(
        realTimeBroadcastCandle,
        resolution
      );
    } else {
      this.__broadcastCandleQueue.enqueue({
        realTimeCandle: realTimeBroadcastCandle,
        ticker: this.symbol.toString(),
        resolution: resolution,
      });
      return null;
    }
  }
  /**
   * @memberof ChartDataManager
   * @description Returns an array of candles which will be contain all the candles that where received when
   * we trying to fetch the intial data from API and empties the queue.
   * @method emptyBroadcastQueue
   * @returns {Array<BroadcastQueue>}
   */
  emptyBroadcastQueue(): Array<BroadcastQueue> {
    return this.__broadcastCandleQueue.emptyAll();
  }
  /**
   * @memberof ChartDataManager
   * @method updatePendingBroadcastCandles
   * @description Will automatically update the pending candles which are available on Queue based on the
   * active symbol selected and empties the queue
   */
  updatePendingBroadcastCandles(): void {
    this.emptyBroadcastQueue().forEach((queueItem: BroadcastQueue) => {
      this.updateRealTime(queueItem.resolution, queueItem.realTimeCandle);
    });
  }
}
