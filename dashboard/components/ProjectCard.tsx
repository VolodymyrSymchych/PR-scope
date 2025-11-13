import { MoreVertical, Users, Trash2 } from 'lucide-react';
import { cn, getRiskColor } from '@/lib/utils';

interface ProjectCardProps {
  id: number;
  name: string;
  team?: string[];
  status?: string;
  risk_level?: string;
  score?: number;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function ProjectCard({ id, name, team, status, risk_level, score, onClick, onDelete }: ProjectCardProps) {
  return (
    <div
      className="glass-light glass-hover rounded-lg p-3 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary/80 flex items-center justify-center">
            <span className="text-white font-semibold text-xs">
              {name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-sm text-text-primary">{name}</h4>
            {team && (
              <p className="text-[10px] text-text-tertiary">
                {team.length} Members
              </p>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-1 hover:bg-white/10 rounded transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300 transition-transform duration-200" />
          </button>
        )}
      </div>

      {team && (
        <div className="flex items-center -space-x-1.5 mb-2">
          {team.slice(0, 5).map((member, idx) => (
            <div
              key={idx}
              className="w-6 h-6 rounded-full border-2 border-white/20 bg-primary flex items-center justify-center text-white text-[10px] font-semibold"
            >
              {member}
            </div>
          ))}
          {team.length > 5 && (
            <div className="w-6 h-6 rounded-full border-2 border-white/20 glass-light flex items-center justify-center text-[10px] font-semibold text-text-primary">
              +{team.length - 5}
            </div>
          )}
        </div>
      )}

      {score !== undefined && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-secondary">Scope Clarity</span>
            <span className="font-semibold text-text-primary">{score}%</span>
          </div>
          <div className="h-1.5 glass-subtle rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                score >= 80 ? 'bg-success' : score >= 60 ? 'bg-primary' : 'bg-warning'
              )}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>
      )}

      {risk_level && (
        <div className="flex items-center justify-between mt-2">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', getRiskColor(risk_level))}>
            {risk_level}
          </span>
          {status && (
            <span className="text-[10px] text-text-tertiary">
              {status}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
