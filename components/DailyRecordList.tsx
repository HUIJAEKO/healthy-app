import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define types for meal and workout data to be passed as props
export type MealRecord = {
  id: string;
  date: string;
  food_name: string;
  time_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  image_url?: string | null;
  calorie: number;
  protein: number;
  carb: number;
  fat: number;
};

export type WorkoutRecord = {
  id: string;
  date: string;
  part: string;
  name: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  speed?: number | null;
  duration_minutes?: number | null;
  is_cardio: boolean;
};

interface DailyRecordListProps {
  selectedDate: string;
  meals: MealRecord[];
  workouts: WorkoutRecord[];
}

const DailyRecordList: React.FC<DailyRecordListProps> = ({ selectedDate, meals, workouts }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleOpenImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][date.getDay()];
    return `${month}월 ${day}일 ${dayOfWeek} 기록`;
  };

  const MealItem = ({ item }: { item: MealRecord }) => (
    <TouchableOpacity onPress={() => item.image_url && handleOpenImage(item.image_url)} disabled={!item.image_url}>
      <View style={styles.recordItem}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.recordImage} />
        ) : (
          <View style={styles.recordIconContainer}>
            <Ionicons name="nutrition" size={24} color="#4CAF50" />
          </View>
        )}
        <View style={styles.recordDetails}>
          <Text style={styles.recordTitle}>{item.food_name}</Text>
          <Text style={styles.recordSubtitle}>{item.time_type}</Text>
          <Text style={styles.recordMeta}>
            {item.calorie}kcal | T {item.carb}g | P {item.protein}g | F {item.fat}g
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const WorkoutItem = ({ item }: { item: WorkoutRecord }) => (
    <View style={styles.recordItem}>
      <View style={[styles.recordIconContainer, { backgroundColor: '#E0F2FE'}]}>
        <Ionicons name="barbell" size={24} color="#0EA5E9" />
      </View>
      <View style={styles.recordDetails}>
        <Text style={styles.recordTitle}>{item.name}</Text>
        <Text style={styles.recordSubtitle}>{item.part}</Text>
        <Text style={styles.recordMeta}>
          {item.is_cardio
            ? `${item.speed || 0}km/h | ${item.duration_minutes || 0}분`
            : `${item.sets || 0}세트 x ${item.reps || 0}회 | ${item.weight || 0}kg`}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedImage && <Image source={{ uri: selectedImage }} style={styles.modalImage} />}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Text style={styles.title}>{formatDate(selectedDate)}</Text>
      {meals.length === 0 && workouts.length === 0 ? (
        <Text style={styles.noRecordText}>이날은 기록이 없습니다.</Text>
      ) : (
        <>
          {meals.map(meal => <MealItem key={`meal-${meal.id}`} item={meal} />)}
          {workouts.map(workout => <WorkoutItem key={`workout-${workout.id}`} item={workout} />)}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  noRecordText: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
    paddingVertical: 40,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  recordImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
  },
  recordIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F0FFF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDetails: {
    marginLeft: 12,
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  recordSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  recordMeta: {
      fontSize: 12,
      color: '#A0AEC0',
      marginTop: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
      width: '90%',
      height: 'auto',
      aspectRatio: 1,
      backgroundColor: 'white',
      borderRadius: 16,
      overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});

export default DailyRecordList;
