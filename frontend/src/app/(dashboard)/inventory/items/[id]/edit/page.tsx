import { ItemForm } from '@/components/dashboard/inventory/items/ItemForm';

export const metadata = {
  title: 'Edit Item | Krishna Events ERP',
  description: 'Edit inventory item',
};

export default function EditItemPage() {
  return <ItemForm isEditing={true} />;
}
