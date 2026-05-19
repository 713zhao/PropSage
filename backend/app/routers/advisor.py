from fastapi import APIRouter
from app.schemas.advisor import AdvisorRequest, AdvisorResponse
from app.services.advisor import call_advisor, detect_red_flags

router = APIRouter(prefix="/api/advisor", tags=["advisor"])


@router.post("/chat", response_model=AdvisorResponse)
def chat(req: AdvisorRequest) -> AdvisorResponse:
    latest = req.messages[-1].content
    red_flags = detect_red_flags(latest, req.profile)
    reply = call_advisor(
        [{"role": m.role, "content": m.content} for m in req.messages],
        req.profile,
        req.shortlist,
    )
    return AdvisorResponse(reply=reply, red_flags=red_flags)
