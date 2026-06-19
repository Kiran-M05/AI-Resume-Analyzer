const multer = require('multer');
const { PdfReader } = require("pdfreader");
const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000; // Updated to support Render's dynamic port assignment
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

// Local Memory Fallback Array if database isn't connected
let localMemoryStorage = [];

// Check if cloud environment variables exist, otherwise default to local
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

const upload = multer({
    dest: 'uploads/'
});

app.get('/', (req, res) => {
    res.send('AI Resume Analyzer Running');
});

// HELPER FUNCTION: Wraps PdfReader inside a clean Promise to extract text sequentially
function extractPdfText(filePath) {
    return new Promise((resolve, reject) => {
        let extractedText = "";
        new PdfReader().parseFileItems(filePath, (err, item) => {
            if (err) {
                reject(err);
            } else if (!item) {
                // End of file reached completely, send text back
                resolve(extractedText);
            } else if (item.text) {
                extractedText += item.text + " ";
            }
        });
    });
}

// RESTRICTION BOUND PARSE PIPELINE
app.post('/analyze', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No resume file uploaded" });
    }

    try {
        // 1. Wait completely for the text extraction stream to finish
        const text = await extractPdfText(req.file.path);
        const jd = req.body.jobDescription || "General Software Engineering Position";

        // 2. Construct the clean structural blueprint prompt for Gemini
        const promptText = `
        You are an advanced Applicant Tracking System (ATS) optimization matrix engine.
        Analyze the following Resume Text against the provided Job Description.
        
        [JOB DESCRIPTION]:
        ${jd}

        [RESUME TEXT]:
        ${text}

        Respond ONLY with a valid, clean JSON object matching this structural blueprint (no markdown formatting code blocks, no backticks, just raw JSON):
        {
            "score": 75,
            "matchScore": 80,
            "skills": ["Java", "React", "Node.js"],
            "missingSkills": ["Docker"],
            "suggestions": ["Add depth to your React project descriptions.", "Detail containerization constraints."]
        }
        `;

        // 3. Request analysis stream from gemini-2.5-flash using the legacy constructor configuration
        // (If using the newer client structure, adjust this line to match your exact initialization)
        const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptText,
        });

        let cleanJsonString = aiResponse.text.trim();
        
        // Strip out markdown wrappers if the model appends them automatically
        if (cleanJsonString.startsWith("```")) {
            cleanJsonString = cleanJsonString.replace(/```json|```/g, "").trim();
        }

        const aiAnalysis = JSON.parse(cleanJsonString);

        // 4. Persistence distribution layer routing
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

        // 5. Fire clean dashboard payload down to the browser UI script hooks
        return res.json({
            message: "Resume uploaded successfully",
            score: aiAnalysis.score,
            matchScore: aiAnalysis.matchScore,
            skills: aiAnalysis.skills,
            missingSkills: aiAnalysis.missingSkills,
            suggestions: aiAnalysis.suggestions,
            text: text.substring(0, 500)
        });

    } catch (error) {
        console.error("AI Generation Matrix Fault:", error);
        return res.status(500).json({ message: "AI Analysis Pipeline Aborted" });
    }
});