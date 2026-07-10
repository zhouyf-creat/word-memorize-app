import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const LOCAL_DICTIONARY: Record<string, { translation: string; example: string; exampleTranslation: string }> = {
  prince: { translation: "n. 王子", example: "The prince was loved by his people.", exampleTranslation: "王子深受他的子民喜爱。" },
  princess: { translation: "n. 公主", example: "The princess wore a gold crown.", exampleTranslation: "公主戴着一顶黄金皇冠。" },
  narrow: { translation: "adj. 狭窄的；窄的", example: "The street is too narrow for cars.", exampleTranslation: "这条街道太窄了，汽车无法通过。" },
  toilet: { translation: "n. 厕所；盥洗室", example: "Excuse me, where is the toilet?", exampleTranslation: "请问厕所在哪里？" },
  thunder: { translation: "n. 雷；雷声 vi. 打雷", example: "We heard the thunder from inside the house.", exampleTranslation: "我们在屋里听到了雷声。" },
  pepper: { translation: "n. 胡椒；胡椒粉；辣椒", example: "Would you like some black pepper on your soup?", exampleTranslation: "你喜欢在汤里放些黑胡椒粉吗？" },
  scissors: { translation: "n. 剪刀 (pl.)", example: "Use these scissors to cut the paper.", exampleTranslation: "用这把剪刀来剪纸。" },
  flood: { translation: "n. 洪水；水灾 vi. 淹没", example: "The heavy rain caused a major flood.", exampleTranslation: "暴雨引起了严重的洪水。" },
  nose: { translation: "n. 鼻子", example: "My nose is running because of the cold.", exampleTranslation: "因为感冒，我一直在流鼻涕。" },
  matter: { translation: "n. 事情；问题；物质 vi. 要紧，有关系", example: "What is the matter with your computer?", exampleTranslation: "你的电脑怎么了？" },
  ground: { translation: "n. 地面；土地；操场", example: "The playground ground is covered with grass.", exampleTranslation: "操场的地面覆盖着草。" },
  kick: { translation: "v./n. 踢", example: "He kicked the soccer ball into the goal.", exampleTranslation: "他把足球踢进了球门。" },
  trousers: { translation: "n. 裤子 (pl.)", example: "These blue trousers are too long for me.", exampleTranslation: "这条蓝色裤子对我来说太长了。" },
  playground: { translation: "n. 操场；游乐场", example: "Students are playing basketball on the playground.", exampleTranslation: "学生们在操场上打篮球。" },
  single: { translation: "adj. 单一的；单身的；单程的", example: "Is that a single bed or a double bed?", exampleTranslation: "那是张单人床还是双人床？" },
  progress: { translation: "n./vi. 进步；进展", example: "She has made rapid progress in her English.", exampleTranslation: "她的英语取得了飞速的进步。" },
  circle: { translation: "n. 圆圈 vt. 圈出，环绕", example: "Please draw a circle around the correct answer.", exampleTranslation: "请在正确答案周围画一个圈。" },
  mall: { translation: "n. 购物中心；商场", example: "Let's go shopping at the new mall.", exampleTranslation: "我们去新购物中心买东西吧。" },
  perhaps: { translation: "adv. 也许，可能", example: "Perhaps we will arrive on time.", exampleTranslation: "也许我们会准时到达。" },
  nagative: { translation: "adj. 否定的；消极的；负面的 (注：通常拼写为 negative)", example: "Try not to have negative thoughts about the exam.", exampleTranslation: "试着不要对考试抱有消极的想法。" },
  stamp: { translation: "n. 邮票；印章 vt. 贴邮票；盖章", example: "Do I need to put a stamp on this letter?", exampleTranslation: "我需要在这封信上贴邮票吗？" },
  science: { translation: "n. 科学；自然科学", example: "Science helps us understand how the world works.", exampleTranslation: "科学帮助我们理解世界是如何运转的。" },
  gold: { translation: "n. 黄金 adj. 金的；金制的", example: "The champion received a solid gold medal.", exampleTranslation: "冠军获得了一枚纯金奖牌。" },
  champion: { translation: "n. 冠军；拥护者", example: "She trained hard to become the school champion.", exampleTranslation: "她刻苦训练以成为学校冠军。" }
};

let genAIClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!genAIClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key === "") {
      console.warn("GEMINI_API_KEY 未配置，降级为离线模式。");
      return null;
    }
    genAIClient = new GoogleGenAI({ apiKey: key });
  }
  return genAIClient;
}

const app = express();
app.use(express.json());

app.post("/api/translate", async (req, res) => {
  const { words } = req.body as { words: string[] };
  if (!words || !Array.isArray(words)) {
    res.status(400).json({ error: "Missing or invalid words array" });
    return;
  }

  const results: Record<string, { translation: string; example: string; exampleTranslation: string }> = {};
  const wordsToFetchAI: string[] = [];

  for (const w of words) {
    const cleanW = w.toLowerCase().trim();
    if (LOCAL_DICTIONARY[cleanW]) {
      results[cleanW] = LOCAL_DICTIONARY[cleanW];
    } else {
      wordsToFetchAI.push(cleanW);
    }
  }

  if (wordsToFetchAI.length > 0) {
    const ai = getGeminiAI();
    if (ai) {
      try {
        const prompt = `You are a helpful middle school English teacher. Translate these English words into Chinese. Provide a standard middle school level translation, a simple sample sentence in English containing the word, and its Chinese translation.
Words to translate: ${JSON.stringify(wordsToFetchAI)}

Please return the results as a JSON object matching:
{
  "translations": {
    "word_name": {
      "translation": "词性 + 中文释义",
      "example": "Simple English sample sentence.",
      "exampleTranslation": "中文翻译"
    }
  }
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                translations: {
                  type: Type.OBJECT,
                  properties: {}
                }
              },
              required: ["translations"]
            }
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed && parsed.translations) {
            Object.assign(results, parsed.translations);
          }
        }
      } catch (error) {
        console.error("Gemini API error:", error);
        for (const w of wordsToFetchAI) {
          results[w] = {
            translation: "n./v. (待自动获取释义)",
            example: `This is a sample sentence containing ${w}.`,
            exampleTranslation: `这是一个包含单词 ${w} 的示例句子。`
          };
        }
      }
    } else {
      for (const w of wordsToFetchAI) {
        results[w] = {
          translation: "n./v. (请点击编辑添加释义)",
          example: `This is a sentence containing "${w}".`,
          exampleTranslation: `这是一个包含"${w}"的句子。`
        };
      }
    }
  }

  res.json({ translations: results });
});

app.post("/api/generate-quiz", async (req, res) => {
  const { words } = req.body as { words: { word: string; translation: string }[] };
  if (!words || !Array.isArray(words) || words.length === 0) {
    res.status(400).json({ error: "Missing or invalid words array" });
    return;
  }

  const ai = getGeminiAI();
  if (ai) {
    try {
      const prompt = `You are a middle school English teacher. Create an English vocabulary quiz based on the following list of words.
Words and their translations: ${JSON.stringify(words)}

Generate exactly 6 multiple-choice questions.
About 3 should be "English to Chinese", about 3 should be "Chinese to English".

Output strictly valid JSON:
{
  "questions": [
    {
      "word": "word",
      "type": "en-zh",
      "question": "What is the meaning of 'narrow'?",
      "options": ["狭窄的", "宽的", "高的", "矮的"],
      "correctAnswer": "狭窄的"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ["en-zh", "zh-en"] },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctAnswer: { type: Type.STRING }
                  },
                  required: ["word", "type", "question", "options", "correctAnswer"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      const text = response.text;
      if (text) {
        res.json(JSON.parse(text));
        return;
      }
    } catch (error) {
      console.error("Gemini quiz generation error:", error);
    }
  }

  const questions = [];
  const poolSize = Math.min(words.length, 6);
  const shuffledWords = [...words].sort(() => 0.5 - Math.random());
  const selected = shuffledWords.slice(0, poolSize);

  for (let i = 0; i < selected.length; i++) {
    const current = selected[i];
    const isEnZh = i % 2 === 0;
    const wrongOptions = words.filter(w => w.word !== current.word).map(w => isEnZh ? w.translation : w.word);
    const shuffledWrongs = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 3);
    const correctAnswer = isEnZh ? current.translation : current.word;
    const options = [correctAnswer, ...shuffledWrongs].sort(() => 0.5 - Math.random());
    while (options.length < 4) options.push(isEnZh ? "待选选项" : "placeholder");

    questions.push({
      word: current.word,
      type: isEnZh ? "en-zh" as const : "zh-en" as const,
      question: isEnZh ? `单词 "${current.word}" 的中文意思是什么？` : `以下哪个单词的意思是 "${current.translation}"？`,
      options,
      correctAnswer
    });
  }

  res.json({ questions });
});

export default app;
