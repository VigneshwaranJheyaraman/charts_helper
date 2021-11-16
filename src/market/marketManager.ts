import { checkIsDailyTicks } from "../feeds/utils";
import Publisher from "../pubsub/publisher";
import Subscriber, { Subscription, SubscriptionEvent } from "../pubsub/subscriber";
import ChartSymbol from "../symbol/symbol";
import AbstractCompose from "../utils/abstract-composer";
import MarketRule from "./rules";
import { checkIfHoliday, checkIfWeekDay, convertToMarketHour, extractHourMinFromRule, getCurrentDateRule, goBackPreviousDay, SessionTime } from "./utils";

export declare type RulesFactory = (symbol: ChartSymbol) => Array<MarketRule>;

export interface MarketManageProps{
    rules:Array<MarketRule> | RulesFactory;
};

interface IMarketManager{
    getValidMarketDay(date:Date):Date;

    isMarketDay(date:Date): boolean;

    isMarketOpen(date:Date): boolean;

    goBackANumberOfTicks(fromDate:Date, numberOfTicks:number, resolution:string):Date;
}

export default class MarketManager extends AbstractCompose<MarketManageProps> implements IMarketManager{
    private __symbolSubscription:Subscriber = new Subscriber();
    private __activeSymbol:ChartSymbol|null=null;
    static MarketSubscriptionToken:string = "MARKET_MANAGER_CHANGES";
    private __publisher:Publisher = new Publisher(MarketManager.MarketSubscriptionToken);

    constructor(props:MarketManageProps){
        super(props);
        let symbolSubscription:Subscription = this.__symbolSubscription.subscribe(ChartSymbol.SubscriptionTopic, (changeEvent:SubscriptionEvent) => {
            if(changeEvent.data){
                this.__activeSymbol = changeEvent.data;
            }
        });
        window.addEventListener('beforeunload', () => {
            this.__symbolSubscription.unsubscribe(ChartSymbol.SubscriptionTopic, symbolSubscription);
        });
        this.__publisher.publish({data: this});

        this.getValidMarketDay = this.getValidMarketDay.bind(this);
        this.isMarketDay = this.isMarketDay.bind(this);
        this.isMarketOpen = this.isMarketOpen.bind(this);
        this.goBackANumberOfTicks = this.goBackANumberOfTicks.bind(this);
    }

    get rules():Array<MarketRule>{
        if(typeof this.__properties.rules === "function"){
            return this.__activeSymbol ? this.__properties.rules(this.__activeSymbol) : [];
        }else{
            return this.__properties.rules;
        }
    }

    get isWeekDay():boolean{
        return checkIfWeekDay(new Date(), this.rules).isValid;
    }

    get isHoliday():boolean{
        return checkIfHoliday(new Date(), this.rules).isValid;
    }

    getValidMarketDay(date:Date): Date{
        date = new Date(date);
        while(!this.isMarketDay(date)){
            date = goBackPreviousDay(date);
        }
        return new Date(convertToMarketHour.call(this, date));
    }

    isMarketDay(date:Date = new Date()):boolean{
        return checkIfWeekDay(date, this.rules) && !checkIfHoliday(date, this.rules, true);
    }

    isMarketOpen(date:Date = new Date()):boolean{
        if(this.isMarketDay(date)){
            let currentDayRule:MarketRule = getCurrentDateRule(date, this.rules);
            if(currentDayRule.open && currentDayRule.close){
                let openHrMin:SessionTime = extractHourMinFromRule(currentDayRule.open), 
                [currentMinute, currentHour] = [date.getMinutes(), date.getHours()],
                closeHrMin:SessionTime = extractHourMinFromRule(currentDayRule.close);
                return (
                    (
                        currentHour > openHrMin.hr ||
                        (currentHour === openHrMin.hr && currentMinute >= openHrMin.min)
                    ) /**market has started */
                    &&
                    (
                        currentHour < closeHrMin.hr ||
                        (currentHour === closeHrMin.hr && currentMinute < closeHrMin.min)
                    )
                );
            }
    }
        return false;
    }

    goBackANumberOfTicks(fromDate:Date, numberOfTicks:number, resolution:string):Date{
        fromDate = new Date(fromDate);
        while(numberOfTicks > 0){
            if(checkIsDailyTicks(resolution)){
                //daily ticks
                fromDate = this.getValidMarketDay(fromDate);
                numberOfTicks--;
            }else{
                //minute ticks
                let res:number = parseInt(resolution, 10),
                timeOffset:number = 1e3*60*res;
                if(this.isMarketOpen(fromDate)){
                    fromDate = new Date(fromDate.getTime() - timeOffset);
                } else{
                    fromDate = convertToMarketHour.call(this, fromDate);
                }
                numberOfTicks--;
            }
        }
        return new Date(fromDate);
    }
}