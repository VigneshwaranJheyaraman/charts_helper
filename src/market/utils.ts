import MarketManager from "./marketManager";
import MarketRule from "./rules";
/**
 * @category Market-Utils
 * @description ValidRule which is returned after checking the rule
 * @interface ValidRule
 * @property {MarketRule} [rule] - optional rule, which is a valid market rule
 * @property {boolean} isValid - return true if a rule exists
 */
interface ValidRule {
  rule?: MarketRule;
  isValid: boolean;
}
/**
 * @category Market-Utils
 * @method checkEverySecond
 * @description Market Session Time
 * @interface SessionTime
 * @property {number} hr - market hour
 * @property {number} min - market minute
 */
export interface SessionTime {
  hr: number;
  min: number;
}
/**
 * @category Market-Utils
 * @method checkIfWeekDay
 * @description Function to check if the date provided is a week day
 * @param {Date} dateToCheck - date to check
 * @param {Array<MarketRule>} rules - list of active market rules
 * @returns {ValidRule}
 */
export function checkIfWeekDay(
  dateToCheck: Date,
  rules: Array<MarketRule>
): ValidRule {
  dateToCheck = new Date(dateToCheck);
  let filteredWeekDayRule: Array<MarketRule> = rules
      .filter((rule: MarketRule) => {
        return rule.dayOfWeek && rule.open && rule.close;
      })
      .filter((rule: MarketRule) => {
        return rule.dayOfWeek === dateToCheck.getDay();
      }),
    isValid: boolean = filteredWeekDayRule.length !== 0;
  return {
    isValid,
    rule: isValid ? filteredWeekDayRule[0] : undefined,
  };
}
/**
 * @category Market-Utils
 * @method checkIfHoliday
 * @description Function to check if the date provided is a holiday
 * @param {Date} dateToCheck - date to check
 * @param {Array<MarketRule>} rules - list of active market rules
 * @param {boolean} [checkForSession=false] - consider the holiday session as well optional
 * @returns {ValidRule}
 */
export function checkIfHoliday(
  dateToCheck: Date,
  rules: Array<MarketRule>,
  checkForSession: boolean = false
): ValidRule {
  dateToCheck = new Date(dateToCheck);
  let filteredHolidayRule: Array<MarketRule> = rules
      .filter((rule: MarketRule) => rule.date && rule.name)
      .filter((rule: MarketRule) => {
        return (
          new Date(rule.date ?? "").toDateString() ===
          dateToCheck.toDateString()
        );
      })
      .filter((rule: MarketRule) => {
        return checkForSession ? true : !rule.open && !rule.close;
      }),
    isValid: boolean = filteredHolidayRule.length !== 0;
  return {
    isValid,
    rule: isValid ? filteredHolidayRule[0] : undefined,
  };
}
/**
 * @category Market-Utils
 * @method getCurrentDateRule
 * @description Return a valid rule based on the date selected
 * @param {Date} dateToCheck - date to check
 * @param {Array<MarketRule>} rules - list of active market rules
 * @returns {MarketRule}
 */
export function getCurrentDateRule(
  dateToCheck: Date,
  rules: Array<MarketRule>
): MarketRule {
  dateToCheck = new Date(dateToCheck);
  let isHoliday: ValidRule = checkIfHoliday(dateToCheck, rules);
  if (isHoliday.isValid && isHoliday.rule) {
    return isHoliday.rule;
  } else {
    let isHolidayWithSession: ValidRule = checkIfHoliday(
      dateToCheck,
      rules,
      true
    );
    if (isHolidayWithSession.isValid && isHolidayWithSession.rule) {
      return isHolidayWithSession.rule;
    } else {
      let isWeekDay: ValidRule = checkIfWeekDay(dateToCheck, rules);
      if (isWeekDay.isValid && isWeekDay.rule) {
        return isWeekDay.rule;
      } else {
        return rules[0];
      }
    }
  }
}
/**
 * @category Market-Utils
 * @method extractHourMinFromRule
 * @description Extract hr and min from string provide on market rule
 * @param {string} hrMin - HH:MM format time
 * @returns {SessionTime}
 */
export function extractHourMinFromRule(hrMin: string): SessionTime {
  let [hr, min] = hrMin.split(":").map((v) => parseInt(v, 10));
  return {
    hr,
    min,
  };
}
/**
 * @category Market-Utils
 * @method goBackPreviousDay
 * @description Returns the previous day from provided day
 * @param {Date} date - date to go back
 * @returns {Date}
 */
export function goBackPreviousDay(date: Date): Date {
  return new Date(date.getTime() - 1e3 * 60 * 60 * 24);
}
/**
 * @category Market-Utils
 * @method convertToMarketHour
 * @description Convert the date object within active market hour
 * @param {MarketManager} this - the this keyword binded to the function
 * @param {Date} date - date to convert within market hour
 * @returns {Date}
 */
export function convertToMarketHour(this: MarketManager, date: Date): Date {
  date = new Date(date);
  if (this.isMarketOpen(date)) {
    return date;
  } else {
    let defaultRule: MarketRule = this.rules[0],
      currentRule: MarketRule = getCurrentDateRule(date, this.rules),
      [currentMin, currentHr] = [date.getMinutes(), date.getHours()];
    if (currentRule.open && currentRule.close) {
      let openHrMin: SessionTime = extractHourMinFromRule(currentRule.open),
        closeHrMin: SessionTime = extractHourMinFromRule(currentRule.close);
      if (
        currentHr < openHrMin.hr ||
        (currentHr === openHrMin.hr && currentMin < openHrMin.min)
      ) {
        date.setHours(closeHrMin.hr, closeHrMin.min - 1, 0, 0);
        return convertToMarketHour.call(this, goBackPreviousDay(date));
      } else if (
        currentHr > closeHrMin.hr ||
        (currentHr === closeHrMin.hr && currentMin >= closeHrMin.min)
      ) {
        date.setHours(closeHrMin.hr, closeHrMin.min, 0, 0);
      }
    } else {
      if (defaultRule.open && defaultRule.close) {
        let defaultOpenHrMin: SessionTime = extractHourMinFromRule(
            defaultRule.open
          ),
          defaultCloseHrMin: SessionTime = extractHourMinFromRule(
            defaultRule.close
          );
        if (
          currentHr < defaultOpenHrMin.hr ||
          (currentHr === defaultOpenHrMin.hr &&
            currentMin < defaultOpenHrMin.min)
        ) {
          date.setHours(defaultCloseHrMin.hr, defaultCloseHrMin.min - 1, 0, 0);
          return convertToMarketHour.call(this, goBackPreviousDay(date));
        } else if (
          currentHr > defaultCloseHrMin.hr ||
          (currentHr === defaultCloseHrMin.hr &&
            currentMin >= defaultCloseHrMin.min)
        ) {
          date.setHours(defaultCloseHrMin.hr, defaultCloseHrMin.min, 0, 0);
        }
      }
    }
  }

  return new Date(date);
}
