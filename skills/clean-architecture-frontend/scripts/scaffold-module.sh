#!/usr/bin/env bash
# Scaffold a Clean Architecture module under modules/<name>/
#
# Usage:
#   scaffold-module.sh <name> [--complexity simple|medium|complex]
#                             [--action <verb>]         # e.g. "login", "create", defaults to "get"
#                             [--route <path>]          # e.g. "(tabs)/debts" creates app/<path>.tsx
#                             [--project-root <path>]   # defaults to $PWD
#                             [--dry-run]               # print plan without writing
#                             [--force]                 # overwrite existing files
#
# Complexity levels:
#   simple   → entity, port, datasource, hook-query, screen
#   medium   → + use-case, dto, hook-mutation     (default)
#   complex  → + errors, mapper, store
#
# The script looks up templates at <skill-root>/assets/templates/ relative to its own location.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$(cd "$SCRIPT_DIR/../assets/templates" && pwd)"

NAME=""
COMPLEXITY="medium"
ACTION="get"
ROUTE=""
PROJECT_ROOT="$PWD"
DRY_RUN=0
FORCE=0

die() { echo "error: $*" >&2; exit 1; }

usage() {
  sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

# --- parse args -----------------------------------------------------------

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help) usage 0 ;;
    --complexity) COMPLEXITY="${2:-}"; shift 2 ;;
    --action) ACTION="${2:-}"; shift 2 ;;
    --route) ROUTE="${2:-}"; shift 2 ;;
    --project-root) PROJECT_ROOT="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    --force) FORCE=1; shift ;;
    -*) die "unknown flag: $1" ;;
    *) if [ -z "$NAME" ]; then NAME="$1"; shift; else die "unexpected argument: $1"; fi ;;
  esac
done

[ -n "$NAME" ] || { echo "error: module name is required"; usage 1; }

case "$COMPLEXITY" in
  simple|medium|complex) ;;
  *) die "complexity must be simple|medium|complex (got: $COMPLEXITY)" ;;
esac

# --- naming helpers -------------------------------------------------------

to_pascal() {
  # kebab-case → PascalCase  (auth → Auth, shopping-list → ShoppingList)
  echo "$1" | awk -F- '{ for (i=1;i<=NF;i++) printf "%s%s", toupper(substr($i,1,1)), substr($i,2) }'
}

to_upper_snake() {
  # kebab-case → UPPER_SNAKE  (auth → AUTH, shopping-list → SHOPPING_LIST)
  echo "$1" | tr '[:lower:]-' '[:upper:]_'
}

MODULE="$NAME"
MODULE_PASCAL="$(to_pascal "$NAME")"
MODULE_UPPER="$(to_upper_snake "$NAME")"
ACTION_KEBAB="$ACTION"
ACTION_PASCAL="$(to_pascal "$ACTION")"

MODULE_DIR="$PROJECT_ROOT/modules/$MODULE"

# --- render helper --------------------------------------------------------

render() {
  # $1 = template filename, $2 = destination path
  local tpl="$TEMPLATES_DIR/$1"
  local dest="$2"
  [ -f "$tpl" ] || die "template missing: $tpl"

  if [ -e "$dest" ] && [ "$FORCE" -ne 1 ]; then
    echo "  skip   $dest (exists, use --force to overwrite)"
    return 0
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  write  $dest"
    return 0
  fi

  mkdir -p "$(dirname "$dest")"
  sed \
    -e "s/__MODULE_PASCAL__/$MODULE_PASCAL/g" \
    -e "s/__MODULE_UPPER__/$MODULE_UPPER/g" \
    -e "s/__MODULE__/$MODULE/g" \
    -e "s/__ACTION_PASCAL__/$ACTION_PASCAL/g" \
    -e "s/__ACTION__/$ACTION_KEBAB/g" \
    "$tpl" > "$dest"
  echo "  write  $dest"
}

mkdirp() {
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "  mkdir  $1"
  else
    mkdir -p "$1"
    echo "  mkdir  $1"
  fi
}

# --- plan -----------------------------------------------------------------

echo "module         $MODULE ($MODULE_PASCAL)"
echo "complexity     $COMPLEXITY"
[ "$ACTION_KEBAB" != "get" ] && echo "action         $ACTION_KEBAB ($ACTION_PASCAL)"
[ -n "$ROUTE" ] && echo "route          app/$ROUTE.tsx"
echo "target         $MODULE_DIR"
[ "$DRY_RUN" -eq 1 ] && echo "mode           DRY RUN"
echo

# --- create skeleton ------------------------------------------------------

mkdirp "$MODULE_DIR/domain"
mkdirp "$MODULE_DIR/application"
mkdirp "$MODULE_DIR/infrastructure"
mkdirp "$MODULE_DIR/presentation/components"
mkdirp "$MODULE_DIR/presentation/hooks"
mkdirp "$MODULE_DIR/presentation/screens"

# --- simple tier (always rendered) ----------------------------------------

render entity.template.ts          "$MODULE_DIR/domain/$MODULE.entity.ts"
render port.template.ts            "$MODULE_DIR/domain/$MODULE.port.ts"
render datasource.template.ts      "$MODULE_DIR/infrastructure/$MODULE.datasource.ts"
render hook-query.template.ts      "$MODULE_DIR/presentation/hooks/use-$MODULE.ts"
render screen.template.tsx         "$MODULE_DIR/presentation/screens/$MODULE.screen.tsx"

# --- medium tier ----------------------------------------------------------

if [ "$COMPLEXITY" = "medium" ] || [ "$COMPLEXITY" = "complex" ]; then
  render use-case.template.ts      "$MODULE_DIR/application/$ACTION_KEBAB.use-case.ts"
  render dto.template.ts           "$MODULE_DIR/application/dtos/$ACTION_KEBAB-request.dto.ts"
  render hook-mutation.template.ts "$MODULE_DIR/presentation/hooks/use-$ACTION_KEBAB.ts"
fi

# --- complex tier ---------------------------------------------------------

if [ "$COMPLEXITY" = "complex" ]; then
  render errors.template.ts        "$MODULE_DIR/domain/$MODULE.errors.ts"
  render mapper.template.ts        "$MODULE_DIR/application/mappers/$MODULE.mapper.ts"
  render store.template.ts         "$MODULE_DIR/infrastructure/store/$MODULE.store.ts"
fi

# --- app/ thin wrapper ----------------------------------------------------

if [ -n "$ROUTE" ]; then
  render app-route.template.tsx    "$PROJECT_ROOT/app/$ROUTE.tsx"
fi

echo
echo "done. next steps:"
echo "  1. rellena entity, port y datasource con los campos reales"
echo "  2. conecta el hook con tu screen"
[ -n "$ROUTE" ] || echo "  3. crea el thin wrapper en app/ o pasa --route la próxima vez"
