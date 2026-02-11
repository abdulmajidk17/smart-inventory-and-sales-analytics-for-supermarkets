from app import app, db, Product, Customer, Sale, Vendor
from datetime import datetime, timedelta
import random

with app.app_context():
    # Clear existing data
    Sale.query.delete()
    Product.query.delete()
    Customer.query.delete()
    Vendor.query.delete()
    
    # Create vendors
    vendors = [
        Vendor(name="ABC Suppliers", contact_person="John Doe", email="john@abc.com", phone="1234567890", status="active", rating=4.5),
        Vendor(name="XYZ Distributors", contact_person="Jane Smith", email="jane@xyz.com", phone="0987654321", status="active", rating=4.2),
    ]
    for v in vendors:
        db.session.add(v)
    db.session.commit()
    
    # Create products
    products = [
        Product(name="Rice 1kg", category="Groceries", stock=100, price=50, gst_rate=5, final_price=52.5, vendor_id=vendors[0].id),
        Product(name="Wheat Flour 1kg", category="Groceries", stock=80, price=40, gst_rate=5, final_price=42, vendor_id=vendors[0].id),
        Product(name="Sugar 1kg", category="Groceries", stock=60, price=45, gst_rate=5, final_price=47.25, vendor_id=vendors[1].id),
        Product(name="Cooking Oil 1L", category="Groceries", stock=50, price=120, gst_rate=12, final_price=134.4, vendor_id=vendors[1].id),
        Product(name="Tea 250g", category="Beverages", stock=90, price=80, gst_rate=12, final_price=89.6, vendor_id=vendors[0].id),
        Product(name="Coffee 200g", category="Beverages", stock=70, price=150, gst_rate=12, final_price=168, vendor_id=vendors[1].id),
        Product(name="Milk 1L", category="Dairy", stock=40, price=60, gst_rate=5, final_price=63, vendor_id=vendors[0].id),
        Product(name="Bread", category="Bakery", stock=30, price=35, gst_rate=5, final_price=36.75, vendor_id=vendors[1].id),
        Product(name="Biscuits", category="Snacks", stock=120, price=25, gst_rate=12, final_price=28, vendor_id=vendors[0].id),
        Product(name="Chips", category="Snacks", stock=100, price=20, gst_rate=12, final_price=22.4, vendor_id=vendors[1].id),
    ]
    for p in products:
        db.session.add(p)
    db.session.commit()
    
    # Create customers
    customers = [
        Customer(name="Rajesh Kumar", phone="9876543210", email="rajesh@email.com", address="123 Main St"),
        Customer(name="Priya Sharma", phone="9876543211", email="priya@email.com", address="456 Park Ave"),
        Customer(name="Amit Patel", phone="9876543212", email="amit@email.com", address="789 Lake Rd"),
        Customer(name="Sneha Reddy", phone="9876543213", email="sneha@email.com", address="321 Hill St"),
        Customer(name="Vikram Singh", phone="9876543214", email="vikram@email.com", address="654 River Ln"),
    ]
    for c in customers:
        db.session.add(c)
    db.session.commit()
    
    # Create sales data for last 60 days
    start_date = datetime.now().date() - timedelta(days=60)
    
    for day in range(60):
        current_date = start_date + timedelta(days=day)
        num_sales = random.randint(5, 15)
        
        for _ in range(num_sales):
            product = random.choice(products)
            customer = random.choice(customers)
            quantity = random.randint(1, 5)
            
            sale = Sale(
                transaction_id=f"TXN-{current_date.strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                product_id=product.id,
                customer_id=customer.id,
                quantity=quantity,
                date=current_date
            )
            db.session.add(sale)
    
    db.session.commit()
    print("✅ Sample data created successfully!")
    print(f"   - {len(vendors)} vendors")
    print(f"   - {len(products)} products")
    print(f"   - {len(customers)} customers")
    print(f"   - {Sale.query.count()} sales transactions")
