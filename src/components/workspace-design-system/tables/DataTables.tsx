import type { ReactNode } from "react";
import type { WdsTableColumn } from "../types";
import { cn } from "../utils";

interface DataTableProps<T extends { id: string }> {
  columns: WdsTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  caption?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage = "No records found.",
  caption,
  className,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-slate-200 bg-white", className)}>
      <table className="min-w-full text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="border-b border-slate-100 bg-slate-50/80">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn("px-4 py-3 font-semibold text-slate-600", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className={cn(onRowClick && "cursor-pointer hover:bg-slate-50/80")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-slate-700", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface StudentTableRow {
  id: string;
  name: string;
  grade?: string;
  mastery?: ReactNode;
  risk?: ReactNode;
  lastSession?: string;
}

export function StudentTable({ rows, emptyMessage }: { rows: StudentTableRow[]; emptyMessage?: string }) {
  const columns: WdsTableColumn<StudentTableRow>[] = [
    { key: "name", header: "Student", render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: "grade", header: "Grade", render: (r) => r.grade ?? "—" },
    { key: "mastery", header: "Mastery", render: (r) => r.mastery ?? "—" },
    { key: "risk", header: "Risk", render: (r) => r.risk ?? "—" },
    { key: "lastSession", header: "Last session", render: (r) => r.lastSession ?? "—" },
  ];
  return <DataTable columns={columns} rows={rows} caption="Students" emptyMessage={emptyMessage} />;
}

export interface CompetencyTableRow {
  id: string;
  competency: string;
  domain: string;
  progress: number;
  mastery?: ReactNode;
}

export function CompetencyTable({ rows, emptyMessage }: { rows: CompetencyTableRow[]; emptyMessage?: string }) {
  const columns: WdsTableColumn<CompetencyTableRow>[] = [
    { key: "competency", header: "Competency", render: (r) => <span className="font-medium">{r.competency}</span> },
    { key: "domain", header: "Domain", render: (r) => r.domain },
    {
      key: "progress",
      header: "Progress",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand-500" style={{ width: `${r.progress}%` }} />
          </div>
          <span className="text-xs text-slate-500">{r.progress}%</span>
        </div>
      ),
    },
    { key: "mastery", header: "Mastery", render: (r) => r.mastery ?? "—" },
  ];
  return <DataTable columns={columns} rows={rows} caption="Competencies" emptyMessage={emptyMessage} />;
}

export interface EvidenceTableRow {
  id: string;
  title: string;
  type: string;
  date: string;
  quality?: ReactNode;
}

export function EvidenceTable({ rows, emptyMessage }: { rows: EvidenceTableRow[]; emptyMessage?: string }) {
  const columns: WdsTableColumn<EvidenceTableRow>[] = [
    { key: "title", header: "Evidence", render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "type", header: "Type", render: (r) => <span className="capitalize">{r.type.replace(/_/g, " ")}</span> },
    { key: "date", header: "Date", render: (r) => r.date },
    { key: "quality", header: "Quality", render: (r) => r.quality ?? "—" },
  ];
  return <DataTable columns={columns} rows={rows} caption="Evidence" emptyMessage={emptyMessage} />;
}
