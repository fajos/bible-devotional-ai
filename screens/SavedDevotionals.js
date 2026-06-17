// screens/SavedDevotionals.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function SavedDevotionals({ navigation }) {
  const [savedDevotionals, setSavedDevotionals] = useState([]);

  useEffect(() => {
    loadSavedDevotionals();
    
    // Reload when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedDevotionals();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSavedDevotionals = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedDevotionals');
      if (saved) {
        setSavedDevotionals(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved:', error);
    }
  };

  const deleteDevotional = async (id) => {
    Alert.alert(
      'Delete Devotional',
      'Are you sure you want to remove this devotional?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = savedDevotionals.filter(item => item.id !== id);
            await AsyncStorage.setItem('savedDevotionals', JSON.stringify(updated));
            setSavedDevotionals(updated);
          }
        }
      ]
    );
  };

  const renderDevotionalItem = ({ item }) => (
    <TouchableOpacity
      style={styles.devotionalCard}
      onPress={() => navigation.navigate('DevotionalDetail', { devotional: item })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.topic}>{item.topic}</Text>
        <TouchableOpacity onPress={() => deleteDevotional(item.id)}>
          <Text style={styles.deleteButton}>🗑️</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.contentPreview} numberOfLines={3}>
        {item.content}
      </Text>
      
      <View style={styles.cardFooter}>
        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.readMore}>Read More →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {savedDevotionals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>No Saved Devotionals</Text>
          <Text style={styles.emptyText}>
            Generate and save devotionals to build your personal Bible study library
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedDevotionals}
          renderItem={renderDevotionalItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 15,
  },
  devotionalCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topic: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    fontSize: 20,
    padding: 5,
  },
  contentPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  readMore: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});