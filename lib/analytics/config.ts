export const GOOGLE_ANALYTICS_ID = "G-PVW65CG68J";

const publicHosts = new Set([
  "mindapp.icu",
  "www.mindapp.icu",
  "mind-lemon.vercel.app",
]);

export function analyticsHostAllowed(host: string) {
  return publicHosts.has(host.toLowerCase());
}

export function analyticsPathAllowed(path: string) {
  return path === "/" ||
    ["/explore", "/p", "/resources", "/u", "/share", "/plans", "/business", "/work-with-us"]
      .some(prefix => path === prefix || path.startsWith(`${prefix}/`));
}
