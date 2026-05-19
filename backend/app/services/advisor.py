import logging
import os
import re

_log = logging.getLogger(__name__)

_DISCLAIMER = "\n\n---\n*Indicative only — not financial advice. Consult a CEA-registered agent and financial advisor before any property decision.*"

_SYSTEM_TEMPLATE = """You are PropSage, an expert Singapore property investment advisor. You help investors evaluate properties, understand stamp duties, interpret market data, and assess investment viability in Singapore.

Always respond in a structured, factual, and helpful manner. Use SGD currency. Reference Singapore-specific regulations (BSD, ABSD, SSD, TDSR, MSR, LTV rules).

**Investor profile:**
{profile_summary}

**Active shortlist:**
{shortlist_summary}

Never give generic advice — always tailor to the investor profile above. If asked about a specific property, factor in their citizenship, existing properties, income, and goals. Always end your response with the standard disclaimer.

Note: All analysis is indicative only — not financial advice. Always recommend users consult a CEA-registered agent and a licensed financial advisor before making any property decision."""


def build_system_prompt(profile: dict, shortlist: list[dict]) -> str:
    citizenship = profile.get("citizenship", "unknown")
    count = profile.get("existingPropertyCount", 0)
    income = profile.get("annualIncomeSgd", 0)
    budget = profile.get("purchasePriceBudget", 0)
    goals = profile.get("investmentGoals", [])
    risk = profile.get("riskProfile", "unknown")

    if income > 0:
        profile_summary = (
            f"Citizenship: {citizenship} | Existing properties: {count} | "
            f"Annual income: SGD {income:,.0f} | Budget: SGD {budget:,.0f} | "
            f"Goals: {', '.join(goals) if goals else 'not set'} | Risk: {risk}"
        )
    else:
        profile_summary = f"Citizenship: {citizenship} | Existing properties: {count} | Income: not set"

    if shortlist:
        items = [f"- {p.get('project', 'Unknown')} ({p.get('district', '?')}) SGD {p.get('price', 0):,.0f}" for p in shortlist[:5]]
        shortlist_summary = "\n".join(items)
    else:
        shortlist_summary = "No properties shortlisted yet."

    return _SYSTEM_TEMPLATE.format(
        profile_summary=profile_summary,
        shortlist_summary=shortlist_summary,
    )


def detect_red_flags(latest_message: str, profile: dict) -> list[str]:
    flags: list[str] = []
    msg = latest_message.lower()

    # Foreigner ABSD flag
    if profile.get("citizenship") == "Foreigner":
        flags.append("⚠️ As a foreigner, ABSD is 60% on any residential property purchase.")

    # Short lease detection in message
    lease_triggers = ["lease remaining", "leasehold", "25 year", "24 year", "23 year", "22 year", "21 year", "20 year", "19 year", "18 year", "17 year", "16 year", "15 year"]
    if any(trigger in msg for trigger in lease_triggers):
        flags.append("⚠️ Short remaining lease detected — properties with <30 years lease face financing and resale challenges.")

    # High ABSD for PR or SC 2nd property
    citizenship = profile.get("citizenship", "SC")
    existing = profile.get("existingPropertyCount", 0)
    if citizenship == "PR" and existing >= 1:
        flags.append(f"⚠️ As a PR buying property #{existing + 1}, ABSD is {30 if existing == 1 else 35}%.")
    elif citizenship == "SC" and existing >= 1:
        flags.append(f"⚠️ As a SC buying property #{existing + 1}, ABSD is {20 if existing == 1 else 30}%.")

    # High price vs income
    income = profile.get("annualIncomeSgd", 0)
    if income > 0:
        prices = re.findall(r'\$?([\d,]+(?:\.\d+)?)\s*(?:million|m\b)', msg)
        for p in prices:
            val = float(p.replace(",", "")) * 1_000_000
            if val > income * 8:
                flags.append(f"⚠️ Property price may exceed comfortable affordability — check TDSR at this price point.")
                break

    return flags


def _stub_response() -> str:
    return (
        "PropSage AI is not configured — `GEMINI_API_KEY` is not set in your `.env` file. "
        "To enable AI advisory, add your Gemini API key and restart the backend.\n\n"
        "In the meantime, use the Tax Calculator, Loan Compare, and ROI Projector for quantitative analysis."
        + _DISCLAIMER
    )


def call_advisor(messages: list[dict], profile: dict, shortlist: list[dict]) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return _stub_response()

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=build_system_prompt(profile, shortlist),
        )

        history = []
        for m in messages[:-1]:
            history.append({"role": m["role"], "parts": [m["content"]]})

        chat = model.start_chat(history=history)
        response = chat.send_message(messages[-1]["content"])
        return response.text + _DISCLAIMER

    except Exception as exc:
        _log.exception("Gemini call failed: %s", exc)
        return (
            "AI advisor encountered an error. Please try again later."
            + _DISCLAIMER
        )
