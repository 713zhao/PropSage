from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "model"]
    content: str


class AdvisorRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    profile: dict = Field(default_factory=dict)
    shortlist: list[dict] = Field(default_factory=list)


class AdvisorResponse(BaseModel):
    reply: str
    red_flags: list[str]
