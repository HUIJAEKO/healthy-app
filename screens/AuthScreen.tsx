import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoginForm } from '../components/LoginForm';
import { SignUpForm } from '../components/SignUpForm';

const AuthScreen = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <LinearGradient
      colors={['#f0f9ff', '#e0f2fe', '#f0f9ff']}
      style={styles.container}
    >
        <KeyboardAvoidingView 
            style={{flex: 1, width: '100%'}}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -100}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {showLogin && (
                    <View style={styles.header}>
                        <Image source={require('../assets/icon.png')} style={styles.logo} />
                        <Text style={styles.title}>FitTogether</Text>
                        <Text style={styles.subtitle}>새로운 건강 여정을 시작해보세요</Text>
                    </View>
                )}
                
                <View style={styles.formContainer}>
                    {showLogin ? (
                        <LoginForm onSwitchToSignUp={() => setShowLogin(false)} />
                    ) : (
                        <SignUpForm onSwitchToLogin={() => setShowLogin(true)} />
                    )}
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default AuthScreen;