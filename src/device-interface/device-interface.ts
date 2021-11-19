import DeviceIdentifier from "./device-identifier";
/**
 * @description Properties which has to be passed to the constructor
 * @interface DeviceInterfaceProps
 * @property {string} androidTag - name of the JSInterface, which Android webview is attached to.
 */
export interface DeviceInterfaceProps {
  androidTag: string;
}
/**
 * @name DeviceInterface
 * @classdesc Device-Interface class allows the website to communicate with the Application level attached using a Webview
 * The Communication flow goes as [Website in a Webview] - JSInterface/ WebkitMessageHandler - Application level logic implementation
 * @class
 */
export default class DeviceInterface {
  /**
   * @private
   * @property {any} __androidInterface - Interface which will be added to the window variable
   */
  private __androidInterface: any;
  /**
   * @private
   * @property {any} __iosInterface - Interface which will added to message handler's list for webkit
   */
  private __iosInterface: any;
  /**
   * @static
   * @property {DeviceIdentifier} deviceIdentifier - This allows us to identify the active platform running
   */
  static deviceIdentifier: DeviceIdentifier = new DeviceIdentifier();
  constructor(props: DeviceInterfaceProps) {
    this.__androidInterface = window[props.androidTag as any] ?? {};
    this.__iosInterface =
      (window["webkit" as any] ?? {})["messageHandlers" as any] ?? {};

    this.invokeDeviceInterface = this.invokeDeviceInterface.bind(this);
  }
  /**
   * @memberof DeviceInterface
   * @method invokeDeviceInterface
   * @description Invokes a method name on the application-logic via the JSInterface / MessageHandler's API
   * @param {string} methodName - name of the method to invoke
   * @param {any[]} [args] - optional parameters which needs to be sent within function as parameters
   * @returns {boolean} - If success returns true else false
   */
  invokeDeviceInterface(methodName: string, ...args: any[]): boolean {
    if (DeviceInterface.deviceIdentifier.isMobile) {
      if (DeviceInterface.deviceIdentifier.isAndroid) {
        if (methodName in this.__androidInterface) {
          this.__androidInterface[methodName](...args);
          return true;
        }
      } else {
        if (methodName in this.__iosInterface) {
          args = args.length ? args : [true];
          this.__iosInterface[methodName].postMessage(...args);
          return true;
        }
      }
    }
    return false;
  }
}
