import nextra from "nextra";
import type { NextConfig } from "next";

const withNextra = nextra({
  // ... Other Nextra config options
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextra(nextConfig);
