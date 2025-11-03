import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Organization, UserOrganization, Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  userOrganization: UserOrganization | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userOrganization, setUserOrganization] = useState<UserOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar usuário inicial
    loadUser();

    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
        if (session?.user) {
          loadUserData(session.user.id);
        } else {
          setProfile(null);
          setOrganization(null);
          setUserOrganization(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadUser() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadUserData(user.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadUserData(userId: string) {
    try {
      // Carregar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      setProfile(profileData);

      // Carregar organização do usuário
      const { data: userOrgData } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      setUserOrganization(userOrgData);

      if (userOrgData) {
        // Carregar dados da organização
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userOrgData.organization_id)
          .maybeSingle();
        
        setOrganization(orgData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  }

  async function refreshOrganization() {
    if (user) {
      await loadUserData(user.id);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Criar perfil
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
      });
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organization,
        userOrganization,
        loading,
        signIn,
        signUp,
        signOut,
        refreshOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
