import Link from "next/link";

interface ExternalLinkProps {
  href: string;
  title?: string;
  size?: number;
  className?: string;
}

export function ExternalLink({
  href,
  title = "Open external link",
  size = 12,
  className = "text-muted-foreground hover:text-foreground p-1 rounded-full",
}: ExternalLinkProps) {
  return (
    <Link
      href={href}
      target="_blank"
      className={className}
      title={title}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </Link>
  );
}
