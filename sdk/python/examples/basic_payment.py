"""
Basic Payment Example for StacksPay Python SDK

This example demonstrates how to create, retrieve, and manage payments
using the StacksPay Python SDK.
"""

import sbtc_gateway
from sbtc_gateway import PaymentRequest, Customer

def main():
    # Initialize the client
    client = sbtc_gateway.SBTCGateway(
        'sk_test_your_api_key_here',
        # Optional: Custom configuration
        base_url='https://api.stackspay.com',  # Default
        timeout=30,  # 30 seconds
        retries=3
    )

    try:
        print('🚀 Creating a payment...')
        
        # Create a payment
        payment = client.payments.create(PaymentRequest(
            amount=50000,  # 0.0005 BTC in satoshis
            currency='sbtc',
            description='Premium subscription',
            customer=Customer(
                email='customer@example.com',
                name='John Doe'
            ),
            metadata={
                'order_id': 'order_123',
                'user_id': '456'
            },
            webhook_url='https://yoursite.com/webhook',
            redirect_url='https://yoursite.com/success',
            expires_in=3600  # 1 hour
        ))

        print('✅ Payment created successfully!')
        print(f'Payment ID: {payment.id}')
        print(f'Payment URL: {payment.payment_url}')
        print(f'QR Code: {payment.qr_code}')
        print(f'Status: {payment.status}')

        # Retrieve the payment
        print('\n📋 Retrieving payment...')
        retrieved_payment = client.payments.retrieve(payment.id)
        print(f'Retrieved payment status: {retrieved_payment.status}')

        # List payments
        print('\n📄 Listing payments...')
        payment_list = client.payments.list(
            page=1,
            limit=10,
            status='pending'
        )

        payments = payment_list.payments
        pagination = payment_list.pagination

        print(f'Found {len(payments)} payments')
        print(f'Pagination: {pagination}')

        # Example: Cancel a payment if it's still pending
        if payment.status == 'pending':
            print('\n❌ Cancelling payment...')
            cancelled_payment = client.payments.cancel(payment.id)
            print(f'Payment cancelled: {cancelled_payment.status}')

    except sbtc_gateway.SBTCGatewayError as e:
        print(f'❌ SDK Error: {e.message}')
        if hasattr(e, 'code') and e.code:
            print(f'Error Code: {e.code}')
        if hasattr(e, 'details') and e.details:
            print(f'Error Details: {e.details}')
    except Exception as e:
        print(f'❌ Unexpected error: {e}')

if __name__ == '__main__':
    main()
