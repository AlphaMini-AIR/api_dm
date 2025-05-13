import { NextResponse } from "next/server";

export const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
    });
}

export function json(body, init = {}) {
    return NextResponse.json(body, {
        ...init,
        headers: {
            ...(init.headers || {}),
            ...CORS_HEADERS,
        },
    });
}
