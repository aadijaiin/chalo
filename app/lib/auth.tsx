import type { AvatarConfig, AvatarStyle } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import * as React from 'react';

export type Profile = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatar: AvatarConfig;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
};

const AuthContext = React.createContext<AuthContextValue>({
  session: null,
  profile: null,
  isLoading: true,
});

// Profile data lives in the user's metadata (set at sign up), so the first
// screen can render without waiting on an extra database round trip.
function toProfile(user: User): Profile {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    fullName: meta.full_name ?? '',
    username: meta.username ?? '',
    email: user.email ?? '',
    avatar: {
      style: (meta.avatar_style as AvatarStyle) ?? 'adventurer',
      seed: meta.avatar_seed ?? user.id,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setIsLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = React.useMemo(
    () => ({ session, isLoading, profile: session ? toProfile(session.user) : null }),
    [session, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}
