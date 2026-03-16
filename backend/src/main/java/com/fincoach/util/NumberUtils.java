package com.fincoach.util;

public final class NumberUtils {

    private NumberUtils() {}

    /** Returns 0.0 if the value is null, otherwise the value itself. */
    public static double orZero(Double v) {
        return v == null ? 0.0 : v;
    }
}
