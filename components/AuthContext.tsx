import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// UserProfile 타입 정의
export interface UserProfile {
  nickname: string;
  avatar_url: string | null;
}

// 회원가입 시 필요한 데이터 타입 정의
interface SignUpParams {
  email: string;
  password: string;
  nickname: string;
  avatarFile: { uri: string; type: string; name: string } | null;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (params: SignUpParams) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  checkNicknameExists: (nickname: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (user: User) => {
    try {
      const { data, error, status } = await supabase
        .from('users')
        .select(`nickname, avatar_url`)
        .eq('id', user.id)
        .single();
      if (error && status !== 406) throw error;
      if (data) setUserProfile(data);
    } catch (error) {
      console.error('프로필 정보 가져오기 실패:', error);
      setUserProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (data.user) {
      await fetchUserProfile(data.user);
    }
    return { error };
  };

  const signUp = async ({ email, password, nickname, avatarFile }: SignUpParams) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname,
          avatar_url: '', // Use avatar_url consistently
        },
      },
    });

    if (signUpError) return { error: signUpError };
    
    const signedUpUser = authData.user;
    if (!signedUpUser) return { error: { message: "회원가입 후 사용자 정보를 가져오지 못했습니다." } };

    if (authData.session) await supabase.auth.setSession(authData.session);

    if (avatarFile) {
      try {
        const base64 = await FileSystem.readAsStringAsync(avatarFile.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const filePath = `${signedUpUser.id}/profile.${avatarFile.name.split('.').pop()}`;
        const contentType = avatarFile.type;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(base64), { contentType, upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const avatar_url = urlData.publicUrl;

        const { error: profileUpdateError } = await supabase
          .from('users')
          .update({ avatar_url: avatar_url })
          .eq('id', signedUpUser.id);
        
        if (profileUpdateError) throw profileUpdateError;
        
        await supabase.auth.updateUser({
          data: { ...signedUpUser.user_metadata, avatar_url: avatar_url }
        });
        
        await fetchUserProfile(signedUpUser);

      } catch (error) {
        return { error };
      }
    } else {
        await fetchUserProfile(signedUpUser);
    }
    
    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUserProfile(null);
    }
    return { error };
  };

  const checkNicknameExists = async (nickname: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('users')
      .select('nickname')
      .eq('nickname', nickname)
      .limit(1);
    if (error) {
      console.error('닉네임 중복 확인 오류:', error);
      return true;
    }
    return (data?.length ?? 0) > 0;
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    checkNicknameExists,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 