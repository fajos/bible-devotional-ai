// services/devotionalEngine.js
import bibleAPIService from './bibleApi';
import { API_CONFIG } from './config';
import openaiService from './openai';

class DevotionalEngine {
  constructor() {
    this.cache = new Map();
  }

  // Extract verse references from text
  extractVerseReferences(text) {
    const patterns = [
      // Pattern: "John 3:16" or "Genesis 1:1-5"
      /\b(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?\b/g,
      // Pattern: "Psalm 23" (chapter only)
      /\b(\d?\s?[A-Za-z]+)\s+(\d+)\b(?!:)/g,
    ];

    const references = new Set();
    
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        references.add(match[0].trim());
      }
    });

    return [...references];
  }

  // Parse AI response into structured devotional
  parseDevotionalResponse(aiContent) {
    const stripMarkdown = (text) => {
      if (!text) return '';
      return text
        .replace(/#+\s/g, '') // Remove markdown headers
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '')   // Remove italics
        .replace(/__/g, '')   // Remove underline
        .replace(/`/g, '')    // Remove code ticks
        .replace(/^[\s-•*]+/, '') // Remove leading bullets/dashes/asterisks
        .trim();
    };

    const sections = {
      topic: '',
      keyVerse: '',
      content: '',
      crossReferences: [],
      theologicalInsight: '',
      application: '',
      prayer: '',
      questions: [],
    };

    const lines = aiContent.split('\n');
    let currentSection = 'content';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine && currentSection !== 'content' && currentSection !== 'application' && currentSection !== 'prayer' && currentSection !== 'theologicalInsight') return;

      const cleanLine = stripMarkdown(trimmedLine);

      if (trimmedLine.toUpperCase().startsWith('TOPIC:')) {
        currentSection = 'topic';
        sections.topic = stripMarkdown(trimmedLine.replace(/TOPIC:/i, ''));
      } else if (trimmedLine.toUpperCase().startsWith('KEY_VERSE:')) {
        currentSection = 'keyVerse';
        sections.keyVerse = stripMarkdown(trimmedLine.replace(/KEY_VERSE:/i, ''));
      } else if (trimmedLine.toUpperCase().startsWith('CONTENT:')) {
        currentSection = 'content';
      } else if (trimmedLine.toUpperCase().startsWith('CROSS_REFERENCES:')) {
        currentSection = 'crossReferences';
      } else if (trimmedLine.toUpperCase().startsWith('THEOLOGICAL_INSIGHT:')) {
        currentSection = 'theologicalInsight';
      } else if (trimmedLine.toUpperCase().startsWith('APPLICATION:')) {
        currentSection = 'application';
      } else if (trimmedLine.toUpperCase().startsWith('PRAYER:')) {
        currentSection = 'prayer';
      } else if (trimmedLine.toUpperCase().startsWith('QUESTIONS:')) {
        currentSection = 'questions';
      } else if (trimmedLine.match(/^[•\-*]/)) {
        if (currentSection === 'crossReferences') {
          sections.crossReferences.push(cleanLine);
        } else if (currentSection === 'questions') {
          sections.questions.push(cleanLine);
        }
      } else if (trimmedLine.match(/^\d[\.\)]/) && currentSection === 'questions') {
        sections.questions.push(trimmedLine.replace(/^\d[\.\)]\s*/, ''));
      } else {
        // Add content to current section
        if (currentSection === 'content') {
          // Prevent adding the key verse if it's just repeated at the start of content
          if (sections.content === '' && sections.keyVerse && cleanLine.toLowerCase().includes(sections.keyVerse.toLowerCase().split(':')[0])) {
             return;
          }
          sections.content += (sections.content !== '' ? '\n' : '') + cleanLine;
        } else if (currentSection === 'theologicalInsight') {
          sections.theologicalInsight += (sections.theologicalInsight !== '' ? '\n' : '') + cleanLine;
        } else if (currentSection === 'application') {
          sections.application += (sections.application !== '' ? '\n' : '') + cleanLine;
        } else if (currentSection === 'prayer') {
          sections.prayer += (sections.prayer !== '' ? '\n' : '') + cleanLine;
        }
      }
    });

    // Final cleanup: if content starts with the key verse text, remove it
    if (sections.keyVerse && sections.content) {
        const verseRef = sections.keyVerse.split('(')[0].trim();
        if (sections.content.startsWith(verseRef)) {
            sections.content = sections.content.substring(verseRef.length).replace(/^[:\s-]+/, '').trim();
        }
    }

    return sections;
  }

  // Generate complete daily devotional
  async generateDailyDevotional(bibleVersion = 'NKJV') {
    try {
      const cacheKey = `daily_${new Date().toDateString()}_${bibleVersion}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Step 1: Generate content with AI
      const aiContent = await openaiService.generateDailyDevotional(bibleVersion);
      
      // Step 2: Parse AI response
      const parsed = this.parseDevotionalResponse(aiContent);
      
      // Step 3: Get actual Bible text for key verse
      const bibleVersionId = this.getBibleVersionId(bibleVersion);
      let keyVerseData = null;
      
      if (parsed.keyVerse && bibleVersionId) {
        const verseText = await bibleAPIService.getFormattedVerse(
          bibleVersionId,
          parsed.keyVerse
        );
        
        if (verseText) {
          keyVerseData = {
            reference: parsed.keyVerse,
            text: verseText.text || verseText.content,
            copyright: verseText.copyright,
          };
        }
      }

      // Step 4: Get cross-reference verses
      const crossRefVerses = [];
      for (const ref of parsed.crossReferences.slice(0, 4)) {
        const refMatch = ref.match(/([A-Za-z0-9\s]+\d+:\d+(?:-\d+)?)/);
        const refOnly = refMatch ? refMatch[0].trim() : ref.split(':')[0]?.trim();

        if (refOnly && bibleVersionId) {
          const verseData = await bibleAPIService.getFormattedVerse(bibleVersionId, refOnly);
          if (verseData) {
            crossRefVerses.push({
              reference: refOnly,
              text: verseData.text || verseData.content,
              explanation: ref.includes(']') ? ref.split(']').slice(1).join(']').trim() : (ref.includes(':') ? ref.split(':').slice(1).join(':').trim() : ref),
            });
          }
        }
      }

      // Step 5: Build final devotional object
      const devotional = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        topic: parsed.topic || 'Daily Devotional',
        keyVerse: keyVerseData,
        content: parsed.content,
        theologicalInsight: parsed.theologicalInsight,
        crossReferences: crossRefVerses,
        application: parsed.application,
        prayer: parsed.prayer,
        questions: parsed.questions,
        bibleVersion: bibleVersion,
        rawAIResponse: aiContent,
        type: 'devotional'
      };

      // Final Check: Strip redundant key verse text from the beginning of content if present
      if (devotional.keyVerse && devotional.keyVerse.text && devotional.content) {
        const verseText = devotional.keyVerse.text.toLowerCase().replace(/[^\w\s]/g, '').trim();
        // Check first 500 chars of content (verse might be at start)
        const contentNormal = devotional.content.toLowerCase().replace(/[^\w\s]/g, '').trim();

        if (contentNormal.startsWith(verseText)) {
          // Find where the actual content starts after the verse text
          // This is a bit fuzzy because of formatting, so we'll look for the first significant
          // difference or just try to find the verse text in the original content and slice after it
          const originalVerseText = devotional.keyVerse.text.trim();
          const firstOccurence = devotional.content.indexOf(originalVerseText);
          if (firstOccurence !== -1) {
            devotional.content = devotional.content.substring(firstOccurence + originalVerseText.length).replace(/^[:\s\-"]+/, '').trim();
          }
        }
      }

      // Cache the result
      this.cache.set(cacheKey, devotional);
      
      return devotional;
    } catch (error) {
      console.error('Devotional generation error:', error);
      throw error;
    }
  }

// Generate Bible study on any topic
async generateBibleStudy(topic, bibleVersion = 'NKJV') {
  try {
    const cacheKey = `study_${topic.toLowerCase()}_${bibleVersion}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Step 1: Generate with AI
    const aiContent = await openaiService.generateBibleStudy(topic, bibleVersion);
    
    // Step 2: Parse the response
    const study = this.parseStudyResponse(aiContent, topic, bibleVersion);
    
    // Step 3: Get actual verse texts from Bible API
    const bibleVersionId = this.getBibleVersionId(bibleVersion);
    
    if (study.keyVerses && study.keyVerses.length > 0 && bibleVersionId) {
      const verseRefs = study.keyVerses.map(v => v.reference);
      const verseTexts = await bibleAPIService.getMultipleVerses(bibleVersionId, verseRefs);
      
      // Enhance verses with actual text
      study.keyVerses = study.keyVerses.map((verse, index) => ({
        ...verse,
        actualText: verseTexts[index]?.text || verseTexts[index]?.content || null,
        copyright: verseTexts[index]?.copyright || null,
      }));
    }

    // Step 4: Generate a unique ID
    study.id = `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    study.type = 'study';
    
    // Cache the result
    this.cache.set(cacheKey, study);
    
    return study;
  } catch (error) {
    console.error('Bible study generation error:', error);
    throw error;
  }
}

// Parse study response from AI
parseStudyResponse(aiContent, topic, bibleVersion) {
  const stripMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/#+\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/`/g, '')
      .replace(/^[\s-•*]+/, '')
      .trim();
  };

  const study = {
    topic: stripMarkdown(topic),
    introduction: '',
    keyVerses: [],
    historicalContext: '',
    oldTestamentShadows: '',
    newTestamentFulfillment: '',
    studyNotes: '',
    practicalApplication: '',
    discussionQuestions: [],
    prayerPoints: [],
    bibleVersion: bibleVersion,
    rawContent: aiContent,
  };

  const lines = aiContent.split('\n');
  let currentSection = 'introduction';

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed && currentSection !== 'studyNotes' && currentSection !== 'practicalApplication' && currentSection !== 'introduction') return;

    const cleanLine = stripMarkdown(trimmed);

    // Detect sections (case insensitive)
    const upper = trimmed.toUpperCase();
    if (upper.startsWith('TOPIC:')) {
      study.topic = stripMarkdown(trimmed.replace(/TOPIC:/i, ''));
    } else if (upper.startsWith('INTRODUCTION:')) {
      currentSection = 'introduction';
    } else if (upper.startsWith('KEY_VERSES:')) {
      currentSection = 'keyVerses';
    } else if (upper.startsWith('HISTORICAL_CONTEXT:')) {
      currentSection = 'historicalContext';
    } else if (upper.startsWith('OLD_TESTAMENT_SHADOWS:')) {
      currentSection = 'oldTestamentShadows';
    } else if (upper.startsWith('NEW_TESTAMENT_FULFILLMENT:')) {
      currentSection = 'newTestamentFulfillment';
    } else if (upper.startsWith('STUDY_NOTES:')) {
      currentSection = 'studyNotes';
    } else if (upper.startsWith('PRACTICAL_APPLICATION:')) {
      currentSection = 'practicalApplication';
    } else if (upper.startsWith('DISCUSSION_QUESTIONS:')) {
      currentSection = 'discussionQuestions';
    } else if (upper.startsWith('PRAYER_POINTS:')) {
      currentSection = 'prayerPoints';
    } else {
      // Add content to current section
      switch (currentSection) {
        case 'introduction':
          study.introduction += (study.introduction ? '\n' : '') + cleanLine;
          break;
        case 'keyVerses':
          if (trimmed.match(/^[•\-*]/)) {
            const refMatch = trimmed.match(/([A-Za-z0-9\s]+\d+:\d+(?:-\d+)?)/);
            const contextMatch = trimmed.split(':').slice(1).join(':');
            if (refMatch) {
              study.keyVerses.push({
                reference: stripMarkdown(refMatch[0]),
                context: stripMarkdown(contextMatch) || '',
              });
            }
          }
          break;
        case 'historicalContext':
          study.historicalContext += (study.historicalContext ? '\n' : '') + cleanLine;
          break;
        case 'oldTestamentShadows':
          study.oldTestamentShadows += (study.oldTestamentShadows ? '\n' : '') + cleanLine;
          break;
        case 'newTestamentFulfillment':
          study.newTestamentFulfillment += (study.newTestamentFulfillment ? '\n' : '') + cleanLine;
          break;
        case 'studyNotes':
          study.studyNotes += (study.studyNotes ? '\n' : '') + cleanLine;
          break;
        case 'practicalApplication':
          study.practicalApplication += (study.practicalApplication ? '\n' : '') + cleanLine;
          break;
        case 'discussionQuestions':
          if (trimmed.match(/^\d[\.\)]/)) {
            study.discussionQuestions.push(stripMarkdown(trimmed.replace(/^\d[\.\)]\s*/, '')));
          } else if (trimmed.match(/^[•\-*]/)) {
            study.discussionQuestions.push(cleanLine);
          }
          break;
        case 'prayerPoints':
          if (trimmed.match(/^[•\-*]/) || trimmed.match(/^\d[\.\)]/)) {
            study.prayerPoints.push(cleanLine);
          }
          break;
      }
    }
  });

  return study;
}

  // Helper to get Bible version ID
  getBibleVersionId(versionName) {
    return API_CONFIG.BIBLE_API.versions[versionName] || 
           API_CONFIG.BIBLE_API.versions['NKJV'];
  }

  // Get version name from ID
  getBibleVersionName(versionId) {
    return API_CONFIG.BIBLE_API.versionNames[versionId] || 'Unknown Version';
  }
}

export const devotionalEngine = new DevotionalEngine();

export const generateDailyDevotional = (bibleVersion) => 
  devotionalEngine.generateDailyDevotional(bibleVersion);

export const generateBibleStudy = (topic, bibleVersion) =>
  devotionalEngine.generateBibleStudy(topic, bibleVersion);