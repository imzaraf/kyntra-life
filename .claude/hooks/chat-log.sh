#!/bin/bash
# Stop hook: asks Claude to save a short summary of the chat to docs/chat-log/.
# Skips if Claude is already continuing because of this hook, or if this chat's
# log file was updated in the last 10 minutes.
input=$(cat)
[ "$(echo "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

sid=$(echo "$input" | jq -r '.session_id // empty')
[ -z "$sid" ] && exit 0
sid8=${sid:0:8}

dir="${CLAUDE_PROJECT_DIR:-.}/docs/chat-log"
mkdir -p "$dir"
existing=$(ls "$dir"/*"$sid8"*.md 2>/dev/null | head -1)

if [ -n "$existing" ] && [ -n "$(find "$existing" -mmin -10 2>/dev/null)" ]; then
  exit 0
fi

if [ -n "$existing" ]; then
  target="Update the existing file $existing"
else
  target="Create docs/chat-log/$(date +%Y-%m-%d)_${sid8}_<short-topic-slug>.md and add a line for it to docs/chat-log/INDEX.md"
fi

jq -n --arg t "$target" '{
  decision: "block",
  reason: ($t + ". Keep it a short summary, not a transcript: goal, decisions and why, files created/changed, what is left, gotchas. Also keep the INDEX.md line (date, title, status) current. Then stop without further commentary.")
}'
