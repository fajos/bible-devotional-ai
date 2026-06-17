// services/openai.js
import { API_CONFIG } from './config';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

class OpenAIService {
  constructor() {
    this.apiKey = API_CONFIG.OPENAI.apiKey;
  }

  async generateContent(prompt, systemPrompt = '') {
    try {
      // Determine if this is a simple validation request
      const isSimpleRequest = prompt.includes('Answer with ONLY "YES" or "NO"');

      const response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: API_CONFIG.OPENAI.model,
          messages: [
            {
              role: 'system',
              content: (systemPrompt || `You are an elite Biblical Scholar and Theologian with expertise in Hermeneutics, Exegesis, and Systematic Theology.
              Your goal is to provide profound, deep-dive biblical studies that explore the "whole counsel of God."

              Core Principles:
              1. Redemptive-Historical Approach: Always connect the specific topic to the broader narrative of Scripture (Creation, Fall, Redemption, Restoration).
              2. OT-NT Synthesis: Explicitly show how Old Testament shadows and types find their fulfillment in Christ and the New Covenant.
              3. Original Context: Respect the historical, cultural, and linguistic (Hebrew/Greek) context of the passages.
              4. Practical but Profound: Ensure applications are not superficial but rooted in the theological depth of the study.

              Tone: Academic yet accessible, pastoral, and deeply spiritual.
              Format: Use clear headings and bullet points for readability.`) + (isSimpleRequest ? "" : "\n\nIMPORTANT: Use PLAIN TEXT ONLY. Do not use Markdown (no asterisks, no bold, no headers like ###). Use plain numbers for lists.")
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: API_CONFIG.OPENAI.temperature,
          max_tokens: API_CONFIG.OPENAI.maxTokens,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }

  async generateDailyDevotional(bibleVersion = 'KJV') {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const prompt = `Create a deep, scholarly daily devotional for ${today} using the ${bibleVersion} Bible version.

    Please structure your response EXACTLY as follows (use these exact headers):

    TOPIC: [A compelling theological title]

    KEY_VERSE: [Primary verse reference]

    CONTENT:
    [Provide a deep-dive exposition (4-5 paragraphs) that:
    - Explains the original linguistic or cultural context.
    - Connects the theme to the overarching biblical narrative.
    - Discusses the "Scarlet Thread" - how this points to or is fulfilled in Jesus Christ.
    - Provides a bridge between Old Testament shadows and New Testament reality.]

    CROSS_REFERENCES:
    - [OT Reference]: [Detailed explanation of how this Old Testament passage relates to the theme]
    - [NT Reference]: [Detailed explanation of the New Testament fulfillment or application]
    - [Prophetic Reference]: [Link to a prophetic fulfillment]
    - [Practical Reference]: [A wisdom/poetic literature connection]

    THEOLOGICAL_INSIGHT: [One profound paragraph on the character of God revealed in this study]

    APPLICATION: [3-4 transformative practical steps rooted in the theology discussed]

    PRAYER: [A liturgically-inspired, heartfelt prayer]

    QUESTIONS:
    1. [Exegetical reflection question]
    2. [Heart-searching application question]
    3. [Communal/Relational reflection question]`;

    return await this.generateContent(prompt);
  }

  async generateBibleStudy(topic, bibleVersion = 'KJV') {
    const prompt = `Create an exhaustive, deep-dive Bible study on "${topic}" using the ${bibleVersion} Bible.

    Structure your response EXACTLY as follows:

    TOPIC: ${topic}

    INTRODUCTION: [A scholarly introduction to the theme within the canon of Scripture]

    KEY_VERSES:
    - [Reference 1]: [Exegesis and context]
    - [Reference 2]: [Exegesis and context]
    - [Reference 3]: [Exegesis and context]
    - [Reference 4]: [Exegesis and context]
    - [Reference 5]: [Exegesis and context]

    HISTORICAL_CONTEXT: [In-depth analysis of the historical, cultural, and geographic setting]

    OLD_TESTAMENT_SHADOWS:
    - [Reference]: [How this topic appears as a type, shadow, or promise in the OT]
    - [Reference]: [Its significance in the Hebrew Scriptures]

    NEW_TESTAMENT_FULFILLMENT:
    - [Reference]: [How Christ or the New Covenant fulfills the OT promise]
    - [Reference]: [The apostolic application of this truth]

    STUDY_NOTES: [Comprehensive, scholarly commentary on the topic (5-6 paragraphs)]

    PRACTICAL_APPLICATION: [Deeply rooted practical implications for the modern believer's walk]

    DISCUSSION_QUESTIONS:
    1. [Question focusing on biblical interpretation]
    2. [Question focusing on theological implications]
    3. [Question focusing on personal transformation]
    4. [Question focusing on defense of the faith (Apologetics)]
    5. [Question focusing on the Great Commission]

    PRAYER_POINTS:
    - [Prayer point for personal sanctification]
    - [Prayer point for the global Church]
    - [Prayer point for the unreached]`;

    return await this.generateContent(prompt);
  }

  // Add this to the OpenAIService class in services/openai.js

async validateBiblicalTopic(topic) {
  const prompt = `Is "${topic}" a biblical topic, person, event, or concept found in or addressed by the Bible? 
  Answer with ONLY "YES" or "NO". 
  If it's a general life question, determine if the Bible provides guidance on this topic.`;
  
  const response = await this.generateContent(prompt);
  return response.trim().toUpperCase().includes('YES');
}

  async generateVerseReferences(topic, scope = 'entire_bible') {
    const scopeDescription = scope === 'entire_bible' 
      ? 'from Genesis to Revelation' 
      : `from the ${scope}`;

    const prompt = `List all significant Bible references about "${topic}" ${scopeDescription}.
    
    For each reference, provide:
    - The exact reference (Book Chapter:Verse)
    - A one-sentence summary of what it says about the topic
    
    Organize by:
    1. Old Testament references
    2. New Testament references
    
    Include at least 10-15 references if possible.`;

    return await this.generateContent(prompt);
  }
}

export default new OpenAIService();