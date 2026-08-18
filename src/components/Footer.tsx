import { Link } from "@/lib/router-compat";

const Footer = () => (
  <footer className="fixed bottom-0 left-0 right-0 z-50 w-full py-3 border-t border-border/40 bg-background/80 backdrop-blur-sm">
    <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground tracking-wide">
      <span>© 2026 Headroom App. All Rights Reserved.</span>
      <span className="text-border">·</span>
      <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
        Privacy Policy
      </Link>
    </div>
  </footer>
);

export default Footer;
