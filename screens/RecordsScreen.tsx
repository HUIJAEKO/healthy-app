import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { useRoute } from '@react-navigation/native';

type MealTime = 'breakfast' | 'lunch' | 'dinner' | 'snack';

const RecordsScreen = () => {
  const { user } = useAuth();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState<'meal' | 'workout'>('meal');
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('breakfast');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [image, setImage] = useState<{ uri: string; type: string; name: string } | null>(null);

  // Workout Form state
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [speed, setSpeed] = useState('');
  const [duration, setDuration] = useState('');

  // route.params가 변경될 때마다 activeTab 업데이트
  useEffect(() => {
    const params = route.params as { tab?: 'meal' | 'workout' };
    if (params?.tab) {
      setActiveTab(params.tab);
    }
  }, [route.params]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진을 추가하려면 카메라 롤 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop();
      setImage({
        uri: file.uri,
        type: file.mimeType ?? 'image/jpeg',
        name: `meal.${fileExt}`,
      });
    }
  };

  const resetMealForm = () => {
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setImage(null);
  };

  const handleRecordMeal = async () => {
    if (!foodName || !calories || !protein || !carbs || !fat) {
      Alert.alert('입력 오류', '모든 필드를 채워주세요.');
      return;
    }
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }
    setIsSubmitting(true);

    let imageUrl: string | null = null;
    if (image) {
      try {
        const base64 = await FileSystem.readAsStringAsync(image.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const filePath = `${user.id}/${uuidv4()}.${image.name.split('.').pop()}`;
        const contentType = image.type;

        const { error: uploadError } = await supabase.storage
          .from('meals')
          .upload(filePath, decode(base64), { contentType });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('meals').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;

      } catch (error) {
        Alert.alert('이미지 업로드 실패', (error as Error).message);
        setIsSubmitting(false);
        return;
      }
    }

    const mealData = {
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      time_type: selectedMealTime,
      food_name: foodName,
      image_url: imageUrl,
      calorie: Number(calories),
      protein: Number(protein),
      carb: Number(carbs),
      fat: Number(fat),
    };

    const { error } = await supabase.from('meals').insert([mealData]);

    if (error) {
      Alert.alert('기록 실패', error.message);
    } else {
      Alert.alert('성공', '식단이 성공적으로 기록되었습니다.');
      resetMealForm();
    }
    setIsSubmitting(false);
  };

  const resetWorkoutForm = () => {
    setWorkoutName('');
    setSets('');
    setReps('');
    setWeight('');
    setSpeed('');
    setDuration('');
  };

  const handleSelectPart = (part: string) => {
    if (selectedPart === part) {
      setSelectedPart(null);
    } else {
      setSelectedPart(part);
    }
    resetWorkoutForm();
  };

  const handleRecordWorkout = async () => {
    if (!selectedPart) {
      Alert.alert('오류', '운동 부위를 선택해주세요.');
      return;
    }
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    let workoutData;

    if (selectedPart === '유산소') {
      if (!workoutName || !speed || !duration) {
        Alert.alert('입력 오류', '모든 유산소 운동 정보를 입력해주세요.');
        setIsSubmitting(false);
        return;
      }
      workoutData = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        part: selectedPart,
        name: workoutName,
        speed: Number(speed),
        duration_minutes: Number(duration),
      };
    } else {
      if (!workoutName || !sets || !reps || !weight) {
        Alert.alert('입력 오류', '모든 근력 운동 정보를 입력해주세요.');
        setIsSubmitting(false);
        return;
      }
      workoutData = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        part: selectedPart,
        name: workoutName,
        sets: Number(sets),
        reps: Number(reps),
        weight: Number(weight),
      };
    }

    const { error } = await supabase.from('workouts').insert([workoutData]);

    if (error) {
      Alert.alert('운동 기록 실패', error.message);
    } else {
      Alert.alert('성공', '운동 내역이 성공적으로 기록되었습니다.');
      resetWorkoutForm();
      setSelectedPart(null);
    }
    setIsSubmitting(false);
  };

  const partOptions = [
    { name: '가슴', color: '#F87171' },
    { name: '등', color: '#60A5FA' },
    { name: '어깨', color: '#818CF8' },
    { name: '팔', color: '#A78BFA' },
    { name: '복근', color: '#FBBF24' },
    { name: '하체', color: '#EC4899' },
    { name: '유산소', color: '#FB923C' },
  ];

  const MealTimeButton = ({
    name,
    label,
    icon,
  }: {
    name: MealTime;
    label: string;
    icon: any;
  }) => (
    <TouchableOpacity
      style={[
        styles.mealTimeButton,
        selectedMealTime === name && styles.selectedMealTimeButton,
      ]}
      onPress={() => setSelectedMealTime(name)}
    >
      <Text style={styles.mealTimeIcon}>{icon}</Text>
      <Text
        style={[
          styles.mealTimeLabel,
          selectedMealTime === name && styles.selectedMealTimeLabel,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>기록하기</Text>
            <Text style={styles.subtitle}>오늘의 식단과 운동을 기록해보세요</Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'meal' && styles.activeTab]}
              onPress={() => setActiveTab('meal')}
            >
              <MaterialCommunityIcons
                name="silverware-fork-knife"
                size={20}
                color={activeTab === 'meal' ? '#4CAF50' : '#A0AEC0'}
              />
              <Text
                style={[styles.tabText, activeTab === 'meal' && styles.activeTabText]}
              >
                식단
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'workout' && styles.activeTab]}
              onPress={() => setActiveTab('workout')}
            >
              <Ionicons
                name="barbell"
                size={20}
                color={activeTab === 'workout' ? '#4CAF50' : '#A0AEC0'}
              />
              <Text
                style={[styles.tabText, activeTab === 'workout' && styles.activeTabText]}
              >
                운동
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'meal' ? (
            <View>
              <Text style={styles.sectionTitle}>언제 드셨나요?</Text>
              <View style={styles.mealTimeContainer}>
                <MealTimeButton name="breakfast" label="아침" icon="☀️" />
                <MealTimeButton name="lunch" label="점심" icon="🏙️" />
              </View>
              <View style={styles.mealTimeContainer}>
                <MealTimeButton name="dinner" label="저녁" icon="🌙" />
                <MealTimeButton name="snack" label="간식" icon="🍎" />
              </View>

              <Text style={styles.sectionTitle}>음식 사진 (선택)</Text>
              <TouchableOpacity
                style={[styles.imagePicker, { width: 200, height: 200, alignSelf: 'center' }]}
                onPress={handlePickImage}
              >
                {image ? (
                  <Image source={{ uri: image.uri }} style={styles.foodImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera" size={32} color="#A0AEC0" />
                    <Text style={styles.imagePlaceholderText}>사진 추가</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.sectionTitle}>음식 정보</Text>
              <TextInput
                style={styles.input}
                placeholder="예: 닭가슴살 샐러드"
                value={foodName}
                onChangeText={setFoodName}
              />
              <View style={styles.nutrientInputContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>칼로리 (kcal)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0"
                    value={calories}
                    onChangeText={setCalories}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>단백질 (g)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0"
                    value={protein}
                    onChangeText={setProtein}
                  />
                </View>
              </View>
              <View style={styles.nutrientInputContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>탄수화물 (g)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0"
                    value={carbs}
                    onChangeText={setCarbs}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>지방 (g)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0"
                    value={fat}
                    onChangeText={setFat}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleRecordMeal}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? '저장 중...' : '식단 기록하기'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>어떤 부위를 운동하셨나요?</Text>
              <View style={styles.partsContainer}>
                {partOptions.map(part => (
                  <TouchableOpacity
                    key={part.name}
                    style={[
                      styles.partButton,
                      selectedPart === part.name && {
                        backgroundColor: part.color,
                        borderColor: part.color,
                      },
                    ]}
                    onPress={() => handleSelectPart(part.name)}
                  >
                    <Text
                      style={[
                        styles.partButtonText,
                        selectedPart === part.name && { color: 'white' },
                      ]}
                    >
                      {part.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedPart && (
                <>
                  {selectedPart === '유산소' ? (
                    <>
                      <Text style={styles.sectionTitle}>유산소 운동 정보</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="예: 런닝머신"
                        value={workoutName}
                        onChangeText={setWorkoutName}
                      />
                      <View style={styles.nutrientInputContainer}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>속도 (km/h)</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="0"
                            value={speed}
                            onChangeText={setSpeed}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>시간 (분)</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="0"
                            value={duration}
                            onChangeText={setDuration}
                          />
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.sectionTitle}>근력 운동 정보</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="예: 벤치프레스"
                        value={workoutName}
                        onChangeText={setWorkoutName}
                      />
                      <View style={styles.nutrientInputContainer}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>세트</Text>
                          <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={sets} onChangeText={setSets} />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>횟수</Text>
                          <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={reps} onChangeText={setReps} />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>무게 (kg)</Text>
                          <TextInput style={styles.input} keyboardType="numeric" placeholder="0" value={weight} onChangeText={setWeight} />
                        </View>
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: '#3B82F6' }, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleRecordWorkout}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.submitButtonText}>{isSubmitting ? '저장 중...' : '운동 기록하기'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0AEC0',
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#2D3748',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 16,
  },
  mealTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealTimeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginHorizontal: 4,
    marginBottom: 12,
  },
  selectedMealTimeButton: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FFF4',
  },
  mealTimeIcon: {
    fontSize: 24,
  },
  mealTimeLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
  },
  selectedMealTimeLabel: {
    color: '#2F855A',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#CBD5E0',
  },
  nutrientInputContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  placeholderText: {
    fontSize: 16,
    color: '#A0AEC0',
  },
  imagePicker: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#A0AEC0',
    fontSize: 16,
  },
  foodImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  // Workout styles
  partsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partButton: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    marginBottom: 12,
  },
  partButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
  },
});

export default RecordsScreen; 