import { forwardRef } from "react";

const Footer = forwardRef<HTMLElement>((_props, ref) => (
  <footer
    ref={ref}
    className="w-full py-3 border-t border-border/40 bg-background/80 backdrop-blur-sm"
  >
    <p className="text-center text-[11px] text-muted-foreground tracking-wide">
      Headroom is a Digital Lexicon Corp production · Delaware, DE
    </p>
    <p className="text-center text-[11px] text-muted-foreground tracking-wide mt-1">
      © 2026, Digital Lexicon Corp &amp; Digital Lexicon Sdn Bhd
    </p>
  </footer>
));
Footer.displayName = "Footer";

export default Footer;
