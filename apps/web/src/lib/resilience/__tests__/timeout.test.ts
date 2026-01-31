import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { withTimeout, TimeoutError, TIMEOUTS } from '../timeout'

describe('Timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Resolves before timeout', () => {
    it('should resolve when operation completes before timeout', async () => {
      const operation = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('success'), 100)
          })
      )

      const resultPromise = withTimeout(operation, { timeout: 1000, name: 'test-op' })

      // Advance time to complete the operation
      vi.advanceTimersByTime(100)

      const result = await resultPromise
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should resolve immediately for instant operations', async () => {
      const operation = vi.fn().mockResolvedValue('instant-success')

      const result = await withTimeout(operation, { timeout: 1000 })

      expect(result).toBe('instant-success')
    })

    it('should return the correct type', async () => {
      interface TestResult {
        id: number
        name: string
      }

      const expectedResult: TestResult = { id: 1, name: 'test' }
      const operation = vi.fn().mockResolvedValue(expectedResult)

      const result = await withTimeout<TestResult>(operation, { timeout: 1000 })

      expect(result).toEqual(expectedResult)
      expect(result.id).toBe(1)
      expect(result.name).toBe('test')
    })
  })

  describe('Rejects after timeout', () => {
    it('should reject with TimeoutError when operation exceeds timeout', async () => {
      // Create a long-running operation that never resolves within timeout
      let resolveOp: (value: string) => void
      const operation = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolveOp = resolve
          })
      )

      const resultPromise = withTimeout(operation, { timeout: 1000, name: 'slow-op' })

      // Advance time past the timeout
      vi.advanceTimersByTime(1001)

      await expect(resultPromise).rejects.toThrow(TimeoutError)

      // Clean up by resolving the hanging promise
      resolveOp!('cleanup')
    })

    it('should include timeout duration in error message', async () => {
      let resolveOp: (value: string) => void
      const operation = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolveOp = resolve
          })
      )

      const resultPromise = withTimeout(operation, { timeout: 5000, name: 'my-operation' })

      vi.advanceTimersByTime(5001)

      try {
        await resultPromise
        expect.fail('Should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError)
        expect((error as Error).message).toContain('5000ms')
        expect((error as TimeoutError).operation).toBe('my-operation')
      }

      // Clean up
      resolveOp!('cleanup')
    })

    it('should use "operation" as default name', async () => {
      let resolveOp: (value: string) => void
      const operation = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolveOp = resolve
          })
      )

      const resultPromise = withTimeout(operation, { timeout: 1000 })

      vi.advanceTimersByTime(1001)

      await expect(resultPromise).rejects.toThrow('operation timed out after 1000ms')

      // Clean up
      resolveOp!('cleanup')
    })

    it('should propagate original error if operation fails before timeout', async () => {
      const originalError = new Error('Operation failed')
      const operation = vi.fn().mockRejectedValue(originalError)

      const resultPromise = withTimeout(operation, { timeout: 1000 })

      await expect(resultPromise).rejects.toThrow('Operation failed')
      await expect(resultPromise).rejects.not.toBeInstanceOf(TimeoutError)
    })
  })

  describe('Default timeout configurations', () => {
    it('should export REDIS timeout constant', () => {
      expect(TIMEOUTS.REDIS).toBe(2000)
    })

    it('should export SUPABASE timeout constant', () => {
      expect(TIMEOUTS.SUPABASE).toBe(5000)
    })

    it('should export WEBSOCKET timeout constant', () => {
      expect(TIMEOUTS.WEBSOCKET).toBe(10000)
    })

    it('should work with default timeout constants', async () => {
      let resolveOp: (value: string) => void
      const operation = vi.fn().mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolveOp = resolve
          })
      )

      const resultPromise = withTimeout(operation, {
        timeout: TIMEOUTS.REDIS,
        name: 'redis-op',
      })

      vi.advanceTimersByTime(TIMEOUTS.REDIS + 1)

      await expect(resultPromise).rejects.toThrow(TimeoutError)

      // Clean up
      resolveOp!('cleanup')
    })
  })

  describe('Timer cleanup', () => {
    it('should clear timer when operation resolves', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const operation = vi.fn().mockResolvedValue('success')

      await withTimeout(operation, { timeout: 1000 })

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should clear timer when operation rejects', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const operation = vi.fn().mockRejectedValue(new Error('fail'))

      try {
        await withTimeout(operation, { timeout: 1000 })
      } catch {
        // Expected
      }

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('TimeoutError properties', () => {
    it('should have correct name property', () => {
      const error = new TimeoutError('test message', 'test-op')
      expect(error.name).toBe('TimeoutError')
    })

    it('should store operation name', () => {
      const error = new TimeoutError('test message', 'my-operation')
      expect(error.operation).toBe('my-operation')
    })

    it('should be instanceof Error', () => {
      const error = new TimeoutError('test message')
      expect(error).toBeInstanceOf(Error)
    })
  })
})
