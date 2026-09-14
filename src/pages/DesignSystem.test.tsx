import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DesignPage } from '@/pages/DesignSystem'

describe('DesignPage', () => {
  it('shows sized cover examples and a countdown clock', () => {
    render(<DesignPage />)
    expect(screen.getByRole('heading', { name: 'Covers' })).toBeInTheDocument()
    expect(screen.getByText('Side (S)')).toBeInTheDocument()
    expect(screen.getByText('Plate (M)')).toBeInTheDocument()
    expect(screen.getByText('Board (L)')).toBeInTheDocument()
    expect(screen.getByText('Banquet (XL)')).toBeInTheDocument()
    expect(
      screen.getByText('walk', { selector: 'div.mt-6.rounded-md span' }),
    ).toBeInTheDocument()
  })
})
