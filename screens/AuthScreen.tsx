import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { LoginForm } from '../components/LoginForm';
import { SignUpForm } from '../components/SignUpForm';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToSignUp = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logo}
            />
            <Text style={styles.appName}>Health Companion</Text>
            <Text style={styles.tagline}>당신의 건강한 삶을 위한 파트너</Text>
          </View>

          <View style={styles.formContainer}>
            {isLogin ? (
              <LoginForm onSwitchToSignUp={switchToSignUp} />
            ) : (
              <SignUpForm onSwitchToLogin={switchToLogin} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8', // 밝고 깨끗한 배경색
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
    paddingTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    borderRadius: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b', // 어두운 슬레이트 색상
  },
  tagline: {
    fontSize: 16,
    color: '#64748b', // 밝은 슬레이트 색상
    marginTop: 8,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
}); 