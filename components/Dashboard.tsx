import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';

// Reusable component for progress bars
const NutrientProgress = ({
  label,
  current,
  goal,
  unit,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
}) => {
  const progress = Math.min((current / goal) * 100, 100);
  return (
    <View style={styles.nutrientRow}>
      <Text style={styles.nutrientLabel}>{label}</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.nutrientValue}>
        {current}/{goal}
        {unit}
      </Text>
    </View>
  );
};

export const Dashboard: React.FC = () => {
  const { user, userProfile, signOut } = useAuth(); // Get userProfile and signOut from context
  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${
    today.getMonth() + 1
  }월 ${today.getDate()}일 ${
    ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][
      today.getDay()
    ]
  }`;

  const getInitials = (nickname: string | undefined) => {
    if (!nickname) return '...';
    return nickname.charAt(0).toUpperCase();
  };

  const handleSignOut = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '확인',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('로그아웃 오류', error.message);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>안녕하세요! 👋</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileImageContainer}
            onPress={handleSignOut}
          >
            {userProfile?.avatar_url ? (
              <Image
                source={{ uri: userProfile.avatar_url }}
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.profileInitials}>
                {getInitials(userProfile?.nickname)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Nutrition Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 오늘의 영양 섭취</Text>
          <NutrientProgress
            label="칼로리"
            current={1850}
            goal={2200}
            unit="kcal"
          />
          <NutrientProgress label="단백질" current={120} goal={150} unit="g" />
          <NutrientProgress
            label="탄수화물"
            current={180}
            goal={250}
            unit="g"
          />
          <NutrientProgress label="지방" current={65} goal={80} unit="g" />
        </View>

        {/* Workout Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤸 오늘의 운동</Text>
          <View style={styles.workoutTagsContainer}>
            {['가슴', '등', '어깨'].map(part => (
              <View key={part} style={styles.workoutTag}>
                <Text style={styles.workoutTagText}>{part}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.mealButton]}>
            <Ionicons name="nutrition" size={24} color="white" />
            <Text style={styles.actionButtonText}>식단 입력</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.workoutButton]}>
            <Ionicons name="barbell" size={24} color="white" />
            <Text style={styles.actionButtonText}>운동 입력</Text>
          </TouchableOpacity>
        </View>

        {/* Friends' Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🙌 친구들의 오늘</Text>
          <View style={styles.friendActivity}>
            <View style={styles.friendAvatar}>
              <Text style={styles.friendInitials}>이</Text>
            </View>
            <View>
              <Text style={styles.friendActivityText}>
                <Text style={{ fontWeight: 'bold' }}>이지은</Text>님이 하체
                운동을 완료했어요!
              </Text>
              <Text style={styles.friendActivityTime}>30분 전</Text>
            </View>
          </View>
          <View style={styles.friendActivity}>
            <View style={[styles.friendAvatar, { backgroundColor: '#FFA726' }]}>
              <Text style={styles.friendInitials}>박</Text>
            </View>
            <View>
              <Text style={styles.friendActivityText}>
                <Text style={{ fontWeight: 'bold' }}>박민수</Text>님이 목표
                칼로리를 달성했어요!
              </Text>
              <Text style={styles.friendActivityTime}>1시간 전</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  dateText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 4,
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitials: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 15,
  },
  nutrientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutrientLabel: {
    width: 60,
    fontSize: 14,
    color: '#4A5568',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4299E1',
  },
  nutrientValue: {
    width: 80,
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'right',
  },
  workoutTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  workoutTag: {
    backgroundColor: '#E9D8FD',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  workoutTagText: {
    color: '#805AD5',
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mealButton: {
    backgroundColor: '#48BB78',
    marginRight: 10,
  },
  workoutButton: {
    backgroundColor: '#6B46C1',
    marginLeft: 10,
  },
  friendActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EC4899',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  friendInitials: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendActivityText: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
  },
  friendActivityTime: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },
}); 