import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getArchetypeMeta, burnoutLevelStyles } from "@/lib/archetypeProfile";


interface CompletionRow {
  archetype_id: string;
  archetype_name: string;
  role: string;
  created_at: string;
}

interface ReturningUserHomeProps {
  user: User;
  completion: CompletionRow;
  onRetake: () => void;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const ReturningUserHome = ({ user, completion, onRetake }: ReturningUserHomeProps) => {
  const meta = getArchetypeMeta(completion.archetype_id, completion.archetype_name);
  const burnoutStyles = burnoutLevelStyles[meta.defaultBurnout.level];

  const displayName =
    (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    (user.user_metadata?.name as string | undefined)?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[140%] h-[60%] rounded-full bg-gradient-to-b from-primary/15 via-accent/10 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-gradient-to-tl from-warm-red/10 via-deep-orange/8 to-transparent blur-3xl" />
      </div>

      

      <div className="relative max-w-lg mx-auto px-6 pt-20 pb-16 space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-sm uppercase tracking-wider text-white/80 font-medium mb-2">
            Welcome back{displayName ? `, ${displayName}` : ""} 👋
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Your Headroom profile
          </h1>
          <p className="text-xs text-white/60 mt-2">
            From your assessment on {formatDate(completion.created_at)}
          </p>
        </motion.div>

        {/* Archetype card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/60 p-7 shadow-sm text-center space-y-3"
        >
          <div className="text-5xl">{meta.emoji}</div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/70 font-medium">
              You are
            </p>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-warm-red mt-1">
              {meta.name}
            </h2>
          </div>
          <p className="text-sm text-white/90 italic leading-relaxed">
            {meta.headline}
          </p>
        </motion.div>

        {/* Burnout signature card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={`rounded-2xl p-6 bg-gradient-to-br ${burnoutStyles.bg} border border-border/40 space-y-2`}
        >
          <div className={`text-xs font-bold uppercase tracking-wider ${burnoutStyles.text}`}>
            Burnout signature
          </div>
          <div className="text-lg font-semibold text-foreground">
            {meta.defaultBurnout.label}
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {meta.defaultBurnout.signal}
          </p>
        </motion.div>

        {/* Retake CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Patterns shift over time. Retake the assessment to see what's changed.
          </p>
          <button
            onClick={onRetake}
            className="w-full max-w-xs mx-auto h-14 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            Retake the Headroom assessment
          </button>
        </motion.div>

        <p className="text-[11px] text-center text-muted-foreground italic">
          We don't store any personal data beyond what's needed to load your profile.
        </p>
      </div>
    </div>
  );
};

export interface ReturningUserState {
  loading: boolean;
  user: User | null;
  completion: CompletionRow | null;
  /** Force a refetch of the latest completion for the current user. */
  refresh: () => void;
}

/** Hook that resolves the signed-in user and their most recent completion (by user_id or email). */
export const useReturningUserProfile = (): ReturningUserState => {
  const [state, setState] = useState<Omit<ReturningUserState, "refresh">>({
    loading: true,
    user: null,
    completion: null,
  });
  const [refreshTick, setRefreshTick] = useState(0);
  // Track the user id we've already loaded for so we don't refetch on token refresh.
  const loadedForUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchCompletion = async (user: User) => {
      // RLS lets the user read rows linked by user_id OR matching email.
      const { data, error } = await supabase
        .from("assessment_completions")
        .select("archetype_id, archetype_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) console.error("Failed to load past completion", error);
      return (data?.[0] as CompletionRow | undefined) ?? null;
    };

    const load = async (user: User | null, force = false) => {
      if (!user) {
        loadedForUserId.current = null;
        if (active) setState({ loading: false, user: null, completion: null });
        return;
      }
      if (!force && loadedForUserId.current === user.id) {
        if (active) setState((s) => ({ ...s, loading: false, user }));
        return;
      }
      loadedForUserId.current = user.id;
      const completion = await fetchCompletion(user);
      if (active) setState({ loading: false, user, completion });
    };

    supabase.auth.getSession().then(({ data }) => {
      // refreshTick > 0 means caller asked to force a refetch.
      load(data.session?.user ?? null, refreshTick > 0);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "INITIAL_SESSION") {
        return;
      }
      const nextUser = session?.user ?? null;
      if (nextUser && loadedForUserId.current === nextUser.id) {
        setState((s) => ({ ...s, user: nextUser, loading: false }));
        return;
      }
      setState((s) => ({ ...s, loading: true }));
      load(nextUser);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [refreshTick]);

  return { ...state, refresh: () => setRefreshTick((n) => n + 1) };
};

export default ReturningUserHome;
