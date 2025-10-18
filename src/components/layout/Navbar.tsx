import { useState, useEffect } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subData) setSubscription(subData);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BuildSelect Pro</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Welcome back, {profile?.full_name || profile?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {subscription && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Plan: {subscription.tier.toUpperCase()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subscription.projects_used} / {subscription.project_limit} projects
                </p>
              </div>
            )}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
              aria-label="Toggle theme"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDark ? 'Dark' : 'Light'}
              </span>
              <div className="relative w-10 h-5 bg-gray-300 dark:bg-slate-600 rounded-full">
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`}>
                  {isDark ? <Moon className="w-3 h-3 text-slate-700 m-0.5" /> : <Sun className="w-3 h-3 text-yellow-500 m-0.5" />}
                </div>
              </div>
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
