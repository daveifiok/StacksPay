"""
Webhook Handler Example for StacksPay Python SDK

This example shows how to handle incoming webhooks from StacksPay
using Flask and verify webhook signatures.
"""

from flask import Flask, request, jsonify
from datetime import datetime
from sbtc_gateway import WebhookUtils

app = Flask(__name__)

# Your webhook secret (get this from your StacksPay dashboard)
WEBHOOK_SECRET = 'whsec_your_webhook_secret_here'

@app.route('/webhook', methods=['POST'])
def webhook_handler():
    signature = request.headers.get('X-Signature')
    payload = request.get_data(as_text=True)

    print(f'📨 Received webhook: signature={"present" if signature else "missing"}, payload_size={len(payload)}')

    try:
        # Verify the webhook signature
        is_valid = WebhookUtils.verify_signature(payload, signature, WEBHOOK_SECRET)

        if not is_valid:
            print('❌ Invalid webhook signature')
            return jsonify({'error': 'Invalid signature'}), 400

        print('✅ Webhook signature verified')

        # Parse the event
        event = WebhookUtils.parse_event(payload)
        
        print(f'📦 Webhook event: id={event.id}, type={event.type}, livemode={event.livemode}')

        # Handle different event types
        if event.type == 'payment.created':
            handle_payment_created(event.data.payment)
        elif event.type == 'payment.paid':
            handle_payment_paid(event.data.payment)
        elif event.type == 'payment.completed':
            handle_payment_completed(event.data.payment)
        elif event.type == 'payment.failed':
            handle_payment_failed(event.data.payment)
        elif event.type == 'payment.expired':
            handle_payment_expired(event.data.payment)
        else:
            print(f'🤷 Unhandled event type: {event.type}')

        # Respond with success
        return jsonify({
            'success': True,
            'message': 'Webhook processed successfully'
        }), 200

    except Exception as e:
        print(f'❌ Webhook processing error: {e}')
        return jsonify({
            'success': False,
            'error': 'Error processing webhook'
        }), 400

def handle_payment_created(payment):
    print(f'🆕 Payment created: id={payment.id}, amount={payment.amount}, currency={payment.currency}')
    
    # Add your business logic here
    # e.g., send confirmation email, update database, etc.

def handle_payment_paid(payment):
    print(f'💰 Payment paid: id={payment.id}, tx_hash={payment.transaction_hash}, confirmations={payment.confirmations}')
    
    # Add your business logic here
    # e.g., start service provisioning, send receipt, etc.

def handle_payment_completed(payment):
    print(f'✅ Payment completed: id={payment.id}, tx_hash={payment.transaction_hash}')
    
    # Add your business logic here
    # e.g., fulfill order, activate service, etc.

def handle_payment_failed(payment):
    print(f'❌ Payment failed: id={payment.id}, status={payment.status}')
    
    # Add your business logic here
    # e.g., notify customer, retry payment, etc.

def handle_payment_expired(payment):
    print(f'⏰ Payment expired: id={payment.id}, expires_at={payment.expires_at}')
    
    # Add your business logic here
    # e.g., clean up resources, notify customer, etc.

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print('🚀 Webhook server starting...')
    print('📨 Webhook endpoint: http://localhost:5000/webhook')
    print('🔗 Health check: http://localhost:5000/health')
    
    app.run(host='0.0.0.0', port=5000, debug=True)
