import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import ActivityCalendar from '../components/ActivityCalendar';
import DailyRecordList from '../components/DailyRecordList';
import { MarkingProps } from 'react-native-calendars/src/calendar/day/marking';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';

type CustomMarking = MarkingProps & {
  dots?: { key: string; color: string }[];
};

type MarkedDates = {
  [key: string]: CustomMarking;
};

const FriendActivityScreen = () => {
  const route = useRoute();
  const { userId, userNickname } = route.params as { userId: string, userNickname: string };

  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [records, setRecords] = useState<{ meals: any[]; workouts: any[] }>({
    meals: [],
    workouts: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const fetchRecords = useCallback(
    async (dateForMonth: Date) => {
      if (!userId) return;
      setLoading(true);

      const startDate = format(startOfMonth(dateForMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(dateForMonth), 'yyyy-MM-dd');

      try {
        const { data: meals, error: mealsError } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate);

        if (mealsError) throw mealsError;

        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate);

        if (workoutsError) throw workoutsError;

        const newMarkedDates: MarkedDates = {};
        (meals || []).forEach(meal => {
          const dateStr = format(parseISO(meal.date), 'yyyy-MM-dd');
          if (!newMarkedDates[dateStr]) {
            newMarkedDates[dateStr] = { dots: [] };
          }
          if (!newMarkedDates[dateStr].dots!.some(d => d.key === 'meal')) {
            newMarkedDates[dateStr].dots!.push({ key: 'meal', color: '#48BB78' });
          }
        });
        (workouts || []).forEach(workout => {
          const dateStr = format(parseISO(workout.date), 'yyyy-MM-dd');
          if (!newMarkedDates[dateStr]) {
            newMarkedDates[dateStr] = { dots: [] };
          }
          if (!newMarkedDates[dateStr].dots!.some(d => d.key === 'workout')) {
            newMarkedDates[dateStr].dots!.push({ key: 'workout', color: '#6B46C1' });
          }
        });

        setMarkedDates(newMarkedDates);
        setRecords({ meals: meals || [], workouts: workouts || [] });
      } catch (err) {
        Alert.alert('오류', '기록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  useFocusEffect(
    useCallback(() => {
      fetchRecords(currentCalendarDate);
    }, [fetchRecords, currentCalendarDate])
  );

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const onMonthChange = (month: { dateString: string }) => {
    setCurrentCalendarDate(parseISO(month.dateString));
  };

  const finalMarkedDates: MarkedDates = useMemo(() => {
    const finalMarks: MarkedDates = { ...markedDates };
    if (finalMarks[selectedDate]) {
      finalMarks[selectedDate] = { ...finalMarks[selectedDate], selected: true, selectedColor: '#6B46C1' };
    } else {
      finalMarks[selectedDate] = { selected: true, selectedColor: '#6B46C1', dots: [] };
    }
    return finalMarks;
  }, [markedDates, selectedDate]);

  const dailyMeals = records.meals.filter(
    meal => format(parseISO(meal.date), 'yyyy-MM-dd') === selectedDate
  );
  const dailyWorkouts = records.workouts.filter(
    workout => format(parseISO(workout.date), 'yyyy-MM-dd') === selectedDate
  );

  return (
    <SafeAreaView style={styles.container}>

      <ActivityCalendar
        currentMonth={format(currentCalendarDate, 'yyyy-MM-dd')}
        markedDates={finalMarkedDates}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <DailyRecordList
          selectedDate={selectedDate}
          meals={dailyMeals}
          workouts={dailyWorkouts}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default FriendActivityScreen; 