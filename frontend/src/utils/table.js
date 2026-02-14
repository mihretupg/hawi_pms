export function filterByQuery(items, query, fields) {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;

  return items.filter((item) =>
    fields.some((field) => {
      const value = typeof field === "function" ? field(item) : item?.[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(needle);
    })
  );
}

export function paginate(items, page, pageSize) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageCount,
    total,
    pageItems: items.slice(start, start + pageSize),
  };
}

function csvValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(rows, columns) {
  const header = columns.map((col) => csvValue(col.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const value = typeof col.accessor === "function" ? col.accessor(row) : row?.[col.accessor];
          return csvValue(value);
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}