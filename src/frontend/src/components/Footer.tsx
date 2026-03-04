export function Footer() {
  const year = new Date().getFullYear();
  const href = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="border-t border-border mt-auto py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
        © {year}. Built with{" "}
        <span className="text-primary" aria-label="love">
          ♥
        </span>{" "}
        using{" "}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors underline underline-offset-2"
        >
          caffeine.ai
        </a>
      </div>
    </footer>
  );
}
