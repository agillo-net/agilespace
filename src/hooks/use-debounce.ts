import { useState, useEffect, useCallback } from 'react'

export function useDebounce<T>(value: T, delay: number): [T, (newValue: T, immediate?: boolean) => void] {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    const setValue = useCallback((newValue: T, immediate: boolean = false) => {
        if (immediate) {
            setDebouncedValue(newValue)
        } else {
            setDebouncedValue(value)
        }
    }, [value])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return [debouncedValue, setValue]
} 
