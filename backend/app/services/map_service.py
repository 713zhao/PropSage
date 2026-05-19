from __future__ import annotations
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.schemas.map import DistrictData, AmenityPoint

_DISTRICT_SEED: list[dict] = [
    {"code": "D01", "name": "Raffles Place / Marina", "lat": 1.2830, "lng": 103.8513, "psf_fallback": 2800},
    {"code": "D02", "name": "Tanjong Pagar / Anson", "lat": 1.2789, "lng": 103.8432, "psf_fallback": 2500},
    {"code": "D03", "name": "Queenstown / Tiong Bahru", "lat": 1.2942, "lng": 103.8062, "psf_fallback": 1800},
    {"code": "D04", "name": "Harbourfront / Telok Blangah", "lat": 1.2718, "lng": 103.8198, "psf_fallback": 1600},
    {"code": "D05", "name": "Buona Vista / West Coast", "lat": 1.3063, "lng": 103.7898, "psf_fallback": 1700},
    {"code": "D06", "name": "City Hall / Clarke Quay", "lat": 1.2944, "lng": 103.8509, "psf_fallback": 3200},
    {"code": "D07", "name": "Beach Road / Little India", "lat": 1.3071, "lng": 103.8593, "psf_fallback": 2000},
    {"code": "D08", "name": "Farrer Park / Serangoon Rd", "lat": 1.3160, "lng": 103.8565, "psf_fallback": 1800},
    {"code": "D09", "name": "Orchard / River Valley", "lat": 1.3048, "lng": 103.8318, "psf_fallback": 3000},
    {"code": "D10", "name": "Bukit Timah / Holland", "lat": 1.3237, "lng": 103.8200, "psf_fallback": 2200},
    {"code": "D11", "name": "Newton / Novena", "lat": 1.3255, "lng": 103.8350, "psf_fallback": 2400},
    {"code": "D12", "name": "Toa Payoh / Balestier", "lat": 1.3343, "lng": 103.8516, "psf_fallback": 1400},
    {"code": "D13", "name": "Macpherson / Potong Pasir", "lat": 1.3286, "lng": 103.8745, "psf_fallback": 1300},
    {"code": "D14", "name": "Geylang / Paya Lebar", "lat": 1.3152, "lng": 103.8912, "psf_fallback": 1200},
    {"code": "D15", "name": "Katong / Joo Chiat", "lat": 1.3088, "lng": 103.9039, "psf_fallback": 1800},
    {"code": "D16", "name": "Bedok / Upper East Coast", "lat": 1.3240, "lng": 103.9267, "psf_fallback": 1100},
    {"code": "D17", "name": "Loyang / Changi", "lat": 1.3605, "lng": 103.9614, "psf_fallback": 900},
    {"code": "D18", "name": "Tampines / Pasir Ris", "lat": 1.3535, "lng": 103.9443, "psf_fallback": 1000},
    {"code": "D19", "name": "Serangoon / Hougang", "lat": 1.3651, "lng": 103.8706, "psf_fallback": 1200},
    {"code": "D20", "name": "Ang Mo Kio / Bishan", "lat": 1.3691, "lng": 103.8454, "psf_fallback": 1100},
    {"code": "D21", "name": "Upper Bukit Timah / Clementi", "lat": 1.3472, "lng": 103.7760, "psf_fallback": 1500},
    {"code": "D22", "name": "Jurong / Boon Lay", "lat": 1.3359, "lng": 103.7040, "psf_fallback": 1000},
    {"code": "D23", "name": "Bukit Panjang / Choa Chu Kang", "lat": 1.3779, "lng": 103.7711, "psf_fallback": 1000},
    {"code": "D24", "name": "Lim Chu Kang / Tengah", "lat": 1.3853, "lng": 103.7456, "psf_fallback": 900},
    {"code": "D25", "name": "Kranji / Woodgrove", "lat": 1.4263, "lng": 103.7568, "psf_fallback": 800},
    {"code": "D26", "name": "Mandai / Upper Thomson", "lat": 1.4146, "lng": 103.8060, "psf_fallback": 800},
    {"code": "D27", "name": "Sembawang / Yishun", "lat": 1.4491, "lng": 103.8186, "psf_fallback": 850},
    {"code": "D28", "name": "Seletar / Yio Chu Kang", "lat": 1.4034, "lng": 103.8672, "psf_fallback": 900},
]

_AMENITIES: dict[str, list[dict]] = {
    "mrt": [
        {"name": "City Hall", "lat": 1.2931, "lng": 103.8520, "subtype": "NSL/EWL"},
        {"name": "Raffles Place", "lat": 1.2834, "lng": 103.8516, "subtype": "NSL/EWL"},
        {"name": "Dhoby Ghaut", "lat": 1.2998, "lng": 103.8456, "subtype": "NSL/CCL/NEL"},
        {"name": "Orchard", "lat": 1.3040, "lng": 103.8318, "subtype": "NSL"},
        {"name": "Newton", "lat": 1.3129, "lng": 103.8387, "subtype": "NSL/DTL"},
        {"name": "Novena", "lat": 1.3202, "lng": 103.8440, "subtype": "NSL"},
        {"name": "Toa Payoh", "lat": 1.3329, "lng": 103.8468, "subtype": "NSL"},
        {"name": "Bishan", "lat": 1.3510, "lng": 103.8484, "subtype": "NSL/CCL"},
        {"name": "Yishun", "lat": 1.4295, "lng": 103.8354, "subtype": "NSL"},
        {"name": "Woodlands", "lat": 1.4368, "lng": 103.7863, "subtype": "NSL/TEL"},
        {"name": "Jurong East", "lat": 1.3331, "lng": 103.7421, "subtype": "EWL/NSL"},
        {"name": "Boon Lay", "lat": 1.3387, "lng": 103.7059, "subtype": "EWL"},
        {"name": "Tampines", "lat": 1.3530, "lng": 103.9453, "subtype": "EWL/DTL"},
        {"name": "Bedok", "lat": 1.3240, "lng": 103.9301, "subtype": "EWL"},
        {"name": "Paya Lebar", "lat": 1.3176, "lng": 103.8922, "subtype": "EWL/CCL"},
        {"name": "Buona Vista", "lat": 1.3073, "lng": 103.7899, "subtype": "EWL/CCL"},
        {"name": "HarbourFront", "lat": 1.2651, "lng": 103.8219, "subtype": "CCL/NEL"},
        {"name": "Serangoon", "lat": 1.3494, "lng": 103.8730, "subtype": "CCL/NEL"},
        {"name": "Outram Park", "lat": 1.2798, "lng": 103.8396, "subtype": "EWL/NEL/TEL"},
        {"name": "Changi Airport", "lat": 1.3592, "lng": 103.9894, "subtype": "EWL"},
    ],
    "school": [
        {"name": "Raffles Institution", "lat": 1.4043, "lng": 103.8139, "subtype": "Secondary"},
        {"name": "Hwa Chong Institution", "lat": 1.3333, "lng": 103.8074, "subtype": "Secondary"},
        {"name": "Anglo-Chinese School", "lat": 1.3223, "lng": 103.8454, "subtype": "Secondary"},
        {"name": "NUS", "lat": 1.2966, "lng": 103.7764, "subtype": "University"},
        {"name": "NTU", "lat": 1.3483, "lng": 103.6831, "subtype": "University"},
        {"name": "SMU", "lat": 1.2967, "lng": 103.8500, "subtype": "University"},
        {"name": "Singapore Polytechnic", "lat": 1.3113, "lng": 103.7789, "subtype": "Polytechnic"},
        {"name": "Nanyang Polytechnic", "lat": 1.3764, "lng": 103.8478, "subtype": "Polytechnic"},
        {"name": "Temasek Polytechnic", "lat": 1.3453, "lng": 103.9326, "subtype": "Polytechnic"},
        {"name": "Victoria School", "lat": 1.3234, "lng": 103.9039, "subtype": "Secondary"},
        {"name": "Dunman High", "lat": 1.3136, "lng": 103.8847, "subtype": "Secondary"},
        {"name": "St Joseph's Institution", "lat": 1.3045, "lng": 103.8337, "subtype": "Secondary"},
        {"name": "National JC", "lat": 1.3572, "lng": 103.8340, "subtype": "JC"},
        {"name": "Republic Polytechnic", "lat": 1.4328, "lng": 103.8355, "subtype": "Polytechnic"},
        {"name": "CHIJ TPSS", "lat": 1.3271, "lng": 103.8592, "subtype": "Secondary"},
    ],
    "mall": [
        {"name": "ION Orchard", "lat": 1.3040, "lng": 103.8331, "subtype": "Orchard"},
        {"name": "VivoCity", "lat": 1.2644, "lng": 103.8222, "subtype": "HarbourFront"},
        {"name": "Jurong Point", "lat": 1.3393, "lng": 103.7056, "subtype": "Jurong"},
        {"name": "Tampines Mall", "lat": 1.3530, "lng": 103.9451, "subtype": "Tampines"},
        {"name": "Bugis Junction", "lat": 1.2993, "lng": 103.8554, "subtype": "City"},
        {"name": "Plaza Singapura", "lat": 1.3002, "lng": 103.8456, "subtype": "Orchard"},
        {"name": "Bedok Mall", "lat": 1.3242, "lng": 103.9303, "subtype": "Bedok"},
        {"name": "NEX", "lat": 1.3494, "lng": 103.8732, "subtype": "Serangoon"},
        {"name": "Causeway Point", "lat": 1.4365, "lng": 103.7864, "subtype": "Woodlands"},
        {"name": "Northpoint City", "lat": 1.4295, "lng": 103.8356, "subtype": "Yishun"},
        {"name": "AMK Hub", "lat": 1.3691, "lng": 103.8454, "subtype": "Ang Mo Kio"},
        {"name": "Westgate", "lat": 1.3337, "lng": 103.7422, "subtype": "Jurong"},
        {"name": "Paya Lebar Square", "lat": 1.3176, "lng": 103.8922, "subtype": "Paya Lebar"},
        {"name": "Clementi Mall", "lat": 1.3152, "lng": 103.7651, "subtype": "Clementi"},
        {"name": "Suntec City", "lat": 1.2937, "lng": 103.8573, "subtype": "City"},
    ],
}


def get_districts(db: Session | None) -> list[dict]:
    from app.models.transaction import Transaction

    psf_by_district: dict[str, tuple[float, int]] = {}
    if db is not None:
        try:
            rows = (
                db.query(
                    Transaction.district,
                    func.avg(Transaction.psf).label("avg_psf"),
                    func.count(Transaction.id).label("cnt"),
                )
                .filter(Transaction.psf.isnot(None))
                .group_by(Transaction.district)
                .all()
            )
            for row in rows:
                if row.district:
                    psf_by_district[row.district] = (round(row.avg_psf, 0), row.cnt)
        except Exception:
            pass

    result = []
    for d in _DISTRICT_SEED:
        live = psf_by_district.get(d["code"])
        psf_median = live[0] if live else d["psf_fallback"]
        count = live[1] if live else 0
        result.append({
            "code": d["code"],
            "name": d["name"],
            "psf_median": psf_median,
            "lat": d["lat"],
            "lng": d["lng"],
            "transaction_count": count,
        })
    return result


def get_amenities(amenity_type: str) -> list[dict]:
    raw = _AMENITIES.get(amenity_type, [])
    return [{"name": r["name"], "lat": r["lat"], "lng": r["lng"], "type": amenity_type, "subtype": r.get("subtype", "")} for r in raw]
