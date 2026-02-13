import { useAuth } from '../Auth/AuthProvider';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-border bg-surface px-3 sm:px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-lg sm:text-xl font-bold text-text-primary">Weaver</h1>
        <span className="hidden md:inline text-sm text-text-muted">
          Knowledge Graph Chat
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {user && (
          <>
            <div className="flex items-center gap-2">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-sm text-text-secondary">
                {user.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="text-xs sm:text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
