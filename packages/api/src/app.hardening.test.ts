import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "./app";

describe("API hardening", () => {
    it("returns X-Request-ID on health responses", async () => {
        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
        expect(response.headers["x-request-id"]).toMatch(/[0-9a-f-]{8,}/i);
    });

    it("returns request_id on unauthorized gateway requests", async () => {
        const response = await request(app)
            .post("/gateway/message")
            .send({
                channel: "web",
                sender: {},
                content: {
                    type: "text",
                    text: "ping",
                },
            });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("UNAUTHORIZED");
        expect(response.body.error.request_id).toMatch(/[0-9a-f-]{8,}/i);
    });

    it("rejects invalid text payloads before hitting the gateway use case", async () => {
        const response = await request(app)
            .post("/gateway/message")
            .set("Authorization", "Bearer andromeda_dev_web_token")
            .send({
                channel: "web",
                sender: {},
                content: {
                    type: "text",
                    text: "",
                },
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
        expect(response.body.error.field).toBe("content.text");
        expect(response.body.error.request_id).toMatch(/[0-9a-f-]{8,}/i);
    });

    it("keeps the API operational when the cognitive service is disabled", async () => {
        const response = await request(app).get("/internal/cognitive/health");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("disabled");
        expect(response.body.service).toBe("cognitive-python");
    });
});
