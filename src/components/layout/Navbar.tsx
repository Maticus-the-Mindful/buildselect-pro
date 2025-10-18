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
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 w-full">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <img 
              src="/assets/logos/bsp_logo_transparent_BASIC_180px_01.png" 
              alt="BuildSelect Pro" 
              className="h-8 sm:h-10 w-auto flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">BuildSelect Pro</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                Welcome back, {profile?.full_name || profile?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {subscription && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500 dark:text-gray-400">Plan: {subscription.tier.toUpperCase()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subscription.projects_used} / {subscription.project_limit} projects
                </p>
              </div>
            )}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition-all"
              aria-label="Toggle theme"
            >
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                {isDark ? 'Dark' : 'Light'}
              </span>
              <div className="relative w-8 h-4 sm:w-10 sm:h-5 bg-gray-300 dark:bg-slate-600 rounded-full">
                <div className={`absolute top-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-md transition-transform ${isDark ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0.5'}`}>
                  {isDark ? <Moon className="w-2 h-2 sm:w-3 sm:h-3 text-slate-700 m-0.5" /> : <Sun className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-500 m-0.5" />}
                </div>
              </div>
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
