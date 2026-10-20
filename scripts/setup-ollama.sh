#!/usr/bin/env bash
set -Eeuo pipefail

MODEL="${SATARK_OLLAMA_MODEL:-qwen2.5:3b}"
OLLAMA_URL="https://ollama.com"

say() { printf '\n[SATARK Ollama setup] %s\n' "$*"; }
fail() { say "ERROR: $*"; exit 1; }

command -v curl >/dev/null 2>&1 || fail "curl is required."
command -v ollama >/dev/null 2>&1 || {
  say "Ollama is not installed. This script can install it from the official Ollama distribution."
  printf 'Continue with installation? [y/N] '
  read -r answer
  case "$answer" in y|Y|yes|YES) ;; *) say "Cancelled. SATARK deterministic analysis still works without Ollama."; exit 0 ;; esac

  case "$(uname -s)" in
    Linux)
      installer="$(mktemp)"
      trap 'rm -f "$installer"' EXIT
      curl --fail --silent --show-error --location "$OLLAMA_URL/install.sh" --output "$installer" || fail "Could not download the official installer."
      say "Downloaded the official installer. Review its source at https://github.com/ollama/ollama/blob/main/scripts/install.sh"
      bash "$installer" || fail "Ollama installation failed. Follow https://ollama.com/download/linux"
      ;;
    Darwin)
      if command -v brew >/dev/null 2>&1; then
        brew install --cask ollama || fail "Homebrew installation failed. See https://ollama.com/download/mac"
      else
        say "Homebrew is not installed. Install Ollama from https://ollama.com/download/mac, then rerun this script."
        exit 2
      fi
      ;;
    *)
      fail "Unsupported OS. Install Ollama from https://ollama.com/download and rerun this script."
      ;;
  esac
}

command -v ollama >/dev/null 2>&1 || fail "The ollama command is still unavailable; restart your terminal after installation."
if ! curl --fail --silent --show-error --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  say "Starting the local Ollama service..."
  (ollama serve >/tmp/satark-ollama-serve.log 2>&1 &)
  for attempt in $(seq 1 20); do
    if curl --fail --silent --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi
curl --fail --silent --show-error --max-time 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1 || fail "Ollama is installed but its local service did not become ready. Start Ollama manually and rerun."
say "Downloading model $MODEL (this may require several GB of disk space and an internet connection)..."
ollama pull "$MODEL" || fail "Model download failed. Check disk space/network and rerun: ollama pull $MODEL"
say "Ready. For the Next.js app, set SATARK_OLLAMA_BASE_URL=http://127.0.0.1:11434 and SATARK_OLLAMA_MODEL=$MODEL."
say "For Streamlit, configure OLLAMA_BASE_URL and the model setting described in ai_provider.py."
say "If Ollama is unavailable, SATARK's deterministic fallback still works. Hosted Vercel cannot access Ollama on your personal computer."
