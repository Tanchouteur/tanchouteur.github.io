export function currentLanguage(pathname) {
  return pathname.startsWith("/en/") || pathname === "/en" ? "en" : "fr";
}

export function languageURL(pathname, language) {
  const page = pathname.split("/").pop() || "index.html";
  const allowed = new Set(["index.html", "project.html", "skills.html", "me.html", "hardware.html", "contact.html"]);
  const safePage = allowed.has(page) ? page : "index.html";
  return language === "en" ? `/en/${safePage}` : `/${safePage}`;
}

export function preferredLanguage(stored, browser) {
  if (stored === "fr" || stored === "en") return stored;
  return /^en(?:-|$)/i.test(browser || "") ? "en" : "fr";
}
