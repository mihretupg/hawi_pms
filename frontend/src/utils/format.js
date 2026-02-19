const fallbackFormatter = {
  format: (value) => `ETB ${Number(value || 0).toFixed(2)}`,
};

const etbFormatter = (() => {
  try {
    return new Intl.NumberFormat("am-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return fallbackFormatter;
  }
})();

const etbPlainFormatter = (() => {
  try {
    return new Intl.NumberFormat("am-ET", {
      maximumFractionDigits: 0,
    });
  } catch {
    return null;
  }
})();

export function formatEtb(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return etbFormatter.format(0);
  }
  return etbFormatter.format(number);
}

export function formatEtbPlain(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "0 ETB";
  }
  if (etbPlainFormatter) {
    return `${etbPlainFormatter.format(number)} ETB`;
  }
  return `${Math.round(number)} ETB`;
}
