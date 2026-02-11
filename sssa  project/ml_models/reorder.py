"""
Reorder prediction using Random Forest Classifier
"""
import pandas as pd
import numpy as np
from .config import DEBUG

class ReorderPredictor:
    def calculate_eoq_and_reorder_point(self, products, sales):
        """
        Calculate EOQ and reorder point for each product.
        
        Args:
            products: List of product dictionaries
            sales: List of sales dictionaries
            
        Returns:
            Dictionary with success status and predictions
        """
        try:
            if not products:
                return {'success': False, 'message': 'No products available.'}
            
            products_df = pd.DataFrame(products)
            sales_df = pd.DataFrame(sales) if sales else pd.DataFrame()
            
            # Calculate daily demand for each product
            if sales_df.empty:
                products_df['daily_demand'] = 0
            else:
                sales_df['date'] = pd.to_datetime(sales_df['date'])
                
                # Calculate demand over the last 30 days for more recent trends
                recent_date = sales_df['date'].max() - pd.Timedelta(days=30)
                recent_sales = sales_df[sales_df['date'] >= recent_date]
                
                if not recent_sales.empty:
                    sales_summary = recent_sales.groupby('product_id').agg(
                        total_quantity=('quantity', 'sum'),
                        days_with_sales=('date', 'nunique')
                    ).reset_index()
                    
                    # Calculate daily demand based on recent sales
                    sales_summary['daily_demand'] = sales_summary['total_quantity'] / sales_summary['days_with_sales']
                else:
                    # Fallback to overall average if no recent sales
                    sales_summary = sales_df.groupby('product_id').agg(
                        total_quantity=('quantity', 'sum'),
                        first_sale=('date', 'min'),
                        last_sale=('date', 'max')
                    ).reset_index()
                    
                    sales_summary['sales_period'] = (sales_summary['last_sale'] - sales_summary['first_sale']).dt.days + 1
                    sales_summary['daily_demand'] = sales_summary['total_quantity'] / sales_summary['sales_period']
                
                products_df = products_df.merge(
                    sales_summary[['product_id', 'daily_demand']],
                    left_on='id',
                    right_on='product_id',
                    how='left'
                )
                products_df['daily_demand'] = products_df['daily_demand'].fillna(0)

            # Ensure minimum values for calculations
            products_df['daily_demand'] = products_df['daily_demand'].clip(lower=0.1)  # Minimum 0.1 units per day
            products_df['holding_cost'] = products_df['holding_cost'].clip(lower=0.01)  # Minimum holding cost
            products_df['order_cost'] = products_df['order_cost'].clip(lower=1.0)  # Minimum order cost
            products_df['lead_time'] = products_df['lead_time'].clip(lower=1)  # Minimum 1 day lead time

            # --- EOQ Calculation ---
            products_df['eoq'] = np.sqrt(
                (2 * products_df['daily_demand'] * 365 * products_df['order_cost']) / 
                products_df['holding_cost']
            ).round().astype(int)

            # --- Reorder Point Calculation ---
            # Include safety stock (20% of lead time demand)
            safety_factor = 1.2
            products_df['reorder_point'] = (products_df['daily_demand'] * products_df['lead_time'] * safety_factor).round().astype(int)
            
            # --- Generate Predictions ---
            # Predict reorder if stock is below reorder point or very low
            products_df['should_reorder'] = (
                (products_df['stock'] <= products_df['reorder_point']) |
                (products_df['stock'] <= 5)  # Always reorder if stock is 5 or less
            )
            
            predictions = []
            for _, product in products_df[products_df['should_reorder']].iterrows():
                predictions.append({
                    'id': int(product['id']),
                    'name': product['name'],
                    'category': product.get('category', 'Unknown'),
                    'stock': int(product['stock']),
                    'reorder_point': int(product['reorder_point']),
                    'eoq': int(product['eoq']),
                    'daily_demand': round(float(product['daily_demand']), 2),
                    'urgency': 'high' if product['stock'] <= 5 else 'medium'
                })

            return {
                'success': True,
                'reorder_predictions': predictions
            }

        except Exception as e:
            if DEBUG:
                return {'success': False, 'message': str(e)}
            return {'success': False, 'message': 'Error in reorder prediction.'} 