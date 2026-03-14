package com.fincoach.model;

/**
 * User roles for role-based access control.
 * - USER    : standard registered user (default)
 * - PREMIUM : paying subscriber with extended features
 * - ADMIN   : platform administrator
 */
public enum Role {
    USER,
    PREMIUM,
    ADMIN
}
