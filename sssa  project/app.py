import json
import logging
import os
import uuid
from datetime import datetime, timedelta

import click
import jwt
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import joinedload
from werkzeug.security import check_password_hash, generate_password_hash

from ml_models import ProductRecommender, ReorderPredictor, SalesForecaster

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.DEBUG)

basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, "instance", "inventory.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "your-secret-key-here"

db = SQLAlchemy(app)

sales_forecaster = SalesForecaster()
product_recommender = ProductRecommender()
reorder_predictor = ReorderPredictor()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def generate_token(self):
        payload = {
            "user_id": self.id,
            "username": self.username,
            "is_admin": self.is_admin,
            "exp": datetime.utcnow() + timedelta(days=1),
        }
        return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")


def token_required(f):
    from functools import wraps

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]

        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.get(data["user_id"])
            if not current_user:
                return jsonify({"error": "Invalid token"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401

        return f(current_user, *args, **kwargs)

    return decorated


class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    address = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.now)
    sales = db.relationship("Sale", backref="customer", lazy=True)


class Vendor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    status = db.Column(db.String(20), default="active")
    rating = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    products = db.relationship("Product", backref="vendor", lazy=True)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    gst_rate = db.Column(db.Float, nullable=False, default=18.0)
    final_price = db.Column(db.Float, nullable=False)
    holding_cost = db.Column(db.Float, nullable=False, default=0.5)
    order_cost = db.Column(db.Float, nullable=False, default=5.0)
    lead_time = db.Column(db.Integer, nullable=False, default=7)
    min_stock = db.Column(db.Integer, nullable=False, default=10)
    reorder_point = db.Column(db.Integer, nullable=False, default=20)
    max_stock = db.Column(db.Integer, nullable=False, default=1000)
    vendor_id = db.Column(db.Integer, db.ForeignKey("vendor.id"))
    sales = db.relationship("Sale", backref="product", lazy=True)

    @property
    def gst_amount(self):
        return (self.price * self.gst_rate) / 100

    def calculate_final_price(self):
        return self.price + self.gst_amount

    @property
    def safety_stock(self):
        return max(5, int(self.min_stock * 0.2))

    @property
    def available_stock(self):
        return max(0, self.stock - self.safety_stock)

    @property
    def stock_status(self):
        if self.stock <= self.safety_stock:
            return "critical"
        elif self.stock <= self.reorder_point:
            return "low"
        elif self.stock >= self.max_stock * 0.9:
            return "overstocked"
        else:
            return "normal"

    @property
    def needs_reorder(self):
        return self.stock <= self.reorder_point


class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.String(36), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    date = db.Column(db.Date, nullable=False)


class Setting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.String(500))
    category = db.Column(db.String(50))
    description = db.Column(db.String(200))
    data_type = db.Column(db.String(20))
    is_public = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)


class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_number = db.Column(db.String(20), unique=True, nullable=False)
    transaction_id = db.Column(db.String(36), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey("customer.id"), nullable=True)
    cashier_name = db.Column(db.String(100), default="Cashier")
    subtotal = db.Column(db.Float, nullable=False)
    tax_amount = db.Column(db.Float, default=0.0)
    discount_amount = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), default="Cash")
    created_at = db.Column(db.DateTime, default=datetime.now)
    customer = db.relationship("Customer", backref="bills")
    bill_items = db.relationship("BillItem", backref="bill", lazy=True, cascade="all, delete-orphan")


class BillItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey("bill.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    line_total = db.Column(db.Float, nullable=False)
    product = db.relationship("Product", backref="bill_items")


class PurchaseOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey("vendor.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.now)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="pending")
    expected_delivery = db.Column(db.DateTime)
    actual_delivery = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    vendor = db.relationship("Vendor", backref="purchase_orders")
    product = db.relationship("Product", backref="purchase_orders")


class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.now)
    action = db.Column(db.String(50), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer)
    user_id = db.Column(db.Integer)
    description = db.Column(db.Text, nullable=False)
    details = db.Column(db.Text)


def log_audit(action, entity_type, entity_id, description, details=None, user_id=None):
    try:
        log_entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            details=json.dumps(details) if details else None,
            user_id=user_id,
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Failed to create audit log: {str(e)}")
        db.session.rollback()


@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data or "username" not in data or "password" not in data:
            return jsonify({"error": "Username and password are required"}), 400

        user = User.query.filter_by(username=data["username"]).first()
        if not user or not user.check_password(data["password"]):
            return jsonify({"error": "Invalid username or password"}), 401

        user.last_login = datetime.now()
        db.session.commit()

        token = user.generate_token()

        return jsonify({
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "is_admin": user.is_admin,
            },
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/auth/verify", methods=["GET"])
@token_required
def verify_token(current_user):
    return jsonify({
        "valid": True,
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "is_admin": current_user.is_admin,
        },
    })


@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        product_count = Product.query.count()
        return jsonify({
            "status": "healthy",
            "database": "connected",
            "products": product_count,
            "schema_version": "v2",
        })
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500


@app.route("/products", methods=["GET", "POST"])
def handle_products():
    if request.method == "POST":
        try:
            data = request.get_json()
            base_price = float(data["price"])
            gst_rate = float(data.get("gst_rate", 18.0))
            final_price = base_price + (base_price * gst_rate / 100)

            new_product = Product(
                name=data["name"],
                category=data["category"],
                stock=int(data["stock"]),
                price=base_price,
                gst_rate=gst_rate,
                final_price=final_price,
                holding_cost=float(data.get("holding_cost", base_price * 0.01)),
                order_cost=float(data.get("order_cost", 50.0)),
                lead_time=int(data.get("lead_time", 7)),
                min_stock=int(data.get("min_stock", max(5, int(data["stock"]) // 10))),
                reorder_point=int(data.get("reorder_point", max(10, int(data["stock"]) // 5))),
                max_stock=int(data.get("max_stock", int(data["stock"]) * 5)),
                vendor_id=data.get("vendor_id"),
            )
            db.session.add(new_product)
            db.session.commit()
            return jsonify({"message": "Product added successfully", "product": {"id": new_product.id}}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

    products = Product.query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "category": p.category,
        "stock": p.stock,
        "price": p.price,
        "gst_rate": p.gst_rate,
        "final_price": p.final_price,
        "min_stock": p.min_stock,
        "reorder_point": p.reorder_point,
        "stock_status": p.stock_status,
        "safety_stock": p.safety_stock,
    } for p in products])


@app.route("/products/<int:product_id>", methods=["PUT", "DELETE"])
def manage_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    if request.method == "DELETE":
        db.session.delete(product)
        db.session.commit()
        return jsonify({"message": "Product deleted"}), 200
    
    try:
        data = request.get_json()
        base_price = float(data.get("price", product.price))
        gst_rate = float(data.get("gst_rate", product.gst_rate))
        
        product.name = data.get("name", product.name)
        product.category = data.get("category", product.category)
        product.stock = int(data.get("stock", product.stock))
        product.price = base_price
        product.gst_rate = gst_rate
        product.final_price = base_price + (base_price * gst_rate / 100)
        product.holding_cost = float(data.get("holding_cost", product.holding_cost))
        product.order_cost = float(data.get("order_cost", product.order_cost))
        product.lead_time = int(data.get("lead_time", product.lead_time))
        product.min_stock = int(data.get("min_stock", product.min_stock))
        product.reorder_point = int(data.get("reorder_point", product.reorder_point))
        product.max_stock = int(data.get("max_stock", product.max_stock))
        product.vendor_id = data.get("vendor_id", product.vendor_id)
        
        db.session.commit()
        return jsonify({"message": "Product updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route("/customers", methods=["GET", "POST"])
def handle_customers():
    if request.method == "POST":
        data = request.get_json()
        new_customer = Customer(
            name=data["name"],
            phone=data.get("phone"),
            email=data.get("email"),
            address=data.get("address"),
        )
        db.session.add(new_customer)
        db.session.commit()
        return jsonify({"message": "Customer added"}), 201

    customers = Customer.query.all()
    return jsonify([{"id": c.id, "name": c.name, "phone": c.phone, "email": c.email} for c in customers])


@app.route("/sales", methods=["POST"])
def add_sale():
    try:
        data = request.get_json()
        sale_date = datetime.strptime(data["date"], "%Y-%m-%d").date()
        product = Product.query.get(data["product_id"])
        
        if not product or product.stock < data["quantity"]:
            return jsonify({"error": "Insufficient stock"}), 400

        new_sale = Sale(
            transaction_id=str(uuid.uuid4()),
            product_id=data["product_id"],
            customer_id=data.get("customer_id"),
            quantity=data["quantity"],
            date=sale_date,
        )
        product.stock -= data["quantity"]
        db.session.add(new_sale)
        db.session.commit()
        return jsonify({"message": "Sale added"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/sales-data", methods=["GET"])
def get_sales_data():
    sales = Sale.query.all()
    return jsonify([{
        "id": s.id,
        "product_id": s.product_id,
        "quantity": s.quantity,
        "date": s.date.strftime("%Y-%m-%d"),
    } for s in sales])


@app.route("/forecast", methods=["GET"])
def get_forecast():
    try:
        product_id = request.args.get("product_id", type=int)
        sales = Sale.query.all()
        app.logger.info(f"Forecast request - Product ID: {product_id}, Total sales: {len(sales)}")
        
        if not sales:
            app.logger.warning("No sales data found")
            return jsonify({"success": True, "forecast": [], "summary": {"total_predicted_sales": 0, "average_daily_sales": 0, "forecast_trend": 0, "forecast_period": "0 days", "confidence_level": "N/A", "model_type": "No Data"}})

        sales_data = [{"date": s.date.strftime("%Y-%m-%d"), "quantity": s.quantity, "product_id": s.product_id} for s in sales]
        app.logger.info(f"Generating forecast with {len(sales_data)} sales records")
        result = sales_forecaster.generate_forecast(sales_data, product_id)
        app.logger.info(f"Forecast result: {result.get('success', False)}")
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Forecast error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/recommend", methods=["GET"])
def get_recommendations():
    try:
        sales = Sale.query.all()
        products = Product.query.all()
        sales_data = [{"transaction_id": s.transaction_id, "product_id": s.product_id} for s in sales]
        products_data = [{"id": p.id, "name": p.name, "category": p.category, "price": p.price} for p in products]
        result = product_recommender.generate_recommendations(sales_data, products_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/reorder", methods=["GET"])
def get_reorder():
    try:
        products = Product.query.all()
        sales = Sale.query.all()
        product_data = [{"id": p.id, "name": p.name, "category": p.category, "stock": p.stock, "price": p.price, "holding_cost": p.holding_cost, "order_cost": p.order_cost, "lead_time": p.lead_time, "reorder_point": p.reorder_point} for p in products]
        sales_data = [{"product_id": s.product_id, "quantity": s.quantity, "date": s.date.strftime("%Y-%m-%d")} for s in sales]
        result = reorder_predictor.calculate_eoq_and_reorder_point(product_data, sales_data)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/sales-summary", methods=["GET"])
def get_sales_summary():
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        query = db.session.query(
            Sale.date,
            db.func.count(Sale.id).label("total_transactions"),
            db.func.sum(Sale.quantity * Product.price).label("total_revenue"),
            db.func.sum(Sale.quantity).label("total_units_sold"),
        ).join(Product)
        
        if start_date:
            query = query.filter(Sale.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
        if end_date:
            query = query.filter(Sale.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
        
        results = query.group_by(Sale.date).all()
        return jsonify([{
            "date": r.date.strftime("%Y-%m-%d"),
            "total_transactions": r.total_transactions,
            "total_revenue": float(r.total_revenue or 0),
            "total_units_sold": r.total_units_sold,
        } for r in results])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/vendors", methods=["GET", "POST"])
def handle_vendors():
    if request.method == "POST":
        data = request.get_json()
        vendor = Vendor(
            name=data["name"],
            contact_person=data.get("contact_person"),
            email=data.get("email"),
            phone=data.get("phone"),
            address=data.get("address"),
            status=data.get("status", "active"),
            rating=data.get("rating", 0),
        )
        db.session.add(vendor)
        db.session.commit()
        return jsonify({"message": "Vendor added"}), 201

    vendors = Vendor.query.all()
    return jsonify([{"id": v.id, "name": v.name, "contact_person": v.contact_person, "email": v.email, "phone": v.phone, "address": v.address, "status": v.status, "rating": v.rating} for v in vendors])


@app.route("/api/vendors/<int:vendor_id>", methods=["PUT", "DELETE"])
def manage_vendor(vendor_id):
    vendor = Vendor.query.get(vendor_id)
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404
    
    if request.method == "DELETE":
        db.session.delete(vendor)
        db.session.commit()
        return jsonify({"message": "Vendor deleted"}), 200
    
    data = request.get_json()
    vendor.name = data.get("name", vendor.name)
    vendor.contact_person = data.get("contact_person", vendor.contact_person)
    vendor.email = data.get("email", vendor.email)
    vendor.phone = data.get("phone", vendor.phone)
    vendor.address = data.get("address", vendor.address)
    vendor.status = data.get("status", vendor.status)
    vendor.rating = data.get("rating", vendor.rating)
    db.session.commit()
    return jsonify({"message": "Vendor updated"}), 200


@app.route("/api/vendors/<int:vendor_id>/performance", methods=["GET"])
def get_vendor_performance(vendor_id):
    return jsonify({"on_time_delivery_rate": 0.95, "average_delivery_days": 5.2, "order_fulfillment_rate": 0.98, "total_orders": 0, "total_spend": 0})


@app.route("/api/purchase-orders", methods=["GET", "POST"])
def handle_purchase_orders():
    if request.method == "POST":
        try:
            data = request.get_json()
            po = PurchaseOrder(
                vendor_id=data["vendor_id"],
                product_id=data["product_id"],
                quantity=data["quantity"],
                unit_price=data["unit_price"],
                expected_delivery=datetime.strptime(data["expected_delivery"], "%Y-%m-%dT%H:%M:%S.%fZ") if data.get("expected_delivery") else None,
                notes=data.get("notes", ""),
            )
            db.session.add(po)
            db.session.commit()
            return jsonify({"message": "Purchase order created"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500
    
    orders = PurchaseOrder.query.options(joinedload(PurchaseOrder.vendor), joinedload(PurchaseOrder.product)).all()
    return jsonify([{"id": o.id, "vendor": {"id": o.vendor.id, "name": o.vendor.name} if o.vendor else None, "product": {"id": o.product.id, "name": o.product.name} if o.product else None, "quantity": o.quantity, "unit_price": o.unit_price, "status": o.status, "expected_delivery": o.expected_delivery.isoformat() if o.expected_delivery else None} for o in orders])


@app.route("/api/purchase-orders/<int:order_id>", methods=["PUT"])
def update_purchase_order(order_id):
    try:
        order = PurchaseOrder.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404
        
        data = request.get_json()
        if "status" in data:
            order.status = data["status"]
        if "quantity" in data:
            order.quantity = data["quantity"]
        if "unit_price" in data:
            order.unit_price = data["unit_price"]
        db.session.commit()
        return jsonify({"message": "Order updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/purchase-orders/from-reorder", methods=["POST"])
def create_purchase_order():
    try:
        data = request.get_json()
        product = Product.query.get(data["product_id"])
        vendor = Vendor.query.get(data["vendor_id"])
        expected_delivery = datetime.now() + timedelta(days=product.lead_time)

        po = PurchaseOrder(
            vendor_id=data["vendor_id"],
            product_id=data["product_id"],
            quantity=data["quantity"],
            unit_price=product.price * 0.7,
            expected_delivery=expected_delivery,
            notes=data.get("notes", ""),
        )
        db.session.add(po)
        db.session.commit()

        return jsonify({
            "message": "Purchase order created",
            "purchase_order": {
                "id": po.id,
                "product_name": product.name,
                "vendor_name": vendor.name,
                "vendor_email": vendor.email,
                "quantity": po.quantity,
                "unit_price": po.unit_price,
                "expected_delivery": po.expected_delivery.strftime("%Y-%m-%d"),
            },
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/audit-logs", methods=["GET"])
def get_audit_logs():
    try:
        logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
        return jsonify([{
            "id": log.id,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "action": log.action,
            "entity_type": log.entity_type,
            "description": log.description,
        } for log in logs])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/bills/generate", methods=["POST"])
def generate_bill():
    try:
        data = request.get_json()
        transaction_id = str(uuid.uuid4())
        bill_number = f"BILL-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        subtotal = sum(item["line_total"] for item in data["items"])
        discount_amount = subtotal * (data.get("discount_percent", 0) / 100)
        total_amount = subtotal - discount_amount
        
        bill = Bill(
            bill_number=bill_number,
            transaction_id=transaction_id,
            customer_id=data.get("customer_id"),
            subtotal=subtotal,
            discount_amount=discount_amount,
            total_amount=total_amount,
            payment_method=data.get("payment_method", "Cash"),
        )
        db.session.add(bill)
        
        for item in data["items"]:
            product = Product.query.get(item["product_id"])
            if not product or product.stock < item["quantity"]:
                db.session.rollback()
                return jsonify({"error": f"Insufficient stock for {item['product_name']}"}), 400
            
            bill_item = BillItem(
                bill_id=bill.id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                line_total=item["line_total"],
            )
            db.session.add(bill_item)
            
            sale = Sale(
                transaction_id=transaction_id,
                product_id=item["product_id"],
                customer_id=data.get("customer_id"),
                quantity=item["quantity"],
                date=datetime.now().date(),
            )
            db.session.add(sale)
            
            product.stock -= item["quantity"]
        
        db.session.commit()
        return jsonify({"bill_id": bill.id, "bill_number": bill_number}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/bills/<int:bill_id>", methods=["GET"])
def get_bill(bill_id):
    try:
        bill = Bill.query.options(joinedload(Bill.bill_items).joinedload(BillItem.product)).get(bill_id)
        if not bill:
            return jsonify({"error": "Bill not found"}), 404
        
        return jsonify({
            "bill_number": bill.bill_number,
            "transaction_id": bill.transaction_id,
            "customer": {"name": bill.customer.name if bill.customer else "Walk-in Customer"},
            "cashier_name": bill.cashier_name,
            "created_at": bill.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "subtotal": bill.subtotal,
            "tax_amount": bill.tax_amount,
            "discount_amount": bill.discount_amount,
            "total_amount": bill.total_amount,
            "payment_method": bill.payment_method,
            "items": [{
                "product_name": item.product.name,
                "category": item.product.category,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.line_total,
            } for item in bill.bill_items],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/product-performance", methods=["GET"])
def get_product_performance():
    try:
        products = Product.query.all()
        result = []
        for p in products:
            sales = Sale.query.filter_by(product_id=p.id).all()
            total_quantity = sum(s.quantity for s in sales)
            total_revenue = total_quantity * p.price
            stock_turnover = round(total_quantity / max(1, p.stock), 2) if p.stock > 0 else 0
            result.append({
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "current_stock": p.stock,
                "total_sales": total_quantity,
                "total_revenue": total_revenue,
                "stock_turnover": stock_turnover,
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/customer-insights", methods=["GET"])
def get_customer_insights():
    try:
        customers = Customer.query.all()
        result = []
        for c in customers:
            sales = Sale.query.filter_by(customer_id=c.id).all()
            total_purchases = len(sales)
            total_spent = sum(s.quantity * Product.query.get(s.product_id).price for s in sales if Product.query.get(s.product_id))
            last_purchase = max([s.date for s in sales], default=None)
            categories = [Product.query.get(s.product_id).category for s in sales if Product.query.get(s.product_id)]
            favorite_categories = list(set(categories))[:3] if categories else []
            result.append({
                "customer_id": c.id,
                "name": c.name,
                "total_purchases": total_purchases,
                "total_spent": total_spent,
                "last_purchase_date": last_purchase.strftime("%Y-%m-%d") if last_purchase else None,
                "favorite_categories": favorite_categories,
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/reports/revenue-analytics", methods=["GET"])
def get_revenue_analytics():
    try:
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        query = db.session.query(
            db.func.strftime('%Y-%m', Sale.date).label('month'),
            db.func.sum(Sale.quantity * Product.price).label('revenue'),
            db.func.count(Sale.id).label('transactions')
        ).join(Product).group_by(db.func.strftime('%Y-%m', Sale.date))
        
        if start_date:
            query = query.filter(Sale.date >= datetime.strptime(start_date, "%Y-%m-%d").date())
        if end_date:
            query = query.filter(Sale.date <= datetime.strptime(end_date, "%Y-%m-%d").date())
        
        results = query.all()
        return jsonify([{"month": r.month, "revenue": float(r.revenue or 0), "transactions": r.transactions} for r in results])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/inventory/low-stock", methods=["GET"])
def get_low_stock():
    try:
        products = Product.query.all()
        critical = [p for p in products if p.stock_status == "critical"]
        low = [p for p in products if p.stock_status == "low"]
        return jsonify({
            "critical_stock": [{"id": p.id, "name": p.name, "category": p.category, "stock": p.stock, "safety_stock": p.safety_stock, "needs_reorder": p.needs_reorder} for p in critical],
            "low_stock": [{"id": p.id, "name": p.name, "category": p.category, "stock": p.stock, "reorder_point": p.reorder_point, "available_stock": p.available_stock} for p in low],
            "summary": {"critical_count": len(critical), "low_stock_count": len(low)},
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    try:
        total_products = Product.query.count()
        total_customers = Customer.query.count()
        total_sales = Sale.query.count()
        low_stock = Product.query.filter(Product.stock <= Product.reorder_point).count()
        
        return jsonify({
            "total_products": total_products,
            "total_customers": total_customers,
            "total_sales": total_sales,
            "low_stock_items": low_stock,
            "total_revenue": 0,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/forecast/all-products", methods=["GET"])
def get_all_forecast():
    return jsonify({"success": True, "forecasts": [], "failed": []})


@app.route("/api/inventory/status", methods=["GET"])
def get_inventory_status():
    try:
        products = Product.query.all()
        return jsonify({
            "total_products": len(products),
            "status_distribution": {"normal": len(products), "low": 0, "critical": 0},
            "total_stock_value": sum(p.stock * p.price for p in products),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/inventory/by-category", methods=["GET"])
def get_inventory_by_category():
    try:
        products = Product.query.all()
        categories = {}
        for p in products:
            if p.category not in categories:
                categories[p.category] = {
                    "category": p.category,
                    "total_products": 0,
                    "total_stock": 0,
                    "available_stock": 0,
                    "total_value": 0,
                    "reorder_needed": 0,
                    "category_health": "healthy",
                }
            categories[p.category]["total_products"] += 1
            categories[p.category]["total_stock"] += p.stock
            categories[p.category]["available_stock"] += p.available_stock
            categories[p.category]["total_value"] += p.stock * p.price
            if p.needs_reorder:
                categories[p.category]["reorder_needed"] += 1
        
        return jsonify({"categories": list(categories.values())})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/inventory/restock", methods=["POST"])
def restock_inventory():
    try:
        data = request.get_json()
        product = Product.query.get(data["product_id"])
        if not product:
            return jsonify({"error": "Product not found"}), 404
        
        product.stock += int(data["quantity"])
        db.session.commit()
        
        log_audit("RESTOCK", "Product", product.id, f"Restocked {data['quantity']} units of {product.name}", data)
        
        return jsonify({"message": "Inventory restocked successfully", "new_stock": product.stock}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/settings", methods=["GET"])
def get_settings():
    try:
        settings = Setting.query.filter_by(is_public=True).all()
        return jsonify([{"key": s.key, "value": s.value, "category": s.category, "description": s.description, "data_type": s.data_type} for s in settings])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/settings/<key>", methods=["PUT"])
def update_setting(key):
    try:
        setting = Setting.query.filter_by(key=key).first()
        if not setting:
            return jsonify({"error": "Setting not found"}), 404
        
        data = request.get_json()
        setting.value = data["value"]
        db.session.commit()
        return jsonify({"message": "Setting updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.before_request
def before_request():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
        return response


@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    return response


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        if not User.query.filter_by(username="admin").first():
            admin = User(username="admin", is_admin=True)
            admin.set_password("admin123")
            db.session.add(admin)
            db.session.commit()
    app.run(debug=True)
