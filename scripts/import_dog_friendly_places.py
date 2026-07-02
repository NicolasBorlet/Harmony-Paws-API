#!/usr/bin/env python3
"""
Transform dog_friendly_france.json (OSM export) into dog_friendly_places table rows.

Usage:
  python scripts/import_dog_friendly_places.py
  python scripts/import_dog_friendly_places.py --format sql -o api/prisma/data/dog_friendly_places.sql
  python scripts/import_dog_friendly_places.py --format csv -o api/prisma/data/dog_friendly_places.csv
  python scripts/import_dog_friendly_places.py --format jsonl -o api/prisma/data/dog_friendly_places.jsonl
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
GEOHASH_PRECISION = 6

VALID_DOG_POLICIES = frozenset({"yes", "leashed", "unleashed", "designated"})

COLUMNS = [
    "id",
    "osm_type",
    "osm_id",
    "latitude",
    "longitude",
    "geohash",
    "category",
    "name",
    "dog_policy",
    "wheelchair",
    "access",
    "city",
    "postcode",
    "street",
    "phone",
    "email",
    "website",
    "opening_hours",
    "description",
    "tags",
    "source",
    "survey_date",
]


def encode_geohash(latitude: float, longitude: float, precision: int = GEOHASH_PRECISION) -> str:
    is_even = True
    bit = 0
    ch = 0
    geohash = ""

    lat_min, lat_max = -90.0, 90.0
    lon_min, lon_max = -180.0, 180.0

    while len(geohash) < precision:
        if is_even:
            mid = (lon_min + lon_max) / 2
            if longitude >= mid:
                ch = (ch << 1) + 1
                lon_min = mid
            else:
                ch = (ch << 1) + 0
                lon_max = mid
        else:
            mid = (lat_min + lat_max) / 2
            if latitude >= mid:
                ch = (ch << 1) + 1
                lat_min = mid
            else:
                ch = (ch << 1) + 0
                lat_max = mid

        is_even = not is_even
        bit += 1
        if bit == 5:
            geohash += BASE32[ch]
            bit = 0
            ch = 0

    return geohash


def resolve_category(tags: dict[str, str]) -> str:
    leisure = tags.get("leisure", "")
    amenity = tags.get("amenity", "")
    natural = tags.get("natural", "")
    tourism = tags.get("tourism", "")

    if leisure == "dog_park":
        return "dog_park"
    if leisure == "dog_agility":
        return "dog_agility"
    if natural == "beach":
        return "beach"
    if amenity == "drinking_water":
        return "drinking_water"
    if leisure == "nature_reserve":
        return "nature_reserve"
    if leisure in {"animal_training", "dressage_de_chien"} or "dog_training" in leisure:
        return "animal_training"
    if amenity == "animal_shelter":
        return "animal_shelter"
    if tourism == "guest_house":
        return "guest_house"
    return "other"


def normalize_dog_policy(value: str | None) -> str | None:
    if not value:
        return None
    base = value.split(";")[0].strip()
    return base if base in VALID_DOG_POLICIES else None


def parse_survey_date(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return datetime.strptime(value[:10], "%Y-%m-%d").date().isoformat()
    except ValueError:
        return None


def extract_coordinates(entry: dict[str, Any]) -> tuple[float, float]:
    if entry["type"] == "node":
        return float(entry["lat"]), float(entry["lon"])

    center = entry.get("center")
    if center and "lat" in center and "lon" in center:
        return float(center["lat"]), float(center["lon"])

    raise ValueError(f"Missing coordinates for {entry['type']} {entry['id']}")


def transform_entry(entry: dict[str, Any]) -> dict[str, Any]:
    tags: dict[str, str] = entry.get("tags", {})
    latitude, longitude = extract_coordinates(entry)

    return {
        "id": str(uuid.uuid4()),
        "osm_type": entry["type"],
        "osm_id": int(entry["id"]),
        "latitude": latitude,
        "longitude": longitude,
        "geohash": encode_geohash(latitude, longitude),
        "category": resolve_category(tags),
        "name": tags.get("name"),
        "dog_policy": normalize_dog_policy(tags.get("dog")),
        "wheelchair": tags.get("wheelchair"),
        "access": tags.get("access"),
        "city": tags.get("addr:city"),
        "postcode": tags.get("addr:postcode"),
        "street": tags.get("addr:street"),
        "phone": tags.get("phone"),
        "email": tags.get("email"),
        "website": tags.get("website"),
        "opening_hours": tags.get("opening_hours"),
        "description": tags.get("description"),
        "tags": tags,
        "source": tags.get("source"),
        "survey_date": parse_survey_date(tags.get("survey:date")),
    }


def load_rows(input_path: Path) -> list[dict[str, Any]]:
    with input_path.open(encoding="utf-8") as handle:
        data = json.load(handle)

    rows: list[dict[str, Any]] = []
    errors: list[str] = []

    for entry in data:
        try:
            rows.append(transform_entry(entry))
        except (KeyError, TypeError, ValueError) as exc:
            errors.append(f"osm:{entry.get('type')}:{entry.get('id')} -> {exc}")

    if errors:
        print(f"Skipped {len(errors)} entries:", file=sys.stderr)
        for message in errors[:10]:
            print(f"  - {message}", file=sys.stderr)
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more", file=sys.stderr)

    return rows


def sql_literal(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, dict):
        return f"'{json.dumps(value, ensure_ascii=False).replace(chr(39), chr(39) * 2)}'::jsonb"
    text = str(value).replace("'", "''")
    return f"'{text}'"


def render_sql(rows: list[dict[str, Any]]) -> str:
    lines = [
        "-- Generated by scripts/import_dog_friendly_places.py",
        "BEGIN;",
        "",
    ]

    for row in rows:
        values = ", ".join(sql_literal(row[column]) for column in COLUMNS)
        columns = ", ".join(f'"{column}"' for column in COLUMNS)
        update_columns = [
            column
            for column in COLUMNS
            if column not in {"id", "osm_type", "osm_id", "created_at"}
        ]
        update_clause = ", ".join(
            f'"{column}" = EXCLUDED."{column}"' for column in update_columns
        )
        lines.append(
            f'INSERT INTO "dog_friendly_places" ({columns}, "created_at", "updated_at") '
            f"VALUES ({values}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
            f'ON CONFLICT ("osm_type", "osm_id") DO UPDATE SET {update_clause}, '
            f'"updated_at" = CURRENT_TIMESTAMP;'
        )

    lines.extend(["", "COMMIT;", ""])
    return "\n".join(lines)


def render_csv(rows: list[dict[str, Any]]) -> str:
    import io

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=COLUMNS, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        serialized = dict(row)
        serialized["tags"] = json.dumps(serialized["tags"], ensure_ascii=False)
        writer.writerow(serialized)
    return buffer.getvalue()


def render_jsonl(rows: list[dict[str, Any]]) -> str:
    return "\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + "\n"


def print_summary(rows: list[dict[str, Any]]) -> None:
    from collections import Counter

    categories = Counter(row["category"] for row in rows)
    print(f"Transformed {len(rows)} rows.", file=sys.stderr)
    for category, count in categories.most_common():
        print(f"  {category}: {count}", file=sys.stderr)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        default=repo_root / "dog_friendly_france.json",
        help="Path to the OSM JSON export",
    )
    parser.add_argument(
        "--format",
        choices=("sql", "csv", "jsonl"),
        default="sql",
        help="Output format (default: sql)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Write output to this file instead of stdout",
    )
    args = parser.parse_args()

    rows = load_rows(args.input)
    print_summary(rows)

    if args.format == "sql":
        content = render_sql(rows)
    elif args.format == "csv":
        content = render_csv(rows)
    else:
        content = render_jsonl(rows)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(content, encoding="utf-8")
        print(f"Wrote {args.output}", file=sys.stderr)
    else:
        sys.stdout.write(content)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
