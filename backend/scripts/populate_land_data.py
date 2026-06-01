import sqlite3
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
db_path = os.getenv("DATABASE_URL", os.path.join(base_dir, "data", "property_data.db"))


def populate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. GLS Land Sales Table
    cursor.execute("DROP TABLE IF EXISTS gls_residential")
    cursor.execute("""
        CREATE TABLE gls_residential (
            year INTEGER,
            region TEXT,
            location TEXT,
            psf_ppr REAL,
            site_area_sqm REAL
        )
    """)

    gls_data = [
        # 2018
        (2018, "CCR", "Middle Road", 1458, 7462),
        (2018, "RCR", "Sims Drive", 1109, 16225),
        (2018, "OCR", "Dairy Farm Road", 830, 19647),
        # 2019
        (2019, "CCR", "Bernam Street", 1463, 3846),
        (2019, "RCR", "Kampong Java Road", 1192, 11643),
        (2019, "OCR", "Pasir Ris Central", 684, 38003),
        # 2020
        (2020, "CCR", "Irwell Bank Road", 1515, 12789),
        (2020, "RCR", "Tanah Merah Kechil Link", 930, 8880),
        (2020, "OCR", "Canberra Drive (Parcel A)", 644, 13315),
        # 2021
        (2021, "CCR", "Central Boulevard", 1673, 10869),
        (2021, "RCR", "Northumberland Road", 1129, 8732),
        (2021, "OCR", "Ang Mo Kio Ave 1", 1118, 12679),
        # 2022
        (2022, "CCR", "Marina View", 1379, 7817),
        (2022, "RCR", "Dunman Road", 1350, 25234),
        (2022, "OCR", "Lentor Central", 1108, 13444),
        # 2023
        (2023, "CCR", "Marina Gardens Lane", 1402, 12345),
        (2023, "RCR", "Pine Grove (Parcel B)", 1223, 25039),
        (2023, "OCR", "Lentor Gardens", 985, 21866),
        # 2024
        (2024, "CCR", "New Park Road", 1550, 10000),
        (2024, "RCR", "Zion Road (Parcel A)", 1202, 15277),
        (2024, "OCR", "Lentor Central (Latest)", 982, 14703),
        # 2025
        (2025, "CCR", "Orchard Boulevard", 1617, 6933),
        (2025, "RCR", "Holland Drive", 1285, 12388),
        (2025, "OCR", "Tampines Ave 11", 885, 50679),
        # 2026 (Projections/Benchmarks)
        (2026, "CCR", "River Valley Road", 1650, 9000),
        (2026, "RCR", "Margaret Drive", 1320, 11000),
        (2026, "OCR", "Senja Close", 950, 15000),
    ]

    cursor.executemany("INSERT INTO gls_residential VALUES (?,?,?,?,?)", gls_data)

    # 2. New Launches Table — full schema with units, sales status, address, launch date
    cursor.execute("DROP TABLE IF EXISTS new_launches")
    cursor.execute("""
        CREATE TABLE new_launches (
            year INTEGER,
            project_name TEXT,
            region TEXT,
            avg_price_psf REAL,
            land_cost_psf_ppr REAL,
            total_units INTEGER,
            units_sold INTEGER,
            address TEXT,
            launch_date TEXT
        )
    """)

    launch_data = [
        # year, project_name, region, avg_price_psf, land_cost_psf_ppr,
        # total_units, units_sold, address, launch_date
        (2026, "Holland Drive Condo",    "RCR", 2700, 1285,  280,   0,  "Holland Drive",          "Q4 2026 (Planned)"),
        (2025, "Zion Residences",        "RCR", 2550, 1202,  517, 310,  "Zion Road",              "Sep 2025"),
        (2025, "Bloomsbury Residences",  "OCR", 1980, 930,   358, 190,  "Media Circle",           "May 2025"),
        (2025, "Elta",                   "OCR", 2040, 980,   501, 380,  "Clementi Ave 1",         "Mar 2025"),
        (2024, "Chuan Park",             "OCR", 2100, 1020,  916, 820,  "Lorong Chuan",           "Nov 2024"),
        (2024, "Union Square Residences","CCR", 2950, 1390,  366, 200,  "Clarke Quay",            "Oct 2024"),
        (2024, "Emerald of Katong",      "OCR", 2627, 1205, 846,  846,  "Jalan Tembusu",          "Oct 2024"),
        (2024, "Nava Grove",             "OCR", 2150, 970,   552, 520,  "Pine Grove",             "Sep 2024"),
        (2024, "Norwood Grand",          "OCR", 2067, 930,   348, 330,  "Champions Way",          "Nov 2024"),
        (2024, "Lentoria",               "OCR", 2120,  982,  267, 240,  "Lentor Hills Road",      "Feb 2024"),
        (2024, "Watten House",           "CCR", 3230, 1402,  180,  90,  "Stevens Road",           "Sep 2023"),
        (2023, "The Reserve Residences", "RCR", 2460, 1223,  732, 640,  "Jalan Anak Bukit",       "May 2023"),
        (2023, "The Shorefront",         "RCR", 2350, 1100,  228, 200,  "Amber Road",             "Apr 2023"),
        (2022, "Lentor Modern",          "OCR", 2100, 1108,  605, 592,  "Lentor Central",         "Sep 2022"),
        (2022, "Amo Residence",          "OCR", 2100, 1118,  372, 372,  "Ang Mo Kio Ave 1",       "Jul 2022"),
        (2022, "Piccadilly Grand",       "RCR", 2150, 1129,  407, 407,  "Northumberland Road",    "May 2022"),
        (2021, "One Bernam",             "CCR", 2650, 1463,  351, 351,  "Bernam Street",          "Feb 2021"),
        (2021, "The Reef at King's Dock","RCR", 2350, 1192,  429, 429,  "Harbourfront Drive",     "Jan 2021"),
    ]

    cursor.executemany(
        "INSERT INTO new_launches VALUES (?,?,?,?,?,?,?,?,?)",
        launch_data
    )

    conn.commit()
    conn.close()
    print("Successfully populated land and new launch data.")


if __name__ == "__main__":
    populate()
