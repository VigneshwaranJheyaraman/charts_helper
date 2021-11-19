import AbstractCompose from "../utils/abstract-composer";
import { decodeDataFromLocalStore, encodeDataForLocalStore } from "./utils";
/**
 * LocalStorage specifies object structure of LocalStore's container
 * @template T
 * @typedef {object} LocalStorage<T>
 */
declare type LocalStorage<T> = {
  [key: string]: {
    enableEncoding: boolean | string;
    data: T;
  };
};
/**
 * @constant
 * @type {string}
 */
const storeKeyword: string = "store";
/**
 * LocalStore provides API for localStorage and will abstract the external API from direct data access
 * @class LocalStore
 */
export default class LocalStore {
  /**
   * Store's container
   * @private
   * @property {LocalStorage} __store
   */
  private __store: LocalStorage<Store>;
  constructor() {
    try {
      var storeFromLocalStore: LocalStorage<string> | null = JSON.parse(
        localStorage.getItem(storeKeyword) || "{}"
      );
    } catch (err) {
      storeFromLocalStore = {};
    }
    this.__store = {};
    if (storeFromLocalStore) {
      Object.keys(storeFromLocalStore).forEach((key: string) => {
        if (storeFromLocalStore && storeFromLocalStore[key]) {
          this.__store[key] = {
            enableEncoding: !!storeFromLocalStore[key].enableEncoding,
            data: Store.fromJSONString(storeFromLocalStore[key].data),
          };
        }
      });
    }

    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.toString = this.toString.bind(this);
  }
  /**
   * @memberof LocalStore
   * @method get
   * @description Returns the Store object for a specfic key
   * @param {string} key - Key to extract from LocalStore
   * @returns {Store|undefined}
   */
  get(key: string): Store | undefined {
    return key in this.__store ? this.__store[key].data : undefined;
  }
  /**
   * @memberof LocalStore
   * @method set
   * @description Set's the value to localstore
   * @param {string} key - key to update
   * @param {Store} value - Store with updated values
   */
  set(key: string, value: Store) {
    this.__store[key] = {
      data: value,
      enableEncoding: !!value.props.encodeString,
    };
    localStorage.setItem(storeKeyword, this.toString());
  }
  /**
   * @memberof LocalStore
   * @method toString
   * @description String implementation for the LocalStore's instance
   * @returns {string}
   */
  toString(): string {
    let storeToString: LocalStorage<string> = {};
    Object.keys(this.__store).forEach((key: string) => {
      let store: Store | undefined = this.get(key);
      if (store) {
        storeToString[key] = {
          enableEncoding: store.encodeString ? "yes" : "no",
          data: store.toString(),
        };
      }
    });
    return JSON.stringify(storeToString);
  }
}
/**
 * Store properties passed on to constructor
 * @interface StoreProps
 */
interface StoreProps {
  encodeString?: boolean;
}
/**
 * Store which can handle its own set of items
 * @class Store
 * @extends AbstractCompose<StoreProps|Store>
 */
class Store extends AbstractCompose<StoreProps | Store> {
  /**
   * @private
   * @property {Map<string, string>} __store;
   */
  private __store: Map<string, string>;
  /**
   * Return's a Store's instance
   * @param {StoreProps|Store} props - constructor properties
   */
  constructor(
    props: StoreProps | Store = {
      encodeString: false,
    }
  ) {
    super(props);
    if (props instanceof Store) {
      this.__store = props.__store;
      this.updateProps(props.props);
    } else {
      this.__store = new Map();
    }

    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.toString = this.toString.bind(this);
  }
  /**
   * Check if the store has encoding enabled to encode the data for security reasons
   * @memberof Store
   * @member {boolean}
   */
  get encodeString(): boolean {
    return !!this.props.encodeString;
  }
  /**
   * @memberof Store
   * @method get
   * @description Get a value from store
   * @param {string} key
   * @returns {string|undefined}
   */
  get(key: string): string | undefined {
    return this.encodeString
      ? decodeDataFromLocalStore(this.__store.get(key) || "")
      : this.__store.get(key);
  }
  /**
   * @memberof Store
   * @method set
   * @description Updates the store with a new key or existing key
   * @param {string} key - key to insert
   * @param {any} value - value to insert
   */
  set(key: string, value: any): void {
    if (typeof value === "object") {
      value = JSON.stringify(value);
    }
    if (this.encodeString) {
      this.__store.set(key, encodeDataForLocalStore(value));
    } else {
      this.__store.set(key, value);
    }
  }
  /**
   * @memberof Store
   * @method toString
   * @description String implementation fo Store's instance
   * @returns {string}
   */
  toString(): string {
    let mappedStore: any = {},
      storeIterator: IterableIterator<[string, string]> =
        this.__store.entries(),
      currentValue: IteratorResult<[string, string]> = storeIterator.next();
    while (!currentValue.done) {
      let [key, value]: [string, string] = currentValue.value;
      mappedStore[key] = value;
      currentValue = storeIterator.next();
    }
    return JSON.stringify(mappedStore);
  }
  /**
   * @static
   * @memberof Store
   * @method fromJSONString
   * @description Extracts store from stringified store and generates a Store's instance
   * @param {string} jsonString - JSON string to convert
   * @param {boolean} [isEnabledEncoding=false] - optional value to enable or disable encoding of data
   * @returns {Store}
   */
  static fromJSONString(
    jsonString: string,
    isEnabledEncoding: boolean = false
  ): Store {
    let mappedStore: any = {},
      newStore: Store = new Store();
    try {
      mappedStore = JSON.parse(jsonString);
    } catch (err) {
      console.error("Error restoring");
    }
    Object.keys(mappedStore).forEach((key: string) => {
      newStore.set(key, mappedStore[key]);
    });
    newStore.updateProps({
      encodeString: isEnabledEncoding,
    });
    return newStore;
  }
}
