import type { JSX } from "react";

export function LinuxIcon(): JSX.Element {
  return (
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 7.5c0-1.864 1.402-3.375 3.132-3.375s3.118 1.511 3.118 3.375c0 1.019.574 1.213 1.021 1.71a3.714 3.714 0 0 1 .979 2.496c0 2.509-1.793 4.547-4 4.547s-4-2.038-4-4.547c0-.948.345-1.823.96-2.497.428-.48.79-.673.79-1.709Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 18.75c.394.9 1.24 2.25 2.25 2.25s1.856-1.35 2.25-2.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75h.008v.008H9V9.75Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9.75h.008v.008H15V9.75Z" />
    </svg>
  );
}

export function WindowsIcon(): JSX.Element {
  return (
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25 11.25 4.5v7.5H4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 4.5 19.5 3.75v8.25h-6.75z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75h6.75v7.5L4.5 19.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 12.75h6.75V20.1l-6.75-.75z" />
    </svg>
  );
}

export function EcsIcon(): JSX.Element {
  return (
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 7.5 7.5-4.5 7.5 4.5v9l-7.5 4.5-7.5-4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3v18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15 7.5-4.5 7.5 4.5" />
    </svg>
  );
}

export function ServiceGlyph(): JSX.Element {
  return (
    <svg
      className="size-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <circle cx="6.5" cy="6.5" r="2.5" fill="none" />
      <circle cx="17.5" cy="6.5" r="2.5" fill="none" />
      <circle cx="12" cy="17.5" r="2.5" fill="none" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.8 7.7 12 15l3.2-7.3" />
    </svg>
  );
}

export function ProfileIcon(): JSX.Element {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8" />
    </svg>
  );
}
