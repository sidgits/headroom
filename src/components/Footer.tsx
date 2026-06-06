import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="w-full py-3 border-t border-border/40 bg-background/80 backdrop-blur-sm">
    <div className="relative px-4">
      <p className="text-center text-[11px] text-muted-foreground tracking-wide">
        Headroom is a Digital Lexicon Corp production · Delaware, DE
      </p>
      <p className="text-center text-[11px] text-muted-foreground tracking-wide mt-1">
        © 2026, Digital Lexicon Corp &amp; Digital Lexicon Sdn Bhd
      </p>
      <div className="mt-2 flex justify-center sm:mt-0 sm:justify-end sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2">
        <Link
          to="/privacy"
          className="text-[11px] text-muted-foreground tracking-wide hover:text-foreground underline underline-offset-2"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
