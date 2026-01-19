import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock fs/promises to prevent file system operations
vi.mock('fs/promises', () => ({
    mkdir: vi.fn(),
    readFile: vi.fn(() => Promise.resolve('[]')), // Return empty array or valid JSON
    writeFile: vi.fn(),
    rename: vi.fn(),
    appendFile: vi.fn()
}));

// Import app AFTER mocking
import { app } from '../server.mjs';

describe('Approval Workflow', () => {

    // We can't easily reset internal module state (STATE variable) in ESM without reloading the module.
    // So we just have to assume sequential execution or shared state.
    // For unit tests, we'll just create new approvals and track them by ID.

    let approvalId;

    it('should create a new approval request', async () => {
        const res = await request(app)
            .post('/approvals/request')
            .send({
                kind: 'test',
                details: { info: 'test approval' },
                risk: 'low'
            });

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.approval).toBeDefined();
        expect(res.body.approval.status).toBe('pending');
        approvalId = res.body.approval.id;
    });

    it('should show the approval in list', async () => {
        const res = await request(app).get('/approvals');
        expect(res.status).toBe(200);
        const found = res.body.approvals.find(a => a.id === approvalId);
        expect(found).toBeDefined();
        expect(found.status).toBe('pending');
    });

    it('should approve the request', async () => {
        const res = await request(app).post(`/approvals/${approvalId}/approve`);
        expect(res.status).toBe(200);
        expect(res.body.approval.status).toBe('approved');
    });

    it('should be idempotent (cannot approve again)', async () => {
        const res = await request(app).post(`/approvals/${approvalId}/approve`);
        expect(res.status).toBe(409); // Conflict
        expect(res.body.error).toBe('already_decided');
    });

    it('should not allow denying an approved request', async () => {
        const res = await request(app).post(`/approvals/${approvalId}/deny`);
        expect(res.status).toBe(409);
        expect(res.body.error).toBe('already_decided');
    });

    it('should create another request and deny it', async () => {
        // Create
        let res = await request(app).post('/approvals/request').send({ kind: 'test' });
        const id = res.body.approval.id;

        // Deny
        res = await request(app).post(`/approvals/${id}/deny`);
        expect(res.status).toBe(200);
        expect(res.body.approval.status).toBe('denied');

        // Verify idempotency
        res = await request(app).post(`/approvals/${id}/deny`);
        expect(res.status).toBe(409);

        // Verify cross-transition fail
        res = await request(app).post(`/approvals/${id}/approve`);
        expect(res.status).toBe(409);
    });
});
