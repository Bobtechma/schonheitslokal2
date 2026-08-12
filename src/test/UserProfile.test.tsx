import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UserProfile from '../components/UserProfile'
import { useAuthStore } from '../stores/authStore'
import { useLanguageStore } from '../stores/languageStore'
import { toast } from 'sonner'

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../stores/languageStore', () => ({
  useLanguageStore: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('UserProfile Component', () => {
  const mockSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default language store mock implementation
    ;(useLanguageStore as any).mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          partnerRole: 'Partner',
          partnerArea: 'Partner-Bereich',
        }
        return translations[key] || key
      },
    })
  })

  it('should render null when user is not authenticated', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: null,
      signOut: mockSignOut,
    })

    const { container } = render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render user profile trigger with name and initials when authenticated', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: '123',
        email: 'john@example.com',
        role: 'client',
        user_metadata: {
          full_name: 'John Doe',
        },
      },
      signOut: mockSignOut,
    })

    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Kunde')).toBeInTheDocument()
  })

  it('should toggle the dropdown menu when clicked', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: '123',
        email: 'john@example.com',
        role: 'client',
        user_metadata: {
          full_name: 'John Doe',
        },
      },
      signOut: mockSignOut,
    })

    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    )

    // Initially, dropdown links should not be visible
    expect(screen.queryByText('Ausloggen')).not.toBeInTheDocument()

    // Click to open dropdown
    const triggerBtn = screen.getByRole('button')
    fireEvent.click(triggerBtn)

    // Now dropdown contents should be visible
    expect(screen.getByText('Ausloggen')).toBeInTheDocument()
    expect(screen.getByText('Meine Termine')).toBeInTheDocument()

    // Click again to close
    fireEvent.click(triggerBtn)
    expect(screen.queryByText('Ausloggen')).not.toBeInTheDocument()
  })

  it('should render correct links and roles for Admin', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'admin-id',
        email: 'admin@example.com',
        role: 'admin',
        user_metadata: {
          full_name: 'Super Admin',
        },
      },
      signOut: mockSignOut,
    })

    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByRole('button')
    fireEvent.click(triggerBtn)

    expect(screen.getAllByText('Administrator').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Einstellungen')).toBeInTheDocument()
    expect(screen.getByText('Partner-Bereich')).toBeInTheDocument()
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('should render correct links and roles for Partner', () => {
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: 'partner-id',
        email: 'partner@example.com',
        role: 'partner',
        user_metadata: {
          full_name: 'Salon Partner',
        },
      },
      signOut: mockSignOut,
    })

    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByRole('button')
    fireEvent.click(triggerBtn)

    expect(screen.getAllByText('Partner').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Partner-Bereich')).toBeInTheDocument()
    expect(screen.queryByText('Einstellungen')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
    expect(screen.getByText('Meine Termine')).toBeInTheDocument()
  })

  it('should call signOut and display toast on logout click', async () => {
    mockSignOut.mockResolvedValueOnce(undefined)
    
    ;(useAuthStore as any).mockReturnValue({
      user: {
        id: '123',
        email: 'john@example.com',
        role: 'client',
        user_metadata: {
          full_name: 'John Doe',
        },
      },
      signOut: mockSignOut,
    })

    render(
      <MemoryRouter>
        <UserProfile />
      </MemoryRouter>
    )

    const triggerBtn = screen.getByRole('button')
    fireEvent.click(triggerBtn)

    const logoutBtn = screen.getByText('Ausloggen')
    
    const { act } = await import('@testing-library/react')
    await act(async () => {
      fireEvent.click(logoutBtn)
    })

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    
    // Wait for the async signOut promise handling in component
    await vi.waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Logout erfolgreich!')
    })
  })
})
