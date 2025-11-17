import { CSVRow } from '@/types/csv';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { autoFixPhoneNumber } from '@/utils/phoneValidation';

interface DataTableProps {
  data: CSVRow[];
  onUpdateRow: (id: string, field: keyof CSVRow, value: string) => void;
  onDeleteRow: (id: string) => void;
  onAutoFixRow: (id: string) => void;
}

export const DataTable = ({ data, onUpdateRow, onDeleteRow, onAutoFixRow }: DataTableProps) => {
  const getStatusIcon = (status: CSVRow['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'invalid':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
      case 'duplicate':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return null;
    }
  };

  const getRowClassName = (status: CSVRow['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-success/5 hover:bg-success/10';
      case 'invalid':
        return 'bg-destructive/5 hover:bg-destructive/10';
      case 'warning':
      case 'duplicate':
        return 'bg-warning/5 hover:bg-warning/10';
      default:
        return 'hover:bg-muted/50';
    }
  };

  const getTelcoBadgeVariant = (telco?: string) => {
    switch (telco) {
      case 'Safaricom':
        return 'default';
      case 'Airtel':
        return 'secondary';
      case 'Telkom':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Status</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Bundle Size</TableHead>
            <TableHead>Telco</TableHead>
            <TableHead>Issues</TableHead>
            <TableHead className="w-32">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className={getRowClassName(row.status)}>
              <TableCell>{getStatusIcon(row.status)}</TableCell>
              <TableCell>
                <Input
                  value={row.phoneNumber}
                  onChange={(e) => onUpdateRow(row.id, 'phoneNumber', e.target.value)}
                  className="max-w-[200px]"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={row.bundleSize}
                  onChange={(e) => onUpdateRow(row.id, 'bundleSize', e.target.value)}
                  className="max-w-[120px]"
                />
              </TableCell>
              <TableCell>
                {row.telco && row.telco !== 'Unknown' && (
                  <Badge variant={getTelcoBadgeVariant(row.telco) as any}>
                    {row.telco}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {row.errors.length > 0 && (
                  <div className="text-xs text-destructive space-y-1">
                    {row.errors.map((error, idx) => (
                      <div key={idx}>{error}</div>
                    ))}
                  </div>
                )}
                {row.status === 'duplicate' && (
                  <div className="text-xs text-warning">Duplicate entry</div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {row.status === 'invalid' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAutoFixRow(row.id)}
                    >
                      Fix
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteRow(row.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
