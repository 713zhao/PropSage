import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.advisor import detect_red_flags, build_system_prompt

client = TestClient(app)


def test_detect_red_flags_high_tdsr():
    profile = {"annualIncomeSgd": 60_000, "existingMonthlyLoanCommitments": 0}
    flags = detect_red_flags("buy a $2M property", profile)
    assert isinstance(flags, list)


def test_detect_red_flags_foreigner():
    profile = {"citizenship": "Foreigner", "existingPropertyCount": 0}
    flags = detect_red_flags("should I buy a condo", profile)
    assert any("ABSD" in f or "60%" in f for f in flags)


def test_detect_red_flags_short_lease():
    profile = {}
    flags = detect_red_flags("lease remaining is 25 years", profile)
    assert any("lease" in f.lower() for f in flags)


def test_build_system_prompt_contains_disclaimer():
    prompt = build_system_prompt({}, [])
    assert "not financial advice" in prompt.lower() or "indicative" in prompt.lower()


def test_build_system_prompt_injects_citizenship():
    profile = {"citizenship": "PR", "existingPropertyCount": 1}
    prompt = build_system_prompt(profile, [])
    assert "PR" in prompt


def test_advisor_chat_stub_response():
    resp = client.post("/api/advisor/chat", json={
        "messages": [{"role": "user", "content": "What is ABSD?"}],
        "profile": {"citizenship": "SC", "existingPropertyCount": 0},
        "shortlist": [],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data
    assert len(data["reply"]) > 0
    assert "red_flags" in data
    assert isinstance(data["red_flags"], list)


def test_advisor_chat_empty_messages_422():
    resp = client.post("/api/advisor/chat", json={
        "messages": [],
        "profile": {},
        "shortlist": [],
    })
    assert resp.status_code == 422
