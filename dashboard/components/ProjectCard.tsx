import { MoreVertical, Users } from 'lucide-react';
import { cn, getRiskColor } from '@/lib/utils';

interface ProjectCardProps {
  id: number;
  name: string;
  team?: string[];
  status?: string;
  risk_level?: string;
  score?: number;
  onClick?: () => void;
}

export function ProjectCard({ id, name, team, status, risk_level, score, onClick }: ProjectCardProps) {
  return (
    <div
      className="glass-light glass-hover rounded-xl p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#8098F9]/80 flex items-center justify-center shadow-[0_0_15px_rgba(128,152,249,0.4)]">
            <span className="text-white font-semibold text-sm">
              {name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary">{name}</h4>
            {team && (
              <p className="text-xs text-text-tertiary">
                {team.length} Members
              </p>
            )}
          </div>
        </div>
        <button className="p-1 hover:bg-white/10 rounded transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95">
          <MoreVertical className="w-4 h-4 text-text-tertiary transition-transform duration-200" />
        </button>
      </div>

      {team && (
        <div className="flex items-center -space-x-2 mb-3">
          {team.slice(0, 5).map((member, idx) => (
            <div
              key={idx}
              className="w-8 h-8 rounded-full border-2 border-white/20 bg-[#8098F9] flex items-center justify-center text-white text-xs font-semibold shadow-[0_0_10px_rgba(128,152,249,0.3)]"
            >
              {member}
            </div>
          ))}
          {team.length > 5 && (
            <div className="w-8 h-8 rounded-full border-2 border-white/20 glass-light flex items-center justify-center text-xs font-semibold text-text-primary">
              +{team.length - 5}
            </div>
          )}
        </div>
      )}

      {score !== undefined && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-text-secondary">Scope Clarity</span>
            <span className="font-semibold text-text-primary">{score}%</span>
          </div>
          <div className="h-2 glass-subtle rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full shadow-[0_0_10px] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                score >= 80 ? 'bg-[#00D66B]' : score >= 60 ? 'bg-[#8098F9]' : 'bg-yellow-500'
              )}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>
      )}

      {risk_level && (
        <div className="flex items-center justify-between mt-3">
          <span className={cn('text-xs px-2 py-1 rounded-full font-medium', getRiskColor(risk_level))}>
            {risk_level}
          </span>
          {status && (
            <span className="text-xs text-text-tertiary">
              {status}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
