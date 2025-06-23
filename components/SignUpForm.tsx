import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from './AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const [profileImage, setProfileImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  
  const { signUp, checkNicknameExists } = useAuth();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '프로필 사진을 설정하려면 사진 라이브러리 접근 권한이 필요합니다.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
    });
    if (!result.canceled && result.assets) {
      setProfileImage(result.assets[0]);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !nickname) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    const nicknameExists = await checkNicknameExists(nickname);
    if (nicknameExists) {
      Alert.alert('오류', '이미 사용 중인 닉네임입니다.');
      setIsLoading(false);
      return;
    }

    try {
      const avatarFile = profileImage ? {
        uri: profileImage.uri,
        type: profileImage.mimeType || 'image/jpeg',
        name: profileImage.fileName || `avatar.${profileImage.uri.split('.').pop()}`,
      } : null;

      const { error } = await signUp({ email, password, nickname, avatarFile });

      if (error) {
        Alert.alert('회원가입 실패', error.message);
      } else {
        Alert.alert('성공', '회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.');
        onSwitchToLogin();
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.formTitle}>회원가입</Text>
      
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage}>
          <Image
            source={profileImage ? { uri: profileImage.uri } : require('../assets/icon.png')}
            style={styles.avatar}
          />
          <Text style={styles.avatarText}>프로필 사진 선택</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>이메일</Text>
        <TextInput style={styles.input} placeholder="example@email.com" placeholderTextColor="#cbd5e1" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="none" autoCapitalize="none" autoComplete="off" />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>닉네임</Text>
        <TextInput style={styles.input} placeholder="사용할 닉네임을 입력하세요" placeholderTextColor="#cbd5e1" value={nickname} onChangeText={setNickname} autoCapitalize="none" textContentType="none" autoComplete="off" />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>비밀번호</Text>
        <View style={styles.passwordInputWrapper}>
            <TextInput style={styles.input} placeholder="6자 이상의 비밀번호" placeholderTextColor="#cbd5e1" value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} textContentType="none" autoComplete="off" />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
                <Ionicons name={passwordVisible ? "eye-off" : "eye"} size={22} color="#94a3b8" />
            </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>비밀번호 확인</Text>
        <View style={styles.passwordInputWrapper}>
            <TextInput style={styles.input} placeholder="비밀번호를 다시 입력하세요" placeholderTextColor="#cbd5e1" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!confirmPasswordVisible} textContentType="none" autoComplete="off" />
            <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.eyeIcon}>
                <Ionicons name={confirmPasswordVisible ? "eye-off" : "eye"} size={22} color="#94a3b8" />
            </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity onPress={handleSignUp} disabled={isLoading} style={styles.buttonContainer}>
        <LinearGradient
            colors={['#34d399', '#2563eb']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.button}
        >
            {isLoading 
                ? <ActivityIndicator color="#fff" /> 
                : <Text style={styles.buttonText}>회원가입</Text>
            }
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>이미 계정이 있으신가요? </Text>
        <TouchableOpacity onPress={onSwitchToLogin}>
          <Text style={[styles.switchText, styles.switchLink]}>로그인</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        회원가입 시 이용약관과 개인정보처리방침에 동의하게 됩니다.
      </Text>
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
    avatarContainer: { 
      alignItems: 'center', 
      marginBottom: 24 
    },
    avatar: { 
        width: 100, 
        height: 100, 
        borderRadius: 50, 
        backgroundColor: '#e2e8f0' 
    },
    avatarText: { 
        color: '#3b82f6', 
        marginTop: 8, 
        fontWeight: 'bold',
        textAlign: 'center'
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
        fontWeight: 'bold' 
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
    footerText: {
        fontSize: 11,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 24,
        paddingHorizontal: 16,
    }
}); 