import { redirect } from 'next/navigation';

/** Keep the old singular URL working without duplicating the downloads page. */
export default function DownloadAlias() {
  redirect('/downloads');
}
