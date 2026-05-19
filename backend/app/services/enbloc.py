from app.schemas.enbloc import DevelopmentProfile

_WEIGHTS = {
    "age": 0.20,
    "plot_ratio": 0.25,
    "land_size": 0.15,
    "location": 0.15,
    "csc_attempt": 0.10,
    "ownership": 0.10,
    "lease": 0.05,
}

_DISTRICT_SCORES = {
    "D09": 10, "D10": 9, "D11": 9, "D01": 8, "D02": 8, "D06": 8,
    "D03": 7, "D04": 7, "D05": 7, "D07": 6, "D08": 6, "D15": 6,
    "D12": 5, "D13": 5, "D14": 4, "D19": 5, "D20": 4, "D21": 5,
    "D16": 4, "D17": 3, "D18": 3, "D22": 3, "D23": 3, "D24": 2,
    "D25": 2, "D26": 2, "D27": 2, "D28": 2,
}

_SEED_DEVELOPMENTS = [
    {"id": 1, "name": "Braddell View", "district": "D13", "age_years": 48, "plot_ratio_headroom": 120.0, "land_area_sqft": 1_130_000, "previous_csc_attempt": True, "ownership_units": 918, "lease_remaining_years": 51, "csc_status": "Pending", "lat": 1.3286, "lng": 103.8745},
    {"id": 2, "name": "Pearlbank Apartments", "district": "D02", "age_years": 52, "plot_ratio_headroom": 150.0, "land_area_sqft": 82_000, "previous_csc_attempt": True, "ownership_units": 288, "lease_remaining_years": 47, "csc_status": "Approved", "lat": 1.2798, "lng": 103.8396},
    {"id": 3, "name": "Amber Park", "district": "D15", "age_years": 38, "plot_ratio_headroom": 95.0, "land_area_sqft": 213_000, "previous_csc_attempt": True, "ownership_units": 200, "lease_remaining_years": 61, "csc_status": "Approved", "lat": 1.3088, "lng": 103.9039},
    {"id": 4, "name": "Rio Casa", "district": "D19", "age_years": 35, "plot_ratio_headroom": 110.0, "land_area_sqft": 302_000, "previous_csc_attempt": True, "ownership_units": 286, "lease_remaining_years": 64, "csc_status": "Approved", "lat": 1.3651, "lng": 103.8706},
    {"id": 5, "name": "Watergate", "district": "D19", "age_years": 32, "plot_ratio_headroom": 85.0, "land_area_sqft": 185_000, "previous_csc_attempt": True, "ownership_units": 210, "lease_remaining_years": 67, "csc_status": "Lapsed", "lat": 1.3620, "lng": 103.8740},
    {"id": 6, "name": "Florence Regency", "district": "D19", "age_years": 29, "plot_ratio_headroom": 90.0, "land_area_sqft": 389_000, "previous_csc_attempt": False, "ownership_units": 336, "lease_remaining_years": 70, "csc_status": "None", "lat": 1.3700, "lng": 103.8800},
    {"id": 7, "name": "City Towers", "district": "D10", "age_years": 45, "plot_ratio_headroom": 70.0, "land_area_sqft": 92_000, "previous_csc_attempt": True, "ownership_units": 138, "lease_remaining_years": 54, "csc_status": "Lapsed", "lat": 1.3237, "lng": 103.8200},
    {"id": 8, "name": "Park West", "district": "D05", "age_years": 36, "plot_ratio_headroom": 100.0, "land_area_sqft": 657_000, "previous_csc_attempt": False, "ownership_units": 432, "lease_remaining_years": 63, "csc_status": "None", "lat": 1.3063, "lng": 103.7898},
    {"id": 9, "name": "Mandarin Gardens", "district": "D15", "age_years": 39, "plot_ratio_headroom": 80.0, "land_area_sqft": 751_000, "previous_csc_attempt": False, "ownership_units": 1008, "lease_remaining_years": 60, "csc_status": "None", "lat": 1.3100, "lng": 103.9000},
    {"id": 10, "name": "Thomson View", "district": "D20", "age_years": 41, "plot_ratio_headroom": 60.0, "land_area_sqft": 365_000, "previous_csc_attempt": False, "ownership_units": 254, "lease_remaining_years": 58, "csc_status": "None", "lat": 1.3691, "lng": 103.8454},
    {"id": 11, "name": "Hollandia", "district": "D10", "age_years": 44, "plot_ratio_headroom": 75.0, "land_area_sqft": 78_000, "previous_csc_attempt": False, "ownership_units": 56, "lease_remaining_years": 55, "csc_status": "None", "lat": 1.3200, "lng": 103.8050},
    {"id": 12, "name": "Changi Garden", "district": "D17", "age_years": 37, "plot_ratio_headroom": 45.0, "land_area_sqft": 241_000, "previous_csc_attempt": False, "ownership_units": 204, "lease_remaining_years": 62, "csc_status": "None", "lat": 1.3605, "lng": 103.9614},
]


def score_development(dev: dict) -> int:
    age_score = min(dev["age_years"] / 5.0, 10.0)
    plot_score = min(dev["plot_ratio_headroom"] / 15.0, 10.0)
    land_score = min(dev["land_area_sqft"] / 100_000.0, 10.0)
    location_score = float(_DISTRICT_SCORES.get(dev["district"], 3))
    csc_score = 10.0 if dev["previous_csc_attempt"] else 0.0
    ownership_score = max(0.0, 10.0 - dev["ownership_units"] / 100.0)
    lease_score = max(0.0, 10.0 - dev["lease_remaining_years"] / 10.0)

    raw = (
        age_score * _WEIGHTS["age"]
        + plot_score * _WEIGHTS["plot_ratio"]
        + land_score * _WEIGHTS["land_size"]
        + location_score * _WEIGHTS["location"]
        + csc_score * _WEIGHTS["csc_attempt"]
        + ownership_score * _WEIGHTS["ownership"]
        + lease_score * _WEIGHTS["lease"]
    )
    return round(raw * 10)


def get_all_developments() -> list[dict]:
    result = []
    for dev in _SEED_DEVELOPMENTS:
        d = dict(dev)
        d["score"] = score_development(dev)
        result.append(d)
    result.sort(key=lambda x: x["score"], reverse=True)
    return result
