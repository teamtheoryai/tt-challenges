#!/bin/sh
# Reviewer tooling — used only during the live 60-minute review.
#
# During the review we may hand you a small pack file and ask you to run:
#   make inject-live PACK=<file we send you>
# It applies one fresh change to your running box so we can debug it together.
# There's nothing to do with this before the review, and nothing here to study.
set -e
cd "$(dirname "$0")/.."

PACK="$1"
if [ -z "$PACK" ]; then
  echo "usage: make inject-live PACK=<pack file provided by your reviewer>"
  exit 1
fi
if [ ! -f "$PACK" ]; then
  echo "pack not found: $PACK"
  exit 1
fi

workdir=".tt-live"
rm -rf "$workdir" && mkdir -p "$workdir"
tar xzf "$PACK" -C "$workdir"
if [ ! -f "$workdir/apply.sh" ]; then
  echo "not a valid pack (no apply.sh)"
  exit 1
fi
sh "$workdir/apply.sh"
echo "[inject-live] applied. Back to you."
