"""
Rate Limiting Middleware for FastAPI
Simple in-memory window-based rate limiting
"""

import time
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from typing import Dict, Tuple

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        limit: int = 100,  # Max requests
        window_seconds: int = 60  # Time window
    ):
        super().__init__(app)
        self.limit = limit
        self.window_seconds = window_seconds
        # Store IP -> (request_count, window_start_time)
        self.clients: Dict[str, Tuple[int, float]] = defaultdict(lambda: (0, time.time()))

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        
        # Bypass for documentation or health checks
        if request.url.path in ["/docs", "/redoc", "/openapi.json", "/health", "/"]:
            return await call_next(request)

        current_time = time.time()
        request_count, window_start = self.clients[client_ip]

        # Reset window if expired
        if current_time - window_start > self.window_seconds:
            self.clients[client_ip] = (1, current_time)
        else:
            if request_count >= self.limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later."
                )
            self.clients[client_ip] = (request_count + 1, window_start)

        response = await call_next(request)
        return response
