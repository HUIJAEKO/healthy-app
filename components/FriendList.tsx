import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FriendsStackParamList } from '../navigation/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

// Helper function to generate a color from a string
const stringToColor = (str: string) => {
  let hash = 0;
  if (!str) return '#CCCCCC';
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

const FriendRequestSection = ({
  requests,
  onAccept,
  onReject,
}: {
  requests: any[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (requests.length === 0) {
    return null;
  }

  return (
    <View style={styles.requestSectionContainer}>
      <TouchableOpacity
        style={styles.requestSectionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.requestSectionTitle}>
          새로운 친구 요청 {requests.length}개
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#4A5568"
        />
      </TouchableOpacity>

      {isExpanded && (
        <View>
          {requests.map(request => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.friendInfo}>
                <View style={[styles.avatar, { backgroundColor: stringToColor(request.nickname) }]}>
                  {request.avatar_url ? (
                    <Image source={{ uri: request.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{request.nickname?.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.friendName}>{request.nickname}</Text>
              </View>
              <View style={styles.requestButtons}>
                <TouchableOpacity
                  style={[styles.requestButton, styles.rejectButton]}
                  onPress={() => onReject(request.id)}
                >
                  <Text style={[styles.requestButtonText, styles.rejectButtonText]}>거절</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.requestButton, styles.acceptButton]}
                  onPress={() => onAccept(request.id)}
                >
                  <Text style={styles.requestButtonText}>수락</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

type FriendListNavigationProp = StackNavigationProp<FriendsStackParamList, 'FriendsList'>;

const FriendList = () => {
  const { user } = useAuth();
  const navigation = useNavigation<FriendListNavigationProp>();
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendsAndRequests = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch pending requests for the current user
      const { data: requestData, error: requestError } = await supabase
        .from('friends')
        .select('*, requester:users!friends_requester_id_fkey(id, nickname, avatar_url)')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      
      if (requestError) throw requestError;
      setPendingRequests(requestData.map(r => r.requester));

      // Fetch friends using the new RPC function
      const { data: friendsData, error: friendsError } = await supabase
        .rpc('get_friends_with_details', { p_user_id: user.id });

      if (friendsError) throw friendsError;
      setFriends(friendsData || []);

    } catch (error) {
      console.error('Error fetching friends:', error);
      Alert.alert('오류', '친구 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchFriendsAndRequests();
    }, [fetchFriendsAndRequests])
  );

  const handleAcceptRequest = async (requesterId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('requester_id', requesterId)
        .eq('receiver_id', user.id);
      if (error) throw error;
      await fetchFriendsAndRequests(); // Refresh data
    } catch (error) {
      Alert.alert('오류', '요청 수락 중 오류가 발생했습니다.');
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('requester_id', requesterId)
        .eq('receiver_id', user.id);
      if (error) throw error;
      await fetchFriendsAndRequests(); // Refresh data
    } catch (error) {
      Alert.alert('오류', '요청 거절 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (friends.length === 0 && pendingRequests.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>아직 추가된 친구가 없습니다.</Text>
        <Text style={styles.emptySubText}>'친구 찾기' 탭에서 친구를 추가해보세요!</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.friendCard}>
      <View style={styles.friendInfo}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: stringToColor(item.nickname) },
          ]}
        >
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {item.nickname?.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.nickname}</Text>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={12} color="#FF6D00" />
            <Text style={styles.streakText}>총 {item.total_activity_days}일 활동</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.viewButton}
        onPress={() => navigation.navigate('FriendActivity', { userId: item.id, userNickname: item.nickname })}
      >
        <Text style={styles.viewButtonText}>활동보기</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={friends}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      style={styles.container}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}
      ListHeaderComponent={
        <FriendRequestSection 
          requests={pendingRequests}
          onAccept={handleAcceptRequest}
          onReject={handleRejectRequest}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
  },
  emptySubText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
  },
  friendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  streakText: {
    marginLeft: 4,
    color: '#FF6D00',
    fontWeight: '600',
    fontSize: 12,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#6B46C1',
    fontWeight: 'bold',
  },
  requestSectionContainer: {
    marginBottom: 20,
    backgroundColor: '#F7F8FA',
    borderRadius: 16,
    padding: 15,
  },
  requestSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  requestButtons: {
    flexDirection: 'row',
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: '#6B46C1',
  },
  rejectButton: {
    backgroundColor: '#F1F5F9',
  },
  requestButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rejectButtonText: {
    color: '#4A5568',
  },
});

export default FriendList; 