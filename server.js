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

app.post('/analyze', upload.single('resume'), (req, res) => {
    let text = "";

    new PdfReader().parseFileItems(req.file.path, (err, item) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "PDF Read Error" });
        }

        if (!item) {
            const skills = ["Java", "Python", "SQL", "HTML", "CSS", "JavaScript", "React", "Node.js", "Machine Learning", "AI"];
            const foundSkills = skills.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
            const score = Math.round((foundSkills.length / skills.length) * 100);
            
            const jd = req.body.jobDescription || "";
            const jdSkills = skills.filter(skill => jd.toLowerCase().includes(skill.toLowerCase()));
            const matchedSkills = foundSkills.filter(skill => jdSkills.includes(skill));
            const matchScore = jdSkills.length > 0 ? Math.round((matchedSkills.length / jdSkills.length) * 100) : 0;
            const missingSkills = jdSkills.filter(skill => !foundSkills.includes(skill));

            let suggestions = [];
            if (score < 40) suggestions.push("Add more technical skills to improve your resume.");
            if (!foundSkills.includes("SQL")) suggestions.push("Consider learning SQL.");
            if (!foundSkills.includes("React")) suggestions.push("Add React projects to strengthen your profile.");
            if (!foundSkills.includes("Node.js")) suggestions.push("Include backend development experience.");
            if (missingSkills.length > 0) suggestions.push(`Missing skills for this job: ${missingSkills.join(", ")}`);

            // --- DATABASE LOGIC OR RAM FALLBACK ---
            if (dbConnected) {
                db.query(
                    `INSERT INTO resumes (filename, score, skills) VALUES(?,?,?)`,
                    [req.file.originalname, score, foundSkills.join(", ")]
                );
            } else {
                // If cloud DB is offline, save to server memory array
                localMemoryStorage.push({
                    id: localMemoryStorage.length + 1,
                    filename: req.file.originalname,
                    score: score,
                    skills: foundSkills.join(", ")
                });
            }

            console.log("Skills Found:", foundSkills);
            console.log("Score:", score);

            res.json({
                message: "Resume uploaded successfully",
                score,
                matchScore,
                skills: foundSkills,
                missingSkills,
                suggestions,
                text: text.substring(0, 500)
            });

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
        // Return memory history reversed (newest first)
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
        // Calculate dashboard stats from memory array
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