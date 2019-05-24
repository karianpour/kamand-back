import { ExpectationFailed } from 'http-errors';
import { type } from 'os';


const emailFormat = /\S+@\S+\.\S+/;
const mobileFormat = /^(09)\d{9}$/;
const persianAlphabetFormat = /^([\u0600-\u06FF|\s|\u200C])+$/;
const allDigitFormat = /^\d+$/;

export function isValidEmailFormat(email: string) {
  return emailFormat.test(email);
}

export function isValidMobileFormat(email: string) {
  return mobileFormat.test(email);
}

export function isValidPersianAlphabetFormat(text: string) {
  return persianAlphabetFormat.test(text);
}

export function allCharsAreDigits(string: string) {
  return allDigitFormat.test(string);
}

export function isValidTimestamp(value: any) {
  if(value instanceof Date){
    return true;
  }
  if(typeof value === 'string'){
    const d = Date.parse(value);
    return !isNaN(d);
  }
  return false;
}

export function isValidNumber(value: any) {
  if(typeof value === 'number'){
    return true;
  }
  if(typeof value === 'string'){
    return allDigitFormat.test(value);
  }
  return false;
}

export function isValidNationalID(value: string) {
  if (value === "") return true;
  if (!allCharsAreDigits(value)) return false;
  if (value.length !== 10) return false;

  let sum = 0;
  let controlDigit = parseInt(value[9], 10);
  for (let i = 8; i >= 0; i--) {
    sum += parseInt(value[i], 10) * (10 - i);
  }
  let reminder = sum % 11;

  if (reminder >= 2) return 11 - reminder === controlDigit;
  else return reminder === controlDigit;
}

export function throwError(property: string, errorCode: string, errorText: string, fieldTranslation: string) {
  const msg = {
    codes: { [property]: [{code: errorCode, params: {field: fieldTranslation}}] },
    [property]: [errorText],
  };
  const error = new ExpectationFailed(JSON.stringify(msg));
  throw error;
}
