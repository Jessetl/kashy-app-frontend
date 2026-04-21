#!/usr/bin/env bash
# Lint para violaciones de Clean Architecture.
#
# Usage:
#   validate-architecture.sh [--project-root PATH] [--quiet] [--no-r3] [--no-r5]
#
# Exit code: 0 = limpio, 1 = violaciones encontradas, 2 = args inválidos
#
# Reglas:
#   R1  domain/ no importa React, Zod, MMKV, Zustand, TanStack Query, expo-*, navegación
#   R1  domain/ no importa de ../application, ../infrastructure, ../presentation
#   R2  application/ no importa React/RN, MMKV, Zustand, TanStack Query (zod sí)
#   R2  application/ no importa de ../infrastructure ni ../presentation
#   R3  app/ (excepto _layout.tsx) ≤ 5 líneas de código reales
#   R4  modules/<A> no importa de @/modules/<B> (B ≠ A) — usa shared/ o expón un hook
#   R5  fetch() directo solo en shared/infrastructure/api/ y tests

set -euo pipefail

PROJECT_ROOT="$PWD"
QUIET=0
RUN_R3=1
RUN_R5=1

while [ $# -gt 0 ]; do
  case "$1" in
    --project-root) PROJECT_ROOT="${2:-}"; shift 2 ;;
    --quiet|-q) QUIET=1; shift ;;
    --no-r3) RUN_R3=0; shift ;;
    --no-r5) RUN_R5=0; shift ;;
    -h|--help) sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "error: unknown flag '$1'" >&2; exit 2 ;;
  esac
done

cd "$PROJECT_ROOT"

violations=0

fail() {
  # $1=rule, $2=file, $3=line, $4=message
  echo "  [$1] $2:$3"
  echo "        $4"
  violations=$((violations + 1))
}

section() {
  [ "$QUIET" -eq 1 ] && return 0
  echo
  echo "== $1 =="
}

# --- helpers --------------------------------------------------------------

# collect_dirs <pattern>... — echoes only existing dirs
collect_dirs() {
  for d in "$@"; do
    [ -d "$d" ] && echo "$d"
  done
}

# scan_imports <rule> <paths...> <--> <pattern> <message>
#   runs grep -rHnE on paths; each match becomes a fail() call
scan_imports() {
  local rule="$1"; shift
  local paths=()
  while [ $# -gt 0 ] && [ "$1" != "--" ]; do paths+=("$1"); shift; done
  shift  # drop --
  local pattern="$1"; shift
  local msg="$1"

  [ ${#paths[@]} -gt 0 ] || return 0

  while IFS= read -r result; do
    [ -n "$result" ] || continue
    local file="${result%%:*}"
    local rest="${result#*:}"
    local line="${rest%%:*}"
    fail "$rule" "$file" "$line" "$msg"
  done < <(grep -rHnE "$pattern" "${paths[@]}" 2>/dev/null || true)
}

# import pattern matches: `from 'X'`, `from "X"`, and bare `import 'X'`
import_from() {
  # usage: import_from <package-regex>
  # returns a regex that matches an import of that package/path
  echo "(from|^[[:space:]]*import)[[:space:]]+['\"]${1}['\"]"
}

# import path pattern for relative/absolute paths (no closing quote required)
import_path() {
  echo "from[[:space:]]+['\"]${1}"
}

# --- R1: domain purity ----------------------------------------------------

section "R1 — domain/ debe ser puro TypeScript"

r1_dirs=()
while IFS= read -r d; do r1_dirs+=("$d"); done < <(collect_dirs modules/*/domain shared/domain)

if [ ${#r1_dirs[@]} -gt 0 ]; then
  for pkg in react react-native zod react-native-mmkv zustand '@tanstack/react-query' 'expo-[a-z-]+' '@react-navigation/'; do
    scan_imports R1 "${r1_dirs[@]}" -- "$(import_from "$pkg")" "domain importa '$pkg' — debe ser TypeScript puro"
  done
  scan_imports R1 "${r1_dirs[@]}" -- "$(import_path "\\.\\./(application|infrastructure|presentation)")" \
    "domain cruza capas — solo debe importar dentro de domain/"
fi

# --- R2: application purity -----------------------------------------------

section "R2 — application/ no conoce infrastructure ni presentation"

r2_dirs=()
while IFS= read -r d; do r2_dirs+=("$d"); done < <(collect_dirs modules/*/application shared/application)

if [ ${#r2_dirs[@]} -gt 0 ]; then
  for pkg in react react-native react-native-mmkv zustand '@tanstack/react-query' 'expo-[a-z-]+' '@react-navigation/'; do
    scan_imports R2 "${r2_dirs[@]}" -- "$(import_from "$pkg")" "application importa '$pkg' — debe vivir en presentation/infrastructure"
  done
  scan_imports R2 "${r2_dirs[@]}" -- "$(import_path "\\.\\./(infrastructure|presentation)")" \
    "application importa de infrastructure/presentation — invierte la dependencia con un port"
fi

# --- R3: app/ thin wrappers -----------------------------------------------

if [ "$RUN_R3" -eq 1 ] && [ -d app ]; then
  section "R3 — app/ solo debe contener thin wrappers y layouts"
  while IFS= read -r file; do
    # Cuenta líneas de código reales (no vacías, no comentarios de una línea)
    loc=$(grep -cE '^[[:space:]]*[^[:space:]/*]' "$file" 2>/dev/null || echo 0)
    if [ "$loc" -gt 5 ]; then
      fail R3 "$file" 1 "thin wrapper con $loc líneas de código; mueve la lógica a modules/ o shared/"
    fi
  done < <(find app -type f -name '*.tsx' -not -name '_layout.tsx' 2>/dev/null)
fi

# --- R4: cross-module imports ---------------------------------------------

section "R4 — módulos no deben importar internals de otros módulos"

if [ -d modules ]; then
  for module_dir in modules/*/; do
    [ -d "$module_dir" ] || continue
    module_name="$(basename "$module_dir")"
    while IFS= read -r result; do
      [ -n "$result" ] || continue
      file="${result%%:*}"
      rest="${result#*:}"
      line="${rest%%:*}"
      content="${rest#*:}"
      # extrae <imported>/<layer> de "from '@/modules/<imported>/<layer>/..."
      imported=$(printf '%s\n' "$content" | sed -nE "s#.*@/modules/([^/\"']+).*#\1#p" | head -1)
      layer=$(printf '%s\n' "$content" | sed -nE "s#.*@/modules/[^/]+/([^/\"']+).*#\1#p" | head -1)
      if [ -n "$imported" ] && [ "$imported" != "$module_name" ]; then
        case "$layer" in
          domain|application|infrastructure)
            fail R4 "$file" "$line" "importa '@/modules/$imported/$layer' — internals profundos, mueve a shared/ o expón como port en domain" ;;
          *)
            fail R4 "$file" "$line" "importa '@/modules/$imported/$layer' — si lo usan 2+ módulos mueve a shared/" ;;
        esac
      fi
    done < <(grep -rHnE "from[[:space:]]+['\"]@/modules/" "$module_dir" 2>/dev/null || true)
  done
fi

# --- R5: direct fetch() calls ---------------------------------------------

if [ "$RUN_R5" -eq 1 ]; then
  section "R5 — fetch() directo solo en shared/infrastructure/api/"
  scan_paths=()
  [ -d modules ] && scan_paths+=(modules)
  [ -d shared ] && scan_paths+=(shared)
  [ -d app ] && scan_paths+=(app)

  if [ ${#scan_paths[@]} -gt 0 ]; then
    while IFS= read -r result; do
      [ -n "$result" ] || continue
      file="${result%%:*}"
      rest="${result#*:}"
      line="${rest%%:*}"
      case "$file" in
        shared/infrastructure/api/*) continue ;;
        *.test.*|*.spec.*|*/__tests__/*) continue ;;
      esac
      fail R5 "$file" "$line" "fetch() directo — usa apiClient de shared/infrastructure/api/"
    done < <(grep -rHnE '(^|[^a-zA-Z_.$])fetch[[:space:]]*\(' "${scan_paths[@]}" 2>/dev/null || true)
  fi
fi

# --- summary --------------------------------------------------------------

echo
if [ "$violations" -eq 0 ]; then
  echo "OK — no violations found"
  exit 0
fi
echo "FAIL — $violations violation(s) found"
exit 1
