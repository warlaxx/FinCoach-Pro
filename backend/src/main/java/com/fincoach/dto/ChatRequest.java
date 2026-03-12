package com.fincoach.dto;

public class ChatRequest {
    private String userId, message;

    public ChatRequest() {
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String v) {
        userId = v;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String v) {
        message = v;
    }
}