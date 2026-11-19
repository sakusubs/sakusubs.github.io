import json
import os
from flask import Flask, render_template, request, abort

app = Flask(__name__)

# =========================================================
# PENGATURAN IDENTITAS WEB, SOSMED, & KOMENTAR GISCUS
# =========================================================
SITE_NAME = "SakuSubs"
AUTHOR_NAME = "SakuSubs"
SITE_TAGLINE = "Fansub & Arsip Konten Sakurazaka46"
SINCE_YEAR = "2026"

TRAKTEER_URL = "https://trakteer.id"
X_URL = "https://x.com"
YOUTUBE_URL = "https://youtube.com"

# Pengaturan Komentar Giscus (Isi setelah repo GitHub dibuat)
GISCUS_REPO = "sakusubs/sakusubs.github.io"
GISCUS_REPO_ID = "R_kgDOVwWaow"
GISCUS_CATEGORY = "General"
GISCUS_CATEGORY_ID = "DIC_kwDOVwWao84DLf9P"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "posts.json")


def load_posts():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


@app.context_processor
def inject_navigation():
    """Mengirim data global ke semua halaman"""
    posts = load_posts()
    cat_counts = {}
    for p in posts:
        c = p.get("category", "Lainnya")
        cat_counts[c] = cat_counts.get(c, 0) + 1

    nav_categories = sorted(cat_counts.items(), key=lambda x: x[0])
    nav_tags = sorted(list({tag for p in posts for tag in p.get("tags", [])}))

    return {
        "nav_categories": nav_categories,
        "nav_tags": nav_tags,
        "total_posts": len(posts),
        "site_name": SITE_NAME,
        "site_tagline": SITE_TAGLINE,
        "since_year": SINCE_YEAR,
        "trakteer_url": TRAKTEER_URL,
        "x_url": X_URL,
        "youtube_url": YOUTUBE_URL,
        "default_author": AUTHOR_NAME,
        "giscus_repo": GISCUS_REPO,
        "giscus_repo_id": GISCUS_REPO_ID,
        "giscus_category": GISCUS_CATEGORY,
        "giscus_category_id": GISCUS_CATEGORY_ID,
    }


@app.route("/")
def index():
    posts = load_posts()
    latest_slides = posts[:3]

    selected_category = request.args.get("category", "").strip()
    selected_tag = request.args.get("tag", "").strip()
    search_query = request.args.get("q", "").strip().lower()

    filtered_posts = posts

    if selected_category:
        filtered_posts = [
            p for p in filtered_posts
            if p["category"].lower() == selected_category.lower()
        ]

    if selected_tag:
        filtered_posts = [
            p for p in filtered_posts
            if any(t.lower() == selected_tag.lower() for t in p.get("tags", []))
        ]

    if search_query:
        filtered_posts = [
            p for p in filtered_posts
            if search_query in p["title"].lower()
            or search_query in p.get("jp_title", "").lower()
            or search_query in p.get("synopsis", "").lower()
            or any(search_query in t.lower() for t in p.get("tags", []))
        ]

    return render_template(
        "index.html",
        posts=filtered_posts,
        latest_slides=latest_slides,
        selected_category=selected_category,
        selected_tag=selected_tag,
        search_query=search_query,
    )


@app.route("/watch/<slug>")
def detail(slug):
    posts = load_posts()
    current_index = next((i for i, p in enumerate(posts) if p["slug"] == slug), None)
    if current_index is None:
        abort(404)

    post = posts[current_index]

    newer_post = posts[current_index - 1] if current_index > 0 else None
    older_post = posts[current_index + 1] if current_index < len(posts) - 1 else None

    current_tags = set(t.lower() for t in post.get("tags", []))
    scored_posts = []
    for p in posts:
        if p["slug"] == post["slug"]:
            continue
        score = 0
        if p["category"] == post["category"]:
            score += 2
        other_tags = set(t.lower() for t in p.get("tags", []))
        score += len(current_tags.intersection(other_tags))
        scored_posts.append((score, p))

    scored_posts.sort(key=lambda x: x[0], reverse=True)
    related_posts = [item[1] for item in scored_posts[:4]]

    return render_template(
        "detail.html",
        post=post,
        older_post=older_post,
        newer_post=newer_post,
        related_posts=related_posts,
    )


@app.route("/tentang")
def tentang():
    return render_template("tentang.html")


@app.route("/cara-download")
def cara_download():
    return render_template("cara_download.html")


@app.route("/disclaimer")
def disclaimer():
    return render_template("disclaimer.html")

@app.route("/go")
def go_redirect():
    return render_template("go.html")
    
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    print("\n==========================================")
    print(f"Server {SITE_NAME} berjalan!")
    print(f"Buka browser di HP dan akses: http://127.0.0.1:{port}")
    print("==========================================\n")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
