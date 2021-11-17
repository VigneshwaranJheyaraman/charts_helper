import { subscribe, unsubscribe } from "./pub-sub-data";
/**
 * Callback which every subscriber will be provided on publish event
 * @typedef {(e:SubscriptionEvent) => void} SubscriptionCallback
 */
export declare type SubscriptionCallback = ((e:SubscriptionEvent) => void);
/**
 * Event object passed on SubscriptionCallback
 * @typedef {{ data?:any }} SubscriptionEvent
 */
export declare type SubscriptionEvent = ({data?:any});
/**
 * List of subscriptions maintained by a Subscriber
 * @typedef {Map<string, SubscriptionMap>} SubscriptionList;
 */
export declare type SubscriptionList = Map<string, SubscriptionMap>;
/**
 * Map of every subscription of a subscriber with their id
 * @typedef {Map<number, Subscription>} SubscriptionMap
 */
export declare type SubscriptionMap = Map<number, Subscription>;
/**
 * Subscriber's API
 * @class Subscriber
 */
export default class Subscriber{
    /**
     * List of subscriber's subscriptions
     * @private
     * @property {SubscriptionList} __subscriptions
     */
    private __subscriptions:SubscriptionList;
    /**
     * Unique subscriber's ID
     * @private
     * @property {number} __id
     */
    private __id:number;
    /**
     * Returns a Subscriber's instance
     */
    constructor(){
        this.__id = Math.random();
        this.__subscriptions = new Map();

        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = this.unsubscribe.bind(this);
        this.getSubscriptions = this.getSubscriptions.bind(this);
        this.unsubscribeAll = this.unsubscribeAll.bind(this);
        this.unsubscribeList = this.unsubscribeList.bind(this)
    };
    /**
     * Subscribe to a token, with a callback when any publish event is triggered by Token publisher
     * @param {string} token - token to subscribe to
     * @param {SubscriptionCallback} callback - callback which will be called on publish event triggered
     * @returns {Subscription}
     */
    subscribe(token:string, callback:SubscriptionCallback):Subscription{
        let existingSubscription:SubscriptionMap|undefined = this.__subscriptions.get(token);
        existingSubscription = existingSubscription || new Map();
        let newSubscription:Subscription = new Subscription(callback);
        existingSubscription.set(newSubscription.id, newSubscription);
        this.__subscriptions.set(token, existingSubscription);
        subscribe(token, this);
        return newSubscription;
    }
    /**
     * Unsubscribes the entire subscribe from the token publisher
     * @param {string} token - token to unsubscribe from
     */
    unsubscribeAll(token:string):void{
        this.__subscriptions.delete(token);
        unsubscribe(token, this, true);
    }
    /**
     * Unsubscribe a specific subscription from a token
     * @param {string} token - token to unsubscribe
     * @param {Subscription} subscription - Subscription to unsubscribe
     */
    unsubscribe(token:string, subscription:Subscription):void{
        let existingSubscription:SubscriptionMap|undefined = this.__subscriptions.get(token);
        if(existingSubscription && subscription.isValid){
            subscription.unsubscribe();
            existingSubscription.delete(subscription.id);
            unsubscribe(token, this);
        }
    }
    /**
     * Unsubscribe a list of subscriptions as a batch
     * @param {Array<{token:string, subscription:Subscription}>} subscriptions - List of subscriptions to unsubsribe from respective token
     */
    unsubscribeList(subscriptions: Array<{token:string, subscription:Subscription}>):void{
        subscriptions.forEach((tokenAndSubscription => {
            this.unsubscribe(tokenAndSubscription.token , tokenAndSubscription.subscription);
        }));
    }
    /**
     * Get List of subscriptions held by subscribe for a given token
     * @param {string} token - token to get list of subscriptions
     * @returns {SubscriptionMap|undefined}
     */
    getSubscriptions(token:string):SubscriptionMap|undefined{
        return this.__subscriptions.get(token);
    }
    /**
     * Returns the string format for the subscrber
     * @returns {string}
     */
    toString():string{
        return `${this.__id} - Subscriber Id`;
    }
}
/**
 * Subscription's API
 * @class Subscription
 */
export class Subscription{
    /**
     * Check if a subscription is valid or expired
     * @property {boolean} isValid
     */
    isValid: boolean;
    /**
     * Unique identifier for a subscription
     * @property {number} id
     */
    id:number;
    /**
     * Callback for the subscription
     * @property {SubscriptionCallback} callback
     */
    callback:SubscriptionCallback;
    /**
     * Returns a Susbcription's instance
     * @param {SubscriptionCallback} callback - callback to be called from publish event occurs
     */
    constructor(callback:SubscriptionCallback){
        this.isValid=true;
        this.id = Date.now();
        this.callback = callback;

        this.unsubscribe = this.unsubscribe.bind(this);
    }
    /**
     * Expires the subsription
     */
    unsubscribe(){
        if(this.isValid){
            this.isValid=false;
        }
    }
}