import type { ReactNode } from 'react';
import Link from 'next/link';

type Props = { href?: string; children?: ReactNode };

export default function ResourceBackLink({ href = '/resources', children = '返回资源中心' }: Props) {
  return (
    <Link href={href} className="resource-back-link">
      <span aria-hidden="true">←</span> {children}
    </Link>
  );
}
