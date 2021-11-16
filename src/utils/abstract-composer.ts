import Subscriber from "../pubsub/subscriber";

export default abstract class AbstractCompose<T>{
    protected __properties:T;
    protected __subscription:Subscriber;

    readonly props:T;
    constructor(props:T){
        this.__properties = props;
        this.props = Object.freeze(this.__properties);
        this.__subscription = new Subscriber();
        this.updateProps = this.updateProps.bind(this);
    }

    updateProps(props:T){
        this.__properties =props;
    }
}