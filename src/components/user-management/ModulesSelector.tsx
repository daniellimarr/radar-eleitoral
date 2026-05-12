import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AVAILABLE_MODULES } from "@/types/user-management";

interface ModulesSelectorProps {
  selectedModules: string[];
  onChange: (modules: string[]) => void;
}

export function ModulesSelector({ selectedModules, onChange }: ModulesSelectorProps) {
  const toggleModule = (modKey: string) => {
    if (selectedModules.includes(modKey)) {
      onChange(selectedModules.filter((m) => m !== modKey));
    } else {
      onChange([...selectedModules, modKey]);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      {AVAILABLE_MODULES.map((mod) => (
        <label key={mod.key} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors">
          <Checkbox
            checked={selectedModules.includes(mod.key)}
            onCheckedChange={() => toggleModule(mod.key)}
          />
          <span className="text-sm">{mod.label}</span>
        </label>
      ))}
    </div>
  );
}
