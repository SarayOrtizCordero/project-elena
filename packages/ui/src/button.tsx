import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: "primary" | "dark" | "ghost" | "brand" | "light" | "ink";
  size?: "md" | "lg";
  href?: string;
  className?: string;
  children: ReactNode;
};

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-display uppercase tracking-wide whitespace-nowrap select-none transition duration-200 ease-out active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary:
    "bg-volt text-ink hover:bg-volt-2 hover:shadow-[0_0_0_6px_rgb(250_163_7/0.18)]",
  dark: "bg-ink-3 text-bone border border-line hover:border-volt hover:text-volt",
  ghost: "text-bone border border-line hover:border-bone",
  brand: "bg-brand text-black hover:bg-brand-2",
  ink: "bg-black text-white hover:bg-ink-3",
  light: "bg-white text-ink hover:bg-paper",
} as const;

const sizes = {
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-lg",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        onClick={rest.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined}
      >
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
