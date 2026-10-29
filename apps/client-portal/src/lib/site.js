import { FUDGE_SUITE_ASSETS } from "@webfudge/utils";

const siteUrl = (
  process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL || "http://localhost:3002"
).replace(/\/$/, "");

export const PORTAL_SITE = {
  brandName: "BikeWo",
  brandShortName: "BikeWo",
  name: "Client Portal",
  shortName: "Portal",
  description:
    "BikeWo Client Portal — access projects, communities, and collaborate with your team.",
  tagline: "Sign in to access your projects and collaborate with your team.",
  url: siteUrl,
  ...FUDGE_SUITE_ASSETS.bikewo,
  brandLogoPath: FUDGE_SUITE_ASSETS.bikewo.brandLogoPath,
  ogImagePath: FUDGE_SUITE_ASSETS.bikewo.brandLogoPath,
  locale: "en_US",
  themeColor: "#F5630F",
  backgroundColor: "#FFFAF7",
};
