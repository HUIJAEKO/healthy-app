import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

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
      </Text>
      <Text style={styles.nutrientUnit}>{unit}</Text>
    </View>
  );
};

// Helper function to generate a color from a string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

export const Dashboard: React.FC = () => {
  const { user, userProfile, signOut } = useAuth(); // Get userProfile and signOut from context
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState({
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
  });
  const [todaysWorkouts, setTodaysWorkouts] = useState<string[]>([]);
  const [friendsActivity, setFriendsActivity] = useState<any[]>([]);
  const [hasFriends, setHasFriends] = useState(false);

  const nutritionGoals = {
    calories: 2000,
    carbohydrates: 250,
    protein: 120,
    fat: 30,
  };

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date();
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
      const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

      // 1. Fetch today's nutrition
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('calorie, protein, carb, fat')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (mealsError) throw mealsError;

      const totalNutrition = mealsData.reduce(
        (acc, meal) => {
          acc.calories += Number(meal.calorie) || 0;
          acc.protein += Number(meal.protein) || 0;
          acc.carbohydrates += Number(meal.carb) || 0;
          acc.fat += Number(meal.fat) || 0;
          return acc;
        },
        { calories: 0, protein: 0, carbohydrates: 0, fat: 0 }
      );
            
      setNutrition(totalNutrition);

      // 2. Fetch today's workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('part')
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (workoutsError) throw workoutsError;

      const uniqueWorkouts = [
        ...new Set(workoutsData.map(w => w.part)),
      ];
      setTodaysWorkouts(uniqueWorkouts);

      // 3. Fetch friends' activity
      const { data: friends1, error: friendsError1 } = await supabase
        .from('friends')
        .select('receiver_id')
        .eq('requester_id', user.id)
        .eq('status', 'accepted');
      if (friendsError1) throw friendsError1;

      const { data: friends2, error: friendsError2 } = await supabase
        .from('friends')
        .select('requester_id')
        .eq('receiver_id', user.id)
        .eq('status', 'accepted');
      if (friendsError2) throw friendsError2;

      const friendIds = [
        ...new Set([
          ...(friends1?.map(f => f.receiver_id) || []),
          ...(friends2?.map(f => f.requester_id) || []),
        ]),
      ];

      setHasFriends(friendIds.length > 0);

      if (friendIds.length > 0) {
        const { data: friendWorkouts, error: workoutError } = await supabase
          .from('workouts')
          .select('*, users(nickname, avatar_url)')
          .in('user_id', friendIds)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString());
        if (workoutError) throw workoutError;

        const { data: friendMeals, error: mealError } = await supabase
          .from('meals')
          .select('*, users(nickname, avatar_url)')
          .in('user_id', friendIds)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString());
        if (mealError) throw mealError;

        const combinedActivities = [
          ...(friendWorkouts || []).map(item => ({
            id: `workout-${item.id}`,
            type: 'workout',
            user: item.users,
            activity: item,
            created_at: item.created_at,
          })),
          ...(friendMeals || []).map(item => ({
            id: `meal-${item.id}`,
            type: 'meal',
            user: item.users,
            activity: item,
            created_at: item.created_at,
          })),
        ];

        combinedActivities.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setFriendsActivity(combinedActivities.slice(0, 5)); // show latest 5
      } else {
        setFriendsActivity([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

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
            <Text style={styles.greetingText}>{userProfile?.nickname}👋</Text>
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
            current={Math.round(nutrition.calories)}
            goal={nutritionGoals.calories}
            unit="kcal"
          />
          <NutrientProgress
            label="단백질"
            current={Math.round(nutrition.protein)}
            goal={nutritionGoals.protein}
            unit="g"
          />
          <NutrientProgress
            label="탄수화물"
            current={Math.round(nutrition.carbohydrates)}
            goal={nutritionGoals.carbohydrates}
            unit="g"
          />
          <NutrientProgress
            label="지방"
            current={Math.round(nutrition.fat)}
            goal={nutritionGoals.fat}
            unit="g"
          />
        </View>

        {/* Workout Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤸 오늘의 운동</Text>
          <View style={styles.workoutTagsContainer}>
            {loading ? (
              <Text style={styles.noDataText}>로딩 중...</Text>
            ) : todaysWorkouts.length > 0 ? (
              todaysWorkouts.map(part => (
                <View key={part} style={styles.workoutTag}>
                  <Text style={styles.workoutTagText}>{part}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>오늘 진행한 운동이 없습니다.</Text>
            )}
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
          {loading ? (
            <Text style={styles.noDataText}>로딩 중...</Text>
          ) : friendsActivity.length > 0 ? (
            friendsActivity.map(item => (
              <View style={styles.friendActivity} key={item.id}>
                <View
                  style={[
                    styles.friendAvatar,
                    item.user?.avatar_url
                      ? {}
                      : {
                          backgroundColor: stringToColor(
                            item.user?.nickname || '?'
                          ),
                        },
                  ]}
                >
                  {item.user?.avatar_url ? (
                    <Image
                      source={{ uri: item.user.avatar_url }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Text style={styles.friendInitials}>
                      {item.user?.nickname
                        ? item.user.nickname.charAt(0).toUpperCase()
                        : '?'}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendActivityText}>
                    <Text style={{ fontWeight: 'bold' }}>
                      {item.user?.nickname || '알 수 없는 사용자'}
                    </Text>
                    {item.type === 'workout'
                      ? `님이 ${item.activity.part} 운동을 완료했어요!`
                      : `님이 ${item.activity.food_name} 식사를 기록했어요!`}
                  </Text>
                  <Text style={styles.friendActivityTime}>
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : hasFriends ? (
            <Text style={styles.noDataText}>오늘 활동한 친구가 없습니다.</Text>
          ) : (
            <Text style={styles.noDataText}>아직 친구가 없습니다.</Text>
          )}
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
    marginBottom: 10,
    height: 20,
    marginRight: -15,
  },
  nutrientLabel: {
    width: 40,
    fontSize: 11,
    color: '#4A5568',
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4299E1',
  },
  nutrientValue: {
    width: 60,
    fontSize: 11,
    color: '#4A5568',
    textAlign: 'right',
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  nutrientUnit: {
    width: 35,
    fontSize: 11,
    color: '#4A5568',
    textAlign: 'left',
    marginLeft: 2,
    textAlignVertical: 'center',
    lineHeight: 20,
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
    overflow: 'hidden',
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
  noDataText: {
    color: '#A0AEC0',
    fontSize: 14,
  },
}); 