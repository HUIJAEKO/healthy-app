import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MarkingProps } from 'react-native-calendars/src/calendar/day/marking';
import { Ionicons } from '@expo/vector-icons';

LocaleConfig.locales['ko'] = {
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
};
LocaleConfig.defaultLocale = 'ko';

export interface MarkedDates {
  [date: string]: MarkingProps;
}

interface ActivityCalendarProps {
  currentMonth: string;
  markedDates: MarkedDates;
  onDayPress: (day: any) => void;
  onMonthChange: (date: any) => void;
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  currentMonth,
  markedDates,
  onDayPress,
  onMonthChange,
}) => {
  return (
    <View style={styles.calendarContainer}>
      <Calendar
        key={currentMonth}
        current={currentMonth}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        markingType={'multi-dot'}
        markedDates={markedDates}
        renderArrow={(direction) => (
          <Ionicons
            name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
            size={24}
            color="#3B82F6"
          />
        )}
        theme={{
          backgroundColor: 'transparent',
          calendarBackground: 'transparent',
          textSectionTitleColor: '#718096',
          selectedDayBackgroundColor: '#3B82F6',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#3B82F6',
          dayTextColor: '#2D3748',
          textDisabledColor: '#D1D5DB',
          arrowColor: '#3B82F6',
          monthTextColor: '#1A202C',
          indicatorColor: 'blue',
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 14,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    calendarContainer: {
        paddingHorizontal: 10
    }
})

export default ActivityCalendar; 