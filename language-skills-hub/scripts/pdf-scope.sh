#!/usr/bin/env bash
# Read git diff --name-only paths from stdin, one path per line.
# Print exactly true/false. Errors must fail the always-on pdf-scope check.
# Use literal shell patterns, not regex escapes in a YAML block scalar.
set -euo pipefail

relevant=false
while IFS= read -r file || [[ -n "$file" ]]; do
  case "$file" in
    language-skills-hub/cteni/asteroids/index.html) relevant=true ;;
    language-skills-hub/data/cards.json) relevant=true ;;
    language-skills-hub/assets/school-logo.png) relevant=true ;;
    language-skills-hub/assets/hub.js) relevant=true ;;
    language-skills-hub/assets/hub.css) relevant=true ;;
    language-skills-hub/index.html) relevant=true ;;
    language-skills-hub/self-check/reading/reading-core.js) relevant=true ;;
    language-skills-hub/self-check/reading/reading-annotations.*) relevant=true ;;
    language-skills-hub/self-check/reading/reading-practice-annotations.js) relevant=true ;;
    language-skills-hub/self-check/reading/reading.js) relevant=true ;;
    language-skills-hub/self-check/reading/index.html) relevant=true ;;
    language-skills-hub/self-check/reading/print-*) relevant=true ;;
    language-skills-hub/printouts/rl-asteroids/*) relevant=true ;;
    language-skills-hub/scripts/build-reading-print-pdfs.cjs) relevant=true ;;
    language-skills-hub/scripts/verify-reading-print-assets.cjs) relevant=true ;;
    language-skills-hub/scripts/pdf-content-sha256.cjs) relevant=true ;;
    language-skills-hub/scripts/pdf-scope.sh) relevant=true ;;
    language-skills-hub/tests/rl-pdf-*) relevant=true ;;
    .github/workflows/lsh-reading-pdf-release-gate.yml) relevant=true ;;
    .github/workflows/lsh-reading-print-assets.yml) relevant=true ;;
  esac
  if [[ "$relevant" == "true" ]]; then
    break
  fi
done

printf '%s\n' "$relevant"
