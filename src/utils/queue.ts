export default class Queue<T>{
    private __queue:Array<T>;
    constructor(){
        this.__queue = [];

        this.enqueue = this.enqueue.bind(this);
        this.dequeue = this.dequeue.bind(this);
        this.emptyAll = this.emptyAll.bind(this);
    }

    enqueue(item:T):void{
        this.__queue.push(item);
    }

    dequeue():T|undefined{
        return this.__queue.shift();
    }

    emptyAll():Array<T>{
        let allItems:Array<T> = [];
        for(let i=0;i<this.__queue.length;i++){
            let item:T|undefined = this.dequeue();
            item && allItems.push(item);
        }
        return allItems;
    }
}