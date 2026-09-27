import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the same wifi load dev assets. Dev-only; ignored in production.
  allowedDevOrigins: ["quantum-remodeler-rising.ngrok-free.dev"],
};

export default nextConfig;
