import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://computebestspecs.vercel.app";

const STATIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/check", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/recommend", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/ai", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/compare", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/software", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/fit", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
