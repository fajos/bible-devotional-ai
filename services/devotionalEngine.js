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
      oldTestamentShadows: '',
      newTestamentFulfillment: '',
      theologicalInsight: '',
      application: '',
      prayer: '',
      questions: [],
    };

    const lines = aiContent.split('\n');
    let currentSection = 'content';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine && !['content', 'application', 'prayer', 'theologicalInsight', 'oldTestamentShadows', 'newTestamentFulfillment'].includes(currentSection)) return;

      const cleanLine = stripMarkdown(trimmedLine);
      const upper = cleanLine.toUpperCase().replace(/_/g, ' ');

      if (upper.startsWith('TOPIC')) {
        currentSection = 'topic';
        sections.topic = cleanLine.replace(/^TOPIC:?\s*/i, '');
      } else if (upper.startsWith('KEY VERSE')) {
        currentSection = 'keyVerse';
        sections.keyVerse = cleanLine.replace(/^KEY_VERSE:?\s*/i, '').replace(/^KEY VERSE:?\s*/i, '');
      } else if (upper.startsWith('CONTENT')) {
        currentSection = 'content';
      } else if (upper.startsWith('OLD TESTAMENT SHADOWS')) {
        currentSection = 'oldTestamentShadows';
      } else if (upper.startsWith('NEW TESTAMENT FULFILLMENT')) {
        currentSection = 'newTestamentFulfillment';
      } else if (upper.startsWith('CROSS REFERENCES')) {
        currentSection = 'crossReferences';
      } else if (upper.startsWith('THEOLOGICAL INSIGHT')) {
        currentSection = 'theologicalInsight';
      } else if (upper.startsWith('APPLICATION')) {
        currentSection = 'application';
      } else if (upper.startsWith('PRAYER')) {
        currentSection = 'prayer';
      } else if (upper.startsWith('QUESTIONS')) {
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
        } else if (currentSection === 'oldTestamentShadows') {
          sections.oldTestamentShadows += (sections.oldTestamentShadows !== '' ? '\n' : '') + cleanLine;
        } else if (currentSection === 'newTestamentFulfillment') {
          sections.newTestamentFulfillment += (sections.newTestamentFulfillment !== '' ? '\n' : '') + cleanLine;
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
      const verseRef = sections.keyVerse.split('(')[0].trim().toLowerCase();
      // Remove any leading repetition of the reference or the verse text if it was included in parsing
      const contentLines = sections.content.split('\n');
      if (contentLines.length > 0) {
        const firstLine = contentLines[0].toLowerCase();
        if (firstLine.includes(verseRef) || (firstLine.length < 100 && (firstLine.includes('verse') || firstLine.includes(':')))) {
          // It's likely just repeating the reference/verse header
          contentLines.shift();
          sections.content = contentLines.join('\n').trim();
        }
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
        console.log(`Fetching key verse: ${parsed.keyVerse} (${bibleVersionId})`);
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
        } else {
          console.warn(`Failed to fetch text for key verse: ${parsed.keyVerse}`);
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
            // Clean up explanation by removing leading symbols/colons
            const rawExp = ref.includes(']') ? ref.split(']').slice(1).join(']') : (ref.includes(':') ? ref.split(':').slice(1).join(':') : ref);
            let cleanExp = rawExp.replace(/^[:\s\-]+/, '').trim();

            const actualText = (verseData.text || verseData.content || '').trim();

            // Check for redundancy - if explanation is just the verse text repeated
            const cleanActual = actualText.toLowerCase().replace(/[^\w\s]/g, '').trim();
            const cleanExpl = cleanExp.toLowerCase().replace(/[^\w\s]/g, '').trim();

            const isRedundant = cleanActual && cleanExpl &&
              (cleanExpl === cleanActual ||
               (cleanExpl.length < 100 && cleanActual.includes(cleanExpl)) ||
               (cleanActual.length > 20 && cleanExpl.includes(cleanActual.substring(0, Math.min(cleanActual.length, 50)))));

            // If explanation starts with the verse text, strip it
            if (!isRedundant && cleanActual && cleanExpl.startsWith(cleanActual.substring(0, Math.min(cleanActual.length, 20)))) {
                const delimiters = [' - ', ': ', '; ', ' – ', '. '];
                for (const d of delimiters) {
                    if (cleanExp.includes(d)) {
                        const parts = cleanExp.split(d);
                        const firstPartClean = parts[0].toLowerCase().replace(/[^\w\s]/g, '').trim();
                        if (cleanActual.includes(firstPartClean) || firstPartClean.includes(cleanActual.substring(0, 10))) {
                            cleanExp = parts.slice(1).join(d).trim();
                            break;
                        }
                    }
                }
            }

            crossRefVerses.push({
              reference: refOnly,
              text: actualText,
              explanation: isRedundant ? "" : cleanExp,
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
        oldTestamentShadows: parsed.oldTestamentShadows,
        newTestamentFulfillment: parsed.newTestamentFulfillment,
        crossReferences: crossRefVerses,
        application: parsed.application,
        prayer: parsed.prayer,
        questions: parsed.questions,
        bibleVersion: bibleVersion,
        rawAIResponse: aiContent,
        type: 'devotional',
        verses: crossRefVerses // Use the rich verse objects instead of just strings
      };

      // Final Check: Strip redundant key verse text or reference from the beginning of content
      if (devotional.keyVerse && devotional.content) {
        const verseRef = devotional.keyVerse.reference.toLowerCase().replace(/[^\w\s]/g, '');
        const verseText = (devotional.keyVerse.text || '').toLowerCase().replace(/[^\w\s]/g, '').trim();

        // Split content into paragraphs/lines
        let contentLines = devotional.content.split('\n');
        let linesRemoved = false;

        // Check the first 2 lines for redundancy
        for (let i = 0; i < Math.min(2, contentLines.length); i++) {
          const lineNormal = contentLines[0].toLowerCase().replace(/[^\w\s]/g, '').trim();

          // If the line is just the verse reference, the verse text, or a "Key Verse" header
          if (
            (verseRef && lineNormal.includes(verseRef)) ||
            (verseText && lineNormal.includes(verseText.substring(0, 50))) ||
            lineNormal === 'keyverse' ||
            lineNormal === 'scripture' ||
            (lineNormal.length < verseRef.length + 5 && lineNormal.includes(verseRef.split(' ')[0]))
          ) {
            contentLines.shift();
            linesRemoved = true;
            // Continue checking next line after shifting
            i--;
            if (contentLines.length === 0) break;
          } else {
            break; // Stop if the first line doesn't match redundancy patterns
          }
        }

        if (linesRemoved) {
          devotional.content = contentLines.join('\n').trim();
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
      console.log(`Fetching ${study.keyVerses.length} verses for Bible Study on ${topic}`);
      const verseRefs = study.keyVerses.map(v => v.reference);
      const verseTexts = await bibleAPIService.getMultipleVerses(bibleVersionId, verseRefs);
      
      // Enhance verses with actual text
      study.keyVerses = study.keyVerses.map((verse, index) => {
        const textData = verseTexts[index];
        if (!textData || textData.text === 'Content unavailable') {
          console.warn(`Verse unavailable: ${verse.reference}`);
        }
        return {
          ...verse,
          actualText: textData?.text || textData?.content || null,
          copyright: textData?.copyright || null,
        };
      });
    }

    // Step 4: Generate a unique ID
    study.id = `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    study.type = 'study';

    // Map keyVerses to verses for UI consistency
    study.verses = study.keyVerses.map(v => {
      const actualText = (v.actualText || '').trim();
      let context = (v.context || '').trim();

      if (!context) return { reference: v.reference, text: actualText, explanation: "" };

      // Check for redundancy - if context is just repeating the verse text
      const cleanActual = actualText.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const cleanContext = context.toLowerCase().replace(/[^\w\s]/g, '').trim();

      // If the context is exactly the same or contained within/contains the verse text significantly
      const isRedundant = cleanActual && cleanContext &&
        (cleanContext === cleanActual ||
         (cleanContext.length < 100 && cleanActual.includes(cleanContext)) ||
         (cleanActual.length > 20 && cleanContext.includes(cleanActual.substring(0, Math.min(cleanActual.length, 50)))));

      // If context starts with the verse text, strip it
      if (cleanActual && cleanContext.startsWith(cleanActual.substring(0, Math.min(cleanActual.length, 20)))) {
          // This is a bit risky but often context is "VERSE_TEXT - EXPLANATION"
          const delimiters = [' - ', ': ', '; ', ' – '];
          for (const d of delimiters) {
              if (context.includes(d)) {
                  const parts = context.split(d);
                  const firstPartClean = parts[0].toLowerCase().replace(/[^\w\s]/g, '').trim();
                  if (cleanActual.includes(firstPartClean) || firstPartClean.includes(cleanActual.substring(0, 10))) {
                      context = parts.slice(1).join(d).trim();
                      break;
                  }
              }
          }
      }

      return {
        reference: v.reference,
        text: actualText,
        explanation: isRedundant ? "" : context
      };
    });

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

    // Detect sections (case insensitive) - check against cleanLine to ignore markdown symbols
    // Use regex to catch headers even if they have extra text or slightly different punctuation
    const upper = cleanLine.toUpperCase().replace(/_/g, ' ');

    if (upper.startsWith('TOPIC')) {
      study.topic = cleanLine.replace(/^TOPIC:?\s*/i, '');
    } else if (upper.startsWith('INTRODUCTION')) {
      currentSection = 'introduction';
    } else if (upper.startsWith('KEY VERSES')) {
      currentSection = 'keyVerses';
    } else if (upper.startsWith('HISTORICAL CONTEXT')) {
      currentSection = 'historicalContext';
    } else if (upper.startsWith('OLD TESTAMENT SHADOWS')) {
      currentSection = 'oldTestamentShadows';
    } else if (upper.startsWith('NEW TESTAMENT FULFILLMENT')) {
      currentSection = 'newTestamentFulfillment';
    } else if (upper.startsWith('STUDY NOTES')) {
      currentSection = 'studyNotes';
    } else if (upper.startsWith('PRACTICAL APPLICATION')) {
      currentSection = 'practicalApplication';
    } else if (upper.startsWith('DISCUSSION QUESTIONS')) {
      currentSection = 'discussionQuestions';
    } else if (upper.startsWith('PRAYER POINTS')) {
      currentSection = 'prayerPoints';
    } else {
      // Add content to current section
      switch (currentSection) {
        case 'introduction':
          study.introduction += (study.introduction ? '\n' : '') + cleanLine;
          break;
        case 'keyVerses':
          if (trimmed.match(/^[•\-*]/)) {
            const refMatch = trimmed.match(/((?:\d\s*)?[A-Za-z]+\s+\d+:\d+(?:-\d+)?)/);
            if (refMatch) {
              const reference = refMatch[0].trim();
              // Find the part after the reference
              const refIndex = trimmed.indexOf(reference);
              const remaining = trimmed.substring(refIndex + reference.length).trim();
              const explanation = remaining.replace(/^[:\s\-]+/, '');

              study.keyVerses.push({
                reference: stripMarkdown(reference),
                context: stripMarkdown(explanation) || '',
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
           API_CONFIG.BIBLE_API.versions['NKJV']; // Default to NKJV
  }

  // Get version name from ID
  getBibleVersionName(versionId) {
    return API_CONFIG.BIBLE_API.versionNames[versionId] || 'Unknown Version';
  }

  // Generate a complete reading plan with verse fetching
  async generateReadingPlan(topic, durationDays = 7, bibleVersion = 'NKJV') {
    try {
      const cacheKey = `plan_${topic.toLowerCase()}_${durationDays}_${bibleVersion}`;

      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Step 1: Generate plan structure with AI
      const planData = await openaiService.generateReadingPlan(topic, durationDays, bibleVersion);

      const bibleVersionId = this.getBibleVersionId(bibleVersion);

      // Step 2: Enhance each day with verse text and cross-references
      const enhancedDays = await Promise.all(planData.days.map(async (day) => {
        // Fetch primary reading text
        let primaryVerseData = null;
        if (day.reference && bibleVersionId) {
          primaryVerseData = await bibleAPIService.getFormattedVerse(bibleVersionId, day.reference);
        }

        // Extract and fetch cross-references from the devotional text
        const refs = this.extractVerseReferences(day.devotional);
        const crossRefs = [];

        // Only fetch unique references that aren't the primary one
        const uniqueRefs = [...new Set(refs)].filter(r => r !== day.reference).slice(0, 3);

        for (const ref of uniqueRefs) {
          const vData = await bibleAPIService.getFormattedVerse(bibleVersionId, ref);
          if (vData) {
            crossRefs.push({
              reference: ref,
              text: vData.text || vData.content
            });
          }
        }

        return {
          ...day,
          primaryVerse: primaryVerseData ? {
            text: primaryVerseData.text || primaryVerseData.content,
            copyright: primaryVerseData.copyright
          } : null,
          crossReferences: crossRefs
        };
      }));

      const finalPlan = {
        ...planData,
        days: enhancedDays,
        id: `plan_${Date.now()}`,
        bibleVersion: bibleVersion
      };

      this.cache.set(cacheKey, finalPlan);
      return finalPlan;
    } catch (error) {
      console.error('Reading plan generation error:', error);
      throw error;
    }
  }
}

export const devotionalEngine = new DevotionalEngine();

export const generateDailyDevotional = (bibleVersion) => 
  devotionalEngine.generateDailyDevotional(bibleVersion);

export const generateBibleStudy = (topic, bibleVersion) =>
  devotionalEngine.generateBibleStudy(topic, bibleVersion);

export const generateReadingPlan = (topic, durationDays, bibleVersion) =>
  devotionalEngine.generateReadingPlan(topic, durationDays, bibleVersion);
