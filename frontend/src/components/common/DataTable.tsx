import * as React from "react"
import { cn } from "@/utils/cn"
import { Pagination } from "./Pagination"

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto rounded-xl border border-border bg-card">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
)
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-semibold text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
      {...props}
    />
  )
)
TableCell.displayName = "TableCell"

export interface DataTableProps {
  data: any[];
  columns: { header: string; accessorKey: string; cell?: (row: any) => React.ReactNode; className?: string; }[];
  searchPlaceholder?: string;
  itemsPerPage?: number;
  headerContent?: React.ReactNode;
  className?: string;
}

export function DataTable({ data, columns, headerContent, className, itemsPerPage }: DataTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const envItemsPerPage = process.env.NEXT_PUBLIC_ITEMS_PER_PAGE 
    ? parseInt(process.env.NEXT_PUBLIC_ITEMS_PER_PAGE, 10) 
    : 10;
  
  const limit = itemsPerPage || envItemsPerPage;
  const totalPages = Math.ceil(data.length / limit);

  // Reset page to 1 when search or data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return data.slice(startIndex, startIndex + limit);
  }, [data, currentPage, limit]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div ref={containerRef} className={cn("p-4", className)}>
      {headerContent && <div className="mb-4">{headerContent}</div>}
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            {columns.map((col, idx) => (
              <TableHead 
                key={idx} 
                className={cn(col.className, (col.accessorKey === 'actions' || col.header === 'Actions') ? "text-center" : "")}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col, colIdx) => (
                  <TableCell 
                    key={colIdx} 
                    className={cn(col.className, (col.accessorKey === 'actions' || col.header === 'Actions') ? "text-center" : "")}
                  >
                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
}
