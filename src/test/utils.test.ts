import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  getDurationText,
  validateEmail,
  validateCpf,
  getInitials,
} from '../lib/utils'

describe('utils.ts utility functions', () => {
  describe('formatCurrency', () => {
    it('should format numbers to Swiss-style currency string', () => {
      expect(formatCurrency(10)).toBe('10.00.-')
      expect(formatCurrency(150.5)).toBe('150.50.-')
      expect(formatCurrency(0)).toBe('0.00.-')
    })
  })

  describe('formatDate', () => {
    it('should return "-" for empty or invalid values', () => {
      expect(formatDate(null)).toBe('-')
      expect(formatDate(undefined)).toBe('-')
      expect(formatDate('invalid-date')).toBe('-')
    })

    it('should format date strings to de-CH format (DD.MM.YYYY)', () => {
      expect(formatDate('2026-07-03')).toBe('03.07.2026')
    })
  })

  describe('getDurationText', () => {
    it('should format minutes to minutes-only text if less than 60', () => {
      expect(getDurationText(45)).toBe('45 min')
    })

    it('should format minutes to hours-only text if multiples of 60', () => {
      expect(getDurationText(120)).toBe('2h')
    })

    it('should format minutes to hours and minutes text if not multiples of 60', () => {
      expect(getDurationText(75)).toBe('1h 15min')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@sub.domain.co')).toBe(true)
    })

    it('should reject incorrect emails', () => {
      expect(validateEmail('test')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('test@example')).toBe(false)
    })
  })

  describe('validateCpf', () => {
    it('should return false for invalid CPFs', () => {
      expect(validateCpf('111.111.111-11')).toBe(false)
      expect(validateCpf('123456')).toBe(false)
    })

    it('should return true for valid CPFs', () => {
      // Valid generated CPF for testing
      expect(validateCpf('000.000.000-00')).toBe(false) // all same
      expect(validateCpf('529.982.247-25')).toBe(true)
    })
  })

  describe('getInitials', () => {
    it('should return uppercase initials of first and last names', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('alice smith')).toBe('AS')
    })

    it('should handle single names', () => {
      expect(getInitials('Bob')).toBe('B')
    })

    it('should handle extra spaces', () => {
      expect(getInitials('  John    Middle  Doe  ')).toBe('JD')
    })
  })
})
