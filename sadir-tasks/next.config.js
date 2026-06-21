/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "nodemailer"],
  images: {
    domains: ["localhost"],
  },
};

module.exports = nextConfig;
