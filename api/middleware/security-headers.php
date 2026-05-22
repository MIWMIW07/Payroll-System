<?php
// api/middleware/security-headers.php
// HTTP Security Headers for PHP (Helmet.js equivalent)

class SecurityHeaders {
    
    /**
     * Apply all security headers
     */
    public static function apply() {
        // Prevent headers from being sent twice
        if (headers_sent()) {
            return;
        }
        
        // ============================================
        // 1. XSS Protection
        // ============================================
        header("X-XSS-Protection: 1; mode=block");
        
        // ============================================
        // 2. Frame Options (Prevents clickjacking)
        // ============================================
        header("X-Frame-Options: DENY");
        
        // ============================================
        // 3. Content Type Options (Prevents MIME sniffing)
        // ============================================
        header("X-Content-Type-Options: nosniff");
        
        // ============================================
        // 4. Referrer Policy
        // ============================================
        header("Referrer-Policy: strict-origin-when-cross-origin");
        
        // ============================================
        // 5. Permissions Policy (formerly Feature-Policy)
        // ============================================
        header("Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()");
        
        // ============================================
        // 6. Strict Transport Security (HSTS)
        // ============================================
        // Only enable in production with HTTPS
        if (self::isProduction()) {
            header("Strict-Transport-Security: max-age=31536000; includeSubDomains; preload");
        }
        
        // ============================================
        // 7. Cross-Origin Resource Policy (CORP)
        // ============================================
        header("Cross-Origin-Resource-Policy: same-origin");
        
        // ============================================
        // 8. Cross-Origin Embedder Policy (COEP)
        // ============================================
        header("Cross-Origin-Embedder-Policy: require-corp");
        
        // ============================================
        // 9. Cross-Origin Opener Policy (COOP)
        // ============================================
        header("Cross-Origin-Opener-Policy: same-origin");
        
        // ============================================
        // 10. Content Security Policy (CSP)
        // ============================================
        header("Content-Security-Policy: " . self::getCSP());
        
        // ============================================
        // 11. Cache Control (Prevents sensitive data caching)
        // ============================================
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Pragma: no-cache");
        header("Expires: 0");
        
        // ============================================
        // 12. Remove Server header (hides PHP version)
        // ============================================
        if (function_exists('header_remove')) {
            header_remove("Server");
        }
        header("Server: WebServer");
    }
    
    /**
     * Generate Content Security Policy
     */
    private static function getCSP() {
        $csp = [];
        
        // Default sources
        $csp[] = "default-src 'self'";
        
        // Script sources
        $csp[] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://www.gstatic.com https://*.firebaseio.com";
        
        // Style sources
        $csp[] = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://cdnjs.cloudflare.com";
        
        // Font sources
        $csp[] = "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com";
        
        // Image sources
        $csp[] = "img-src 'self' data: https://i.pravatar.cc https://*.gravatar.com blob:";
        
        // Connect sources (for API calls)
        $csp[] = "connect-src 'self' https://*.onrender.com";
        
        // Frame sources
        $csp[] = "frame-src 'none'";
        
        // Object sources
        $csp[] = "object-src 'none'";
        
        // Base URI
        $csp[] = "base-uri 'self'";
        
        // Form actions
        $csp[] = "form-action 'self'";
        
        // Frame ancestors
        $csp[] = "frame-ancestors 'none'";
        
        return implode("; ", $csp);
    }
    
    /**
     * Check if running in production environment
     */
    private static function isProduction() {
        $env = getenv('APP_ENV') ?: getenv('NODE_ENV') ?: 'production';
        return $env === 'production';
    }
}

// Auto-apply headers when file is included
SecurityHeaders::apply();
?>