import { getSubscribersList } from "./pub-sub-data";
import Subscriber, { Subscription, SubscriptionMap } from "./subscriber";
import { SubscriptionEvent } from "./subscriber";

export default class Publisher{
    topic:string;

    constructor(topic:string){
        this.topic = topic;

        this.publish = this.publish.bind(this);
    }

    private get __subscribers():Array<Subscriber>{
        return getSubscribersList(this.topic);
    }

    publish(eve:SubscriptionEvent){
        this.__subscribers.forEach((sub:Subscriber) => {
            let subscriptions:SubscriptionMap|undefined = sub.getSubscriptions(this.topic);
            if(subscriptions){
                subscriptions.forEach((value:Subscription) => {
                    value.callback(eve);
                })
            }
        });
    }
}