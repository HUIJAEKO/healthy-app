import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { Dashboard } from '../components/Dashboard';
import RecordsScreen from '../screens/RecordsScreen';
import ActivityScreen from '../screens/ActivityScreen';
import FriendsScreen from '../screens/FriendsScreen';
import FriendActivityScreen from '../screens/FriendActivityScreen';
import MessagesScreen from '../screens/MessagesScreen';
import { FriendsStackParamList } from './types';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<FriendsStackParamList>();

const FriendsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FriendsList" component={FriendsScreen} />
      <Stack.Screen 
        name="FriendActivity" 
        component={FriendActivityScreen} 
        options={{
          headerShown: true,
          title: '친구 활동',
          headerBackTitle: ' ',
        }}
      />
    </Stack.Navigator>
  );
};

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
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          headerShown: false,
          tabBarLabel: '활동',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsStack}
        options={{
          headerShown: false,
          tabBarLabel: '친구',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          headerShown: false,
          tabBarLabel: '메시지',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator; 