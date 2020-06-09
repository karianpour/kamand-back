export function mapToFarsi(str: string | number | undefined | null): string | number | undefined | null {
  if (!str && str !== 0) return str;
  return str.toString().replace(/[1234567890١٢٣٤٥٦٧٨٩٠]/gi, e => { const c = e.charCodeAt(0); return String.fromCharCode(c + (c < 60 ? 1728 : 144)) })
}

export function mapToLatin(str: string | number | undefined | null): string | number | undefined | null {
  if (!str && str !== 0) return str;
  return str.toString().replace(/[۱۲۳۴۵۶۷۸۹۰١٢٣٤٥٦٧٨٩٠]/gi, e => { const c = e.charCodeAt(0); return String.fromCharCode(c - (c < 1770 ? 1584 : 1728)) })
}

export function stripAnyThingButDigits(str: string): string {
  if(!str) return str;
  return str.toString().replace(/[^1234567890۱۲۳۴۵۶۷۸۹۰١٢٣٤٥٦٧٨٩٠]/gi, '');
}
