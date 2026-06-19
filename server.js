const multer = require('multer');
const { PdfReader } = require("pdfreader");
const express = require('express');
const mysql = require('mysql2');
const { GoogleGenAI } = require('@google/genai'); // Imported the updated Gen AI SDK

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Initialize Gemini AI (Falls back to empty string if not deployed yet)
const aiApiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6KaYrtGjtejFa3Xm9-00fp1IRa934qbFhwuPJgRw7rneA";
const ai = new GoogleGenAI({ apiKey: aiApiKey });

let localMemoryStorage = [];

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Kiran@490',
    database: process.env.DB_DATABASE || 'resumeDB',
    port: process.env.DB_PORT || 3306
};

let dbConnected = false;
const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.log('⚠️ Database Connection Failed. Falling back to Local RAM Memory Storage.');
        dbConnected = false;
    } else {
        console.log('✅ MySQL Connected Successfully');
        dbConnected = true;
    }
});

const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
    res.send('AI Resume Analyzer Running');
});

app.post('/analyze', upload.single('resume'), (req, res) => {
    let text = "";

    if (!req.file) {
        return res.status(400).json({ message: "No resume file uploaded" });
    }

    new PdfReader().parseFileItems(req.file.path, async (err, item) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "PDF Read Error" });
        }

        if (!item) {
            const jd = req.body.jobDescription || "General Software Engineering Position";

            try {
                // Constructing the complex system context prompt for Gemini
                const promptText = `
                You are an advanced Applicant Tracking System (ATS) optimization matrix engine.
                Analyze the following Resume Text against the provided Job Description.
                
                [JOB DESCRIPTION]:
                ${jd}

                [RESUME TEXT]:
                ${text}

                Respond ONLY with a valid, clean JSON object matching this structural blueprint (no markdown formatting code blocks, no backticks, just raw JSON):
                {
                    "score": 0-100 score matching resume profile to job description,
                    "matchScore": 0-100 skill cross-match matrix score,
                    "skills": ["Array", "of", "detected", "technical", "skills"],
                    "missingSkills": ["Array", "of", "skills", "demanded", "by", "JD", "but", "missing"],
                    "suggestions": ["3", "actionable", "bullet", "points", "to", "improve", "the", "resume"]
                }
                `;

                // Running the compilation stream on gemini-2.5-flash
                const aiResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: promptText,
                });

                let cleanJsonString = aiResponse.text.trim();
                // Strip markdown wrappers if the model appends them
                if (cleanJsonString.startsWith("```json")) {
                    cleanJsonString = cleanJsonString.replace(/```json|```/g, "").trim();
                }

                const aiAnalysis = JSON.parse(cleanJsonString);

                // Save to active persistence layer
                if (dbConnected) {
                    db.query(
                        `INSERT INTO resumes (filename, score, skills) VALUES(?,?,?)`,
                        [req.file.originalname, aiAnalysis.score, aiAnalysis.skills.join(", ")]
                    );
                } else {
                    localMemoryStorage.push({
                        id: localMemoryStorage.length + 1,
                        filename: req.file.originalname,
                        score: aiAnalysis.score,
                        skills: aiAnalysis.skills.join(", ")
                    });
                }

                return res.json({
                    message: "Resume uploaded successfully",
                    score: aiAnalysis.score,
                    matchScore: aiAnalysis.matchScore,
                    skills: aiAnalysis.skills,
                    missingSkills: aiAnalysis.missingSkills,
                    suggestions: aiAnalysis.suggestions,
                    text: text.substring(0, 500)
                });

            } catch (aiError) {
                console.error("AI Generation Matrix Fault:", aiError);
                return res.status(500).json({ message: "AI Analysis Pipeline Aborted" });
            }

        } else if (item.text) {
            text += item.text + " ";
        }
    });
});

app.get('/history', (req, res) => {
    if (dbConnected) {
        db.query('SELECT * FROM resumes ORDER BY id DESC', (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    } else {
        res.json([...localMemoryStorage].reverse());
    }
});

app.get('/dashboard', (req, res) => {
    if (dbConnected) {
        db.query(
            `SELECT COUNT(*) AS totalResumes, AVG(score) AS averageScore, MAX(score) AS highestScore FROM resumes`,
            (err, result) => {
                if (err) return res.status(500).json(err);
                res.json(result[0]);
            }
        );
    } else {
        const totalResumes = localMemoryStorage.length;
        const scores = localMemoryStorage.map(r => r.score);
        const averageScore = totalResumes > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalResumes) : 0;
        const highestScore = totalResumes > 0 ? Math.max(...scores) : 0;
        res.json({ totalResumes, averageScore, highestScore });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running dynamically on port ${PORT}`);
});