import { Request } from 'express'
import { Project, Segment, Image, Style } from './index'

export interface ProjectRequest extends Request {
    body: {
        title?: string
    }
    params: {
        id?: string
    }
}

export interface TextProcessRequest extends Request {
    body: {
        text: string
        projectId?: number
        styleDescription?: string
    }
}

export interface SegmentRequest extends Request {
    body: {
        projectId: number
        segments: {
            text: string
            position: number
        }[]
    }
    params: {
        id?: string
    }
}

export interface ImageGenerationRequest extends Request {
    body: {
        segmentId: number
        prompt?: string
        style?: string
        styleDescription?: string
        customPrompt?: string
        aiParams?: any
    }
    params: {
        id?: string
    }
}

export interface DatabaseCallback {
    (err: Error | null, result?: any): void
}

export interface DbRunResult {
    lastID?: number
    changes?: number
}

export type DbAll<T> = (sql: string, params: any[], callback: (err: Error | null, rows: T[]) => void) => void

export type DbGet<T> = (sql: string, params: any[], callback: (err: Error | null, row: T) => void) => void

export type DbRun = (sql: string, params: any[], callback: (err: Error | null, result: DbRunResult) => void) => void
