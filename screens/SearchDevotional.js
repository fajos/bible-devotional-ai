// screens/SearchDevotional.js
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import AIService from '../services/openai';

export default function SearchDevotional({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions] = useState([
    'Faith', 'How to become born again', 'Love', 'Prayer',
    'Forgiveness', 'David and Goliath', 'The Holy Spirit',
    'Salvation', 'Grace', 'End Times'
  ]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Please enter a topic');
      return;
    }

    setLoading(true);
    try {
      const devotional = await AIService.generateDevotional(searchQuery);
      navigation.navigate('DevotionalDetail', { devotional });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate devotional. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion);
    handleSearch();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.searchSection}>
        <Text style={styles.title}>AI Bible Study</Text>
        <Text style={styles.subtitle}>
          Enter any topic, person, or question to generate an in-depth Bible study
        </Text>

        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="e.g., Faith, Moses, How to pray..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            multiline
          />
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Generate Study</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.suggestionsSection}>
        <Text style={styles.suggestionsTitle}>Popular Topics</Text>
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Search Tips</Text>
        <Text style={styles.tipText}>• Enter a specific topic: "Fruits of the Spirit"</Text>
        <Text style={styles.tipText}>• Ask a question: "How to overcome fear?"</Text>
        <Text style={styles.tipText}>• Name a person: "Study on Daniel"</Text>
        <Text style={styles.tipText}>• Get all references: "Verses about faith"</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#4A90E2',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20,
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
  },
  searchInput: {
    padding: 15,
    fontSize: 16,
    minHeight: 60,
  },
  searchButton: {
    backgroundColor: '#2C3E50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  suggestionsSection: {
    padding: 20,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  suggestionText: {
    color: '#4A90E2',
    fontSize: 14,
  },
  tipsSection: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
});