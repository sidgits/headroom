import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ProfileBadgeProps {
  /** Tailwind positioning override; defaults to fixed top-right */
  className?: string;
}


const ProfileBadge = ({ className = "fixed top-4 right-4 z-50" }: ProfileBadgeProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "";
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;


  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  // Only show when signed in. Sign-in happens once at the end of the quiz.
  if (!user) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-xl bg-card/90 backdrop-blur-md border border-border/60 shadow-sm">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-7 h-7 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="hidden sm:inline text-xs sm:text-sm font-medium text-foreground max-w-[140px] truncate">
          {displayName}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1 underline-offset-2 hover:underline"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default ProfileBadge;
