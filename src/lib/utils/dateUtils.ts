const DATE_SEPERATOR =  '/';
const MIDDLE_SEPERATOR =  '\xa0';
const TIME_SEPERATOR =  ':';


export function formatDateTimeString(dateStr:string | undefined | null){
  if(!dateStr) return '';
  const date = new Date(dateStr);
  return formatDate(date) +MIDDLE_SEPERATOR+ formatTime(date);
}

export function formatDateString(dateStr:string | undefined | null){
  if(!dateStr) return '';
  const date = new Date(dateStr);
  return Date2JalaliDate(date);
}

export function formatDateTime(date:Date | undefined | null){
  if(!date) return '';
  return formatDate(date) +MIDDLE_SEPERATOR+ formatTime(date);
}

export function formatDate(date:Date | undefined | null){
  if(!date) return '';
  return Date2JalaliDate(date);
}

export function formatTime(date:Date | undefined | null){
  if(!date) return '';
  let hours: string = date.getHours().toString()
  let minutes: string = date.getMinutes().toString()

  return `${'00'.substring(hours.length)}${hours}${TIME_SEPERATOR}${'00'.substring(minutes.length)}${minutes}`;
}
export interface IDateDiff {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  miliseconds: number;
  passed: boolean;
}

export function calcDateDifferences(fromDate: Date, tillDate: Date) : IDateDiff {
  let diff = tillDate.getTime() - fromDate.getTime();
  const passed = diff < 0;
  if(diff < 0) diff = -diff;
  const days = Math.floor(diff / 86400000);
  diff -= days * 86400000;
  if(diff < 0) diff = 0;
  const hours = Math.floor(diff / 3600000);
  diff -= hours * 3600000;
  if(diff < 0) diff = 0;
  const minutes = Math.floor(diff / 60000);
  diff -= minutes * 60000;
  if(diff < 0) diff = 0;
  const seconds = Math.floor(diff / 1000);
  diff -= seconds * 1000;
  if(diff < 0) diff = 0;

  const result = { days, hours, minutes, seconds, miliseconds: diff, passed };
  // console.log({fromDate, tillDate, result});
  return result;
}

export function renderDateDiff(diff: IDateDiff, t: Function) : string {
  return (
    (diff.days === 0 ? '' : ' ' + t('date.day', {count: diff.days}))
    + (diff.hours === 0 ? '' : ' ' + t('date.hour', {count: diff.hours}))
    + (diff.minutes === 0 ? '' : ' ' + t('date.minute', {count: diff.minutes}))
    + (diff.seconds === 0 ? '' : ' ' + t('date.second', {count: diff.seconds}))
    + ' ' + (diff.passed ? t('date.passed') : t('date.still'))
  )

}


export function constructdate (_year: number, _month: number, _day: number, seperator: string = DATE_SEPERATOR): string {
	let _yeary: string, _monthm: string, _dayd: string;

  _dayd = _day.toString();
	_dayd = '00'.substring(0, 2 - _dayd.length) + _dayd;
	_monthm = _month.toString();
	_monthm = '00'.substring(0, 2 - _monthm.length) + _monthm;
	_yeary = _year.toString();
	_yeary = '0000'.substring(0, 4 - _yeary.length) + _yeary;
	return _yeary + seperator + _monthm + seperator + _dayd;
}

export const gregorianmonthdays: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const jalalimonthdays: number[] = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

const DATE_SEPERATOR_REPLACER = new RegExp(DATE_SEPERATOR, 'g');

export function JalaliGoFirstDateOfMonth (_date: string): string {
  let _d: number, _m: number, _y: number;

  _date = _date.replace(DATE_SEPERATOR_REPLACER, '');
  _d = 1;
  _m = parseInt(_date.substr(4, 2));
  _y = parseInt(_date.substr(0, 4));

	return constructdate(_y, _m, _d);
}

export function JalaliGoLastDateOfMonth (_date: string): string {
  return JalaliDaysToDate(JalaliDateToDays(JalaliGoFirstDateOfMonth(JalaliDaysToDate(JalaliDateToDays(JalaliGoFirstDateOfMonth(_date)) + 31))) - 1);
}

export function JalaliDateToDays (_date: string): number {
  let _day: number, _d: number, _m: number, _y: number;

  _day = 0;
  _date = _date.replace(DATE_SEPERATOR_REPLACER, '');
  _d = parseInt(_date.substr(6, 2));
  _m = parseInt(_date.substr(4, 2));
  _y = parseInt(_date.substr(0, 4));

  _day = _day + _d;
  if (_m > 6) {
    _day = _day + (6 * 31) + ((_m - 7) * 30);
  }else{
    _day = _day + ((_m - 1) * 31);
  }

  _y = _y - 1371;
  _day = _day + (_y * 365) + Math.floor((_y + 3) / 4);
  return _day;
}

export function JalaliDaysToDate (_days: number): string { 
  let _d: number, _m: number, _y: number, _i: number, _ly: number;
	_y = Math.floor(_days / 365);
	_ly = Math.floor((_y + 3) / 4);
	if (_days % 365 <= _ly) { 
    _y = _y-1;
  }

	_days = _days - Math.floor(_y * 365 + (_y + 3) / 4);
	_m = 1;
	_i = 0;

	while (_i < 11) {
		if (_days > jalalimonthdays[_i]) {
			_m = _m + 1;
			_days = _days - jalalimonthdays[_i];
			_i = _i + 1;
    }else{
			break;
    }
	}

	_d = _days;
	_y = _y + 1371;
	return constructdate(_y, _m, _d);
}

export function GregorianDateToDays (_date: string): number {
  let _day: number, _d: number, _m: number, _y: number, _i: number;
		_day = 0;
    _date = _date.replace(DATE_SEPERATOR_REPLACER, '');
    _d = parseInt(_date.substr(6, 2));
    _m = parseInt(_date.substr(4, 2));
    _y = parseInt(_date.substr(0, 4));
  
		_day = _day + _d;
		_i = 1;
		while(_i < _m) {
			_day = _day + gregorianmonthdays[_i - 1];
			_i = _i + 1;
		}


    _y = _y - 1992;
		_day = _day + (_y * 365) + Math.floor((_y + 3) / 4);

		if (((_y % 4) === 0) && _m > 2) {
			_day = _day + 1;
    }

		_day = _day - (31 + 29 + 19);
		return _day;
}

export function GregorianDaysToDate (_days: number): string { 
  let _d: number, _m: number, _y: number, _i: number, _ly: number;
	_days = _days + (31 + 29 + 19);
	_y = Math.floor(_days / 365);
	_ly = Math.floor((_y + 3) / 4);
	if (_days % 365 <= _ly) { 
    _y = _y-1; 
  }

	_days = _days - Math.floor(_y * 365 + (_y + 3) / 4);
	_m = 1;
	_i = 0;

	while (_i < 12) {
		if (_i === 1 && (_y % 4)===0) {
			if (_days > (gregorianmonthdays[_i] + 1)) {
				_m = _m+1;
				_days = _days - (gregorianmonthdays[_i] + 1);
      }
		}else if (_days > gregorianmonthdays[_i]) {
			_m = _m+1;
			_days = _days - gregorianmonthdays[_i];
    }else {
      break;
    }
		_i = _i + 1;
	}
	_d = _days;
	_y = _y + 1992;
	return constructdate(_y, _m, _d);
}

export function Jalali2Gregorian (_jalaliDate: string): string { 
  return GregorianDaysToDate(JalaliDateToDays(_jalaliDate));
}

export function Gregorian2Jalali (_gregorianDate: string): string {
  return JalaliDaysToDate(GregorianDateToDays(_gregorianDate));
}

export interface IFirstDay{
  firstDayDate: Date;
  jalaliDate: string;
  firstDayPersianWeekDay: number;
}
export interface ILastDay{
  lastDay: number;
  jalaliDate: string;
  lastDayDate: Date;
}

// month is based on 1
export function FirstDayOfJalaliMonth(year: number, month: number): IFirstDay{
  const jalaliDate = constructdate(year, month, 1);
  const firstDayDate = Jalali2Date(jalaliDate);
  const firstDayPersianWeekDay = (firstDayDate.getDay() + 1) % 7;
  return {firstDayDate, jalaliDate, firstDayPersianWeekDay};
}

export function LastDayOfJalaliMonth(year: number, month: number): ILastDay{
  const lastDay = jalalimonthdays[month - 1] + (month===12 && isJalaliLapsYear(year) ? 1 : 0);
  const jalaliDate = constructdate(year, month, lastDay);
  const lastDayDate = Jalali2Date(jalaliDate, '23:59:59');
  return {lastDay, jalaliDate, lastDayDate};
}

export function Jalali2Date(jalaliDate: string, time: string = '00:00:00'): Date{
  const gregorianDate = Jalali2Gregorian(jalaliDate).replace(DATE_SEPERATOR_REPLACER, '-');
  const date = new Date((gregorianDate)+'T'+time);
  return date;
}

export function JalaliNow(): string{
  return Date2JalaliDate(new Date());
}

const lapsYears: number[] = [0, 4, 8, 12, 16, 20, 24, 29, 33, 37, 41, 45, 53, 57, 62, 66, 70, 74, 78, 82, 86, 90, 95, 99, 103, 107, 111, 115, 119, 124];
export function isJalaliLapsYear(year: number): boolean {
  const ly = year % 128; 
  const i = lapsYears.findIndex( l => l === ly);
  return i !== -1;
}

export function Date2JalaliDate(date: Date): string{
  if(!date) return '';
  if(!(date instanceof Date)){
    date = new Date(date);
  }
  const gregorianDate = constructdate(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return Gregorian2Jalali(gregorianDate);
}

export function test(){
  console.log('FirstDayOfJalaliMonth', Date2JalaliDate(new Date()))
  
  console.log('FirstDayOfJalaliMonth', FirstDayOfJalaliMonth(1398, 1))
  console.log('FirstDayOfJalaliMonth', LastDayOfJalaliMonth(1396, 12))
  console.log('FirstDayOfJalaliMonth', LastDayOfJalaliMonth(1397, 12))
  console.log('FirstDayOfJalaliMonth', LastDayOfJalaliMonth(1399, 12))
  console.log('FirstDayOfJalaliMonth', LastDayOfJalaliMonth(1400, 12))
  console.log('FirstDayOfJalaliMonth', LastDayOfJalaliMonth(1401, 12))
  
  console.log(JalaliDaysToDate(JalaliDateToDays('1403/01/01')))
  console.log(GregorianDaysToDate(GregorianDateToDays('2024/03/20')))
  
  // it have problem before 1372 and after 1408, so not a problem for now
  let a = new Date("1993-03-01T20:54:14.900Z");
  console.log('starting')
  for(let i = 0 ; i < 1; i++){
    a = new Date(a.getTime() + 24 * 60 * 60 * 1000)
    let m1 = a.toLocaleDateString('de-DE-u-ca-persian-hc-h24', { year: 'numeric', month: '2-digit', day: '2-digit' });
    m1 = m1.substr(6, 4) + DATE_SEPERATOR + m1.substr(3, 2) + DATE_SEPERATOR + m1.substr(0, 2);

    let m2 = a.toLocaleDateString('de-DE-u-hc-h24', { year: 'numeric', month: '2-digit', day: '2-digit' });
    m2 = m2.substr(6, 4) + DATE_SEPERATOR + m2.substr(3, 2) + DATE_SEPERATOR + m2.substr(0, 2);

    let r1 = Jalali2Gregorian(m1)
    let r2 = Gregorian2Jalali(m2)

    if(m1!==r2 || m2!==r1)
      console.log(m1, m2, r1, r2)
  }
  console.log(`finished with ${a.toISOString()}`)
}