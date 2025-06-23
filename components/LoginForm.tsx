import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from './AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

interface LoginFormProps {
  onSwitchToSignUp: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        Alert.alert('로그인 실패', error.message);
      }
    } catch (error) {
      Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: any) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      Alert.alert(`${provider} 로그인 실패`, error.message);
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.formTitle}>로그인</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="example@email.com"
          placeholderTextColor="#cbd5e1"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          textContentType="none"
          autoCapitalize="none"
          autoComplete="off"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>비밀번호</Text>
        <View style={styles.passwordInputWrapper}>
            <TextInput 
                style={styles.input} 
                placeholder="비밀번호" 
                placeholderTextColor="#cbd5e1" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!passwordVisible}
                textContentType="none"
                autoComplete="off"
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
                <Ionicons name={passwordVisible ? "eye-off" : "eye"} size={22} color="#94a3b8" />
            </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={handleLogin} disabled={isLoading} style={styles.buttonContainer}>
        <LinearGradient
            colors={['#34d399', '#2563eb']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.button}
        >
            {isLoading 
                ? <ActivityIndicator color="#fff" /> 
                : <Text style={styles.buttonText}>로그인</Text>
            }
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>계정이 없으신가요? </Text>
        <TouchableOpacity onPress={onSwitchToSignUp}>
          <Text style={[styles.switchText, styles.switchLink]}>회원가입</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>또는</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={[styles.socialButton, styles.kakaoButton]} onPress={() => handleSocialLogin('kakao')} disabled={isLoading}>
        <Text style={[styles.socialButtonText, styles.kakaoButtonText]}>카카오로 시작하기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.socialButton, styles.naverButton]} onPress={() => handleSocialLogin('naver')} disabled={isLoading}>
        <Text style={[styles.socialButtonText, styles.naverButtonText]}>네이버로 시작하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputContainer: { 
        marginBottom: 16 
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 8,
    },
    input: { 
        backgroundColor: '#f8fafc', 
        paddingVertical: 10, 
        paddingHorizontal: 16, 
        borderRadius: 8, 
        fontSize: 16, 
        color: '#1e293b', 
        borderWidth: 1, 
        borderColor: '#e2e8f0',
        flex: 1,
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
    },
    buttonContainer: {
        marginTop: 8,
        borderRadius: 12,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    button: {
        paddingVertical: 14, 
        borderRadius: 12, 
        alignItems: 'center', 
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '600' 
    },
    switchContainer: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        marginTop: 24, 
    },
    switchText: { 
        fontSize: 14, 
        color: '#64748b' 
    },
    switchLink: { 
        fontWeight: 'bold', 
        color: '#2563eb' 
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#94a3b8',
        fontWeight: '600',
    },
    socialButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    kakaoButton: {
        backgroundColor: '#FEE500',
    },
    kakaoButtonText: {
        color: '#191919',
    },
    naverButton: {
        backgroundColor: '#03C75A',
    },
    naverButtonText: {
        color: '#FFF',
    },
}); 