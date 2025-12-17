tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
            sans: ['Manrope', 'sans-serif'],
            serif: ['Playfair Display', 'serif'],
            },
            colors: {
            violet: {
                400: '#a78bfa',
                500: '#8b5cf6',
                600: '#7c3aed',
                950: '#2e1065',
            }
            },
            animation: {
            'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
            'pop-in': 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            },
            keyframes: {
            fadeInUp: {
                '0%': { opacity: '0', transform: 'translateY(20px)' },
                '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            popIn: {
                '0%': { opacity: '0', transform: 'scale(0.95)' },
                '100%': { opacity: '1', transform: 'scale(1)' },
            }
            }
        }
    }
}