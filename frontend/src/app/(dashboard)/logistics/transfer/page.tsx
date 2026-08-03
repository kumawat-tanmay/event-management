import { StockTransfersView } from '@/components/dashboard/logistics/transfer/StockTransfersView';

export const metadata = {
  title: 'Stock Transfers | Krishna Events ERP',
  description: 'Manage inter-godown equipment transfers',
};

export default function StockTransfersPage() {
  return <StockTransfersView />;
}
