"""
Request/response contract for the FUTURE academic-risk prediction endpoint.

STATUS: contract draft only. The feature list below is PROVISIONAL and will be finalised
when the dataset is chosen and feature engineering is done (proposal Phases 4-5).
Nothing here is trained or evaluated.
"""
from typing import Literal

from pydantic import BaseModel, Field


class RiskFeatures(BaseModel):
    """Provisional feature vector the backend would assemble from the database."""

    current_cgpa: float | None = Field(None, ge=0, le=4)
    attendance_percent: float | None = Field(None, ge=0, le=100)
    avg_assessment_score_percent: float | None = Field(None, ge=0, le=100)
    pending_assessments: int = Field(0, ge=0)
    weekly_study_hours: float | None = Field(None, ge=0)
    avg_focus_rating: float | None = Field(None, ge=1, le=5)
    avg_course_difficulty: float | None = Field(None, ge=1, le=5)


class RiskPrediction(BaseModel):
    risk_class: Literal["Low", "Medium", "High"]
    probability: float = Field(ge=0, le=1)
    top_features: list[dict]
