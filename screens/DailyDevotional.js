// screens/DailyDevotional.js
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AIService from '../services/openai';
import Store from '../services/store';

export default function DailyDevotional({ navigation }) {
  const [devotional, setDevotional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTodayDevotional();
  }, []);

  const loadTodayDevotional = async () => {
    try {
      // Check if today's devotional is already cached
      const today = new Date().toDateString();
      const cached = await Store.getDailyDevotional();
      
      if (cached) {
        const { date, devotional } = cached;
        if (date === today) {
          setDevotional(devotional);
          setLoading(false);
          return;
        }
      }

      // Generate new daily devotional
      await generateDailyDevotional();
    } catch (error) {
      console.error('Error loading daily devotional:', error);
      setLoading(false);
    }
  };

  const generateDailyDevotional = async () => {
    setLoading(true);
    try {
      const newDevotional = await AIService.generateDevotional('daily', 'daily');
      setDevotional(newDevotional);
      
      // Cache for today
      const today = new Date().toDateString();
      await Store.setDailyDevotional(today, newDevotional);
    } catch (error) {
      console.error('Error generating daily devotional:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    generateDailyDevotional();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Preparing today's devotional...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {devotional ? (
        <>
          <View style={styles.dailyHeader}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.greeting}>Daily Devotional</Text>
          </View>

          <TouchableOpacity
            style={styles.devotionalCard}
            onPress={() => navigation.navigate('DevotionalDetail', { devotional })}
          >
            <Text style={styles.topicPreview}>{devotional.topic}</Text>
            <Text style={styles.contentPreview} numberOfLines={5}>
              {devotional.content}
            </Text>
            <View style={styles.readMoreButton}>
              <Text style={styles.readMoreText}>Read Full Devotional →</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.verseOfDay}>
            <Text style={styles.verseTitle}>Verse of the Day</Text>
            {devotional.verses && devotional.verses[0] && (
              <Text style={styles.verseText}>{devotional.verses[0]}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.newDevotionButton}
            onPress={onRefresh}
          >
            <Text style={styles.newDevotionText}>Generate New Devotional</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load devotional. Please try again.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generateDailyDevotional}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  dailyHeader: {
    backgroundColor: '#4A90E2',
    padding: 30,
    paddingTop: 50,
    paddingBottom: 30,
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  devotionalCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topicPreview: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  contentPreview: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  readMoreButton: {
    marginTop: 15,
    alignItems: 'flex-end',
  },
  readMoreText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  verseOfDay: {
    backgroundColor: '#FFF3E0',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  verseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 10,
  },
  verseText: {
    fontSize: 18,
    color: '#333',
    fontStyle: 'italic',
    lineHeight: 26,
  },
  newDevotionButton: {
    backgroundColor: '#2C3E50',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  newDevotionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});