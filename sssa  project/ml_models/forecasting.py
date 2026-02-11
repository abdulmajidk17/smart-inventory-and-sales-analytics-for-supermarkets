"""
Sales forecasting module using Facebook Prophet with enhanced sparse data handling
"""

import logging
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

try:
    from prophet import Prophet

    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Warning: Prophet not available. Forecasting will be disabled.")
from .config import DEBUG, FORECAST_FUTURE_PERIODS, FORECAST_MIN_PERIODS

# Setup logging for forecasting
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SalesForecaster:
    def __init__(self):
        self.model = None
        self.min_data_points = 3

    def detect_data_sparsity(self, df):
        """Analyze data sparsity and recommend preprocessing approach"""
        if df.empty:
            return {"type": "no_data", "severity": "critical"}

        # Calculate time span and data density
        date_range = (df["ds"].max() - df["ds"].min()).days
        data_points = len(df[df["y"] > 0])  # Only count actual sales days
        density = data_points / max(date_range, 1)

        # Calculate gaps between sales
        sales_days = df[df["y"] > 0].sort_values("ds")
        if len(sales_days) > 1:
            gaps = sales_days["ds"].diff().dt.days.dropna()
            avg_gap = gaps.mean()
            max_gap = gaps.max()
        else:
            avg_gap = max_gap = 0

        analysis = {
            "date_range_days": date_range,
            "data_points": data_points,
            "density": density,
            "avg_gap_days": avg_gap,
            "max_gap_days": max_gap,
            "last_sale": df["ds"].max(),
            "days_since_last_sale": (pd.Timestamp.now() - df["ds"].max()).days,
        }

        # Classify sparsity
        if density > 0.8:
            analysis["type"] = "dense"
            analysis["severity"] = "low"
        elif density > 0.3:
            analysis["type"] = "moderate"
            analysis["severity"] = "medium"
        elif avg_gap > 30:
            analysis["type"] = "very_sparse"
            analysis["severity"] = "high"
        elif avg_gap > 7:
            analysis["type"] = "sparse"
            analysis["severity"] = "medium"
        else:
            analysis["type"] = "irregular"
            analysis["severity"] = "medium"

        return analysis

    def preprocess_sparse_data(self, df, analysis):
        """Preprocess sparse data to improve forecasting"""
        if df.empty:
            return df

        df = df.copy()
        df = df.sort_values("ds").reset_index(drop=True)

        # Remove outliers for better stability
        if len(df[df["y"] > 0]) > 3:
            sales_data = df[df["y"] > 0]["y"]
            mean_val = sales_data.mean()
            std_val = sales_data.std()
            if std_val > 0:
                threshold = mean_val + 3 * std_val
                df.loc[df["y"] > threshold, "y"] = threshold

        if analysis["type"] in ["sparse", "very_sparse"]:
            if DEBUG:
                print(
                    f"🔧 Applying sparse data preprocessing for {analysis['type']} data..."
                )

            # For very sparse data, use conservative smoothing
            if analysis["max_gap_days"] > 60:
                # Fill gaps with very small values to maintain trend
                last_sales = (
                    df[df["y"] > 0].tail(3)["y"].mean()
                    if len(df[df["y"] > 0]) > 0
                    else 1
                )
                df.loc[df["y"] == 0, "y"] = max(0.1, last_sales * 0.1)
            elif analysis["max_gap_days"] > 30:
                # Use interpolation with decay for moderately sparse data
                df["y"] = df["y"].replace(0, np.nan)
                df["y"] = (
                    df["y"]
                    .interpolate(method="linear")
                    .fillna(method="bfill")
                    .fillna(method="ffill")
                )
                # Apply some smoothing
                if len(df) > 3:
                    df["y"] = (
                        df["y"].rolling(window=3, center=True, min_periods=1).mean()
                    )

        # Ensure all values are positive
        df["y"] = df["y"].clip(lower=0.1)

        return df

    def prepare_data(self, sales_data, product_id=None):
        """
        Prepare sales data for Prophet model with enhanced sparse data handling

        Args:
            sales_data: List of dictionaries containing date, quantity, and product_id
            product_id: (Optional) ID of the product to filter by

        Returns:
            DataFrame with 'ds' and 'y' columns
        """
        if not sales_data:
            return pd.DataFrame(columns=["ds", "y"])

        df = pd.DataFrame(sales_data)

        if product_id:
            df = df[df["product_id"] == product_id]

        if "date" in df.columns:
            df = df.rename(columns={"date": "ds", "quantity": "y"})

        # Ensure date column is datetime
        df["ds"] = pd.to_datetime(df["ds"])

        # Group by date and sum quantities
        result = df.groupby("ds")["y"].sum().reset_index()

        # Analyze sparsity and preprocess if needed
        analysis = self.detect_data_sparsity(result)

        # Fill missing dates with 0 sales initially
        if not result.empty:
            date_range = pd.date_range(
                start=result["ds"].min(), end=result["ds"].max(), freq="D"
            )
            full_df = pd.DataFrame({"ds": date_range})
            result = full_df.merge(result, on="ds", how="left").fillna(0)

            # Apply sparse data preprocessing
            result = self.preprocess_sparse_data(result, analysis)

        return result

    def create_fallback_forecast(self, df, days_ahead=FORECAST_FUTURE_PERIODS):
        """Create a simple forecast when Prophet fails or data is too sparse"""
        if DEBUG:
            print("📊 Using fallback forecasting method for sparse data...")

        if df.empty:
            return self._create_zero_forecast(days_ahead)

        # Calculate recent trend from actual sales data
        sales_data = df[df["y"] > 0]
        if len(sales_data) >= 3:
            recent_data = sales_data.tail(min(7, len(sales_data)))
            recent_avg = recent_data["y"].mean()

            # Simple trend calculation
            if len(recent_data) > 1:
                x = range(len(recent_data))
                y = recent_data["y"].values
                slope = np.polyfit(x, y, 1)[0] if np.var(x) > 0 else 0
            else:
                slope = 0
        else:
            recent_avg = sales_data["y"].mean() if not sales_data.empty else 1
            slope = 0

        # Generate forecast
        forecast_dates = pd.date_range(
            start=pd.Timestamp.now().date(), periods=days_ahead, freq="D"
        )

        forecast_list = []
        for i, date in enumerate(forecast_dates):
            # Apply trend with dampening for stability
            predicted = max(0.1, recent_avg + slope * i * 0.3)
            lower_bound = max(0.1, predicted * 0.7)
            upper_bound = predicted * 1.3

            forecast_list.append(
                {
                    "ds": date.strftime("%Y-%m-%d"),
                    "date_formatted": date.strftime("%a, %b %d"),
                    "yhat": round(predicted, 2),
                    "yhat_lower": round(lower_bound, 2),
                    "yhat_upper": round(upper_bound, 2),
                    "confidence_range": f"{lower_bound:.1f}-{upper_bound:.1f}",
                }
            )

        # Calculate summary
        total_forecast = sum(point["yhat"] for point in forecast_list)
        avg_daily = total_forecast / len(forecast_list) if forecast_list else 0
        trend = (
            (
                (forecast_list[-1]["yhat"] - forecast_list[0]["yhat"])
                / max(forecast_list[0]["yhat"], 0.1)
                * 100
            )
            if len(forecast_list) > 1
            else 0
        )

        return {
            "success": True,
            "forecast": forecast_list,
            "summary": {
                "total_predicted_sales": round(total_forecast, 1),
                "average_daily_sales": round(avg_daily, 1),
                "forecast_trend": round(trend, 1),
                "forecast_period": f"{len(forecast_list)} days",
                "confidence_level": "Medium (Fallback)",
                "model_type": "Statistical Fallback",
            },
        }

    def _create_zero_forecast(self, days_ahead):
        """Create a zero forecast when no data is available"""
        forecast_dates = pd.date_range(
            start=pd.Timestamp.now().date(), periods=days_ahead, freq="D"
        )

        forecast_list = []
        for date in forecast_dates:
            forecast_list.append(
                {
                    "ds": date.strftime("%Y-%m-%d"),
                    "date_formatted": date.strftime("%a, %b %d"),
                    "yhat": 0.0,
                    "yhat_lower": 0.0,
                    "yhat_upper": 0.0,
                    "confidence_range": "0.0-0.0",
                }
            )

        return {
            "success": True,
            "forecast": forecast_list,
            "summary": {
                "total_predicted_sales": 0.0,
                "average_daily_sales": 0.0,
                "forecast_trend": 0.0,
                "forecast_period": f"{len(forecast_list)} days",
                "confidence_level": "N/A",
                "model_type": "No Data",
            },
        }

    def generate_forecast(self, sales_data, product_id=None):
        """
        Train Prophet model and make predictions with enhanced sparse data handling

        Args:
            sales_data: List of dictionaries containing date and quantity
            product_id: (Optional) ID of the product to forecast

        Returns:
            Dictionary containing success status and forecast or error message
        """
        if not PROPHET_AVAILABLE:
            return {
                "success": False,
                "message": "Prophet is not installed. Please install it with: pip install prophet",
            }

        try:
            df = self.prepare_data(sales_data, product_id)

            if df.empty or len(df) < FORECAST_MIN_PERIODS:
                if DEBUG:
                    print(
                        f"⚠️  Insufficient data ({len(df)} points), using fallback method"
                    )
                return self.create_fallback_forecast(df)

            # Analyze data sparsity
            analysis = self.detect_data_sparsity(df)
            if DEBUG:
                print(
                    f"📊 Data type: {analysis['type']} ({analysis['data_points']} sales over {analysis['date_range_days']} days)"
                )

            # Ensure we have positive values for Prophet
            df["y"] = df["y"].clip(lower=0.1)

            # Configure Prophet with enhanced parameters for sparse data
            model_params = {
                "daily_seasonality": False,
                "weekly_seasonality": len(df) >= 14
                and analysis["type"] != "very_sparse",
                "yearly_seasonality": False,  # Disable for better stability with sparse data
                "changepoint_prior_scale": 0.001
                if analysis["type"] == "very_sparse"
                else 0.01,
                "seasonality_prior_scale": 0.01,
                "interval_width": 0.8,
                "growth": "linear",
                "n_changepoints": min(5, len(df) // 10),
                "seasonality_mode": "additive",  # More stable for sparse data
            }

            if DEBUG:
                print(
                    f"🤖 Training Prophet model with enhanced configuration for {analysis['type']} data..."
                )

            # Suppress Prophet logging
            logging.getLogger("prophet").setLevel(logging.WARNING)
            logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

            self.model = Prophet(**model_params)

            # Add custom seasonalities for denser data
            if len(df) >= 30 and analysis["severity"] == "low":
                self.model.add_seasonality(name="monthly", period=30.5, fourier_order=3)

            self.model.fit(df)

            # Create future dates starting from TODAY
            today = pd.Timestamp(datetime.now().date())
            last_historical_date = df["ds"].max()

            if last_historical_date < today:
                days_to_today = (today - last_historical_date).days
                total_periods = days_to_today + FORECAST_FUTURE_PERIODS
                future = self.model.make_future_dataframe(periods=total_periods)
            else:
                future = self.model.make_future_dataframe(
                    periods=FORECAST_FUTURE_PERIODS
                )

            forecast = self.model.predict(future)

            # Get future predictions starting from TODAY
            future_only = forecast[forecast["ds"] >= today]
            result = future_only[["ds", "yhat", "yhat_lower", "yhat_upper"]].head(
                FORECAST_FUTURE_PERIODS
            )

            # Enhanced prediction validation for sparse data
            min_threshold = 0.1 if analysis["type"] in ["sparse", "very_sparse"] else 0
            result["yhat"] = result["yhat"].clip(lower=min_threshold)
            result["yhat_lower"] = result["yhat_lower"].clip(lower=0)
            result["yhat_upper"] = result["yhat_upper"].clip(lower=min_threshold)

            # Check if predictions are unreasonably low and use fallback
            historical_avg = (
                df[df["y"] > 0]["y"].mean() if len(df[df["y"] > 0]) > 0 else 1
            )
            if result["yhat"].mean() < 0.1 and historical_avg > 1:
                if DEBUG:
                    print(
                        "⚠️  Prophet predictions too low for sparse data, using fallback method"
                    )
                return self.create_fallback_forecast(df)

            # Round predictions
            result = result.round(2)

            # Convert to response format
            result_records = []
            for _, row in result.iterrows():
                date_obj = pd.to_datetime(row["ds"])
                result_records.append(
                    {
                        "ds": date_obj.strftime("%Y-%m-%d"),
                        "date_formatted": date_obj.strftime("%a, %b %d"),
                        "yhat": float(row["yhat"]),
                        "yhat_lower": float(row["yhat_lower"]),
                        "yhat_upper": float(row["yhat_upper"]),
                        "confidence_range": f"{float(row['yhat_lower']):.1f}-{float(row['yhat_upper']):.1f}",
                    }
                )

            # Calculate summary statistics
            total_forecast = sum(record["yhat"] for record in result_records)
            avg_daily = total_forecast / len(result_records) if result_records else 0
            trend = (
                (
                    (result_records[-1]["yhat"] - result_records[0]["yhat"])
                    / max(result_records[0]["yhat"], 0.1)
                    * 100
                )
                if len(result_records) >= 2
                else 0
            )

            return {
                "success": True,
                "forecast": result_records,
                "summary": {
                    "total_predicted_sales": round(total_forecast, 1),
                    "average_daily_sales": round(avg_daily, 1),
                    "forecast_trend": round(trend, 1),
                    "forecast_period": f"{len(result_records)} days",
                    "confidence_level": "High"
                    if analysis["severity"] == "low"
                    else "Medium",
                    "model_type": f"Enhanced Prophet ({analysis['type'].title()} Data)",
                },
            }

        except Exception as e:
            if DEBUG:
                print(f"⚠️  Prophet failed ({str(e)}), using fallback method")
                import traceback

                traceback.print_exc()

            # Try fallback method
            try:
                df = self.prepare_data(sales_data, product_id)
                return self.create_fallback_forecast(df)
            except Exception as fallback_error:
                logger.error(f"Both Prophet and fallback failed: {str(fallback_error)}")
                return {
                    "success": False,
                    "message": f"All forecasting methods failed: {str(e)}",
                }
                return {"success": False, "message": str(e)}
            return {"success": False, "message": "Error in forecasting"}
