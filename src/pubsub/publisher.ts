import { getSubscribersList } from "./pub-sub-data";
import Subscriber, { Subscription, SubscriptionMap } from "./subscriber";
import { SubscriptionEvent } from "./subscriber";
/**
 * @class Publisher
 */
export default class Publisher {
  /**
   * @property {string} topic - title which will be subscribed by the consumers
   */
  topic: string;
  constructor(topic: string) {
    this.topic = topic;

    this.publish = this.publish.bind(this);
  }
  /**
   * Get list of subscriptions for the current topic
   * @private
   * @memberof Publisher
   * @member {Array<Subscriber>} __subscribers
   */
  private get __subscribers(): Array<Subscriber> {
    return getSubscribersList(this.topic);
  }
  /**
   * @memberof Publisher
   * @method publish
   * @description Publish a new update to all subscribers
   * @param {SubscriptionEvent} eve - event which will be passed to all the subscribers
   */
  publish(eve: SubscriptionEvent) {
    this.__subscribers.forEach((sub: Subscriber) => {
      let subscriptions: SubscriptionMap | undefined = sub.getSubscriptions(
        this.topic
      );
      if (subscriptions) {
        subscriptions.forEach((value: Subscription) => {
          value.callback(eve);
        });
      }
    });
  }
}
