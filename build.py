import os
import re
import shutil
from app import app, load_posts

OUTPUT_DIR = "dist"


def get_base_path():
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    if "/" in repo:
        owner, repo_name = repo.split("/", 1)
        if repo_name.lower() == f"{owner.lower()}.github.io":
            return ""
        return f"/{repo_name}"
    return ""


def rewrite_paths(html, base_path):
    if not base_path:
        return html
    html = re.sub(r'(href|src|action|data-url)="\/(?!\/)', rf'\1="{base_path}/', html)
    html = re.sub(r"(\.src=|openImgModal\()'\/(?!\/)", rf"\1'{base_path}/", html)
    return html


def save_page(client, route, output_rel_path, base_path):
    res = client.get(route)
    if res.status_code != 200:
        raise RuntimeError(f"Gagal render halaman {route} (status: {res.status_code})")

    html = res.get_data(as_text=True)
    html = rewrite_paths(html, base_path)

    full_path = os.path.join(OUTPUT_DIR, output_rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"[OK] {route} -> {full_path}")


def build():
    base_path = get_base_path()
    print(f"Memulai build statis (base_path='{base_path}')...")

    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    shutil.copytree("static", os.path.join(OUTPUT_DIR, "static"))

    with open(os.path.join(OUTPUT_DIR, ".nojekyll"), "w", encoding="utf-8") as f:
        f.write("")

    with app.test_client() as client:
        save_page(client, "/", "index.html", base_path)
        save_page(client, "/tentang", os.path.join("tentang", "index.html"), base_path)
        save_page(client, "/cara-download", os.path.join("cara-download", "index.html"), base_path)
        save_page(client, "/disclaimer", os.path.join("disclaimer", "index.html"), base_path)

        posts = load_posts()
        for post in posts:
            slug = post["slug"]
            save_page(client, f"/watch/{slug}", os.path.join("watch", slug, "index.html"), base_path)

    print("\nBuild selesai! Semua halaman siap tayang.")


if __name__ == "__main__":
    build()
