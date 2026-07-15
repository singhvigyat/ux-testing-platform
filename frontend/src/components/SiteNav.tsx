import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type Props = {
  right?: ReactNode;
};

export default function SiteNav({ right }: Props) {
  return (
    <header className="site-nav">
      <Link to="/" className="wordmark">
        argus
      </Link>
      <span className="nav-meta">multi-agent ux</span>
      {right ? <div className="nav-right">{right}</div> : null}
    </header>
  );
}
