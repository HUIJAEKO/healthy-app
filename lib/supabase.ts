import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_CONFIG, validateConfig } from '../config/supabase'

// 설정 유효성 검사
validateConfig()

// Supabase 클라이언트 생성
export const supabase: SupabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)

// 데이터베이스 작업을 위한 타입 정의
export interface DatabaseOptions {
  select?: string;
  where?: Record<string, any>;
  orderBy?: {
    column: string;
    ascending: boolean;
  };
  limit?: number;
}

export interface DatabaseResponse<T = any> {
  data: T | null;
  error: any;
}

// 데이터베이스 작업을 위한 헬퍼 함수들
export const db = {
  // 사용자 인증
  auth: {
    signUp: async (email: string, password: string): Promise<DatabaseResponse> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { data, error }
    },
    
    signIn: async (email: string, password: string): Promise<DatabaseResponse> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    },
    
    signOut: async (): Promise<{ error: any }> => {
      const { error } = await supabase.auth.signOut()
      return { error }
    },
    
    getCurrentUser: () => {
      return supabase.auth.getUser()
    },
  },
  
  // 데이터 조회
  select: async <T = any>(table: string, options: DatabaseOptions = {}): Promise<DatabaseResponse<T[]>> => {
    let query = supabase.from(table).select(options.select || '*')
    
    if (options.where) {
      query = query.match(options.where)
    }
    
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending })
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    return { data: data as T[], error }
  },
  
  // 데이터 삽입
  insert: async <T = any>(table: string, data: Record<string, any>): Promise<DatabaseResponse<T[]>> => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
    return { data: result ? (result as T[]) : null, error }
  },
  
  // 데이터 업데이트
  update: async <T = any>(table: string, data: Record<string, any>, where?: Record<string, any>): Promise<DatabaseResponse<T[]>> => {
    let query = supabase.from(table).update(data)
    
    if (where) {
      query = query.match(where)
    }
    
    const { data: result, error } = await query.select()
    return { data: result ? (result as T[]) : null, error }
  },
  
  // 데이터 삭제
  delete: async <T = any>(table: string, where?: Record<string, any>): Promise<DatabaseResponse<T[]>> => {
    let query = supabase.from(table).delete()
    
    if (where) {
      query = query.match(where)
    }
    
    const { data, error } = await query
    return { data: data ? (data as T[]) : null, error }
  },
} 