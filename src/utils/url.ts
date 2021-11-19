/**
 * @category URL-Utils
 * @method updateURLState
 * @description Update's the URL state without reloading the chart
 * @param {string} newUrl - new URL to be updated
 */
export function updateURLState(newUrl: string): void {
  window.history.replaceState({}, "", newUrl);
}
/**
 * @category URL-Utils
 * @method convertObjectToURLString
 * @description Converts the custom object provide to URL query string
 * @param {object} customObject - custom JS object to convert to string
 * @param {boolean} returnEncodedValue - which will encode the string instead of raw string
 * @returns {string}
 */
export function convertObjectToURLString(
  customObject: object,
  returnEncodedValue: boolean
): string {
  return encodeURIComponent(
    returnEncodedValue
      ? btoa(JSON.stringify(customObject))
      : JSON.stringify(customObject)
  );
}
