import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import Footer from "@/components/Footer";

interface AssessmentCompletion {
  id: string;
  role: string;
  archetype_id: string;
  archetype_name: string;
  ip_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  created_at: string;
}

const AdminLogin = ({ onAuth }: { onAuth: (pw: string) => void }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-admin", {
        body: { password },
      });

      if (fnError || !data?.valid) {
        setError("Incorrect password");
      } else {
        sessionStorage.setItem("headroom_admin", "1");
        sessionStorage.setItem("headroom_admin_pw", password);
        onAuth(password);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        <h1 className="text-xl font-bold text-foreground text-center">Admin Access</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          className="w-full px-4 py-3 rounded-xl border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          autoFocus
        />
        {error && <p className="text-xs text-warm-red text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Enter"}
        </button>
      </form>
    </div>
  );
};

const Admin = () => {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem("headroom_admin") === "1");
  const [adminPw, setAdminPw] = useState(() => sessionStorage.getItem("headroom_admin_pw") || "");
  const [completions, setCompletions] = useState<AssessmentCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authed || !adminPw) return;

    const fetchCompletions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("admin-completions", {
          body: { password: adminPw },
        });
        if (!error && data?.completions) {
          setCompletions(data.completions as AssessmentCompletion[]);
        }
      } catch {
        // Failed to fetch
      }
      setLoading(false);
    };

    fetchCompletions();
  }, [authed, adminPw]);

  if (!authed) {
    return <AdminLogin onAuth={(pw) => { setAdminPw(pw); setAuthed(true); }} />;
  }

  const roleLabels: Record<string, string> = {
    ic: "Individual Contributor",
    manager: "Manager / Lead",
    founder: "Founder / Exec",
    freelancer: "Freelancer",
  };

  const archetypeEmojis: Record<string, string> = {
    architect: "🏗️",
    juggler: "🤹",
    absorber: "🧽",
    survivor: "🔥",
    sprinter: "⚡",
  };

  const totalCount = completions.length;
  const archetypeCounts = completions.reduce<Record<string, number>>((acc, c) => {
    acc[c.archetype_name] = (acc[c.archetype_name] || 0) + 1;
    return acc;
  }, {});
  const roleCounts = completions.reduce<Record<string, number>>((acc, c) => {
    acc[c.role] = (acc[c.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Headroom Admin</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Assessment completions dashboard
              </p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem("headroom_admin");
                setAuthed(false);
              }}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Logout
            </button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{totalCount}</p>
                </div>
                {Object.entries(archetypeCounts).map(([name, count]) => (
                  <div key={name} className="rounded-xl border bg-card p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{name}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">By Role</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(roleCounts).map(([role, count]) => (
                    <span key={role} className="text-sm text-foreground">
                      {roleLabels[role] || role}: <strong>{count}</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Archetype</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {roleLabels[c.role] || c.role}
                        </TableCell>
                        <TableCell className="text-sm">
                          {archetypeEmojis[c.archetype_id] || ""} {c.archetype_name}
                        </TableCell>
                        <TableCell className="text-sm">
                          {[c.city, c.region, c.country].filter(Boolean).join(", ") || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono text-xs">
                          {c.ip_address || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {completions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No assessments completed yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Admin;
