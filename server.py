import hmac
import json
import os
import secrets
import sqlite3
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from http.cookies import CookieError, SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


SITE_ROOT = Path(__file__).resolve().parent
DATABASE_PATH = Path(os.environ.get("CSE_HUB_DB", SITE_ROOT / "data" / "cse_hub.sqlite3"))
MAX_REQUEST_SIZE = 16_384
ADMIN_SESSION_COOKIE = "cse_hub_admin"
ADMIN_SESSION_DURATION = 8 * 60 * 60
ADMIN_SESSIONS = {}

COLLECTIONS = {
    "hackathon-stories": {
        "table": "hackathon_stories",
        "moderated": True,
        "fields": {
            "author": 100,
            "event": 120,
            "project": 2000,
            "venue": 1500,
            "people": 1500,
            "experience": 3000,
        },
        "columns": ("author", "event", "project", "venue", "people", "experience"),
    },
    "problem-statements": {
        "table": "problem_statements",
        "fields": {
            "author": 100,
            "role": 10,
            "title": 160,
            "description": 3000,
            "solution": 2000,
        },
        "columns": ("author", "role", "title", "description", "solution"),
    },
    "projects": {
        "table": "projects",
        "moderated": True,
        "fields": {
            "title": 160,
            "team": 120,
            "description": 3000,
            "technologies": 500,
            "project_url": 2048,
        },
        "columns": ("title", "team", "description", "technologies", "project_url"),
    },
}


@contextmanager
def connect_database():
    connection = sqlite3.connect(DATABASE_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def initialise_database():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect_database() as connection:
        for config in COLLECTIONS.values():
            connection.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {config["table"]} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    {", ".join(f"{field} TEXT NOT NULL" for field in config["columns"])},
                    created_at TEXT NOT NULL
                )
                """
            )
        for collection in ("hackathon-stories", "projects"):
            table = COLLECTIONS[collection]["table"]
            columns = {
                column["name"]
                for column in connection.execute(f"PRAGMA table_info({table})").fetchall()
            }
            if "status" not in columns:
                connection.execute(
                    f"ALTER TABLE {table} ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'"
                )
            if collection == "projects" and "project_url" not in columns:
                connection.execute(
                    "ALTER TABLE projects ADD COLUMN project_url TEXT NOT NULL DEFAULT ''"
                )


class CSEHubRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE_ROOT), **kwargs)

    def translate_path(self, path):
        translated = Path(super().translate_path(path)).resolve()
        private_directory = DATABASE_PATH.parent.resolve()
        try:
            translated.relative_to(private_directory)
        except ValueError:
            return str(translated)
        return str(SITE_ROOT / "__private_resource_not_found__")

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        content_length = self.headers.get("Content-Length")
        if not content_length:
            self.send_json(411, {"error": "Content-Length is required."})
            return None

        try:
            size = int(content_length)
        except ValueError:
            self.send_json(400, {"error": "Invalid Content-Length."})
            return None
        if size < 0 or size > MAX_REQUEST_SIZE:
            self.send_json(413, {"error": "Submission is too large."})
            return None

        try:
            submission = json.loads(self.rfile.read(size))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "Request body must be valid JSON."})
            return None
        if not isinstance(submission, dict):
            self.send_json(400, {"error": "Submission must be a JSON object."})
            return None
        return submission

    def has_admin_session(self):
        try:
            cookies = SimpleCookie(self.headers.get("Cookie", ""))
        except CookieError:
            return False
        cookie = cookies.get(ADMIN_SESSION_COOKIE)
        if cookie is None:
            return False

        token = cookie.value
        expires_at = ADMIN_SESSIONS.get(token)
        if expires_at is None:
            return False
        if expires_at <= time.time():
            del ADMIN_SESSIONS[token]
            return False
        return True

    def require_admin_session(self):
        if self.has_admin_session():
            return True
        self.send_json(401, {"error": "Admin sign-in is required."})
        return False

    def is_same_origin_request(self):
        origin = self.headers.get("Origin")
        host = self.headers.get("Host")
        return bool(
            origin
            and host
            and urlsplit(origin).scheme in ("http", "https")
            and urlsplit(origin).netloc.casefold() == host.casefold()
        )

    def send_admin_cookie(self, token, max_age):
        cookie = (
            f"{ADMIN_SESSION_COOKIE}={token}; Path=/; HttpOnly; "
            f"SameSite=Strict; Max-Age={max_age}"
        )
        if self.headers.get("X-Forwarded-Proto", "").casefold() == "https":
            cookie += "; Secure"
        self.send_header("Set-Cookie", cookie)

    def do_GET(self):
        path = urlsplit(self.path).path.strip("/")
        if path == "api/admin/submissions":
            if not self.require_admin_session():
                return
            try:
                with connect_database() as connection:
                    items = []
                    for collection in ("hackathon-stories", "projects"):
                        config = COLLECTIONS[collection]
                        columns = ", ".join(config["columns"])
                        rows = connection.execute(
                            f"SELECT id, {columns}, created_at FROM {config['table']} "
                            "WHERE status = 'pending' ORDER BY id DESC"
                        ).fetchall()
                        items.extend(
                            {**dict(row), "submission_type": collection} for row in rows
                        )
            except sqlite3.Error:
                self.send_json(500, {"error": "Database unavailable. Please try again later."})
                return
            items.sort(key=lambda item: item["id"], reverse=True)
            self.send_json(200, {"items": items})
            return

        if path == "api/admin/projects":
            if not self.require_admin_session():
                return
            config = COLLECTIONS["projects"]
            columns = ", ".join(config["columns"])
            try:
                with connect_database() as connection:
                    rows = connection.execute(
                        f"SELECT id, {columns}, created_at FROM projects "
                        "WHERE status = 'pending' ORDER BY id DESC"
                    ).fetchall()
            except sqlite3.Error:
                self.send_json(500, {"error": "Database unavailable. Please try again later."})
                return
            self.send_json(200, {"items": [dict(row) for row in rows]})
            return

        if path.startswith("api/"):
            collection = path.removeprefix("api/")
            if collection not in COLLECTIONS:
                self.send_json(404, {"error": "API endpoint not found."})
                return

            config = COLLECTIONS[collection]
            columns = ", ".join(config["columns"])
            query = f"SELECT id, {columns}, created_at FROM {config['table']}"
            if config.get("moderated"):
                query += " WHERE status = 'approved'"
            query += " ORDER BY id DESC"
            try:
                with connect_database() as connection:
                    rows = connection.execute(query).fetchall()
            except sqlite3.Error:
                self.send_json(500, {"error": "Database unavailable. Please try again later."})
                return
            self.send_json(200, {"items": [dict(row) for row in rows]})
            return

        if path == "data" or path.startswith("data/") or path.endswith((".sqlite", ".sqlite3", ".db")):
            self.send_json(404, {"error": "Resource not found."})
            return

        super().do_GET()

    def do_POST(self):
        path = urlsplit(self.path).path.strip("/")
        if not path.startswith("api/"):
            self.send_json(404, {"error": "API endpoint not found."})
            return

        if path == "api/admin/login":
            if not self.is_same_origin_request():
                self.send_json(403, {"error": "Admin requests must come from this site."})
                return
            admin_password = os.environ.get("CSE_HUB_ADMIN_PASSWORD")
            if not admin_password:
                self.send_json(503, {"error": "Admin password is not configured on the server."})
                return
            submission = self.read_json_body()
            if submission is None:
                return
            password = submission.get("password")
            if not isinstance(password, str) or not hmac.compare_digest(password, admin_password):
                self.send_json(401, {"error": "Incorrect admin password."})
                return

            now = time.time()
            for token, expires_at in list(ADMIN_SESSIONS.items()):
                if expires_at <= now:
                    del ADMIN_SESSIONS[token]
            token = secrets.token_urlsafe(32)
            ADMIN_SESSIONS[token] = now + ADMIN_SESSION_DURATION
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_admin_cookie(token, ADMIN_SESSION_DURATION)
            self.end_headers()
            self.wfile.write(b'{"authenticated":true}')
            return

        if path == "api/admin/logout":
            if not self.is_same_origin_request():
                self.send_json(403, {"error": "Admin requests must come from this site."})
                return
            try:
                cookies = SimpleCookie(self.headers.get("Cookie", ""))
            except CookieError:
                cookies = SimpleCookie()
            cookie = cookies.get(ADMIN_SESSION_COOKIE)
            if cookie is not None:
                ADMIN_SESSIONS.pop(cookie.value, None)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_admin_cookie("", 0)
            self.end_headers()
            self.wfile.write(b'{"authenticated":false}')
            return

        admin_action = path.split("/")
        if len(admin_action) == 6 and admin_action[:3] == ["api", "admin", "submissions"]:
            if not self.is_same_origin_request():
                self.send_json(403, {"error": "Admin requests must come from this site."})
                return
            if not self.require_admin_session():
                return
            collection = admin_action[3]
            config = COLLECTIONS.get(collection)
            if config is None or not config.get("moderated"):
                self.send_json(404, {"error": "Submission not found."})
                return
            try:
                submission_id = int(admin_action[4])
            except ValueError:
                self.send_json(404, {"error": "Submission not found."})
                return
            status_by_action = {"approve": "approved", "reject": "rejected"}
            next_status = status_by_action.get(admin_action[5])
            if next_status is None:
                self.send_json(404, {"error": "Admin endpoint not found."})
                return
            try:
                with connect_database() as connection:
                    result = connection.execute(
                        f"UPDATE {config['table']} SET status = ? "
                        "WHERE id = ? AND status = 'pending'",
                        (next_status, submission_id),
                    )
            except sqlite3.Error:
                self.send_json(500, {"error": "Database unavailable. Please try again later."})
                return
            if result.rowcount == 0:
                self.send_json(404, {"error": "Pending submission not found."})
                return
            self.send_json(200, {"status": next_status})
            return

        if len(admin_action) == 5 and admin_action[:3] == ["api", "admin", "projects"]:
            if not self.is_same_origin_request():
                self.send_json(403, {"error": "Admin requests must come from this site."})
                return
            if not self.require_admin_session():
                return
            try:
                project_id = int(admin_action[3])
            except ValueError:
                self.send_json(404, {"error": "Project not found."})
                return
            status_by_action = {"approve": "approved", "reject": "rejected"}
            next_status = status_by_action.get(admin_action[4])
            if next_status is None:
                self.send_json(404, {"error": "Admin endpoint not found."})
                return
            try:
                with connect_database() as connection:
                    result = connection.execute(
                        "UPDATE projects SET status = ? WHERE id = ? AND status = 'pending'",
                        (next_status, project_id),
                    )
            except sqlite3.Error:
                self.send_json(500, {"error": "Database unavailable. Please try again later."})
                return
            if result.rowcount == 0:
                self.send_json(404, {"error": "Pending project not found."})
                return
            self.send_json(200, {"status": next_status})
            return

        collection = path.removeprefix("api/")
        if collection not in COLLECTIONS:
            self.send_json(404, {"error": "API endpoint not found."})
            return

        submission = self.read_json_body()
        if submission is None:
            return

        config = COLLECTIONS[collection]
        cleaned = {}
        for field, max_length in config["fields"].items():
            value = submission.get(field)
            if not isinstance(value, str) or not value.strip():
                self.send_json(400, {"error": f"{field} is required."})
                return
            value = value.strip()
            if len(value) > max_length:
                self.send_json(400, {"error": f"{field} must be {max_length} characters or fewer."})
                return
            cleaned[field] = value

        if collection == "projects":
            try:
                project_url = urlsplit(cleaned["project_url"])
                valid_project_url = (
                    project_url.scheme.lower() in ("http", "https")
                    and bool(project_url.hostname)
                    and project_url.username is None
                    and project_url.password is None
                )
            except ValueError:
                valid_project_url = False
            if not valid_project_url:
                self.send_json(400, {"error": "project_url must be a valid http or https URL."})
                return

        if collection == "problem-statements" and cleaned["role"] not in ("Student", "Faculty"):
            self.send_json(400, {"error": "role must be Student or Faculty."})
            return

        columns = config["columns"]
        placeholders = ", ".join("?" for _ in columns)
        values = [cleaned[field] for field in columns]
        created_at = datetime.now(timezone.utc).isoformat()
        try:
            with connect_database() as connection:
                if config.get("moderated"):
                    cursor = connection.execute(
                        f"INSERT INTO {config['table']} ({', '.join(columns)}, created_at, status) "
                        f"VALUES ({placeholders}, ?, 'pending')",
                        (*values, created_at),
                    )
                else:
                    cursor = connection.execute(
                        f"INSERT INTO {config['table']} ({', '.join(columns)}, created_at) "
                        f"VALUES ({placeholders}, ?)",
                        (*values, created_at),
                    )
                item = connection.execute(
                    f"SELECT id, {', '.join(columns)}, created_at FROM {config['table']} WHERE id = ?",
                    (cursor.lastrowid,),
                ).fetchone()
        except sqlite3.Error:
            self.send_json(500, {"error": "Database unavailable. Please try again later."})
            return

        response = {"item": dict(item)}
        if config.get("moderated"):
            response["item"]["status"] = "pending"
        self.send_json(201, response)

    def log_message(self, format, *args):
        super().log_message(format, *args)


if __name__ == "__main__":
    initialise_database()
    server = ThreadingHTTPServer(("0.0.0.0", 8000), CSEHubRequestHandler)
    print(f"Serving site at http://localhost:8000 using database {DATABASE_PATH}", flush=True)
    server.serve_forever()
