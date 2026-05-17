import json
import os
from pathlib import Path

_MOCK_DIR = Path(__file__).parent.parent / "mock_data"


def _is_mock() -> bool:
    return os.getenv("USE_MOCK_DATA", "true").lower() in ("true", "1", "yes")


def _load_mock(filename: str) -> list[dict]:
    with open(_MOCK_DIR / filename) as f:
        return json.load(f)["records"]


class DataGovService:
    def get_ppi(self) -> list[dict]:
        if _is_mock():
            return _load_mock("ppi.json")
        return self._fetch_ppi_live()

    def get_rental(self) -> list[dict]:
        if _is_mock():
            return _load_mock("rental.json")
        return self._fetch_rental_live()

    def get_volume(self) -> list[dict]:
        if _is_mock():
            return _load_mock("volume.json")
        return self._fetch_volume_live()

    def get_vacancy(self) -> list[dict]:
        if _is_mock():
            return _load_mock("vacancy.json")
        return self._fetch_vacancy_live()

    def _fetch_ppi_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live DataGov PPI fetch not yet implemented")

    def _fetch_rental_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live DataGov Rental fetch not yet implemented")

    def _fetch_volume_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live DataGov Volume fetch not yet implemented")

    def _fetch_vacancy_live(self) -> list[dict]:  # pragma: no cover
        raise NotImplementedError("Live DataGov Vacancy fetch not yet implemented")
