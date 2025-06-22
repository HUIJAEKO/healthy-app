import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { db } from './lib/supabase';

export default function App() {
  const testConnection = async () => {
    try {
      const { data, error } = await db.select('auth.users', { limit: 1 });
      if (error) {
        Alert.alert('연결 실패', error.message);
      } else {
        Alert.alert('연결 성공!', 'Supabase가 정상적으로 연동되었습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '연결 테스트 중 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase 연동 테스트</Text>
      <Button title="연결 테스트" onPress={testConnection} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
});