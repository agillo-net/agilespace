import { useMDXComponents as getDocsMDXComponents } from "nextra-theme-docs";

const themeComponents = getDocsMDXComponents({});

export const useMDXComponents: typeof getDocsMDXComponents = (components) => ({
  ...themeComponents,
  ...components,
});
