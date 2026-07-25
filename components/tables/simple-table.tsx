export function SimpleTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="sticky top-0 bg-slate-100 text-left text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-white/10 dark:text-slate-400">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-white/10">{rows.map((row, index) => <tr key={index} className="hover:bg-slate-100/70 dark:hover:bg-white/[0.04]">{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
