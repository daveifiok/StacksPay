import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const admin = accounts.get("wallet_1")!;
const backend = accounts.get("wallet_2")!;
const merchant1 = accounts.get("wallet_3")!;
const merchant2 = accounts.get("wallet_4")!;
const customer1 = accounts.get("wallet_5")!;
// const customer2 = accounts.get("wallet_6")!; // Reserved for future use
const uniqueAddress1 = accounts.get("wallet_7")!;
const uniqueAddress2 = accounts.get("wallet_8")!;

// Test constants
const PAYMENT_ID_1 = "payment_test_001";
const PAYMENT_ID_2 = "payment_test_002";
const EXPECTED_AMOUNT = 1000000; // 1 STX in microSTX
const FEE_RATE = 250; // 2.5%
const METADATA = "Test payment for coffee";
const EXPIRY_BLOCKS = 144;

describe("STX Payment Gateway Contract Tests", () => {
  
  beforeEach(() => {
    // Reset simnet state before each test
    simnet.mineEmptyBlocks(1);
  });

  describe("Admin Functions", () => {
    
    it("should initialize admin correctly", () => {
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify admin was added
      const { result: isAdminResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "is-admin",
        [Cl.principal(admin)],
        deployer
      );
      expect(isAdminResult).toBeBool(true);
    });

    it("should fail to initialize admin from non-owner", () => {
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        admin // Not the deployer/owner
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR_UNAUTHORIZED
    });

    it("should authorize backend correctly", () => {
      // First initialize admin
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );

      // Admin authorizes backend
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify backend was authorized
      const { result: isBackendResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "is-backend-authorized",
        [Cl.principal(backend)],
        deployer
      );
      expect(isBackendResult).toBeBool(true);
    });

    it("should authorize merchant with fee rate", () => {
      // Initialize admin
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );

      // Authorize merchant
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify merchant authorization
      const { result: isMerchantResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "is-merchant-authorized",
        [Cl.principal(merchant1)],
        deployer
      );
      expect(isMerchantResult).toBeBool(true);

      // Verify fee rate
      const { result: feeRateResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-merchant-fee-rate",
        [Cl.principal(merchant1)],
        deployer
      );
      expect(feeRateResult).toBeSome(Cl.uint(FEE_RATE));
    });

    it("should reject merchant with invalid fee rate", () => {
      // Initialize admin
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );

      // Try to authorize merchant with fee rate > 10%
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(1001)], // 10.01%
        admin
      );
      expect(result).toBeErr(Cl.uint(107)); // ERR_INVALID_AMOUNT
    });
  });

  describe("Contract Pause/Unpause", () => {
    
    beforeEach(() => {
      // Setup admin for pause tests
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
    });

    it("should pause contract", () => {
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "pause-contract",
        [],
        admin
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify contract is paused
      const { result: statsResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-contract-stats",
        [],
        deployer
      );
      expect(statsResult).toBeTuple({
        "total-payments": Cl.uint(0),
        "total-settlements": Cl.uint(0),
        "is-paused": Cl.bool(true),
        "contract-owner": Cl.principal(deployer)
      });
    });

    it("should unpause contract", () => {
      // First pause
      simnet.callPublicFn(
        "stx-payment-gateway",
        "pause-contract",
        [],
        admin
      );

      // Then unpause
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "unpause-contract",
        [],
        admin
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify contract is unpaused
      const { result: statsResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-contract-stats",
        [],
        deployer
      );
      expect(statsResult).toBeTuple({
        "total-payments": Cl.uint(0),
        "total-settlements": Cl.uint(0),
        "is-paused": Cl.bool(false),
        "contract-owner": Cl.principal(deployer)
      });
    });
  });

  describe("Payment Registration", () => {
    
    beforeEach(() => {
      // Setup admin, backend, and merchant
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );
    });

    it("should register payment successfully", () => {
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      expect(result).toBeOk(Cl.stringAscii(PAYMENT_ID_1));
      
      // Verify payment was registered
      const { result: paymentResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-payment",
        [Cl.stringAscii(PAYMENT_ID_1)],
        deployer
      );
      expect(paymentResult).toBeSome(Cl.tuple({
        merchant: Cl.principal(merchant1),
        "unique-address": Cl.principal(uniqueAddress1),
        "expected-amount": Cl.uint(EXPECTED_AMOUNT),
        "received-amount": Cl.uint(0),
        status: Cl.stringAscii("pending"),
        "created-at": Cl.uint(simnet.blockHeight),
        "expires-at": Cl.uint(simnet.blockHeight + EXPIRY_BLOCKS),
        "confirmed-at": Cl.none(),
        "settled-at": Cl.none(),
        metadata: Cl.stringAscii(METADATA)
      }));
      
      // Verify address mapping
      const { result: addressResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-address-mapping",
        [Cl.principal(uniqueAddress1)],
        deployer
      );
      expect(addressResult).toBeSome(Cl.tuple({
        "payment-id": Cl.stringAscii(PAYMENT_ID_1),
        merchant: Cl.principal(merchant1),
        "expected-amount": Cl.uint(EXPECTED_AMOUNT),
        status: Cl.stringAscii("pending"),
        "registered-at": Cl.uint(simnet.blockHeight)
      }));
    });

    it("should fail to register payment from unauthorized backend", () => {
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        customer1 // Not authorized backend
      );
      expect(result).toBeErr(Cl.uint(110)); // ERR_INVALID_CALLER
    });

    it("should fail to register payment for unauthorized merchant", () => {
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant2), // Not authorized
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      expect(result).toBeErr(Cl.uint(105)); // ERR_INVALID_MERCHANT
    });

    it("should fail to register duplicate payment ID", () => {
      // Register first payment
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );

      // Try to register duplicate
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1), // Same payment ID
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress2), // Different address
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      expect(result).toBeErr(Cl.uint(102)); // ERR_PAYMENT_ALREADY_PROCESSED
    });

    it("should fail to register duplicate unique address", () => {
      // Register first payment
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );

      // Try to register with same unique address
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_2), // Different payment ID
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1), // Same address
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      expect(result).toBeErr(Cl.uint(108)); // ERR_ADDRESS_ALREADY_REGISTERED
    });

    it("should fail to register when contract is paused", () => {
      // Pause contract
      simnet.callPublicFn(
        "stx-payment-gateway",
        "pause-contract",
        [],
        admin
      );

      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      expect(result).toBeErr(Cl.uint(106)); // ERR_CONTRACT_PAUSED
    });
  });

  describe("Payment Confirmation", () => {
    
    beforeEach(() => {
      // Setup and register a payment
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
    });

    it("should confirm payment received successfully", () => {
      const receivedAmount = EXPECTED_AMOUNT;
      const txId = new Uint8Array(32).fill(123); // Mock transaction ID

      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "confirm-payment-received",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.uint(receivedAmount),
          Cl.buffer(txId)
        ],
        backend
      );
      expect(result).toBeOk(Cl.uint(receivedAmount));
      
      // Verify payment status updated
      const { result: paymentResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-payment",
        [Cl.stringAscii(PAYMENT_ID_1)],
        deployer
      );
      expect(paymentResult).toBeSome(Cl.tuple({
        merchant: Cl.principal(merchant1),
        "unique-address": Cl.principal(uniqueAddress1),
        "expected-amount": Cl.uint(EXPECTED_AMOUNT),
        "received-amount": Cl.uint(receivedAmount),
        status: Cl.stringAscii("confirmed"),
        "created-at": Cl.uint(simnet.blockHeight - 1),
        "expires-at": Cl.uint(simnet.blockHeight - 1 + EXPIRY_BLOCKS),
        "confirmed-at": Cl.some(Cl.uint(simnet.blockHeight)),
        "settled-at": Cl.none(),
        metadata: Cl.stringAscii(METADATA)
      }));
    });

    it("should fail to confirm with insufficient amount", () => {
      const insufficientAmount = EXPECTED_AMOUNT - 1;
      const txId = new Uint8Array(32).fill(123);

      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "confirm-payment-received",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.uint(insufficientAmount),
          Cl.buffer(txId)
        ],
        backend
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR_INSUFFICIENT_AMOUNT
    });

    it("should fail to confirm from unauthorized caller", () => {
      const receivedAmount = EXPECTED_AMOUNT;
      const txId = new Uint8Array(32).fill(123);

      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "confirm-payment-received",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.uint(receivedAmount),
          Cl.buffer(txId)
        ],
        customer1 // Not authorized
      );
      expect(result).toBeErr(Cl.uint(110)); // ERR_INVALID_CALLER
    });

    it("should fail to confirm non-existent payment", () => {
      const receivedAmount = EXPECTED_AMOUNT;
      const txId = new Uint8Array(32).fill(123);

      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "confirm-payment-received",
        [
          Cl.stringAscii("non_existent_payment"),
          Cl.uint(receivedAmount),
          Cl.buffer(txId)
        ],
        backend
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR_PAYMENT_NOT_FOUND
    });
  });

  describe("Payment Settlement", () => {
    
    beforeEach(() => {
      // Setup, register, and confirm a payment
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      
      const txId = new Uint8Array(32).fill(123);
      simnet.callPublicFn(
        "stx-payment-gateway",
        "confirm-payment-received",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.buffer(txId)
        ],
        backend
      );
    });

    it("should settle payment successfully", () => {
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "settle-payment",
        [Cl.stringAscii(PAYMENT_ID_1)],
        backend
      );
      
      // Calculate expected fee and net amount
      const expectedFeeAmount = Math.floor((EXPECTED_AMOUNT * FEE_RATE) / 10000);
      const expectedNetAmount = EXPECTED_AMOUNT - expectedFeeAmount;
      
      expect(result).toBeOk(Cl.tuple({
        "settlement-id": Cl.uint(0),
        "total-amount": Cl.uint(EXPECTED_AMOUNT),
        "fee-amount": Cl.uint(expectedFeeAmount),
        "net-amount": Cl.uint(expectedNetAmount)
      }));
      
      // Verify payment status updated  
      const { result: paymentResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-payment",
        [Cl.stringAscii(PAYMENT_ID_1)],
        deployer
      );
      // Just verify the payment exists and is settled
      expect(paymentResult).not.toBeNone();
      // Extract the payment data to check status
      const paymentData = paymentResult as any;
      expect(paymentData.value.data.status.data).toBe("settled");
      expect(paymentData.value.data["received-amount"].value).toBe(BigInt(EXPECTED_AMOUNT));
      
      // Verify settlement record
      const { result: settlementResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-settlement",
        [Cl.uint(0)],
        deployer
      );
      expect(settlementResult).toBeSome(Cl.tuple({
        "payment-id": Cl.stringAscii(PAYMENT_ID_1),
        "from-address": Cl.principal(uniqueAddress1),
        "to-address": Cl.principal(merchant1),
        amount: Cl.uint(expectedNetAmount),
        "fee-amount": Cl.uint(expectedFeeAmount),
        "settled-at": Cl.uint(simnet.blockHeight),
        "tx-id": Cl.none()
      }));
    });

    it("should fail to settle unconfirmed payment", () => {
      // Register a new payment but don't confirm it
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_2),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress2),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );

      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "settle-payment",
        [Cl.stringAscii(PAYMENT_ID_2)],
        backend
      );
      expect(result).toBeErr(Cl.uint(101)); // ERR_PAYMENT_NOT_FOUND (because status is not confirmed)
    });

    it("should update settlement transaction ID", () => {
      // First settle the payment
      simnet.callPublicFn(
        "stx-payment-gateway",
        "settle-payment",
        [Cl.stringAscii(PAYMENT_ID_1)],
        backend
      );

      // Update with transaction ID
      const settlementTxId = new Uint8Array(32).fill(255);
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "update-settlement-tx",
        [Cl.uint(0), Cl.buffer(settlementTxId)],
        backend
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify settlement record updated
      const { result: settlementResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-settlement",
        [Cl.uint(0)],
        deployer
      );
      expect(settlementResult).toBeSome(Cl.tuple({
        "payment-id": Cl.stringAscii(PAYMENT_ID_1),
        "from-address": Cl.principal(uniqueAddress1),
        "to-address": Cl.principal(merchant1),
        amount: Cl.uint(975000),
        "fee-amount": Cl.uint(25000),
        "settled-at": Cl.uint(simnet.blockHeight - 1),
        "tx-id": Cl.some(Cl.buffer(settlementTxId))
      }));
    });
  });

  describe("Payment Refunds", () => {
    
    beforeEach(() => {
      // Setup and register a payment
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
    });

    it("should refund pending payment", () => {
      const refundReason = "Customer requested refund";
      
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "refund-payment",
        [Cl.stringAscii(PAYMENT_ID_1), Cl.stringAscii(refundReason)],
        backend
      );
      expect(result).toBeOk(Cl.bool(true));
      
      // Verify payment status updated
      const { result: paymentResult } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-payment",
        [Cl.stringAscii(PAYMENT_ID_1)],
        deployer
      );
      expect(paymentResult).toBeSome(Cl.tuple({
        merchant: Cl.principal(merchant1),
        "unique-address": Cl.principal(uniqueAddress1),
        "expected-amount": Cl.uint(EXPECTED_AMOUNT),
        "received-amount": Cl.uint(0),
        status: Cl.stringAscii("refunded"),
        "created-at": Cl.uint(simnet.blockHeight - 1),
        "expires-at": Cl.uint(simnet.blockHeight - 1 + EXPIRY_BLOCKS),
        "confirmed-at": Cl.none(),
        "settled-at": Cl.some(Cl.uint(simnet.blockHeight)),
        metadata: Cl.stringAscii(METADATA)
      }));
    });

    it("should refund confirmed payment", () => {
      // First confirm the payment
      const txId = new Uint8Array(32).fill(123);
      simnet.callPublicFn(
        "stx-payment-gateway",
        "confirm-payment-received",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.buffer(txId)
        ],
        backend
      );

      // Then refund
      const refundReason = "Order cancelled";
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "refund-payment",
        [Cl.stringAscii(PAYMENT_ID_1), Cl.stringAscii(refundReason)],
        backend
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should fail to refund from unauthorized caller", () => {
      const refundReason = "Test refund";
      
      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "refund-payment",
        [Cl.stringAscii(PAYMENT_ID_1), Cl.stringAscii(refundReason)],
        customer1 // Not authorized
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR_UNAUTHORIZED
    });
  });

  describe("Read-Only Functions", () => {
    
    beforeEach(() => {
      // Setup basic state
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );
    });

    it("should get contract stats", () => {
      const { result } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-contract-stats",
        [],
        deployer
      );
      expect(result).toBeTuple({
        "total-payments": Cl.uint(0),
        "total-settlements": Cl.uint(0),
        "is-paused": Cl.bool(false),
        "contract-owner": Cl.principal(deployer)
      });
    });

    it("should check if payment exists", () => {
      // Non-existent payment
      let { result } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "payment-exists",
        [Cl.stringAscii(PAYMENT_ID_1)],
        deployer
      );
      expect(result).toBeBool(false);
      
      // Register payment
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      
      // Existing payment
      ({ result } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "payment-exists",
        [Cl.stringAscii(PAYMENT_ID_1)],
        deployer
      ));
      expect(result).toBeBool(true);
    });

    it("should check if address is registered", () => {
      // Non-registered address
      let { result } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "address-registered",
        [Cl.principal(uniqueAddress1)],
        deployer
      );
      expect(result).toBeBool(false);
      
      // Register payment with address
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      
      // Registered address
      ({ result } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "address-registered",
        [Cl.principal(uniqueAddress1)],
        deployer
      ));
      expect(result).toBeBool(true);
    });

    it("should get payment by address", () => {
      // Register payment
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      
      const { result } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "get-payment-by-address",
        [Cl.principal(uniqueAddress1)],
        deployer
      );
      // Just verify the payment exists and is pending
      expect(result).not.toBeNone();
      // Extract the payment data to check status
      const paymentData = result as any;
      expect(paymentData.value.data.status.data).toBe("pending");
      expect(paymentData.value.data["received-amount"].value).toBe(BigInt(0));
    });

    it("should check payment expiration", () => {
      // Register payment with short expiry
      simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(1) // Expires in 1 block
        ],
        backend
      );
      
      // Not expired yet
      let { result } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "is-payment-expired",
        [Cl.stringAscii(PAYMENT_ID_1)],
        deployer
      );
      expect(result).toBeBool(false);
      
      // Mine 2 blocks to expire payment
      simnet.mineEmptyBlocks(2);
      
      // Now expired
      ({ result } = simnet.callReadOnlyFn(
        "stx-payment-gateway",
        "is-payment-expired",
        [Cl.stringAscii(PAYMENT_ID_1)],
        deployer
      ));
      expect(result).toBeBool(true);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    
    it("should handle zero amount payment registration", () => {
      // Setup
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );

      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(0), // Zero amount
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      expect(result).toBeErr(Cl.uint(103)); // ERR_INSUFFICIENT_AMOUNT
    });

    it("should handle excessive expiry blocks", () => {
      // Setup
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );

      const { result } = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(145) // Exceeds MAX_EXPIRY_BLOCKS (144)
        ],
        backend
      );
      expect(result).toBeErr(Cl.uint(104)); // ERR_PAYMENT_EXPIRED
    });
  });

  describe("Event Emission", () => {
    
    it("should emit correct events during payment lifecycle", () => {
      // Setup
      simnet.callPublicFn(
        "stx-payment-gateway",
        "initialize-admin",
        [Cl.principal(admin)],
        deployer
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-backend",
        [Cl.principal(backend)],
        admin
      );
      
      simnet.callPublicFn(
        "stx-payment-gateway",
        "authorize-merchant",
        [Cl.principal(merchant1), Cl.uint(FEE_RATE)],
        admin
      );
      
      // Register payment and check events
      const registerResult = simnet.callPublicFn(
        "stx-payment-gateway",
        "register-payment",
        [
          Cl.stringAscii(PAYMENT_ID_1),
          Cl.principal(merchant1),
          Cl.principal(uniqueAddress1),
          Cl.uint(EXPECTED_AMOUNT),
          Cl.stringAscii(METADATA),
          Cl.uint(EXPIRY_BLOCKS)
        ],
        backend
      );
      
      // Check that events are emitted (events are captured in result.events)
      expect(registerResult.events).toHaveLength(1);
      expect(registerResult.events[0].event).toBe("print_event");
    });
  });
});