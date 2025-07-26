import { clsx } from "clsx";
import React from "react";
import {
  Input as RACInput,
  type InputProps as RACInputProps,
} from "react-aria-components";
import "./input.css";

export type InputProps = RACInputProps;
export const Input = React.forwardRef(function Input(
  { className, ...props }: InputProps,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const classNames = clsx(className, "input");
  return <RACInput className={classNames} ref={ref} {...props} />;
});
