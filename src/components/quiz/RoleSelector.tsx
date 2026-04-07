import { roles } from "@/data/quizQuestions";

interface RoleSelectorProps {
  onSelect: (roleId: string) => void;
}

const RoleSelector = ({ onSelect }: RoleSelectorProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <p className="text-sm text-muted-foreground uppercase tracking-widest mb-3">
        Step 1
      </p>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-2">
        What best describes your role?
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-sm">
        This helps us tailor your results.
      </p>

      <div className="w-full max-w-md space-y-3">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            className="w-full min-h-[56px] px-5 py-4 rounded-lg border border-border bg-card text-left transition-all hover:border-primary hover:bg-secondary active:scale-[0.98]"
          >
            <span className="font-semibold text-foreground">{role.label}</span>
            <span className="block text-sm text-muted-foreground mt-0.5">
              {role.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
