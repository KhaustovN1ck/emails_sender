import {Status} from "./status.ts";

export type EmailRecord = {
    id: string;
    email: string;
    lastUpdatedAt: string;
    status: { id: string, name: Status };
}