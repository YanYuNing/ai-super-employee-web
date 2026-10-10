import { redirect } from 'next/navigation';

export default function LegacyMediaAdmin() {
  redirect('/admin/files');
}
