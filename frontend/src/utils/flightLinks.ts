const CITY_TO_AIRPORT: Record<string, string> = {
  TYO: "NRT", OSA: "KIX", SEL: "ICN",
};

function resolve(code: string): string {
  return CITY_TO_AIRPORT[code] ?? code;
}

export function googleFlightsUrl(dest: string, outbound: string, ret: string): string {
  const arr = resolve(dest);
  return `https://www.google.com/flights#flt=SIN.${arr}.${outbound}*${arr}.SIN.${ret};c:SGD;e:1;s:0*1;sd:1;t:f`;
}

export function skyscannerUrl(dest: string, outbound: string, ret: string): string {
  const arr = resolve(dest).toLowerCase();
  const out = outbound.replace(/-/g, "").slice(2);
  const retStr = ret.replace(/-/g, "").slice(2);
  return `https://www.skyscanner.com.sg/transport/flights/sin/${arr}/${out}/${retStr}/`;
}
