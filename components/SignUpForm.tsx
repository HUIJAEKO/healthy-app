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
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from './AuthContext';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const [profileImage, setProfileImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  
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

  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
      Alert.alert('오류', '닉네임을 입력해주세요.');
      return;
    }
    setIsCheckingNickname(true);
    const exists = await checkNicknameExists(nickname);
    setIsCheckingNickname(false);
    if (exists) {
      Alert.alert('중복', '이미 사용 중인 닉네임입니다.');
    } else {
      Alert.alert('성공', '사용 가능한 닉네임입니다.');
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !nickname) {
      Alert.alert('오류', '프로필 사진을 제외한 모든 필드를 입력해주세요.');
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
    <ScrollView style={styles.container}>
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
        <TextInput style={styles.input} placeholder="이메일 주소" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" autoCapitalize="none"/>
      </View>

      <View style={styles.inputGroup}>
        <TextInput style={[styles.input, styles.inputFlex]} placeholder="닉네임" placeholderTextColor="#94a3b8" value={nickname} onChangeText={setNickname} autoCapitalize="none"/>
        <TouchableOpacity style={styles.checkButton} onPress={handleCheckNickname} disabled={isCheckingNickname}>
          {isCheckingNickname ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.checkButtonText}>중복확인</Text>}
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="비밀번호" placeholderTextColor="#94a3b8" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword"/>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="비밀번호 확인" placeholderTextColor="#94a3b8" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry textContentType="newPassword"/>
      </View>
      
      <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSignUp} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>가입하기</Text>}
      </TouchableOpacity>

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>이미 계정이 있으신가요? </Text>
        <TouchableOpacity onPress={onSwitchToLogin}>
          <Text style={[styles.switchText, styles.switchLink]}>로그인</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e2e8f0', borderWidth: 2, borderColor: '#fff' },
  avatarText: { color: '#3b82f6', marginTop: 8, fontWeight: 'bold' },
  inputContainer: { marginBottom: 16 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, fontSize: 16, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  inputFlex: { flex: 1, marginRight: 8 },
  checkButton: { backgroundColor: '#64748b', paddingHorizontal: 12, paddingVertical: 14, borderRadius: 12, justifyContent: 'center' },
  checkButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  button: { backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  switchContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingBottom: 20 },
  switchText: { fontSize: 14, color: '#64748b' },
  switchLink: { fontWeight: 'bold', color: '#10b981' },
}); 