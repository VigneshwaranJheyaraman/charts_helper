import { subscribe, unsubscribe } from "./pub-sub-data";

export declare type SubscriptionCallback = (e:SubscriptionEvent) => void;
export declare type SubscriptionEvent = {data?:any};
export declare type SubscriptionList = Map<string, SubscriptionMap>;
export declare type SubscriptionMap = Map<number, Subscription>;

export default class Subscriber{
    private __subscriptions:SubscriptionList;
    private __id:number;
    constructor(){
        this.__id = Math.random();
        this.__subscriptions = new Map();

        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.getSubscriptions = this.getSubscriptions.bind(this);
        this.unsubscribeAll = this.unsubscribeAll.bind(this);
        this.unsubscribeList = this.unsubscribeList.bind(this)
    };

    subscribe(token:string, callback:SubscriptionCallback):Subscription{
        let existingSubscription:SubscriptionMap|undefined = this.__subscriptions.get(token);
        existingSubscription = existingSubscription || new Map();
        let newSubscription:Subscription = new Subscription(callback);
        existingSubscription.set(newSubscription.id, newSubscription);
        this.__subscriptions.set(token, existingSubscription);
        subscribe(token, this);
        return newSubscription;
    }

    unsubscribeAll(token:string){
        this.__subscriptions.delete(token);
    }

    unsubscribe(token:string, subscription:Subscription){
        let existingSubscription:SubscriptionMap|undefined = this.__subscriptions.get(token);
        if(existingSubscription && subscription.isValid){
            subscription.unsubscribe();
            existingSubscription.delete(subscription.id);
            unsubscribe(token, this);
        }
    }

    unsubscribeList(subscriptions: Array<{token:string, subscription:Subscription}>){
        subscriptions.forEach((tokenAndSubscription => {
            this.unsubscribe(tokenAndSubscription.token , tokenAndSubscription.subscription);
        }));
    }

    getSubscriptions(token:string):SubscriptionMap|undefined{
        return this.__subscriptions.get(token);
    }

    toString():string{
        return `${this.__id} - Subscriber Id`;
    }
}

export class Subscription{
    isValid: boolean;
    id:number;
    callback:SubscriptionCallback;

    constructor(callback:SubscriptionCallback){
        this.isValid=true;
        this.id = Date.now();
        this.callback = callback;

        this.unsubscribe = this.unsubscribe.bind(this);
    }

    unsubscribe(){
        if(this.isValid){
            this.isValid=false;
        }
    }
}