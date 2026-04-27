import type { ReactNode } from "react";
import { Fragment } from "react";

const LINK = /\[([^\]]*)\]\(([^)\s]+)\)/g;

function isAllowedUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

type BoldPart = string | { strong: true; s: string };

function tokenizeBold(s: string): BoldPart[] {
  const parts = s.split("**");
  if (parts.length === 1) {
    return s ? [s] : [];
  }
  const out: BoldPart[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i] ?? "";
    if (i % 2 === 0) {
      if (p) out.push(p);
    } else if (p) {
      out.push({ strong: true, s: p });
    }
  }
  return out;
}

function boldPartsToNodes(parts: BoldPart[], keyBase: string): ReactNode[] {
  return parts.flatMap((p, i) => {
    if (typeof p === "string")
      return [<Fragment key={`${keyBase}-t-${i}`}>{p}</Fragment>];
    return [<strong key={`${keyBase}-b-${i}`}>{p.s}</strong>];
  });
}

function plainToNodes(s: string, keyBase: string): ReactNode[] {
  return boldPartsToNodes(tokenizeBold(s), keyBase);
}

export function renderChangelogLine(line: string, lineId: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  let k = 0;
  const matches = [...line.matchAll(LINK)];
  for (const m of matches) {
    const full = m[0];
    const label = m[1] ?? "";
    const href = m[2] ?? "";
    const index = m.index ?? 0;
    if (index > last) {
      nodes.push(...plainToNodes(line.slice(last, index), `${lineId}-p-${k++}`));
    }
    if (isAllowedUrl(href)) {
      nodes.push(
        <a
          key={`${lineId}-a-${k++}`}
          href={href}
          className="changelog-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>,
      );
    } else {
      nodes.push(
        <Fragment key={`${lineId}-r-${k++}`}>{full}</Fragment>,
      );
    }
    last = index + full.length;
  }
  if (last < line.length) {
    nodes.push(...plainToNodes(line.slice(last), `${lineId}-p-${k++}`));
  }
  if (nodes.length === 0) return line.length > 0 ? line : null;
  return <>{nodes}</>;
}
