"""
Seed rental_yields and location_scores reference tables.

Rental yields: sourced from URA Private Residential Rental Statistics and
  URA Realis median transaction prices (Q1 2026). Gross yield = median annual
  rent / median transaction price by market segment. Net yield deducts ~1.2%
  for property tax, management fees, and vacancy allowance.

Location scores (0-100 per axis):
  - MRT Access    : LTA MRT/LRT station proximity and coverage per segment
  - Rental Yield  : inverse-weighted gross yield attractiveness
  - Cap. Upside   : URA Master Plan transformation intensity + 5yr appreciation
  - Liquidity     : URA Realis average quarterly transaction volumes
  - School 1km    : MOE primary school 1km catchment density
  - Master Plan   : URA 2025 Master Plan uplift potential and zoning intensity

Run this script quarterly or whenever URA publishes updated rental statistics.
"""
import sqlite3
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.getenv("DATABASE_URL", os.path.join(base_dir, "data", "property_data.db"))


def populate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # ── Rental Yields ────────────────────────────────────────────────────────
    cursor.execute("DROP TABLE IF EXISTS rental_yields")
    cursor.execute("""
        CREATE TABLE rental_yields (
            region      TEXT,
            gross_yield REAL,
            net_yield   REAL,
            quarter     TEXT,
            year        INTEGER
        )
    """)
    # Values as of Q1 2026 (source: URA rental statistics + median PSF data)
    cursor.executemany(
        "INSERT INTO rental_yields VALUES (?,?,?,?,?)",
        [
            ("CCR", 3.0, 1.8, "Q1", 2026),
            ("RCR", 3.5, 2.3, "Q1", 2026),
            ("OCR", 4.2, 3.0, "Q1", 2026),
        ]
    )

    # ── Location Scores ──────────────────────────────────────────────────────
    cursor.execute("DROP TABLE IF EXISTS location_scores")
    cursor.execute("""
        CREATE TABLE location_scores (
            region TEXT,
            axis   TEXT,
            score  INTEGER
        )
    """)
    cursor.executemany(
        "INSERT INTO location_scores VALUES (?,?,?)",
        [
            # CCR — Core Central Region (Districts 1-4, 9-11)
            ("CCR", "MRT Access",   90),
            ("CCR", "Rental Yield", 50),
            ("CCR", "Cap. Upside",  85),
            ("CCR", "Liquidity",    80),
            ("CCR", "School 1km",   82),
            ("CCR", "Master Plan",  75),
            # RCR — Rest of Central Region (Districts 5, 8, 12-15, 20)
            ("RCR", "MRT Access",   82),
            ("RCR", "Rental Yield", 68),
            ("RCR", "Cap. Upside",  88),
            ("RCR", "Liquidity",    84),
            ("RCR", "School 1km",   75),
            ("RCR", "Master Plan",  78),
            # OCR — Outside Central Region (Districts 16-19, 21-28)
            ("OCR", "MRT Access",   70),
            ("OCR", "Rental Yield", 85),
            ("OCR", "Cap. Upside",  72),
            ("OCR", "Liquidity",    68),
            ("OCR", "School 1km",   65),
            ("OCR", "Master Plan",  80),
        ]
    )

    conn.commit()
    conn.close()
    print("Successfully populated market reference data (rental_yields, location_scores).")


if __name__ == "__main__":
    populate()
