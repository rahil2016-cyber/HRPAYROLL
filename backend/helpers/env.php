<?php
// backend/helpers/env.php

/**
 * Loads environment variables from a .env file.
 */
function loadEnv() {
    $paths = [
        dirname(dirname(__DIR__)) . '/.env', // Root directory
        dirname(__DIR__) . '/.env'           // backend/ directory
    ];

    foreach ($paths as $path) {
        if (file_exists($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) {
                    continue;
                }
                
                // Parse key and value
                $parts = explode('=', $line, 2);
                if (count($parts) === 2) {
                    $key = trim($parts[0]);
                    $value = trim($parts[1]);
                    
                    // Strip quotes if any
                    if (preg_match('/^"([^"]*)"$/', $value, $matches) || preg_match('/^\'([^\']*)\'$/', $value, $matches)) {
                        $value = $matches[1];
                    }
                    
                    // Check if it is already set in the environment, if not, set it
                    if (getenv($key) === false) {
                        putenv("$key=$value");
                    }
                    if (!isset($_ENV[$key])) {
                        $_ENV[$key] = $value;
                    }
                    if (!isset($_SERVER[$key])) {
                        $_SERVER[$key] = $value;
                    }
                }
            }
            break; // Stop after loading the first found .env
        }
    }
}

// Automatically load environment variables
loadEnv();

/**
 * Gets the value of an environment variable, with a default fallback.
 * Can parse boolean and empty string values.
 */
if (!function_exists('env')) {
    function env($key, $default = null) {
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }
        
        switch (strtolower($value)) {
            case 'true':
            case '(true)':
                return true;
            case 'false':
            case '(false)':
                return false;
            case 'empty':
            case '(empty)':
                return '';
            case 'null':
            case '(null)':
                return null;
        }
        
        return $value;
    }
}
