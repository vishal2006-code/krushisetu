export function toSafeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function formatINR(value, fractionDigits = 2) {
  const amount = toSafeNumber(value);
  return `\u20B9${amount.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })}`;
}

