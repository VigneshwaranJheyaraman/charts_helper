import Subscriber, { SubscriptionList } from "./subscriber";
/**
 * The List of subscriber, which map every token with list of subscribers
 * @typedef {Map<string, Array<Subscriber>>} SubscribersList;
 */
export declare type SubscribersList = Map<string, Array<Subscriber>>;
/**
 * Data storing all the publisher and their subscriptions
 * @type {SubscriptionList}
 */
var allPublisherSubscribers:SubscribersList = new Map();
/**
 * Subscribe to a token
 * @param {string} token - token to subscribe
 * @param {Subscriber} subscriber - subscriber wanting to subscribe
 */
export function subscribe(token:string, subscriber: Subscriber):void{
    let subscriptionList:Array<Subscriber>|undefined = allPublisherSubscribers.get(token) || [];
    subscriptionList.push(subscriber);
    allPublisherSubscribers.set(token, [...subscriptionList]);
}
/**
 * Unsubscribe from a token
 * @param {string} token - token to unsubscribe from
 * @param {Subscriber} subscriber - subscriber to unsubscribe
 * @param {boolean} [removeAllSubscriptions=false] - remove all subscriptions and subscriber from data store
 */
export function unsubscribe(token:string, subscriber:Subscriber, removeAllSubscriptions:boolean=false):void{
    let subscriptionList:Array<Subscriber>|undefined = allPublisherSubscribers.get(token) || [];
    subscriptionList = subscriptionList.filter((sub:Subscriber) => sub.toString() !== subscriber.toString());
    if(!removeAllSubscriptions){
    allPublisherSubscribers.set(token, [...subscriptionList, subscriber]);
    }else{
        allPublisherSubscribers.set(token, subscriptionList);
    }
}
/**
 * Get list of Subscriber for a given token
 * @param {string} token - token to get list of subscribers
 * @returns {Array<Subscriber>}
 */
export function getSubscribersList(token:string): Array<Subscriber>{
    return allPublisherSubscribers.get(token) || [];
}