from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_no_model():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["model_loaded"] is False


def test_predict_is_explicitly_not_implemented():
    r = client.post("/predict", json={"current_cgpa": 3.1, "attendance_percent": 82})
    assert r.status_code == 501
    assert r.json()["error"] == "not_implemented"


def test_predict_validates_input_contract():
    r = client.post("/predict", json={"attendance_percent": 140})
    assert r.status_code == 422
