import MarketManager, { MarketManageProps } from "../market/marketManager";
import { Subscription, SubscriptionEvent } from "../pubsub/subscriber";
import ChartSymbol from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";

export interface Range{
    from: Date|null,
    to: Date|null
};

interface RequestRange{
    [key:string]: Range
};

export interface RangeManagerProps extends MarketManageProps{
    rangeSize?:number;
}

export default class RangeManager extends AbstractCompose<RangeManagerProps>{

    private __requestRange:RequestRange;
    private __marketManager:MarketManager;

    static RangeChangeToken:string = 'RANGE_CHANGE_TOKEN';

    constructor(props:RangeManagerProps){
        super(props);

        this.__requestRange = {};
        this.__marketManager = new MarketManager({
            rules:props.rules
        });

        this.getRange = this.getRange.bind(this);
        this.initRange = this.initRange.bind(this);
        this.clearAll = this.clearAll.bind(this);


        let symbolSubscription:Subscription = this.__subscription.subscribe(
            ChartSymbol.SubscriptionTopic,
            (e:SubscriptionEvent) => {
                if(e.data){
                    this.clearAll();
                }
            }
        );

        window.addEventListener("beforeunload", ()=>{
            this.__subscription.unsubscribe(ChartSymbol.SubscriptionTopic, symbolSubscription);
        })
    }

    get rangeSize():number{
        return this.__properties.rangeSize || 500;
    }

    getRange(resolution:string){
        let newRange: Range = {
            from: null,
            to: null
        };
        if(resolution in this.__requestRange){
            newRange = this.__requestRange[resolution];
        }
        let toDate:Date = newRange.from || new Date(),
        fromDate:Date|null = newRange.from;
        if(!fromDate){
            fromDate = this.__marketManager.goBackANumberOfTicks(
                toDate,
                this.rangeSize,
                resolution
            );
        }
        newRange = {
            from:fromDate,
            to:toDate
        };
        this.__requestRange[resolution] = Object.assign({}, newRange);
        return {...newRange};
    }

    initRange(resolution:string){
        if(resolution in this.__requestRange){
            this.__requestRange[resolution] = {
                to:null,
                from:null
            };
        }
    }

    clearAll(){
        this.__requestRange = {};
    }
}