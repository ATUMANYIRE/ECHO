# ECHO — GLITCHATHON 2026 Video Demo Script

**Project:** ECHO — AI-Powered Educational Debugging Laboratory  
**Target Duration:** 2 minutes 45 seconds (Under 3-minute hard ceiling)  
**Presenter Tone:** Confident, pedagogical, crisp, professional software engineer.

---

## Storyboard Overview

| Time | Scene | Visual Cue | Key Message |
|---|---|---|---|
| **0:00 – 0:30** | **Act 1: The Hook** | Workspace hero view; code editor with accumulator bug | The fatal flaw of chatbot coding tutors: superficial guessing. |
| **0:30 – 1:10** | **Act 2: The Sandbox** | Click "Run Code"; Docker container executes; timeline renders | Real execution is authoritative. sys.settrace in an isolated sandbox. |
| **1:10 – 1:45** | **Act 3: Time-Travel** | Scrubber moves back to Step 7; variable mutation highlighted | Pinpointing the exact moment the logic broke. |
| **1:45 – 2:20** | **Act 4: Evidence AI** | AI panel; citations highlight timeline steps; "Verify Fix" button | Gemini grounded in trace facts; sandbox-verified corrections. |
| **2:20 – 2:45** | **Act 5: Mastery & Close** | Dual comparison Run A vs Run B; Multi-tab learning challenges | "Don't just fix the mistake. Understand the moment it was made." |

---

## Detailed Audio & Video Script

### Act 1: The Hook & The Problem (0:00 – 0:30)

**[VISUAL]**  
*Screen opens on the ECHO desktop workspace (`http://localhost:3005`). Warm-white surfaces, clean indigo accents. The editor contains the classic introductory Python bug:*
```python
scores = [60, 80, 100]
total = 0
for score in scores:
    total = score  # Bug: overwriting instead of accumulating
average = total / len(scores)
print(f"Average: {average}")
```

**[AUDIO / NARRATOR]**  
> "Every programming student knows this feeling: your code runs without crashing, but the output is completely wrong. You expected an average of 80, but Python printed 33.3.
> 
> If you paste this into a standard AI chatbot, it just spits out the corrected code. You copy-paste it, the test passes, and you learned absolutely nothing about why your logic broke.
> 
> This is **ECHO** — an educational debugging laboratory built on a single, non-negotiable principle: **Execution evidence is authoritative. AI explanations are hypotheses until proven by evidence.**"

---

### Act 2: The Isolated Sandbox & Authoritative Tracing (0:30 – 1:10)

**[VISUAL]**  
*Narrator clicks the indigo `Run Code (Sandbox)` button. A subtle loading spinner appears for under a second, then the Execution Timeline, Call Stack, and Variable Inspector populate with crisp green badges.*

**[AUDIO / NARRATOR]**  
> "When we click 'Run Code', student code is never executed on our host or evaluated in a fake browser mock. It is launched inside a disposable, unprivileged Linux Docker container with zero network access, read-only root filesystems, and strict CPU and memory limits.
> 
> Using Python's authoritative `sys.settrace`, ECHO records every single line execution, function call, and variable mutation.
> 
> In our variable inspector, look at the causal trajectory of `total`:
> `0 → 60 → 80 → 100`.
> Notice that? At each iteration, `total` doesn't accumulate — it gets overwritten!"

---

### Act 3: Time-Travel Replay & The Causal Moment (1:10 – 1:45)

**[VISUAL]**  
*Narrator scrubs backward through the execution timeline using keyboard arrow keys and the slider. The code editor highlights line 4, then line 5. Narrator stops at Step #7.*

**[AUDIO / NARRATOR]**  
> "With ECHO's time-travel replay, students don't have to guess when things went wrong. We can step backwards and forwards in time.
> 
> Watch what happens at Step 7, on line 5: `score` is 80, but `total` gets replaced with 80 instead of 140. That is the exact causal moment the program diverged from the student's mental model.
> 
> To reinforce their understanding, ECHO generates an interactive **Prediction Challenge**: 'What will the value of `total` be at the next step?' The student selects 80, clicks Submit, and receives instant feedback validated directly against the recorded execution trace."

---

### Act 4: Evidence-Grounded Gemini AI & Sandbox Fix Verification (1:45 – 2:20)

**[VISUAL]**  
*Narrator clicks the 'AI Investigation' tab. The panel displays Gemini's diagnosis. Narrator points to the clickable citation badges `[Step #7]` and `[Line 5]`. Narrator clicks `Verify in Sandbox`.*

**[AUDIO / NARRATOR]**  
> "Next, we consult ECHO's AI Investigator, powered by Google Gemini. But notice: Gemini isn't allowed to hallucinate.
> 
> ECHO enforces a strict server-side citation validator. Every single hypothesis must cite a verified trace step and line number. When we hover over Step 7, the timeline instantly spotlights that exact point in time.
> 
> Even better: look at the suggested fix. Instead of blindly trusting AI code, ECHO provides a **'Verify in Sandbox'** button.
> 
> We click it. A clean, disposable Docker container spins up in the background, executes the proposed code, and verifies that the output matches the expected behavior: `Average: 80.0`. Only after sandbox proof is the student prompted to accept the correction."

---

### Act 5: Dual Execution Comparison & Learning Challenges (2:20 – 2:45)

**[VISUAL]**  
*Narrator switches to the 'Compare Runs' view, showing Run A (Buggy) vs Run B (Corrected) side-by-side with diverging trajectories (`0 → 60 → 80 → 100` vs `0 → 60 → 140 → 240`). Then clicks into 'Learning Challenges'.*

**[AUDIO / NARRATOR]**  
> "Now, look at our Before-and-After Comparison view. Students can see both runs side-by-side. The state divergence is crystal clear: in Run B, `total` accumulates to 240, yielding 80.0.
> 
> Finally, ECHO tests their conceptual mastery with three tiers of targeted learning challenges: trace predictions, concept checks, and coding exercises.
> 
> ECHO transforms debugging from frustrating guesswork into an empowering, evidence-based science.
> 
> **Don't just fix the mistake. Understand the moment it was made.**
> 
> Thank you."

---

## Production Recording Tips for Presenter

1. **Browser Resolution:** Set desktop browser to 1920x1080 (100% zoom).
2. **Preset Execution:** Start with "Acceptance Case: Accumulator Loop" preset.
3. **Cursor Visibility:** Use a high-contrast mouse pointer for clear visual tracking.
4. **Clean Audio:** Use an external microphone; keep background noise to zero.
5. **Pacing:** Allow 1 second of silence after clicking "Run Code" and "Verify in Sandbox" so the viewer can see the live response.
