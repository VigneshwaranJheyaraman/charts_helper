/**
 * @classdesc Device-Identifier identifies the platform on which the application is running
 * @class
 * @name DeviceIdentifier
 */
export default class DeviceIdentifier {
  /**
   * UserAgent property from JS Native API of navigator
   * @private
   * @property {string} _userAgent;
   */
  private _userAgent: string;
  /**
   * Platform's property from JS Native API for navigator
   * @private
   * @property {string} _platform;
   */
  private _platform: string;
  constructor() {
    this._userAgent = navigator.userAgent || "";
    this._platform = navigator.platform || "";
  }
  /**
   * Returns if the platform is android or not
   * @memberof DeviceIdentifier
   * @member {boolean} isAndroid
   */
  get isAndroid(): boolean {
    return /android/i.test(this._userAgent);
  }
  /**
   * Returns if the platform is iOS / iPhone or not
   * @memberof DeviceIdentifier
   * @member {boolean} isIos
   */
  get isIos(): boolean {
    return /iPad|iPhone|iPod/.test(this._platform);
  }
  /**
   * Returns if the device is a mobile device or not
   * @memberof DeviceIdentifier
   * @member {boolean} isMobile
   */
  get isMobile(): boolean {
    return /android|iphone|kindle|ipad/i.test(this._userAgent);
  }
  /**
   * Returns if the device is desktop / laptop device or not
   * @memberof DeviceIdentifier
   * @member {boolean} isDesktop
   */
  get isDesktop(): boolean {
    return !this.isMobile;
  }
}
