import importlib.util
import pathlib
import urllib.parse
from fastapi.testclient import TestClient

# Load the app module from src/app.py so tests work regardless of package layout
BASE = pathlib.Path(__file__).resolve().parents[1]
APP_PATH = BASE / "src" / "app.py"
spec = importlib.util.spec_from_file_location("app_module", str(APP_PATH))
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)
app = getattr(app_module, "app")

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Known activity from seeded data
    assert "Chess Club" in data


def test_signup_and_unregister():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure the email is not present before test
    resp = client.get("/activities")
    participants = resp.json()[activity]["participants"]
    if email in participants:
        client.delete(f"/activities/{urllib.parse.quote(activity)}/unregister?email={email}")

    # Signup
    signup_resp = client.post(f"/activities/{urllib.parse.quote(activity)}/signup?email={email}")
    assert signup_resp.status_code == 200
    assert email in client.get("/activities").json()[activity]["participants"]

    # Unregister
    del_resp = client.delete(f"/activities/{urllib.parse.quote(activity)}/unregister?email={email}")
    assert del_resp.status_code == 200
    assert email not in client.get("/activities").json()[activity]["participants"]
