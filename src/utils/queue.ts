/**
 * Queue implementation using Array
 * @class Queue
 * @template T
 */
export default class Queue<T>{
    /**
     * @private
     * @property {Array<T>} __queue;
     */
    private __queue:Array<T>;
    /**
     * Returns a Queue's instance
     */
    constructor(){
        this.__queue = [];

        this.enqueue = this.enqueue.bind(this);
        this.dequeue = this.dequeue.bind(this);
        this.emptyAll = this.emptyAll.bind(this);
    }
    /**
     * Enqueue an item
     * @param {@template T} item 
     */
    enqueue(item:T):void{
        this.__queue.push(item);
    }
    /**
     * Dequeue an item
     * @returns {@template T |undefined}
     */
    dequeue():T|undefined{
        return this.__queue.shift();
    }
    /**
     * Empty the queue and return Array of queue items
     * @returns {Array<T>}
     */
    emptyAll():Array<T>{
        let allItems:Array<T> = [];
        for(let i=0;i<this.__queue.length;i++){
            let item:T|undefined = this.dequeue();
            item && allItems.push(item);
        }
        return allItems;
    }
}