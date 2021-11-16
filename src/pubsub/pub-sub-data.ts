import Subscriber, { Subscription } from "./subscriber";

export declare type SubscribersList = Map<string, Array<Subscriber>>;

var allPublisherSubscribers:SubscribersList = new Map();

export function subscribe(token:string, subscriber: Subscriber):void{
    let subscriptionList:Array<Subscriber>|undefined = allPublisherSubscribers.get(token) || [];
    subscriptionList.push(subscriber);
    allPublisherSubscribers.set(token, [...subscriptionList]);
}

export function unsubscribe(token:string, subscriber:Subscriber):void{
    let subscriptionList:Array<Subscriber>|undefined = allPublisherSubscribers.get(token) || [];
    subscriptionList = subscriptionList.filter((sub:Subscriber) => sub.toString() !== subscriber.toString());
    allPublisherSubscribers.set(token, [...subscriptionList, subscriber]);
}

export function getSubscribersList(token:string): Array<Subscriber>{
    return allPublisherSubscribers.get(token) || [];
}