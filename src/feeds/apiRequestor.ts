import AbstractCompose from "../utils/abstract-composer";
import RangeManager, { Range, RangeManagerProps } from "./rangeManager";

declare type URLFactory = () => string;

export interface ApiRequestorProps extends RangeManagerProps{
    url:string|URLFactory;
};

interface IApiRequestor{
    request(resolution:string, requestBody:string, isRequestForInitialData:boolean): Promise<any>;
}

export default class ApiRequestor extends AbstractCompose<ApiRequestorProps> implements IApiRequestor{
    private __rangeManager: RangeManager;
    requestCount:number =0;
    constructor(props:ApiRequestorProps){
        super(props);
        this.__rangeManager = new RangeManager({
            rules:props.rules,
            rangeSize: props.rangeSize
        });

        this.generateRequestRange = this.generateRequestRange.bind(this);
        this.request = this.request.bind(this);
    }

    get url():string{
        if(typeof this.__properties.url === "function"){
            return this.__properties.url();
        }else{
            return this.__properties.url;
        }
    }

    generateRequestRange(resolution:string):Range{
        return this.__rangeManager.getRange(resolution);
    }
    
    request(resolution:string, requestBody: string, isRequestForInitialData: boolean, headers:HeadersInit|undefined=undefined): Promise<any> {
        this.requestCount++;
        if(isRequestForInitialData){
            this.__rangeManager.initRange(resolution);
        }
        return fetch(
            this.url,
            {
                body: requestBody,
                headers
            }
        );
    }

}