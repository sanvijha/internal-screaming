import { useState, useRef } from "react";
import Robot from "./Robot";

const cleanText = (text) =>
  (text || "")
    .replace(/undefined/gi, "")
    .replace(/\s+/g, " ")
    .trim();

export default function Debate() {
  const [question, setQuestion] = useState("");
  const [words, setWords] = useState([]);        // array of { word, id }
  const [speaker, setSpeaker] = useState(null);  // "mind" | "heart" | "final" | null
  const [round, setRound] = useState("");        // display label
  const [isFinal, setIsFinal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const wordIdRef = useRef(0);

  // ── speak + word-by-word subtitles ──────────────────────────────────────
  const speakWithSubtitles = (text, voiceIndex, who, roundLabel) => {
    return new Promise((resolve) => {
      const clean = cleanText(text);
      if (!clean) return resolve();

      speechSynthesis.cancel();
      setSpeaker(who);
      setRound(roundLabel || "");
      setWords([]);

      const voices = speechSynthesis.getVoices();
      const u = new SpeechSynthesisUtterance(clean);
      if (voices[voiceIndex]) u.voice = voices[voiceIndex];
      u.rate = 0.93;
      u.pitch = voiceIndex === 1 ? 1.1 : 0.95;

      // Word-by-word: estimate timing from character position
      const wordList = clean.split(/\s+/).filter(Boolean);
      const totalChars = clean.length;
      // Average speech rate ~140 wpm at rate 0.88 → ~155ms per word average
      // We'll use character proportion for better accuracy
      let charCount = 0;
      const wordTimings = wordList.map((w) => {
        const start = (charCount / totalChars);
        charCount += w.length + 1;
        return start;
      });

      u.onstart = () => {
        // We don't know exact duration upfront, so we schedule
        // by firing words when speech starts, using estimated WPM
        const estimatedDuration = (wordList.length / 3.2) * 1000; // ~138 wpm at rate 0.88
        wordTimings.forEach((frac, i) => {
          setTimeout(() => {
            setWords((prev) => [
              ...prev,
              { word: wordList[i], id: wordIdRef.current++ },
            ]);
          }, frac * estimatedDuration);
        });
      };

      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  };

  // ── main debate flow ─────────────────────────────────────────────────────
  const startDebate = async () => {
    if (!question.trim() || isRunning) return;
    setIsRunning(true);
    setIsFinal(false);
    setSpeaker(null);
    setWords([]);
    setRound("");

    try {
      const res = await fetch("http://localhost:5001/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const result = await res.json();

      await speakWithSubtitles(result.round1.mind,  0, "mind",  "Round 1");
      await speakWithSubtitles(result.round1.heart, 1, "heart", "Round 1");
      await speakWithSubtitles(result.round2.mind,  0, "mind",  "Round 2");
      await speakWithSubtitles(result.round2.heart, 1, "heart", "Round 2");

      // transition to final
      setSpeaker(null);
      setWords([]);
      await new Promise((r) => setTimeout(r, 600));
      setIsFinal(true);

      await speakWithSubtitles(result.final, 2, "final", "Final Verdict");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") startDebate();
  };

  // ── derived ──────────────────────────────────────────────────────────────
  const mindActive  = speaker === "mind";
  const heartActive = speaker === "heart";
  const finalActive = speaker === "final";

  return (
    <div className="screen">
      {/* TOP */}
      <div className="top">
        <p className="app-title">Internal Screaming</p>
        <div className="input-row">
          <input
            placeholder="What's on your mind?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKey}
            disabled={isRunning}
          />
          <button onClick={startDebate} disabled={isRunning || !question.trim()}>
            {isRunning ? "Debating…" : "Debate"}
          </button>
        </div>
        {!isFinal && (
  <div className={`round-label ${round ? "active" : ""}`}>
    {round}
  </div>
)}
      </div>

      {/* FINAL VERDICT HEADING */}
      <div className={`final-heading ${isFinal ? "visible" : ""}`}>
        <h2 className="final-heading-title">Final Verdict</h2>
      </div>

      {/* ROBOTS */}
      <div className={`robot-container ${isFinal ? "final-mode" : ""}`}>
        {/* MIND */}
<div className={`robot-slot ${isFinal ? "hidden" : ""}`}>
  <Robot active={mindActive} label="Mind" type="mind" />
</div>

{/* HEART */}
<div className={`robot-slot ${isFinal ? "hidden" : ""}`}>
  <Robot active={heartActive} label="Heart" type="heart" />
</div>

{/* FINAL */}
{isFinal && (
  <div className="robot-slot final-center">
    <Robot active={finalActive} label="Verdict" type="final" />
  </div>
)}
      </div>

      {/* SUBTITLES */}
      {words.length > 0 && (
        <div className="subtitle-wrap">
          <div className="subtitle">
            {words.map(({ word, id }) => (
              <span
                key={id}
                className="subtitle-word"
                style={{ animationDelay: "0ms" }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {!isRunning && !speaker && (
        <p className="idle-hint">type a question · press debate</p>
      )}
    </div>
  );
}