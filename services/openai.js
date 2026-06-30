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
              Format: Use clear headings and bullet points for readability.`) + (isSimpleRequest ? "" : "\n\nIMPORTANT: Use clear section headers. You may use Markdown for emphasis (**bold**, *italics*) and bullet points, but ensure section headers are on their own lines and follow the EXACT requested format.")
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

  async generateDailyDevotional(bibleVersion = 'NKJV') {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const themes = [
      "The Sovereignty of God", "The New Covenant", "Justification by Faith",
      "The Fruit of the Spirit", "The Armor of God", "The Priesthood of Christ",
      "Sanctification and Holiness", "The Wisdom of God in Proverbs", "God's Providence in Joseph's life",
      "The Servant Songs of Isaiah", "The Kingdom of God in Parables", "Apostolic Zeal in Acts",
      "The Love of God (1 John)", "Spiritual Warfare (Ephesians 6)", "The Preeminence of Christ (Colossians)",
      "The Tabernacle as a Type of Christ", "The Sufficiency of Scripture", "The Fear of the Lord",
      "Perseverance of the Saints", "The Incarnation", "The Resurrection Power",
      "Gifts of the Spirit", "The Covenants (Abrahamic, Davidic, New)", "Christ in the Psalms",
      "The Sermon on the Mount", "The Attributes of God (Omniscience, Omnipresence)",
      "Biblical Stewardship", "The Great Commission", "Worship in Spirit and Truth",
      "The Imago Dei (Image of God)", "Grace vs. Legalism (Galatians)"
    ];

    // Pick a theme based on the day of the year to ensure variety across a month
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    const themeSeed = themes[day % themes.length];

    const prompt = `Create a deep, scholarly daily devotional for ${today} using the ${bibleVersion} Bible version.

    FOCUS THEME: ${themeSeed}
    (Ensure the devotional explores this theme deeply using relevant scriptures, but do not use "Focus Theme" as a header in your response).

    Please structure your response EXACTLY as follows (use these exact headers):

    TOPIC: [A compelling theological title]

    KEY_VERSE: [Primary verse reference]

    CONTENT:
    [Provide a deep-dive exposition (4-5 paragraphs) that:
    - Explains the original linguistic (Hebrew/Greek) or cultural context.
    - Include specific Hebrew or Greek root words for key theological terms found in the passage, providing their transliteration and original meaning.
    - Connects the theme to the overarching biblical narrative.
    - Explains how this points to or is fulfilled in Jesus Christ and God's consistent plan for salvation.
    - Provides a bridge between Old Testament shadows and New Testament reality.

    IMPORTANT: Start immediately with your analysis. DO NOT repeat the key verse text or the reference at the beginning of this section.]

    OLD_TESTAMENT_SHADOWS:
    - [Reference]: [How this topic/passage appears as a type, shadow, or promise in the OT]
    - [Reference]: [Its significance in the Hebrew Scriptures]

    NEW_TESTAMENT_FULFILLMENT:
    - [Reference]: [How Christ or the New Covenant fulfills the OT promise/shadow]
    - [Reference]: [The apostolic application of this truth]

    CROSS_REFERENCES:
    - [OT Reference]: [Detailed theological explanation of how this Old Testament passage relates to the theme. Do NOT repeat the verse text here.]
    - [NT Reference]: [Detailed theological explanation of the New Testament fulfillment or application. Do NOT repeat the verse text here.]
    - [Prophetic Reference]: [Link to a prophetic fulfillment. Do NOT repeat the verse text here.]
    - [Practical Reference]: [A wisdom/poetic literature connection. Do NOT repeat the verse text here.]

    THEOLOGICAL_INSIGHT: [One profound paragraph on the character of God revealed in this study]

    APPLICATION: [3-4 transformative practical steps rooted in the theology discussed]

    PRAYER: [A liturgically-inspired, heartfelt prayer]

    QUESTIONS:
    1. [Exegetical reflection question]
    2. [Heart-searching application question]
    3. [Communal/Relational reflection question]`;

    return await this.generateContent(prompt);
  }

  async generateBibleStudy(topic, bibleVersion = 'NKJV') {
    const prompt = `Create an exhaustive, deep-dive Bible study on "${topic}" using the ${bibleVersion} Bible.

    If the topic refers to a person and there are multiple individuals with that name in the Bible, focus on the most prominent one(s) and mention others briefly if relevant.

    Structure your response EXACTLY as follows:

    TOPIC: ${topic}

    INTRODUCTION: [A scholarly introduction to the theme within the canon of Scripture]

    KEY_VERSES:
    - [Reference 1]: [Exegesis and context. Provide scholarly insight only; do NOT repeat the verse text itself.]
    - [Reference 2]: [Exegesis and context. Provide scholarly insight only; do NOT repeat the verse text itself.]
    - [Reference 3]: [Exegesis and context. Provide scholarly insight only; do NOT repeat the verse text itself.]
    - [Reference 4]: [Exegesis and context. Provide scholarly insight only; do NOT repeat the verse text itself.]
    - [Reference 5]: [Exegesis and context. Provide scholarly insight only; do NOT repeat the verse text itself.]

    HISTORICAL_CONTEXT: [In-depth analysis of the historical, cultural, and geographic setting]

    OLD_TESTAMENT_SHADOWS:
    - [Reference]: [How this topic appears as a type, shadow, or promise in the OT]
    - [Reference]: [Its significance in the Hebrew Scriptures]

    NEW_TESTAMENT_FULFILLMENT:
    - [Reference]: [How Christ or the New Covenant fulfills the OT promise]
    - [Reference]: [The apostolic application of this truth]

    STUDY_NOTES: [Comprehensive, scholarly commentary on the topic (5-6 paragraphs).
    Include specific Hebrew or Greek root words for key theological terms relevant to the topic, providing their transliteration and original meaning.]

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

  async generateReadingPlan(topic, durationDays = 7, bibleVersion = 'NKJV') {
    const prompt = `Create an exhaustive, deep-dive ${durationDays}-day Bible reading plan on the topic: "${topic}" using the ${bibleVersion} Bible.

    IMPORTANT: If the topic "${topic}" is a book of the Bible (like "Ephesians", "Romans", etc.), the plan must act as a scholarly commentary and exposition of that book, progressing logically through its chapters and major theological themes.

    This plan must be rigorous, exegetical, and profoundly theological. Avoid superficial summaries. Each day must provide deep "meat" for a serious student of the Word.

    For each day's devotional content, you MUST provide at least 4-5 substantial paragraphs covering:
    1. Literary & Historical Context: Where does this passage fit in the book's argument and what was the author's intent?
    2. Exegetical Deep-Dive: A detailed verse-by-verse or section-by-section analysis.
    3. Linguistic Analysis: Identify specific Greek or Hebrew terms (transliterated) that are critical to the passage, explaining their nuances.
    4. Systematic & Biblical Theology: Connect this passage to major Christian doctrines and the central theme of God's redemption through Christ throughout the entire Bible.
    5. Modern Application: Rooted deeply in the theology discussed, not just "feel-good" advice.

    Structure your response EXACTLY as follows (use JSON format):

    {
      "title": "[A profound theological title for the plan]",
      "description": "[An exhaustive, scholarly introduction to the topic/book within the biblical canon]",
      "days": [
        {
          "day": 1,
          "title": "[Theological sub-theme for the day]",
          "reference": "[Specific Bible passage reference]",
          "devotional": "[THE FULL SCHOLARLY CONTENT (at least 4-5 paragraphs) as described above. Use \n\n for paragraph breaks. Do NOT be brief. Be exhaustive.]",
          "reflection": "[A challenging, heart-searching reflection question that bridges the exegetical depth to personal transformation]"
        }
      ]
    }

    Ensure the plan has exactly ${durationDays} days. The JSON must be perfectly valid.`;

    const response = await this.generateContent(prompt, "You are a world-class Biblical Scholar, Professor of New Testament and Old Testament Exegesis, and Systematic Theologian. Your task is to produce rigorous, Christ-centered, and academically sound reading plans that uncover the deep theological riches of Scripture. You write for serious students of the Bible who want 'meat' and not just 'milk'. Always respond with valid JSON.");

    try {
      // Find the JSON part in the response (sometimes AI adds preamble)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse reading plan JSON:", error);
      throw new Error("Could not generate a structured reading plan. Please try again.");
    }
  }

  async generateVerseOfTheDayBatch(count = 7, bibleVersion = 'NKJV') {
    const prompt = `Generate ${count} unique "Verse of the Day" entries.
    Each entry must include:
    1. A central Bible verse reference (from ${bibleVersion} version).
    2. The full text of that verse.
    3. A short, profound reflection (max 150 characters).
    4. A short spiritual challenge or action step (max 100 characters).

    Ensure a diverse range of themes (Grace, Wisdom, Courage, Love, etc.).
    Respond ONLY with a JSON array of objects.
    IMPORTANT: Do not truncate the response. Ensure all ${count} items are complete.

    Structure:
    [
      {
        "reference": "John 3:16",
        "text": "For God so loved the world...",
        "reflection": "A reminder of God's infinite love for us.",
        "challenge": "Share God's love with someone today through a kind act."
      }
    ]`;

    const response = await this.generateContent(prompt, "You are a pastoral theologian who provides concise, powerful daily spiritual insights. Respond only with valid JSON. Never leave the JSON incomplete.");

    try {
      // Robust JSON extraction
      let jsonString = response;
      const firstBracket = response.indexOf('[');
      const lastBracket = response.lastIndexOf(']');

      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonString = response.substring(firstBracket, lastBracket + 1);
      }

      // Attempt to fix common truncation issues by closing the array if it looks like it's cut off
      if (!jsonString.endsWith(']')) {
        console.warn("Detected potentially truncated JSON, attempting to fix...");
        // If it ends with a comma, remove it
        jsonString = jsonString.trim();
        if (jsonString.endsWith(',')) {
          jsonString = jsonString.slice(0, -1);
        }
        // If it doesn't end with a closing brace for an object, try to find the last complete object
        if (!jsonString.endsWith('}')) {
          const lastBrace = jsonString.lastIndexOf('}');
          if (lastBrace !== -1) {
            jsonString = jsonString.substring(0, lastBrace + 1);
          }
        }
        jsonString += ']';
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse VOTD batch JSON:", error);
      console.log("Raw response length:", response.length);
      console.log("Raw response was:", response);
      throw new Error("Could not generate Verse of the Day batch.");
    }
  }

  async generateCharacterSpotlight(bibleVersion = 'NKJV') {
    const prompt = `Create a deep, scholarly weekly "Bible Character Spotlight" using the ${bibleVersion} Bible version.

    The spotlight should focus on a prominent or deeply significant biblical figure.

    Please structure your response EXACTLY as follows (use these exact headers):

    CHARACTER: [Name of the Character]

    THEOLOGICAL_TITLE: [A compelling title capturing the essence of their life]

    KEY_VERSE: [Primary verse reference related to them]

    BIBLICAL_NARRATIVE:
    [Provide a 3-4 paragraph summary of their life and role in the biblical story.]

    STRENGTHS_AND_VIRTUES:
    - [Strength]: [Description rooted in scripture]
    - [Strength]: [Description rooted in scripture]

    FAILURES_AND_LESSONS:
    - [Failure/Lesson]: [Description of what we learn from their humanity]
    - [Failure/Lesson]: [Description of what we learn from their humanity]

    CHRIST_CONNECTION:
    [Explain how this character's life serves as a type, shadow, or points to the person and work of Jesus Christ.]

    MODERN_APPLICATION:
    [Provide 2-3 substantial paragraphs on how their story applies to a believer's walk today.]

    PRAYER: [A prayer inspired by the lessons from this character's life]`;

    return await this.generateContent(prompt);
  }

  async generatePrayer(request, bibleVersion = 'NKJV') {
    const prompt = `Task: Craft a deep, scripturally-rooted, and beautifully written prayer based on the following concern or request.

    REQUEST: "${request}"
    BIBLE VERSION: ${bibleVersion}

    The prayer should:
    1. Be written in the first person ("I" or "We").
    2. Incorporate specific biblical promises and language directly into the prayer's flow.
    3. Use a tone that is humble, reverent, and full of faith.
    4. Include 2-3 specific Bible references (e.g., John 14:27) woven naturally into the sentences.
    5. Be approximately 2-3 paragraphs long.

    IMPORTANT:
    - DO NOT use Markdown formatting (no **, ##, or bullet points).
    - Use only plain text.
    - Put the prayer's title on the first line.
    - End with a section called "Scriptural Foundation" that lists the references used.`;

    return await this.generateContent(prompt, "You are a pastoral theologian and expert in liturgical prayer. Your goal is to help believers find the right words to bring their deepest concerns before God, rooted firmly in the truth of His Word. Write in pure plain text, never use markdown symbols like asterisks or hashes.");
  }

  async explainVerse(verseText, reference, bibleVersion = 'NKJV') {
    const prompt = `Provide a deep, scholarly contextual explanation for the following verse(s) from the ${bibleVersion} translation:

    Reference: ${reference}
    Text: "${verseText}"

    Please include:
    1. Historical and Cultural Context.
    2. Original Language Insights (mention key Greek or Hebrew words if relevant).
    3. Theological Significance (how it fits into the broader message of the Bible).
    4. Practical Application for today.

    Format the response using Markdown with clear headers.`;

    return await this.generateContent(prompt);
  }

  async validateBiblicalTopic(topic) {
    const prompt = `Task: Determine if the following topic is suitable for a Bible study.
    Topic: "${topic}"

    Criteria for "YES":
    1. It is a person, place, event, or object mentioned in the Bible.
    2. It is a theological concept or doctrine found in Scripture.
    3. It is a practical life topic that the Bible provides specific guidance or principles for.
    4. It is a "Life Lessons" or "Biography" study of a biblical figure.

    Only answer "NO" if the topic is completely secular and has no relation to biblical text, Christian theology, or spiritual life.

    Answer with ONLY "YES" or "NO".`;

    const response = await this.generateContent(prompt);
    return response.trim().toUpperCase().includes('YES');
  }

  async generateDevotional(topicOrType, extraParam = null) {
    if (topicOrType === 'daily') {
      const response = await this.generateDailyDevotional();
      return this.parseAIResponse(response, 'daily');
    } else {
      const response = await this.generateBibleStudy(topicOrType);
      return this.parseAIResponse(response, topicOrType);
    }
  }

  parseAIResponse(responseText, originalQuery) {
    const result = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      topic: originalQuery,
      content: responseText,
      verses: []
    };

    // Extract TOPIC
    const topicMatch = responseText.match(/TOPIC:\s*(.+)/);
    if (topicMatch) result.topic = topicMatch[1].trim();

    // Extract verse references like "John 3:16" or "Genesis 1:1"
    const verseRegex = /\b([1-3]\s+)?[A-Z][a-z]+\s+\d+:\d+(-\d+)?\b/g;
    const matches = responseText.match(verseRegex);
    if (matches) {
      result.verses = [...new Set(matches)]; // Unique references
    }

    return result;
  }
}

export default new OpenAIService();
