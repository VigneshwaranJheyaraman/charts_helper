import { convertObjectToURLString, updateURLState } from "../utils/url";
import ChartSymbol, { ChartSymbolProps } from "./symbol";
/**
 * @category Symbol-utils
 * @method updateUrlStateBasedOnCurrentSymbol
 * @description Function which will update the symbol's provided properties on URL
 * @param {ChartSymbol} currentSymbol - current symbol to change
 * @param {boolean} encodeURLData - instead of raw string this will update an encoded string
 */
export function updateUrlStateBasedOnCurrentSymbol(
  currentSymbol: ChartSymbol,
  encodeURLData: boolean
): void {
  let currentURL: URL = new URL(window.location.href),
    dataToUpdate: ChartSymbolProps = currentSymbol.props,
    encodedDataOrPlainData: string = convertObjectToURLString(
      dataToUpdate,
      encodeURLData
    );
  currentURL.searchParams.set(ChartSymbol.URLQueryKey, encodedDataOrPlainData);
  updateURLState(currentURL.href);
}
