<?php
// api/models/Database.php (ADD THESE METHODS)

class Database {
    private $conn;
    
    // ... existing constructor and methods ...
    
    // ============================================
    // SESSION METHODS
    // ============================================
    
    public function createSession($userId, $token, $expiresAt, $ipAddress = null, $userAgent = null) {
        if ($this->conn instanceof PDO) {
            // PostgreSQL
            $stmt = $this->conn->prepare("
                INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?)
            ");
            return $stmt->execute([$userId, $token, $expiresAt, $ipAddress, $userAgent]);
        } else {
            // MySQL
            $stmt = $this->conn->prepare("
                INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("issss", $userId, $token, $expiresAt, $ipAddress, $userAgent);
            return $stmt->execute();
        }
    }
    
    public function validateToken($token) {
        if ($this->conn instanceof PDO) {
            $stmt = $this->conn->prepare("
                SELECT s.*, u.username, u.full_name, u.role, u.email 
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ? AND s.expires_at > NOW() AND u.status = 'Active'
            ");
            $stmt->execute([$token]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            // MySQL
            $stmt = $this->conn->prepare("
                SELECT s.*, u.username, u.full_name, u.role, u.email 
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ? AND s.expires_at > NOW() AND u.status = 'Active'
            ");
            $stmt->bind_param("s", $token);
            $stmt->execute();
            $result = $stmt->get_result();
            return $result->fetch_assoc();
        }
    }
    
    public function deleteSession($token) {
        if ($this->conn instanceof PDO) {
            $stmt = $this->conn->prepare("DELETE FROM sessions WHERE token = ?");
            return $stmt->execute([$token]);
        } else {
            $stmt = $this->conn->prepare("DELETE FROM sessions WHERE token = ?");
            $stmt->bind_param("s", $token);
            return $stmt->execute();
        }
    }
    
    public function deleteExpiredSessions() {
        if ($this->conn instanceof PDO) {
            $stmt = $this->conn->prepare("DELETE FROM sessions WHERE expires_at <= NOW()");
            return $stmt->execute();
        } else {
            $stmt = $this->conn->prepare("DELETE FROM sessions WHERE expires_at <= NOW()");
            return $stmt->execute();
        }
    }
    
    public function logout($token) {
        return $this->deleteSession($token);
    }
}
?>