import MarketManager from "../market/marketManager";
import { convertToMarketHour } from "../market/utils";

export function checkEverySecond(callback:() => void, checkCondition:boolean, timeOutMs:number=1e3):void{
    let timeOut:number = setTimeout(() => {
        if(checkCondition){
            callback();
        }else{
            checkEverySecond(callback, checkCondition, timeOutMs);
            clearTimeout(timeOut);
        }
    }, timeOutMs);
}

export interface Candle{
    date:Date|null,
    open:number,
    close:number,
    low:number,
    high:number,
    volume?:number
};

export function checkIsDailyTicks(resolution:string):boolean{
    return /[DWM]/.test(resolution);
}

export function normalizeMinutes(date:Date, resolution:string){
    date = new Date(date);
    if(checkIsDailyTicks(resolution)){
        return new Date(date.setHours(5,30,0,0));
    }else{
        let res:number = parseInt(resolution, 10);
        if(date.getMinutes() % res === 0){
            date.setSeconds(0,0);
        }else{
            date.setMinutes(Math.floor(date.getMinutes() / res) * res, 0, 0);
        }
        return new Date(date);
    }
}

export function findLastCandleTime(lastCandleTime:Date, broadCastCandleTime:Date, resolution:string, marketManager:MarketManager):Date{
    broadCastCandleTime = new Date(broadCastCandleTime);
    lastCandleTime = new Date(lastCandleTime);
    let normalizedTime:Date = normalizeMinutes(broadCastCandleTime, resolution);
    if(checkIsDailyTicks(resolution)){
        return new Date(lastCandleTime.setHours(5,30,0,0));
    }else{
        if(broadCastCandleTime.toDateString() === lastCandleTime.toDateString()){
            let res:number = parseInt(resolution, 10),
                resolutionInMilliSecond:number = (res * 1e3 * 60),
                timeDifferenceBetweenLastCandleAndBroadcastCandle:number = broadCastCandleTime.getTime() - lastCandleTime.getTime(),
                candlesDifferenceBetweenLastCandleAndBroadcastCandle:number = Math.floor(timeDifferenceBetweenLastCandleAndBroadcastCandle / resolutionInMilliSecond),
                nextCandleTime:Date = new Date(lastCandleTime.getTime() + resolutionInMilliSecond),
                newLastCandleTime:Date = new Date(nextCandleTime);
            if(candlesDifferenceBetweenLastCandleAndBroadcastCandle > 1){
                nextCandleTime = new Date(lastCandleTime.getTime() + (resolutionInMilliSecond * candlesDifferenceBetweenLastCandleAndBroadcastCandle));
            }
            newLastCandleTime = new Date((broadCastCandleTime.getTime() >= lastCandleTime.getTime()) ? nextCandleTime : lastCandleTime);
            if(marketManager.isMarketOpen(newLastCandleTime)){
                return newLastCandleTime;
            }else{
                return convertToMarketHour.call(marketManager, newLastCandleTime);
            }
        }
        return normalizedTime;
    }
}