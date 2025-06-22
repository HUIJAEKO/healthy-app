import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FriendList from '../components/FriendList';
import FriendSearch from '../components/FriendSearch';

const FriendsScreen = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'search'>('list');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>친구</Text>
        <Text style={styles.headerSubtitle}>함께 건강한 습관을 만들어가요</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons
            name="people"
            size={20}
            color={activeTab === 'list' ? '#6B46C1' : '#A0AEC0'}
          />
          <Text
            style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}
          >
            친구 목록
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && styles.activeTab]}
          onPress={() => setActiveTab('search')}
        >
          <Ionicons
            name="search"
            size={20}
            color={activeTab === 'search' ? '#6B46C1' : '#A0AEC0'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'search' && styles.activeTabText,
            ]}
          >
            친구 찾기
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'list' ? <FriendList /> : <FriendSearch />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#718096',
  },
  activeTabText: {
    color: '#6B46C1',
  },
  contentContainer: {
    flex: 1,
  },
});

export default FriendsScreen; 