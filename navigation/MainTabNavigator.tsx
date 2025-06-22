import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { Dashboard } from '../components/Dashboard';
import RecordsScreen from '../screens/RecordsScreen';
import ActivityScreen from '../screens/ActivityScreen';
import FriendsScreen from '../screens/FriendsScreen';
import MessagesScreen from '../screens/MessagesScreen';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === '홈') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === '기록') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === '활동') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === '친구') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === '메시지') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="홈" component={Dashboard} />
      <Tab.Screen name="기록" component={RecordsScreen} />
      <Tab.Screen name="활동" component={ActivityScreen} />
      <Tab.Screen name="친구" component={FriendsScreen} />
      <Tab.Screen name="메시지" component={MessagesScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 