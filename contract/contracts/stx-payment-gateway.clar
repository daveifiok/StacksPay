;; STX Payment Gateway - Unique Address Implementation
;; Version: 2.0.0 - Implementing Option 2 (Off-chain address generation)
;; 
;; This contract handles STX payment processing with unique addresses per payment.
;; Backend generates unique addresses, contract tracks and processes settlements.

;; CONSTANTS
;; Error codes
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_PAYMENT_NOT_FOUND (err u101))
(define-constant ERR_PAYMENT_ALREADY_PROCESSED (err u102))
(define-constant ERR_INSUFFICIENT_AMOUNT (err u103))
(define-constant ERR_PAYMENT_EXPIRED (err u104))
(define-constant ERR_INVALID_MERCHANT (err u105))
(define-constant ERR_CONTRACT_PAUSED (err u106))
(define-constant ERR_INVALID_AMOUNT (err u107))
(define-constant ERR_ADDRESS_ALREADY_REGISTERED (err u108))
(define-constant ERR_SETTLEMENT_FAILED (err u109))
(define-constant ERR_INVALID_CALLER (err u110))

;; Payment status constants
(define-constant STATUS_PENDING "pending")
(define-constant STATUS_CONFIRMED "confirmed")
(define-constant STATUS_SETTLED "settled")
(define-constant STATUS_REFUNDED "refunded")
(define-constant STATUS_FAILED "failed")

;; Contract settings
(define-constant CONTRACT_OWNER tx-sender)
(define-constant MAX_EXPIRY_BLOCKS u144) ;; ~24 hours (assuming 10min blocks)

;; DATA VARIABLES
(define-data-var contract-paused bool false)
(define-data-var payment-counter uint u0)
(define-data-var settlement-counter uint u0)

;; DATA MAPS

;; Core payment data structure - mapped by payment-id
(define-map payments
    { payment-id: (string-ascii 64) }
    {
        merchant: principal,
        unique-address: principal,
        expected-amount: uint,
        received-amount: uint,
        status: (string-ascii 20),
        created-at: uint,
        expires-at: uint,
        confirmed-at: (optional uint),
        settled-at: (optional uint),
        metadata: (string-ascii 256)
    }
)

;; Map unique addresses to payment IDs for quick lookup
(define-map payment-addresses
    { address: principal }
    {
        payment-id: (string-ascii 64),
        merchant: principal,
        expected-amount: uint,
        status: (string-ascii 20),
        registered-at: uint
    }
)

;; Authorized merchants with fee rates
(define-map authorized-merchants
    { merchant: principal }
    { 
        authorized: bool,
        fee-rate: uint ;; basis points (e.g., 250 = 2.5%)
    }
)

;; Admin management
(define-map admins
    { admin: principal }
    { authorized: bool }
)

;; Track backend callers (addresses authorized to register payments)
(define-map authorized-backends
    { backend: principal }
    { authorized: bool }
)

;; Settlement tracking
(define-map settlements
    { settlement-id: uint }
    {
        payment-id: (string-ascii 64),
        from-address: principal,
        to-address: principal,
        amount: uint,
        fee-amount: uint,
        settled-at: uint,
        tx-id: (optional (buff 32))
    }
)

;; PUBLIC FUNCTIONS

;; Initialize admin (only contract owner)
(define-public (initialize-admin (admin principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (map-set admins { admin: admin } { authorized: true })
        (print {
            topic: "admin-initialized",
            admin: admin,
            block-height: stacks-block-height
        })
        (ok true)
    )
)

;; Authorize backend caller (only admin)
(define-public (authorize-backend (backend principal))
    (begin
        (asserts! (or (is-eq tx-sender CONTRACT_OWNER) (is-admin tx-sender)) ERR_UNAUTHORIZED)
        (map-set authorized-backends { backend: backend } { authorized: true })
        (print {
            topic: "backend-authorized",
            backend: backend,
            authorized-by: tx-sender,
            block-height: stacks-block-height
        })
        (ok true)
    )
)

;; Authorize merchant (only admin)
(define-public (authorize-merchant (merchant principal) (fee-rate uint))
    (begin
        (asserts! (or (is-eq tx-sender CONTRACT_OWNER) (is-admin tx-sender)) ERR_UNAUTHORIZED)
        (asserts! (<= fee-rate u1000) ERR_INVALID_AMOUNT) ;; Max 10% fee
        (map-set authorized-merchants 
            { merchant: merchant } 
            { authorized: true, fee-rate: fee-rate }
        )
        (print {
            topic: "merchant-authorized",
            merchant: merchant,
            fee-rate: fee-rate,
            authorized-by: tx-sender,
            block-height: stacks-block-height
        })
        (ok true)
    )
)

;; Register payment with unique address (only authorized backend)
(define-public (register-payment 
    (payment-id (string-ascii 64))
    (merchant principal)
    (unique-address principal)
    (expected-amount uint)
    (metadata (string-ascii 256))
    (expires-in-blocks uint))
    (let 
        (
            (current-block stacks-block-height)
            (expiry-block (+ current-block expires-in-blocks))
            (merchant-data (unwrap! (map-get? authorized-merchants { merchant: merchant }) ERR_INVALID_MERCHANT))
        )
        (begin
            ;; Validations
            (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
            (asserts! (is-backend-authorized tx-sender) ERR_INVALID_CALLER)
            (asserts! (> expected-amount u0) ERR_INSUFFICIENT_AMOUNT)
            (asserts! (get authorized merchant-data) ERR_INVALID_MERCHANT)
            (asserts! (<= expires-in-blocks MAX_EXPIRY_BLOCKS) ERR_PAYMENT_EXPIRED)
            (asserts! (is-none (map-get? payments { payment-id: payment-id })) ERR_PAYMENT_ALREADY_PROCESSED)
            (asserts! (is-none (map-get? payment-addresses { address: unique-address })) ERR_ADDRESS_ALREADY_REGISTERED)
            
            ;; Register payment
            (map-set payments 
                { payment-id: payment-id }
                {
                    merchant: merchant,
                    unique-address: unique-address,
                    expected-amount: expected-amount,
                    received-amount: u0,
                    status: STATUS_PENDING,
                    created-at: current-block,
                    expires-at: expiry-block,
                    confirmed-at: none,
                    settled-at: none,
                    metadata: metadata
                }
            )
            
            ;; Register address mapping
            (map-set payment-addresses 
                { address: unique-address }
                {
                    payment-id: payment-id,
                    merchant: merchant,
                    expected-amount: expected-amount,
                    status: STATUS_PENDING,
                    registered-at: current-block
                }
            )
            
            ;; Increment counter
            (var-set payment-counter (+ (var-get payment-counter) u1))
            
            ;; Emit event for chainhook monitoring
            (print {
                topic: "payment-registered",
                payment-id: payment-id,
                merchant: merchant,
                unique-address: unique-address,
                expected-amount: expected-amount,
                metadata: metadata,
                expires-at: expiry-block,
                block-height: current-block
            })
            
            (ok payment-id)
        )
    )
)

;; Confirm payment received at unique address (only backend after detecting payment)
(define-public (confirm-payment-received 
    (payment-id (string-ascii 64))
    (received-amount uint)
    (tx-id (buff 32)))
    (let 
        (
            (payment-data (unwrap! (map-get? payments { payment-id: payment-id }) ERR_PAYMENT_NOT_FOUND))
        )
        (begin
            ;; Validations
            (asserts! (is-backend-authorized tx-sender) ERR_INVALID_CALLER)
            (asserts! (is-eq (get status payment-data) STATUS_PENDING) ERR_PAYMENT_ALREADY_PROCESSED)
            (asserts! (<= stacks-block-height (get expires-at payment-data)) ERR_PAYMENT_EXPIRED)
            (asserts! (>= received-amount (get expected-amount payment-data)) ERR_INSUFFICIENT_AMOUNT)
            
            ;; Update payment status
            (map-set payments 
                { payment-id: payment-id }
                (merge payment-data {
                    received-amount: received-amount,
                    status: STATUS_CONFIRMED,
                    confirmed-at: (some stacks-block-height)
                })
            )
            
            ;; Update address mapping status
            (map-set payment-addresses 
                { address: (get unique-address payment-data) }
                (merge 
                    (unwrap-panic (map-get? payment-addresses { address: (get unique-address payment-data) }))
                    { status: STATUS_CONFIRMED }
                )
            )
            
            ;; Emit confirmation event
            (print {
                topic: "payment-confirmed",
                payment-id: payment-id,
                merchant: (get merchant payment-data),
                unique-address: (get unique-address payment-data),
                expected-amount: (get expected-amount payment-data),
                received-amount: received-amount,
                tx-id: tx-id,
                confirmed-by: tx-sender,
                block-height: stacks-block-height
            })
            
            (ok received-amount)
        )
    )
)

;; Settle payment to merchant (only backend after confirming payment)
(define-public (settle-payment (payment-id (string-ascii 64)))
    (let 
        (
            (payment-data (unwrap! (map-get? payments { payment-id: payment-id }) ERR_PAYMENT_NOT_FOUND))
            (merchant-data (unwrap! (map-get? authorized-merchants { merchant: (get merchant payment-data) }) ERR_INVALID_MERCHANT))
            (settlement-id (var-get settlement-counter))
        )
        (begin
            ;; Validations
            (asserts! (is-backend-authorized tx-sender) ERR_INVALID_CALLER)
            (asserts! (is-eq (get status payment-data) STATUS_CONFIRMED) ERR_PAYMENT_NOT_FOUND)
            (asserts! (> (get received-amount payment-data) u0) ERR_INSUFFICIENT_AMOUNT)
            
            ;; Calculate fee and net amount
            (let 
                (
                    (total-amount (get received-amount payment-data))
                    (fee-amount (/ (* total-amount (get fee-rate merchant-data)) u10000))
                    (net-amount (- total-amount fee-amount))
                )
                
                ;; Transfer funds from unique address to merchant (backend handles the actual transfer)
                ;; Contract just tracks the settlement
                
                ;; Update payment status
                (map-set payments 
                    { payment-id: payment-id }
                    (merge payment-data {
                        status: STATUS_SETTLED,
                        settled-at: (some stacks-block-height)
                    })
                )
                
                ;; Update address mapping status
                (map-set payment-addresses 
                    { address: (get unique-address payment-data) }
                    (merge 
                        (unwrap-panic (map-get? payment-addresses { address: (get unique-address payment-data) }))
                        { status: STATUS_SETTLED }
                    )
                )
                
                ;; Record settlement
                (map-set settlements
                    { settlement-id: settlement-id }
                    {
                        payment-id: payment-id,
                        from-address: (get unique-address payment-data),
                        to-address: (get merchant payment-data),
                        amount: net-amount,
                        fee-amount: fee-amount,
                        settled-at: stacks-block-height,
                        tx-id: none ;; Backend will update this
                    }
                )
                
                ;; Increment settlement counter
                (var-set settlement-counter (+ settlement-id u1))
                
                ;; Emit settlement event
                (print {
                    topic: "payment-settled",
                    payment-id: payment-id,
                    settlement-id: settlement-id,
                    merchant: (get merchant payment-data),
                    unique-address: (get unique-address payment-data),
                    total-amount: total-amount,
                    fee-amount: fee-amount,
                    net-amount: net-amount,
                    settled-by: tx-sender,
                    block-height: stacks-block-height
                })
                
                (ok { 
                    settlement-id: settlement-id,
                    total-amount: total-amount, 
                    fee-amount: fee-amount, 
                    net-amount: net-amount 
                })
            )
        )
    )
)

;; Update settlement with transaction ID (after backend completes transfer)
(define-public (update-settlement-tx (settlement-id uint) (tx-id (buff 32)))
    (let 
        (
            (settlement-data (unwrap! (map-get? settlements { settlement-id: settlement-id }) ERR_PAYMENT_NOT_FOUND))
        )
        (begin
            (asserts! (is-backend-authorized tx-sender) ERR_INVALID_CALLER)
            
            (map-set settlements
                { settlement-id: settlement-id }
                (merge settlement-data { tx-id: (some tx-id) })
            )
            
            (print {
                topic: "settlement-tx-updated",
                settlement-id: settlement-id,
                payment-id: (get payment-id settlement-data),
                tx-id: tx-id,
                block-height: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Refund payment (payer, merchant, or admin can initiate)
(define-public (refund-payment (payment-id (string-ascii 64)) (reason (string-ascii 128)))
    (let 
        (
            (payment-data (unwrap! (map-get? payments { payment-id: payment-id }) ERR_PAYMENT_NOT_FOUND))
        )
        (begin
            ;; Note: In unique address model, refunds are handled by backend
            ;; Contract just tracks the refund status
            (asserts! (or 
                (is-backend-authorized tx-sender)
                (is-admin tx-sender)) ERR_UNAUTHORIZED)
            (asserts! (or 
                (is-eq (get status payment-data) STATUS_PENDING)
                (is-eq (get status payment-data) STATUS_CONFIRMED)) ERR_PAYMENT_ALREADY_PROCESSED)
            
            ;; Update status
            (map-set payments 
                { payment-id: payment-id }
                (merge payment-data {
                    status: STATUS_REFUNDED,
                    settled-at: (some stacks-block-height)
                })
            )
            
            ;; Update address mapping
            (map-set payment-addresses 
                { address: (get unique-address payment-data) }
                (merge 
                    (unwrap-panic (map-get? payment-addresses { address: (get unique-address payment-data) }))
                    { status: STATUS_REFUNDED }
                )
            )
            
            ;; Emit refund event
            (print {
                topic: "payment-refunded",
                payment-id: payment-id,
                merchant: (get merchant payment-data),
                unique-address: (get unique-address payment-data),
                amount: (get received-amount payment-data),
                reason: reason,
                refunded-by: tx-sender,
                block-height: stacks-block-height
            })
            
            (ok true)
        )
    )
)

;; Emergency pause (admin only)
(define-public (pause-contract)
    (begin
        (asserts! (or (is-eq tx-sender CONTRACT_OWNER) (is-admin tx-sender)) ERR_UNAUTHORIZED)
        (var-set contract-paused true)
        (print {
            topic: "contract-paused",
            admin: tx-sender,
            block-height: stacks-block-height
        })
        (ok true)
    )
)

;; Emergency unpause (admin only)
(define-public (unpause-contract)
    (begin
        (asserts! (or (is-eq tx-sender CONTRACT_OWNER) (is-admin tx-sender)) ERR_UNAUTHORIZED)
        (var-set contract-paused false)
        (print {
            topic: "contract-unpaused",
            admin: tx-sender,
            block-height: stacks-block-height
        })
        (ok true)
    )
)

;; READ-ONLY FUNCTIONS

;; Get payment details by payment ID
(define-read-only (get-payment (payment-id (string-ascii 64)))
    (map-get? payments { payment-id: payment-id })
)

;; Get payment details by unique address
(define-read-only (get-payment-by-address (address principal))
    (match (map-get? payment-addresses { address: address })
        address-data (get-payment (get payment-id address-data))
        none
    )
)

;; Get address mapping
(define-read-only (get-address-mapping (address principal))
    (map-get? payment-addresses { address: address })
)

;; Get settlement details
(define-read-only (get-settlement (settlement-id uint))
    (map-get? settlements { settlement-id: settlement-id })
)

;; Check if merchant is authorized
(define-read-only (is-merchant-authorized (merchant principal))
    (default-to false (get authorized (map-get? authorized-merchants { merchant: merchant })))
)

;; Get merchant fee rate
(define-read-only (get-merchant-fee-rate (merchant principal))
    (get fee-rate (map-get? authorized-merchants { merchant: merchant }))
)

;; Check if backend is authorized
(define-read-only (is-backend-authorized (backend principal))
    (default-to false (get authorized (map-get? authorized-backends { backend: backend })))
)

;; Check if payment exists
(define-read-only (payment-exists (payment-id (string-ascii 64)))
    (is-some (map-get? payments { payment-id: payment-id }))
)

;; Check if address is registered
(define-read-only (address-registered (address principal))
    (is-some (map-get? payment-addresses { address: address }))
)

;; Check if payment is expired
(define-read-only (is-payment-expired (payment-id (string-ascii 64)))
    (match (map-get? payments { payment-id: payment-id })
        payment-data (> stacks-block-height (get expires-at payment-data))
        true
    )
)

;; Get contract stats
(define-read-only (get-contract-stats)
    {
        total-payments: (var-get payment-counter),
        total-settlements: (var-get settlement-counter),
        is-paused: (var-get contract-paused),
        contract-owner: CONTRACT_OWNER
    }
)

;; Check admin status
(define-read-only (is-admin (admin principal))
    (default-to false (get authorized (map-get? admins { admin: admin })))
)

;; Get payments by status (for monitoring)
(define-read-only (get-payment-status (payment-id (string-ascii 64)))
    (match (map-get? payments { payment-id: payment-id })
        payment-data (ok (get status payment-data))
        ERR_PAYMENT_NOT_FOUND
    )
)

;; PRIVATE FUNCTIONS

;; Private helper to validate payment ID format
(define-private (is-valid-payment-id (payment-id (string-ascii 64)))
    (> (len payment-id) u0)
)