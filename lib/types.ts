export type ScriptStatus = 'draft'  | 'published'

export interface Script {
    id: string
    title: string
    code: string
    status: ScriptStatus
    created_at: string
    updated_at: string
    published_at: string | null
}

// API request/response contracts
export type CreateScriptResponse = Script

export interface SaveDraftRequest {
    title?: string
    code: string
}

export type SaveDraftResponse = Pick<Script, 'id' | 'updated_at' | 'status'>

export interface PublishResponse {
    id: string
    public_url: string
    published_at: string
}

export interface ApiError {
    error: string
}