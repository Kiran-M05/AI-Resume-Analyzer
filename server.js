const multer = require('multer');
const { PdfReader } = require("pdfreader");
const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kiran@490',
    database: 'resumeDB'
});

db.connect((err) => {
    if (err) {
        console.log('Database Connection Failed');
        console.log(err);
        return;
    }

    console.log('✅ MySQL Connected');
});
const upload = multer({
    dest: 'uploads/'
});

app.get('/', (req, res) => {
    res.send('AI Resume Analyzer Running');
});


app.post('/upload', upload.single('resume'), (req, res) => {

    let text = "";

    new PdfReader().parseFileItems(req.file.path, (err, item) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "PDF Read Error"
            });
        }

        if (!item) {

            const skills = [
                "Java",
                "Python",
                "SQL",
                "HTML",
                "CSS",
                "JavaScript",
                "React",
                "Node.js",
                "Machine Learning",
                "AI"
            ];

            const foundSkills = skills.filter(skill =>
                text.toLowerCase().includes(skill.toLowerCase())
            );

            const score = Math.round(
                (foundSkills.length / skills.length) * 100
            );
           const jd = req.body.jobDescription || "";

const jdSkills = skills.filter(skill =>
    jd.toLowerCase().includes(skill.toLowerCase())
);

const matchedSkills = foundSkills.filter(skill =>
    jdSkills.includes(skill)
);

const matchScore =
    jdSkills.length > 0
        ? Math.round(
              (matchedSkills.length / jdSkills.length) * 100
          )
        : 0;

const missingSkills = jdSkills.filter(skill =>
    !foundSkills.includes(skill)
);

let suggestions = [];

if (score < 40) {
    suggestions.push(
        "Add more technical skills to improve your resume."
    );
}

if (!foundSkills.includes("SQL")) {
    suggestions.push("Consider learning SQL.");
}

if (!foundSkills.includes("React")) {
    suggestions.push(
        "Add React projects to strengthen your profile."
    );
}

if (!foundSkills.includes("Node.js")) {
    suggestions.push(
        "Include backend development experience."
    );
}

if (missingSkills.length > 0) {
    suggestions.push(
        `Missing skills for this job: ${missingSkills.join(", ")}`
    );
}

db.query(
    `INSERT INTO resumes
    (filename,score,skills)
    VALUES(?,?,?)`,
    [
        req.file.originalname,
        score,
        foundSkills.join(", ")
    ]
);

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

    db.query(
        'SELECT * FROM resumes ORDER BY id DESC',
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result);
        }
    );

});
app.get('/dashboard', (req, res) => {

    db.query(
        `
        SELECT
        COUNT(*) AS totalResumes,
        AVG(score) AS averageScore,
        MAX(score) AS highestScore
        FROM resumes
        `,
        (err, result) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(result[0]);
        }
    );

});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});