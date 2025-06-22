import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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

const FriendSearch = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState<Record<string, 'idle' | 'pending' | 'friends'>>({});

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) {
      Alert.alert('검색어 오류', '닉네임은 2글자 이상 입력해주세요.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    try {
      // Fetch current user's friends and pending requests
      const { data: friends1 } = await supabase.from('friends').select('receiver_id').eq('requester_id', user!.id);
      const { data: friends2 } = await supabase.from('friends').select('requester_id').eq('receiver_id', user!.id);
      const existingFriendIds = [...(friends1?.map(f => f.receiver_id) || []), ...(friends2?.map(f => f.requester_id) || [])];

      const { data, error } = await supabase
        .from('users')
        .select('id, nickname, avatar_url')
        .ilike('nickname', `%${searchTerm}%`)
        .not('id', 'eq', user!.id);

      if (error) throw error;
      
      const initialStatus: Record<string, 'idle' | 'pending' | 'friends'> = {};
      const searchResults = data.map(u => {
        if (existingFriendIds.includes(u.id)) {
            initialStatus[u.id] = 'friends';
        } else {
            initialStatus[u.id] = 'idle';
        }
        return u;
      });

      setResults(searchResults);
      setFriendRequestStatus(initialStatus);

    } catch (error) {
      Alert.alert('검색 오류', '사용자를 찾는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (receiverId: string) => {
    setFriendRequestStatus(prev => ({ ...prev, [receiverId]: 'pending' }));
    try {
      const { error } = await supabase.from('friends').insert({
        requester_id: user!.id,
        receiver_id: receiverId,
        status: 'pending',
      });

      if (error) {
          throw error;
      }
    } catch (error) {
      Alert.alert('친구 추가 실패', '요청을 보내는 중 오류가 발생했습니다. 이미 요청을 보냈거나 친구일 수 있습니다.');
      setFriendRequestStatus(prev => ({ ...prev, [receiverId]: 'idle' }));
    }
  };
  
  const renderItem = ({ item }: { item: any }) => {
    const status = friendRequestStatus[item.id] || 'idle';
    return (
        <View style={styles.resultCard}>
            <View style={styles.userInfo}>
            <View style={[ styles.avatar, { backgroundColor: stringToColor(item.nickname) }]}>
                {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
                ) : (
                <Text style={styles.avatarText}>{item.nickname?.charAt(0).toUpperCase()}</Text>
                )}
            </View>
            <Text style={styles.nickname}>{item.nickname}</Text>
            </View>
            <TouchableOpacity
                style={[styles.addButton, status !== 'idle' && styles.disabledButton]}
                disabled={status !== 'idle'}
                onPress={() => handleAddFriend(item.id)}
            >
                <Text style={styles.addButtonText}>
                    {status === 'idle' ? '친구 추가' : status === 'pending' ? '요청 보냄' : '친구'}
                </Text>
            </TouchableOpacity>
        </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="친구 닉네임으로 검색"
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                </View>
            )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#F7F8FA',
  },
  searchButton: {
    marginLeft: 10,
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  nickname: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#E2E8F0',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
  },
  emptyText: {
      fontSize: 16,
      color: '#A0AEC0',
  }
});

export default FriendSearch; 