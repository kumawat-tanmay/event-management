import { LedgerView } from '@/components/dashboard/inventory/ledger/LedgerView';

export const metadata = {
  title: 'Inventory Ledger | Krishna Events ERP',
  description: 'View inventory ledger and stock movements',
};

export default function LedgerPage() {
  return <LedgerView />;
}
