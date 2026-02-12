import React, { useEffect, useMemo, useState } from "react";
import "../App.css";

const DEFAULT_SETTINGS = {
  // AI
  answerStyle: "balanced", // concise | balanced | detailed
  temperature: 0.2, // 0 - 1
  topK: 6, // retrieval chunks
  showSources: true,
  autoSummarize: true,

  // Chat
  autoScroll: true,
  showTimestamps: false,

  // UI
  theme: "dark", // dark | light
  compactMode: false,
};

const STORAGE_KEY = "docqa_settings_v1";

export default function SettingsPage({ value, onChange }) {
  const [local, setLocal] = useState(value || DEFAULT_SETTINGS);

  // if parent passes updated settings
  useEffect(() => {
    if (value) setLocal(value);
  }, [value]);

  const savedLabel = useMemo(() => {
    return "Saved in this browser";
  }, []);

  const update = (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    onChange?.(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  };

  const reset = () => {
    update(DEFAULT_SETTINGS);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <div className="settings-title">Settings</div>
          <div className="settings-subtitle">{savedLabel}</div>
        </div>

        <button className="settings-reset-btn" onClick={reset}>
          Reset
        </button>
      </div>

      {/* AI & Answers */}
      <Section title="AI & Answers" desc="Control how the bot answers and how much context it uses.">
        <Row label="Answer style" hint="Concise vs detailed response.">
          <select
            className="settings-select"
            value={local.answerStyle}
            onChange={(e) => update({ answerStyle: e.target.value })}
          >
            <option value="concise">Concise</option>
            <option value="balanced">Balanced</option>
            <option value="detailed">Detailed</option>
          </select>
        </Row>

        <Row label={`Temperature (${local.temperature.toFixed(2)})`} hint="Lower = more factual, higher = more creative.">
          <input
            className="settings-range"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={local.temperature}
            onChange={(e) => update({ temperature: Number(e.target.value) })}
          />
        </Row>

        <Row label={`Top K (chunks): ${local.topK}`} hint="How many document chunks to retrieve for an answer.">
          <input
            className="settings-range"
            type="range"
            min="2"
            max="10"
            step="1"
            value={local.topK}
            onChange={(e) => update({ topK: Number(e.target.value) })}
          />
        </Row>

        <Toggle
          label="Show sources"
          hint="Show citations/sources in answers (if backend provides)."
          checked={local.showSources}
          onChange={(v) => update({ showSources: v })}
        />

        <Toggle
          label="Auto summarize long answers"
          hint="Shortens very long responses automatically."
          checked={local.autoSummarize}
          onChange={(v) => update({ autoSummarize: v })}
        />
      </Section>

      {/* Chat */}
      <Section title="Chat" desc="Chat experience preferences.">
        <Toggle
          label="Auto-scroll to latest message"
          hint="Keeps view pinned to the newest message."
          checked={local.autoScroll}
          onChange={(v) => update({ autoScroll: v })}
        />

        <Toggle
          label="Show timestamps"
          hint="Show time next to messages."
          checked={local.showTimestamps}
          onChange={(v) => update({ showTimestamps: v })}
        />
      </Section>

      {/* Appearance */}
      <Section title="Appearance" desc="UI preferences.">
        <Row label="Theme" hint="App theme (UI only).">
          <select
            className="settings-select"
            value={local.theme}
            onChange={(e) => update({ theme: e.target.value })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </Row>

        <Toggle
          label="Compact mode"
          hint="Tighter spacing for smaller screens."
          checked={local.compactMode}
          onChange={(v) => update({ compactMode: v })}
        />
      </Section>
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="settings-section">
      <div className="settings-section-head">
        <div className="settings-section-title">{title}</div>
        <div className="settings-section-desc">{desc}</div>
      </div>
      <div className="settings-section-body">{children}</div>
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <div className="settings-label">{label}</div>
        {hint && <div className="settings-hint">{hint}</div>}
      </div>
      <div className="settings-row-right">{children}</div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <div className="settings-label">{label}</div>
        {hint && <div className="settings-hint">{hint}</div>}
      </div>
      <div className="settings-row-right">
        <button
          className={`settings-toggle ${checked ? "on" : "off"}`}
          onClick={() => onChange(!checked)}
          type="button"
          aria-pressed={checked}
        >
          <span className="settings-toggle-dot" />
        </button>
      </div>
    </div>
  );
}

// Optional helper you can import in App.js
export function loadSettings() {
  try {
    const raw = localStorage.getItem("docqa_settings_v1");
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
