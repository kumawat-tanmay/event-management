import { ItemForm } from '@/components/dashboard/inventory/items/ItemForm';

export const metadata = {
  title: 'Add Item | Krishna Events ERP',
  description: 'Add a new inventory item',
};

export default function NewItemPage() {
  return <ItemForm />;
}
