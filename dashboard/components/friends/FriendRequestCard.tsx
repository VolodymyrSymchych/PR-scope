import { Check, X, Mail, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FriendRequest {
  id: number;
  sender: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
}

export function FriendRequestCard({
  request,
  onAccept,
  onReject,
}: FriendRequestCardProps) {
  return (
    <div className="glass-light rounded-xl p-6 border border-border hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-2xl shadow-lg">
            {request.sender.fullName?.charAt(0) || request.sender.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-lg text-text-primary mb-1">
              {request.sender.fullName || request.sender.username}
            </h4>
            <div className="flex items-center gap-2 text-sm text-text-tertiary mb-2">
              <Mail className="w-4 h-4" />
              <span>{request.sender.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <Clock className="w-3 h-3" />
              <span>
                Sent {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onAccept(request.id)}
            className="px-4 py-2 rounded-xl bg-success/20 hover:bg-success/30 text-success font-semibold transition-all hover:scale-105 flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            Accept
          </button>
          <button
            onClick={() => onReject(request.id)}
            className="px-4 py-2 rounded-xl bg-danger/20 hover:bg-danger/30 text-danger font-semibold transition-all hover:scale-105 flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

