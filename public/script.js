/**
 * AI Resume Analyzer — Cyber Core Pipeline Engine
 * Handles micro-interaction hooks, file stream processing, and neon SVG donut chart population.
 */

document.addEventListener("DOMContentLoaded", () => {
    const uploadForm = document.getElementById("uploadForm");
    const resumeInput = document.getElementById("resume");
    const resultBox = document.getElementById("result");

    // Toggle this to false when your backend server route is live and ready
    const USE_LOCAL_SIMULATION = true; 

    // File Dropzone Micro-interactions
    const dropzone = document.querySelector(".upload-dropzone");
    const dropzoneText = document.querySelector(".dropzone-text");
    
    if (dropzone && resumeInput) {
        resumeInput.addEventListener("dragover", () => dropzone.style.borderColor = "var(--border-active)");
        resumeInput.addEventListener("dragleave", () => dropzone.style.borderColor = "rgba(56, 189, 248, 0.3)");
        resumeInput.addEventListener("drop", () => dropzone.style.borderColor = "var(--border-active)");
        
        // Real-Time Dynamic File Name Stream Feedback
        resumeInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file && dropzoneText) {
                dropzoneText.innerText = `READY_STREAM: ${file.name.toUpperCase()}`;
                dropzoneText.style.color = "var(--success-matrix)";
                dropzoneText.style.textShadow = "0 0 8px rgba(16, 185, 129, 0.4)";
            }
        });
    }

    // Pipeline Execution Stream
    if (uploadForm) {
        uploadForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Set loading / parsing HUD state
            resultBox.innerHTML = `
                <div class="empty-state-placeholder">
                    <div class="radar-scanner">
                        <div class="radar-sweep"></div>
                        <div class="empty-icon" style="animation: rotate-sweep 1.5s linear infinite;">⚙️</div>
                    </div>
                    <h4 style="color: var(--accent-cyan); letter-spacing: 1.5px;">RUNNING_PIPELINE_CALCULATIONS...</h4>
                    <p>Parsing text blobs, checking ATS structural rulesets, and building vector alignment matrices.</p>
                </div>
            `;

            // 1. Simulation Path (Toggle active state above via USE_LOCAL_SIMULATION)
            if (USE_LOCAL_SIMULATION) {
                setTimeout(() => {
                    const mockData = {
                        score: 88,
                        matchScore: 65,
                        skills: ["JavaScript", "React.js", "Node.js", "Git Matrix", "REST APIs", "CSS3 Architecture"],
                        missingKeywords: ["TypeScript Matrix", "Docker Containers", "GraphQL Matrix"],
                        text: "SUMMARY // Highly motivated Software Engineer with robust experience building responsive, fluid front-end control systems using React and core JavaScript web components...",
                        suggestions: [
                            "Inject 'TypeScript Matrix' directly into your core technical expertise stack.",
                            "Append container orchestration metrics showing active deployment layout arrays using Docker.",
                            "Optimize your profile's header nodes to ensure tracking software catches semantic layout weights."
                        ]
                    };
                    renderMetricsDashboard(mockData);
                }, 1500);
                return;
            }

            // 2. Real Production Server Path
            const formData = new FormData();
            formData.append("resume", resumeInput.files[0]);
            formData.append("jobDescription", document.getElementById("jobDescription").value);

            try {
                const response = await fetch("/analyze", {
                    method: "POST",
                    body: formData
                });

                if (!response.ok) throw new Error("CRITICAL_PIPELINE_FAILURE");

                const data = await response.json();
                renderMetricsDashboard(data);

            } catch (error) {
                console.error("Pipeline Error:", error);
                resultBox.innerHTML = `
                    <div class="empty-state-placeholder" style="border: 1px dashed var(--error-alert); padding: 30px; background: rgba(239, 68, 68, 0.03);">
                        <div class="empty-icon" style="color: var(--error-alert); border-color: var(--error-alert);">⚠️</div>
                        <h4 style="color: var(--error-alert);">[SYSTEM_ERROR: PIPELINE_ABORTED]</h4>
                        <p>The connection matrix timed out or returned invalid token variables. Ensure your backend compiler is active.</p>
                    </div>
                `;
            }
        });
    }

    /**
     * Renders the analytical metrics dashboard using SVG Donut elements with dynamic health color coloring maps.
     * @param {Object} data - Processed payload from server.
     */
    function renderMetricsDashboard(data) {
        const resumeScore = typeof data.score === 'number' ? data.score : 0;
        const matchScore = typeof data.matchScore === 'number' ? data.matchScore : 0;
        const matchDisplay = typeof data.matchScore === 'number' ? `${data.matchScore}%` : "N/A";
        
        const missingDisplay = data.missingKeywords && data.missingKeywords.length 
            ? data.missingKeywords.join(", ") 
            : "No extreme gaps detected against targeting rules.";

        // SVG Circle Perimeter formula: 2 * Math.PI * radius (r=40) => ~251.2
        const totalCircumference = 251.2;
        const resumeOffset = totalCircumference - (totalCircumference * resumeScore) / 100;
        const matchOffset = totalCircumference - (totalCircumference * matchScore) / 100;

        // Helper calculation loop to determine dynamic matrix health coloring states
        const getColorClass = (score) => {
            if (score >= 80) return "glow-success"; // Excellent / High Match (Emerald)
            if (score >= 50) return "glow-warning"; // Average / Optimization required (Amber/Orange)
            return "glow-error";                   // Critical Alert / Structural gaps (Breach Red)
        };

        resultBox.innerHTML = `
            <h3 style="color: var(--success-matrix); margin-bottom: 15px; letter-spacing: 1px;">🎉 ANALYSIS_COMPLETE</h3>
            
            <div class="metrics-pill-grid">
                <div class="metric-donut-card">
                    <div class="donut-container">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle class="donut-track" cx="50" cy="50" r="40" stroke-width="8"></circle>
                            <circle class="donut-progress ${getColorClass(resumeScore)}" cx="50" cy="50" r="40" stroke-width="8" 
                                    style="stroke-dasharray: ${totalCircumference}; stroke-dashoffset: ${totalCircumference};">
                            </circle>
                        </svg>
                        <div class="donut-percentage">${resumeScore}%</div>
                    </div>
                    <span>Base Resume Score</span>
                </div>
                
                <div class="metric-donut-card">
                    <div class="donut-container">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle class="donut-track" cx="50" cy="50" r="40" stroke-width="8"></circle>
                            <circle class="donut-progress ${getColorClass(matchScore)}" cx="50" cy="50" r="40" stroke-width="8" 
                                    style="stroke-dasharray: ${totalCircumference}; stroke-dashoffset: ${totalCircumference};">
                            </circle>
                        </svg>
                        <div class="donut-percentage">${matchDisplay}</div>
                    </div>
                    <span>JD Match Score</span>
                </div>
            </div>

            <div class="result-section-title">Detected Keywords</div>
            <div class="skills-list-block">${data.skills && data.skills.length ? data.skills.join(", ") : "No base vectors compiled."}</div>

            <div class="result-section-title">Missing Core Target Requirements</div>
            <div class="skills-list-block" style="border-left: 2px solid var(--accent-cyan); font-weight: 500;">${missingDisplay}</div>

            <div class="result-section-title">Extracted Document Snippet</div>
            <pre class="preview-box-snippet">${data.text || "[EMPTY_BUFFER]"}</pre>

            <div class="result-section-title">ATS Strategy Suggestions</div>
            <div class="skills-list-block" style="line-height: 1.6; color: var(--text-neon); margin-bottom: 20px; opacity: 0.85;">
                ${data.suggestions && data.suggestions.length ? "• " + data.suggestions.join("<br>• ") : "Structural arrays verify complete match profile configurations."}
            </div>

            <button id="downloadReportBtn" class="primary-submit-btn" style="width: 100%; color: var(--accent-cyan); border: 1px solid var(--accent-cyan);">
                💾 DOWNLOAD_DETAILED_AUDIT_LOG (.TXT)
            </button>
        `;

        // Micro-timeout triggers sleek circular growth animation on insertion
        setTimeout(() => {
            const circles = resultBox.querySelectorAll(".donut-progress");
            if (circles[0]) circles[0].style.strokeDashoffset = resumeOffset;
            if (circles[1]) circles[1].style.strokeDashoffset = matchOffset;
        }, 50);

        // Bind secure structural local disk file compilation pipeline
        document.getElementById("downloadReportBtn").addEventListener("click", () => {
            triggerLogDownload(data, resumeScore, matchDisplay, missingDisplay);
        });
    }

    /**
     * Builds and exports a clean tactical dashboard text audit manifest log.
     */
    function triggerLogDownload(data, resumeScore, matchDisplay, missingDisplay) {
        const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        const logContent = `===================================================================
CYBER RECON / ATS METRIC RESUME ANALYSIS ENGINE LOG
GENERATED ON: ${timestamp}
===================================================================

[SUMMARY PARAMETERS]
-------------------------------------------------------------------
* Base Profile Formatting Score  : ${resumeScore}%
* Contextual JD Alignment Match : ${matchDisplay}

[EXTRACTED INTERFACES / FOUND KEYWORDS]
-------------------------------------------------------------------
${data.skills && data.skills.length ? data.skills.join(", ") : "None Detected"}

[MISSING CRITICAL REQUIREMENTS]
-------------------------------------------------------------------
${missingDisplay}

[ATS STRATEGY STRATAGEMS]
-------------------------------------------------------------------
${data.suggestions && data.suggestions.length ? data.suggestions.map(s => `- ${s}`).join("\n") : "Profile architecture clean."}

===================================================================
[EOF - PIPELINE STREAM SESSION CLOSED]
===================================================================`;

        const blob = new Blob([logContent], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `ATS_METRIC_REPORT_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});