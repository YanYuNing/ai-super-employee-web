import { redirect } from 'next/navigation';

export default function LegacyHomeAdmin() {
  redirect('/admin/home-config');
}
