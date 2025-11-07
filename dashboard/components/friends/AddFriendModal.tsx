'use client';

import { useState } from 'react';
import { X, UserPlus, Mail, Loader2 } from 'lucide-react';

interface AddFriendModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddFriendModal({ onClose, onSuccess }: AddFriendModalProps) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send friend request');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl p-8 border border-border max-w-md w-full relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-text-tertiary" />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">Request Sent!</h3>
            <p className="text-text-secondary">
              Your friend request has been sent successfully
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-text-primary mb-2">Add Friend</h3>
              <p className="text-text-secondary">
                Send a friend request by entering their username or email
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="emailOrUsername"
                  className="block text-sm font-medium text-text-primary mb-2"
                >
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    id="emailOrUsername"
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-text-primary placeholder:text-text-tertiary"
                    placeholder="username or email@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl glass-subtle hover:glass-light border border-border font-semibold text-text-primary transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 glass-button px-6 py-3 rounded-xl font-semibold text-white hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Send Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

