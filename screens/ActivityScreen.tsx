import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import ActivityCalendar, { MarkedDates } from '../components/ActivityCalendar';
import DailyRecordList, { MealRecord, WorkoutRecord } from '../components/DailyRecordList';

const ActivityScreen = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState<{ meals: MealRecord[]; workouts: WorkoutRecord[] }>({
    meals: [],
    workouts: [],
  });
  const [loading, setLoading] = useState(false);

  const fetchRecordsForMonth = useCallback(async (date: Date) => {
    if (!user) return;
    setLoading(true);

    const from = format(startOfMonth(date), 'yyyy-MM-dd');
    const to = format(endOfMonth(date), 'yyyy-MM-dd');

    try {
      const { data: meals, error: mealError } = await supabase
        .from('meals')
        .select('id, date, food_name, time_type, image_url, calorie, protein, carb, fat')
        .eq('user_id', user.id)
        .gte('date', from)
        .lte('date', to);

      const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('id, date, part, name, sets, reps, weight, speed, duration_minutes')
        .eq('user_id', user.id)
        .gte('date', from)
        .lte('date', to);

      if (mealError) throw mealError;
      if (workoutError) throw workoutError;

      const workoutRecords: WorkoutRecord[] = workouts.map(w => ({ ...w, is_cardio: w.part === '유산소' }));

      setRecords({ meals: meals || [], workouts: workoutRecords || [] });
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchRecordsForMonth(currentDate);
    }, [fetchRecordsForMonth, currentDate])
  );
  
  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};
    const mealDot = { key: 'meal', color: 'green' };
    const workoutDot = { key: 'workout', color: 'blue' };

    records.meals.forEach(meal => {
        const dateStr = format(new Date(meal.date), 'yyyy-MM-dd');
        if (!marks[dateStr]) marks[dateStr] = { dots: [] };
        if (!marks[dateStr].dots?.some(dot => dot.key === 'meal')) {
            marks[dateStr].dots?.push(mealDot);
        }
    });

    records.workouts.forEach(workout => {
        const dateStr = format(new Date(workout.date), 'yyyy-MM-dd');
        if (!marks[dateStr]) marks[dateStr] = { dots: [] };
        if (!marks[dateStr].dots?.some(dot => dot.key === 'workout')) {
            marks[dateStr].dots?.push(workoutDot);
        }
    });
    
    if (marks[selectedDate]) {
        marks[selectedDate] = { ...marks[selectedDate], selected: true };
    } else {
        marks[selectedDate] = { selected: true };
    }

    return marks;
  }, [records, selectedDate]);


  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };
  
  const onMonthChange = (date: any) => {
      setCurrentDate(new Date(date.dateString));
  };

  const filteredRecords = useMemo(() => {
    return {
      meals: records.meals.filter(meal => format(new Date(meal.date), 'yyyy-MM-dd') === selectedDate),
      workouts: records.workouts.filter(workout => format(new Date(workout.date), 'yyyy-MM-dd') === selectedDate),
    };
  }, [records, selectedDate]);


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
            <Text style={styles.title}>활동 캘린더</Text>
            <Text style={styles.subtitle}>나의 건강 기록을 확인해보세요</Text>
        </View>

        <ActivityCalendar
          currentMonth={format(currentDate, 'yyyy-MM-dd')}
          markedDates={markedDates}
          onDayPress={onDayPress}
          onMonthChange={onMonthChange}
        />
        
        <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
                <View style={[styles.dot, {backgroundColor: 'green'}]} />
                <Text style={styles.legendText}>식단</Text>
            </View>
            <View style={styles.legendItem}>
                <View style={[styles.dot, {backgroundColor: 'blue'}]} />
                <Text style={styles.legendText}>운동</Text>
            </View>
        </View>

        <DailyRecordList
          selectedDate={selectedDate}
          meals={filteredRecords.meals}
          workouts={filteredRecords.workouts}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
   header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
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
  legendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
  },
  legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
  },
  dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 8,
  },
  legendText: {
      fontSize: 14,
      color: '#718096'
  }
});

export default ActivityScreen; 