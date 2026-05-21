from flask import Flask, render_template, request, redirect, url_for, jsonify
from datetime import datetime

app = Flask(__name__)

# In-memory storage for posts
posts = []
post_id_counter = 0


@app.route("/")
def index():
    return render_template("index.html", posts=reversed(posts))


@app.route("/add", methods=["POST"])
def add_post():
    global post_id_counter
    title = request.form.get("title", "").strip()
    message = request.form.get("message", "").strip()

    if title and message:
        post_id_counter += 1
        posts.append(
            {
                "id": post_id_counter,
                "title": title,
                "message": message,
                "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            }
        )

    return redirect(url_for("index"))


@app.route("/delete/<int:pid>", methods=["POST"])
def delete_post(pid):
    global posts
    posts = [p for p in posts if p["id"] != pid]
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
