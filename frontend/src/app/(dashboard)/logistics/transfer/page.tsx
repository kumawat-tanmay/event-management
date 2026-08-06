import { Metadata } from 'next';
import { StockTransfersView } from '@/components/dashboard/logistics/transfer/StockTransfersView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Stock Transfer',
  description: 'Manage inter-godown equipment transfers, approvals, loading, and receipt confirmations.',
  url: '/logistics/transfer',
});

export default function StockTransfersPage() {
  return <StockTransfersView />;
}
