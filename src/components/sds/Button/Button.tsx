import { clsx } from "clsx";
import React, { ComponentPropsWithoutRef } from "react";
import { Button as RACButton } from "react-aria-components";
import "./button.css";

export type ButtonProps = {
  type?: ComponentPropsWithoutRef<"button">["type"];
  size?: "small" | "medium";
  variant?: "primary" | "neutral" | "subtle";
  children?: React.ReactNode;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
  onPress?: () => void;
  isDisabled?: boolean;
};

export const Button = React.forwardRef(function Button(
  { className, size = "medium", variant = "primary", href, target, rel, children, ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLElement>,
) {
  const classNames = clsx(
    className,
    "button",
    `button-size-${size}`,
    `button-variant-${variant}`,
  );

  // If href is provided, render as anchor
  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={classNames}
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
      >
        {children}
      </a>
    );
  }

  // Otherwise render as button
  return (
    <RACButton
      {...props}
      className={classNames}
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
    >
      {children}
    </RACButton>
  );
});

export type ButtonDangerProps = {
  type?: ComponentPropsWithoutRef<"button">["type"];
  size?: "small" | "medium";
  variant?: "danger-primary" | "danger-subtle";
  children?: React.ReactNode;
  className?: string;
  onPress?: () => void;
  isDisabled?: boolean;
};

export const ButtonDanger = React.forwardRef(function ButtonDanger(
  { className, size = "medium", variant = "danger-primary", children, ...props }: ButtonDangerProps,
  ref: React.ForwardedRef<HTMLElement>,
) {
  const classNames = clsx(
    className,
    "button",
    `button-size-${size}`,
    `button-variant-${variant}`,
  );

  return (
    <RACButton
      {...props}
      className={classNames}
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
    >
      {children}
    </RACButton>
  );
});

export type ButtonGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  align?: "start" | "end" | "center" | "justify" | "stack";
};

export const ButtonGroup = ({
  align = "start",
  className,
  ...props
}: ButtonGroupProps) => {
  const classNames = clsx(
    className,
    "button-group",
    `button-group-align-${align}`,
  );
  return <div className={classNames} {...props} />;
};
