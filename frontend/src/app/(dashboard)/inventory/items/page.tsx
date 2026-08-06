import { Metadata } from 'next';
import { ItemsView } from '@/components/dashboard/inventory/items/ItemsView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Item Catalog & Stock',
  description: 'Manage tent and event inventory master catalog, barcodes, rental costs, and godown stock counts.',
  url: '/inventory/items',
});

export default function ItemsPage() {
  return <ItemsView />;
}
