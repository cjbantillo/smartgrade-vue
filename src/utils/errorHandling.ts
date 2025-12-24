/**
 * Error Handling Utility
 * Provides standardized error classification, user-friendly messages, and recovery strategies
 */

import type { PostgrestError } from '@supabase/supabase-js'

export interface ErrorResponse {
  message: string
  severity: 'error' | 'warning' | 'info'
  action?: 'retry' | 'redirect-home' | 'redirect-login' | 'none'
  technical?: string // For logging/debugging
  retryable: boolean
}

/**
 * Error type classification
 */
export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  DATABASE = 'database',
  UNKNOWN = 'unknown',
}

/**
 * Classify Supabase/Postgres error
 */
export function classifyError (error: unknown): ErrorType {
  if (!error) {
    return ErrorType.UNKNOWN
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ErrorType.NETWORK
  }

  // Supabase/Postgres errors
  if (isPostgrestError(error)) {
    const pgError = error as PostgrestError

    // RLS / Permission errors
    if (pgError.code === '42501' || pgError.code === 'PGRST301') {
      return ErrorType.PERMISSION
    }

    // Unique constraint violations
    if (pgError.code === '23505') {
      return ErrorType.CONFLICT
    }

    // Foreign key violations
    if (pgError.code === '23503') {
      return ErrorType.VALIDATION
    }

    // Check constraint violations
    if (pgError.code === '23514') {
      return ErrorType.VALIDATION
    }

    // Not found (404)
    if (pgError.code === 'PGRST116') {
      return ErrorType.NOT_FOUND
    }

    // Rate limit (429)
    if (pgError.code === 'PGRST103') {
      return ErrorType.RATE_LIMIT
    }

    // Authentication errors
    if (pgError.message?.toLowerCase().includes('jwt')) {
      return ErrorType.AUTH
    }

    return ErrorType.DATABASE
  }

  // JavaScript Error with network indicators
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes('network')
      || msg.includes('timeout')
      || msg.includes('offline')
    ) {
      return ErrorType.NETWORK
    }
    if (msg.includes('unauthorized') || msg.includes('authentication')) {
      return ErrorType.AUTH
    }
  }

  return ErrorType.UNKNOWN
}

/**
 * Type guard for PostgrestError
 */
function isPostgrestError (error: unknown): error is PostgrestError {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && 'message' in error
  )
}

/**
 * Convert error to user-friendly response
 */
export function handleError (error: unknown, context?: string): ErrorResponse {
  const errorType = classifyError(error)
  const technicalMessage
    = error instanceof Error ? error.message : String(error)

  switch (errorType) {
    case ErrorType.NETWORK: {
      return {
        message:
          'Unable to connect. Please check your internet connection and try again.',
        severity: 'error',
        action: 'retry',
        technical: technicalMessage,
        retryable: true,
      }
    }

    case ErrorType.AUTH: {
      return {
        message: 'Your session has expired. Please log in again.',
        severity: 'warning',
        action: 'redirect-login',
        technical: technicalMessage,
        retryable: false,
      }
    }

    case ErrorType.PERMISSION: {
      return {
        message: 'You don\'t have permission to access this resource.',
        severity: 'warning',
        action: 'redirect-home',
        technical: technicalMessage,
        retryable: false,
      }
    }

    case ErrorType.NOT_FOUND: {
      return {
        message: context
          ? `${context} not found.`
          : 'The requested resource was not found.',
        severity: 'warning',
        action: 'none',
        technical: technicalMessage,
        retryable: false,
      }
    }

    case ErrorType.CONFLICT: {
      return {
        message: getDuplicateErrorMessage(error),
        severity: 'warning',
        action: 'none',
        technical: technicalMessage,
        retryable: false,
      }
    }

    case ErrorType.VALIDATION: {
      return {
        message: getValidationErrorMessage(error),
        severity: 'error',
        action: 'none',
        technical: technicalMessage,
        retryable: false,
      }
    }

    case ErrorType.RATE_LIMIT: {
      return {
        message:
          'You\'re performing actions too quickly. Please wait a moment and try again.',
        severity: 'warning',
        action: 'retry',
        technical: technicalMessage,
        retryable: true,
      }
    }

    case ErrorType.DATABASE: {
      return {
        message: context
          ? `Failed to ${context}. Please try again.`
          : 'A database error occurred. Please try again.',
        severity: 'error',
        action: 'retry',
        technical: technicalMessage,
        retryable: true,
      }
    }

    default: {
      return {
        message: context
          ? `Failed to ${context}. Please try again or contact support if the problem persists.`
          : 'An unexpected error occurred. Please try again.',
        severity: 'error',
        action: 'retry',
        technical: technicalMessage,
        retryable: true,
      }
    }
  }
}

/**
 * Extract user-friendly message from duplicate key errors
 */
function getDuplicateErrorMessage (error: unknown): string {
  if (!isPostgrestError(error)) {
    return 'This item already exists.'
  }

  const detail = error.details || error.message || ''

  if (detail.includes('unique_class_enrollment')) {
    return 'This student is already enrolled in this class.'
  }

  if (detail.includes('students_lrn_key')) {
    return 'A student with this LRN already exists.'
  }

  if (detail.includes('students_student_number_key')) {
    return 'A student with this student number already exists.'
  }

  if (detail.includes('profiles_email_key')) {
    return 'An account with this email already exists.'
  }

  if (detail.includes('unique_grade_entry')) {
    return 'A grade entry for this student and quarter already exists.'
  }

  return 'This record already exists. Please check for duplicates.'
}

/**
 * Extract user-friendly message from validation errors
 */
function getValidationErrorMessage (error: unknown): string {
  if (!isPostgrestError(error)) {
    return 'Please check your input and try again.'
  }

  const detail = error.details || error.message || ''

  if (detail.includes('valid_grade_level')) {
    return 'Grade level must be 11 or 12.'
  }

  if (detail.includes('valid_quarterly_grade')) {
    return 'Quarterly grade must be between 60 and 100.'
  }

  if (detail.includes('valid_period_number')) {
    return 'Grading period must be between 1 and 4.'
  }

  if (detail.includes('valid_email_domain')) {
    return 'Email must be a @deped.gov.ph address.'
  }

  if (detail.includes('valid_lrn_format')) {
    return 'LRN must be exactly 12 digits.'
  }

  if (detail.includes('foreign key')) {
    return 'The referenced record does not exist. Please check your selection.'
  }

  return 'Please check your input and try again.'
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T> (
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000,
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      const errorType = classifyError(error)

      // Don't retry non-retryable errors
      if (
        errorType === ErrorType.PERMISSION
        || errorType === ErrorType.AUTH
        || errorType === ErrorType.VALIDATION
        || errorType === ErrorType.CONFLICT
        || errorType === ErrorType.NOT_FOUND
      ) {
        throw error
      }

      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Check if user is online
 */
export function isOnline (): boolean {
  return navigator.onLine
}

/**
 * Wait for online connection
 */
export function waitForOnline (timeout = 30_000): Promise<boolean> {
  return new Promise(resolve => {
    if (navigator.onLine) {
      resolve(true)
      return
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onOnline)
      resolve(false)
    }, timeout)

    const onOnline = () => {
      clearTimeout(timeoutId)
      window.removeEventListener('online', onOnline)
      resolve(true)
    }

    window.addEventListener('online', onOnline)
  })
}
