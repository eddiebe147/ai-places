import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  withCircuitBreaker,
  getCircuitState,
  resetCircuit,
  CircuitOpenError,
} from '../circuit-breaker'

describe('Circuit Breaker', () => {
  const TEST_CIRCUIT = 'test-circuit'

  beforeEach(() => {
    vi.useFakeTimers()
    // Reset the circuit before each test
    resetCircuit(TEST_CIRCUIT)
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Circuit opens after threshold failures', () => {
    it('should remain CLOSED after fewer failures than threshold', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))

      // Fail 4 times (default threshold is 5)
      for (let i = 0; i < 4; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      const state = getCircuitState(TEST_CIRCUIT)
      expect(state.state).toBe('CLOSED')
      expect(state.failures).toBe(4)
    })

    it('should transition to OPEN after reaching failure threshold', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))

      // Fail 5 times (default threshold)
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      const state = getCircuitState(TEST_CIRCUIT)
      expect(state.state).toBe('OPEN')
      expect(state.failures).toBe(5)
    })

    it('should respect custom failure threshold', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))

      // Fail 2 times with threshold of 2
      for (let i = 0; i < 2; i++) {
        await expect(
          withCircuitBreaker(TEST_CIRCUIT, failingOp, { failureThreshold: 2 })
        ).rejects.toThrow('fail')
      }

      const state = getCircuitState(TEST_CIRCUIT)
      expect(state.state).toBe('OPEN')
    })

    it('should reset failure count on success', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const successOp = vi.fn().mockResolvedValue('success')

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      // Succeed once
      await withCircuitBreaker(TEST_CIRCUIT, successOp)

      const state = getCircuitState(TEST_CIRCUIT)
      expect(state.failures).toBe(0)
      expect(state.state).toBe('CLOSED')
    })
  })

  describe('Circuit transitions from OPEN to HALF_OPEN', () => {
    it('should transition to HALF_OPEN after reset timeout', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const successOp = vi.fn().mockResolvedValue('success')

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      expect(getCircuitState(TEST_CIRCUIT).state).toBe('OPEN')

      // Advance time past reset timeout (default 30 seconds)
      vi.advanceTimersByTime(30001)

      // Next call should trigger transition to HALF_OPEN
      await withCircuitBreaker(TEST_CIRCUIT, successOp)

      // After successful call in HALF_OPEN, check state
      // Note: It takes 2 successes by default to close, so it's still HALF_OPEN
      const state = getCircuitState(TEST_CIRCUIT)
      expect(state.state).toBe('HALF_OPEN')
    })

    it('should use custom reset timeout', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const successOp = vi.fn().mockResolvedValue('success')
      const customConfig = { failureThreshold: 2, resetTimeout: 5000 }

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp, customConfig)).rejects.toThrow(
          'fail'
        )
      }

      expect(getCircuitState(TEST_CIRCUIT).state).toBe('OPEN')

      // Advance time to just before reset timeout
      vi.advanceTimersByTime(4999)

      // Should still be OPEN
      await expect(withCircuitBreaker(TEST_CIRCUIT, successOp, customConfig)).rejects.toThrow(
        CircuitOpenError
      )

      // Advance past reset timeout
      vi.advanceTimersByTime(2)

      // Now it should transition to HALF_OPEN
      await withCircuitBreaker(TEST_CIRCUIT, successOp, customConfig)
      expect(getCircuitState(TEST_CIRCUIT).state).toBe('HALF_OPEN')
    })
  })

  describe('Circuit closes after successful call in HALF_OPEN', () => {
    it('should close after reaching success threshold in HALF_OPEN', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const successOp = vi.fn().mockResolvedValue('success')

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      // Advance time past reset timeout
      vi.advanceTimersByTime(30001)

      // Make 2 successful calls (default success threshold)
      await withCircuitBreaker(TEST_CIRCUIT, successOp)
      expect(getCircuitState(TEST_CIRCUIT).state).toBe('HALF_OPEN')

      await withCircuitBreaker(TEST_CIRCUIT, successOp)
      expect(getCircuitState(TEST_CIRCUIT).state).toBe('CLOSED')
      expect(getCircuitState(TEST_CIRCUIT).failures).toBe(0)
    })

    it('should respect custom success threshold', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const successOp = vi.fn().mockResolvedValue('success')
      const customConfig = { failureThreshold: 2, resetTimeout: 1000, successThreshold: 3 }

      // Open the circuit
      for (let i = 0; i < 2; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp, customConfig)).rejects.toThrow(
          'fail'
        )
      }

      // Advance time past reset timeout
      vi.advanceTimersByTime(1001)

      // Make 2 successful calls - should still be HALF_OPEN
      await withCircuitBreaker(TEST_CIRCUIT, successOp, customConfig)
      await withCircuitBreaker(TEST_CIRCUIT, successOp, customConfig)
      expect(getCircuitState(TEST_CIRCUIT).state).toBe('HALF_OPEN')

      // Third success should close the circuit
      await withCircuitBreaker(TEST_CIRCUIT, successOp, customConfig)
      expect(getCircuitState(TEST_CIRCUIT).state).toBe('CLOSED')
    })

    it('should reopen on failure during HALF_OPEN', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const successOp = vi.fn().mockResolvedValue('success')

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      // Advance time past reset timeout
      vi.advanceTimersByTime(30001)

      // One success puts us in HALF_OPEN
      await withCircuitBreaker(TEST_CIRCUIT, successOp)
      expect(getCircuitState(TEST_CIRCUIT).state).toBe('HALF_OPEN')

      // Failure in HALF_OPEN should reopen
      await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      expect(getCircuitState(TEST_CIRCUIT).state).toBe('OPEN')
    })
  })

  describe('Circuit rejects calls when OPEN', () => {
    it('should throw CircuitOpenError when circuit is OPEN', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const successOp = vi.fn().mockResolvedValue('success')

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      // Next call should be rejected immediately
      await expect(withCircuitBreaker(TEST_CIRCUIT, successOp)).rejects.toThrow(CircuitOpenError)
      await expect(withCircuitBreaker(TEST_CIRCUIT, successOp)).rejects.toBeInstanceOf(
        CircuitOpenError
      )
    })

    it('should include circuit name in error', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      try {
        await withCircuitBreaker(TEST_CIRCUIT, vi.fn().mockResolvedValue('success'))
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(CircuitOpenError)
        expect((error as CircuitOpenError).circuitName).toBe(TEST_CIRCUIT)
        expect((error as Error).message).toContain(TEST_CIRCUIT)
      }
    })

    it('should not call operation when circuit is OPEN', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const successOp = vi.fn().mockResolvedValue('success')

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      // Try to call with success operation
      try {
        await withCircuitBreaker(TEST_CIRCUIT, successOp)
      } catch {
        // Expected
      }

      // Operation should not have been called
      expect(successOp).not.toHaveBeenCalled()
    })
  })

  describe('resetCircuit', () => {
    it('should reset circuit to initial state', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))

      // Open the circuit
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(TEST_CIRCUIT, failingOp)).rejects.toThrow('fail')
      }

      expect(getCircuitState(TEST_CIRCUIT).state).toBe('OPEN')

      // Reset
      resetCircuit(TEST_CIRCUIT)

      const state = getCircuitState(TEST_CIRCUIT)
      expect(state.state).toBe('CLOSED')
      expect(state.failures).toBe(0)
      expect(state.lastFailure).toBeNull()
      expect(state.successCount).toBe(0)
    })
  })

  describe('Multiple circuits', () => {
    it('should maintain separate state for different circuits', async () => {
      const failingOp = vi.fn().mockRejectedValue(new Error('fail'))
      const circuit1 = 'circuit-1'
      const circuit2 = 'circuit-2'

      resetCircuit(circuit1)
      resetCircuit(circuit2)

      // Open circuit1
      for (let i = 0; i < 5; i++) {
        await expect(withCircuitBreaker(circuit1, failingOp)).rejects.toThrow('fail')
      }

      expect(getCircuitState(circuit1).state).toBe('OPEN')
      expect(getCircuitState(circuit2).state).toBe('CLOSED')
    })
  })
})
