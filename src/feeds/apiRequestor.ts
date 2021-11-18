import AbstractCompose from "../utils/abstract-composer";
import RangeManager, { Range, RangeManagerProps } from "./rangeManager";
/**
 * The type of the variable which returns the URL after some check or any logic
 * @typedef {() => string} URLFactory
 */
declare type URLFactory = (() => string);
/**
 * ApiRequestor's properties that will be passed alongside the constructor
 * @interface ApiRequestorProps
 * @extends RangeManagerProps
 */
export interface ApiRequestorProps extends RangeManagerProps{
    /**
     * URL which will be called by the API for candles from External Server
     * @property {string|URLFactory} url
     */
    url:string|URLFactory;
};
/**
 * The interface, which implements the function which can be accessed publically
 * @interface IApiRequestor
 */
interface IApiRequestor{
    /**
     * @method
     * This raises a HTTP-REST API request to the url
     * @param {string} resolution - the expected resolution for which chart has to be plotted
     * @param {string} requestBodyOrURLQuery - The stringiied JSON object which will added to the body or URL Query attached alongside URL for GET request
     * @param {boolean} isRequestForInitialData - The boolean value stating the nature of request
     * is it for initial data of for historic data so the range can be generated as such
     * @param {HeadersInit|undefined} [headers=undefined] - The optional paramter which will be passed as the headers for the request.
     * @param {string} [method="POST"] - The optional parameter to specify the method of API request
     * @returns {Promise<any>}
     */
    request(resolution:string, requestBodyOrURLQuery:string, isRequestForInitialData:boolean, headers:HeadersInit|undefined, method:string): Promise<any>;
}
/**
 * ApiRequestor class handles all API request and response related logic, also handles the range for every request
 * the from and to date range based on market and symbol selected
 * @class ApiRequestor
 * @extends AbstractCompose<ApiRequestorProps>
 * @implements {IApiRequestor}
 */
export default class ApiRequestor extends AbstractCompose<ApiRequestorProps> implements IApiRequestor{
    /**
     * Manages all range generation logic based on the market nature of the active symbol
     * @private 
     * @property {RangeManager} __rangeManager
     */
    private __rangeManager: RangeManager;
    /**
     * A basic couter which increments for every request sent to API
     * @property {number} requestCount
     */
    requestCount:number =0;
    /**
     * An ApiRequestor instance is created
     * @param {ApiRequestorProps} props - All properties which are required by ApiRequestor to work seamlessly
     */
    constructor(props:ApiRequestorProps){
        super(props);
        this.__rangeManager = new RangeManager({
            rules:props.rules,
            rangeSize: props.rangeSize
        });

        this.generateRequestRange = this.generateRequestRange.bind(this);
        this.request = this.request.bind(this);
    }
    /**
     * Returns the url which we are requesting for data
     * @returns {string}
     */
    get url():string{
        if(typeof this.__properties.url === "function"){
            return this.__properties.url();
        }else{
            return this.__properties.url;
        }
    }
    /**
     * Generates the request range which will return the from and to date for current resolution
     * @param {string} resolution - the resolution for which the range has to be identified
     * @returns {Range}
     */
    generateRequestRange(resolution:string):Range{
        return this.__rangeManager.getRange(resolution);
    }
    request(resolution:string, requestBodyOrURLQuery: string, isRequestForInitialData: boolean, headers:HeadersInit|undefined, method:string): Promise<any> {
        this.requestCount++;
        if(isRequestForInitialData){
            this.__rangeManager.initRange(resolution);
        }
        return fetch(
            this.url+`${method.toUpperCase()==="GET" ? requestBodyOrURLQuery : ''}`,
            {
                method: method,
                body: method.toUpperCase() === "POST" ? requestBodyOrURLQuery : undefined,
                headers
            }
        );
    }

}