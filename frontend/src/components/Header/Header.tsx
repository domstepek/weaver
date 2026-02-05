import { useAuth } from '../Auth/AuthProvider';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 border-b border-gray-200 bg-white px-3 sm:px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Weaver</h1>
        <span className="hidden md:inline text-sm text-gray-500">
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
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline text-sm text-gray-700">
                {user.name}
              </span>
            </div>

            <button
              onClick={logout}
              className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
