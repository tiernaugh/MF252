// React import not required for React 17+ with jsx runtime
import { AvatarOrb } from '../brand/AvatarOrb';

type FuturaHeroProps = {
  projectName: string;
  // Optional quick actions (kept minimal for day one)
  actions?: React.ReactNode;
};

export function FuturaHero({ projectName, actions }: FuturaHeroProps) {
  return (
    <section className="flex-1">
      <div className="flex items-start gap-4">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 animate-pulse-slow opacity-30">
            <AvatarOrb size={56} />
          </div>
          <AvatarOrb size={56} />
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-lora font-bold text-gray-900 tracking-tight">
              {projectName}
            </h1>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              Weekly futures intelligence • 47 sources tracked
            </p>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed max-w-2xl">
            I found three signals this week that could reshape how design consultancies position for 2026.
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex gap-2 mt-4">
          {actions}
        </div>
      )}
    </section>
  );
}


