import { ProfileCard, ProfileEmpty } from "@/components/platform/profile-workspace/ProfilePrimitives";

export interface ProfileRecordColumn {
  key: string;
  label: string;
  render?: (row: Record<string, unknown>) => string;
}

interface ProfileRecordTableProps {
  title: string;
  records: Record<string, unknown>[];
  columns: ProfileRecordColumn[];
  emptyMessage?: string;
}

function cellValue(row: Record<string, unknown>, column: ProfileRecordColumn): string {
  if (column.render) return column.render(row);
  const value = row[column.key];
  if (value == null || value === "") return "—";
  return String(value);
}

export function ProfileRecordTable({
  title,
  records,
  columns,
  emptyMessage = "No records on file",
}: ProfileRecordTableProps) {
  return (
    <ProfileCard title={title}>
      {records.length === 0 ? (
        <ProfileEmpty>{emptyMessage}</ProfileEmpty>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                {columns.map((col) => (
                  <th key={col.key} className="py-2 pr-4">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={String(row.id ?? JSON.stringify(row))} className="border-t border-slate-100">
                  {columns.map((col) => (
                    <td key={col.key} className="py-2 pr-4 capitalize">
                      {cellValue(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProfileCard>
  );
}
