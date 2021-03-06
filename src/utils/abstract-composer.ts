import Subscriber from "../pubsub/subscriber";
/**
 * Composes a basic implementation to handle the constructor props, adding subscribers for every isntance
 * @class AbstractCompose
 * @template T
 * @abstract
 */
export default abstract class AbstractCompose<T> {
  /**
   * Properties passed to constructor
   * @protected
   * @property {@template T} __properties;
   */
  protected __properties: T;
  /**
   * Subscription's instance
   * @protected
   * @property {Subscriber} __subscription;
   */
  protected __subscription: Subscriber;
  /**
   * Props which only be read
   * @readonly
   * @template T
   * @property {T} props
   */
  readonly props: T;
  constructor(props: T) {
    this.__properties = props;
    this.props = Object.freeze(this.__properties);
    this.__subscription = new Subscriber();
    this.updateProps = this.updateProps.bind(this);
  }
  /**
   * @memberof AbstractCompose
   * @method updateProps
   * @template T
   * @description Update Properties of the instance
   * @param {T} props - new properties to be updated
   */
  updateProps(props: T) {
    this.__properties = props;
  }
}
