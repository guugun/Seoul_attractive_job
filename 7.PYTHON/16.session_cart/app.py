from flask import Flask, render_template, session, redirect, url_for, request, flash

app = Flask(__name__)
app.secret_key = "hello1234"

items = [
    {"id": "item1", "name": "햄버거", "price": 3000},
    {"id": "item2", "name": "핫도그", "price": 2000},
    {"id": "item3", "name": "콜라", "price": 1500},
]
users = [
    {"id": "alice", "pw": "alice", "name": "Alice"},
]


@app.route("/")
def index():
    user = session.get("user")
    return render_template("product.html", items=items, user=user)


@app.route("/add_to_cart/<item_id>")
def add_to_cart(item_id):
    print("장바구니에 담을 상품: ", item_id)
    if "user" not in session:
        return redirect(url_for("login"))

    if "cart" not in session:
        session["cart"] = {}

    if item_id in session["cart"]:
        session["cart"][item_id] += 1
    else:
        # 장바구니에 담을 상품이 실제로 존재하는가??
        session["cart"][item_id] = 1

    print(session["cart"])
    session.modified = True  # 세션 데이터가 수정되었음을 flask에게 인지시킴
    item = next((i for i in items if i["id"] == item_id), None)
    flash(f"{item['name']}을(를) 장바구니에 담았습니다!")

    return redirect(url_for("index"))


@app.route("/cart")
def view_cart():
    cart_items = {}
    total_price = 0

    for item_id, quantity in session.get("cart", {}).items():
        item = next((i for i in items if i["id"] == item_id), None)
        cart_items[item_id] = {
            "name": item["name"],
            "quantity": quantity,
            "price": item["price"],
        }
        total_price += item["price"] * quantity

    return render_template(
        "cart.html",
        cart_items=cart_items,
        total_price=total_price,
        user=session.get("user"),
    )  # 여기에 장바구니에 담긴 상품 채워넣기


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        # 1. 요청에서 id/pw 가져온다
        id = request.form.get("id")
        pw = request.form.get("pw")

        # 2. user db에서 이 사용자 매칭한다
        user = next((u for u in users if u["id"] == id and u["pw"] == pw), None)

        # 3. 사용자가 있으면??
        if user:
            session["user"] = user  # 로그인한 사용자를 세션에 저장한다.
            error = None
            return redirect(url_for("index"))
        else:
            error = "Invalid ID or password"

    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("index"))


@app.route("/remove_from_cart/<item_id>")
def remove_from_cart(item_id):
    # 1. session['cart'] 안에 item_id가 있으면
    # 2. 그 키를 삭제
    # 3. session.modified = True
    # 4. 장바구니 페이지로 redirect
    print("장바구니에 담을 상품: ", item_id)

    if item_id in session["cart"]:
        session["cart"].pop(item_id, None)

    print(session["cart"])
    session.modified = True  # 세션 데이터가 수정되었음을 flask에게 인지시킴

    return redirect(url_for("view_cart"))


if __name__ == "__main__":
    app.run(debug=True)
