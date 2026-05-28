import os
import logging
from datetime import datetime, timezone
import resend
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

resend.api_key = os.environ["RESEND_API_KEY"]
ALERT_FROM_EMAIL = os.environ.get("ALERT_FROM_EMAIL", "Libretix <onboarding@resend.dev>")

def get_supabase():
    return create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def get_latest_prices(sb) -> dict:
    result = sb.table("stock_prices").select("ticker, price").order("timestamp", desc=True).execute()
    prices = {}
    for row in result.data:
        if row["ticker"] not in prices:
            prices[row["ticker"]] = float(row["price"])
    return prices

def send_alert_email(email: str, ticker: str, condition: str, target_price: float, current_price: float):
    direction = "naik di atas" if condition == "above" else "turun di bawah"
    resend.Emails.send({
        "from": ALERT_FROM_EMAIL,
        "to": email,
        "subject": f"🔔 Alert: {ticker} {direction} {target_price}",
        "html": f"""
        <h2>Price Alert Triggered</h2>
        <p><strong>{ticker}</strong> sekarang di harga <strong>{current_price}</strong></p>
        <p>Target kamu: {condition} {target_price}</p>
        <p><a href="https://libretix.vercel.app/stock/{ticker}">Lihat di Libretix →</a></p>
        """
    })
    log.info(f"Email sent to {email} for {ticker}")

def main():
    log.info("=== Price Alert Checker Start ===")
    sb = get_supabase()

    # Ambil semua alert yang belum triggered
    alerts = sb.table("price_alerts").select("*").eq("is_triggered", False).execute().data
    for alert in alerts:
        try:
            user = sb.auth.admin.get_user_by_id(alert["user_id"])
            alert["email"] = user.user.email if user and user.user else None
        except Exception:
            alert["email"] = None
    if not alerts:
        log.info("No active alerts")
        return

    prices = get_latest_prices(sb)
    triggered = 0

    for alert in alerts:
        ticker = alert["ticker"]
        current = prices.get(ticker)
        if current is None:
            continue

        target = float(alert["target_price"])
        condition = alert["condition"]
        should_trigger = (condition == "above" and current >= target) or \
                         (condition == "below" and current <= target)

        if should_trigger:
            email = alert.get("email")
            if email:
                send_alert_email(email, ticker, condition, target, current)
            sb.table("price_alerts").update({
                "is_triggered": True,
                "triggered_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", alert["id"]).execute()
            triggered += 1

    log.info(f"=== Done. {triggered} alerts triggered ===")

if __name__ == "__main__":
    main()
