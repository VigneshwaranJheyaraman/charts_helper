/**!
 * @interface MarketRule interface specifies standard definition for a date or a week day
 * to specify their respective market timing or holiday
 * @property {number} [dayofweek] - specifies the day of the week with Sunday as 0 till Saturday as 6.
 * @property {string} [open] - specifies the open timing of the day, the format is HH:MM
 * @property {string} [close] - market session closing time of the day, format is HH:MM
 * @property {string} [date] - a string of format YYYY-MM-DD to specify a rule for specific date
 * @property {string} [name] - This property when specified will consider the date or dayofweek as a holiday
 */
export default interface MarketRule {
  dayofweek?: number;
  open?: string;
  close?: string;
  date?: string;
  name?: string;
}
